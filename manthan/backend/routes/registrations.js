const express = require('express');
const { body, validationResult } = require('express-validator');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticate, authorize, authorizeEventAccess } = require('../middleware/auth');
const { generateEventQR, validateCheckInQR, parseQRData } = require('../utils/qrCode');

const router = express.Router();

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
router.post('/', authenticate, [
  body('eventId').isMongoId().withMessage('Valid event ID is required'),
  body('teamInfo.teamName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Team name must be between 2 and 50 characters'),
  body('responses').optional().isArray().withMessage('Responses must be an array'),
  body('specialRequirements').optional().trim().isLength({ max: 500 }).withMessage('Special requirements cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { eventId, teamInfo, responses, specialRequirements, dietaryRestrictions, emergencyContact } = req.body;

    // Check if event exists and is approved
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      });
    }

    // Check if registration is still open
    if (!event.isRegistrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration for this event is closed'
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event is full
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Prepare registration data
    const registrationData = {
      user: req.user._id,
      event: eventId,
      responses: responses || [],
      specialRequirements,
      dietaryRestrictions: dietaryRestrictions || [],
      emergencyContact,
      status: 'confirmed',
      paymentStatus: event.registrationFee > 0 ? 'pending' : 'not-required',
      amountPaid: event.registrationFee || 0
    };

    // Handle team registration
    if (event.isTeamEvent && teamInfo) {
      const teamCode = `TEAM-${Date.now().toString(36).toUpperCase()}`;
      registrationData.teamInfo = {
        isTeamLead: true,
        teamName: teamInfo.teamName,
        teamCode,
        maxMembers: event.teamSize.max,
        teamMembers: []
      };
    }

    // Create registration
    const registration = await Registration.create(registrationData);

    // Generate QR code for the registration
    try {
      const qrCode = await generateEventQR(registration._id, eventId);
      registration.qrCode = {
        code: qrCode.code,
        url: qrCode.dataURL
      };
      await registration.save();
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError);
    }

    // Update event participant count
    await event.addParticipant();

    // Award points to user
    await req.user.addPoints(10, 'Event registration');

    // Populate registration data
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('user', 'name email department')
      .populate('event', 'title startDate endDate location');

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      data: { registration: populatedRegistration }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's registrations
// @route   GET /api/registrations/my
// @access  Private
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const registrations = await Registration.findByUser(req.user._id, status)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Registration.countDocuments({
      user: req.user._id,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get registrations for an event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Event Organizer, Admin)
router.get('/event/:eventId', authenticate, authorizeEventAccess, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const { eventId } = req.params;

    const registrations = await Registration.findByEvent(eventId, status)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Registration.countDocuments({
      event: eventId,
      ...(status && { status })
    });

    // Get registration statistics
    const stats = await Registration.getEventStats(eventId);

    res.json({
      success: true,
      data: {
        registrations,
        stats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single registration
// @route   GET /api/registrations/:id
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('user', 'name email department year phone')
      .populate('event', 'title startDate endDate location organizer');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check access permissions
    const isOwner = registration.user._id.toString() === req.user._id.toString();
    const isOrganizer = registration.event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this registration'
      });
    }

    res.json({
      success: true,
      data: { registration }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user owns the registration or is admin
    const isOwner = registration.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this registration'
      });
    }

    // Check if event has already started
    if (new Date() >= registration.event.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel registration after event has started'
      });
    }

    // Update registration status
    registration.status = 'cancelled';
    await registration.save();

    // Update event participant count
    await registration.event.removeParticipant();

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Check-in user for event
// @route   POST /api/registrations/:id/checkin
// @access  Private (Event Organizer, Admin)
router.post('/:id/checkin', authenticate, [
  body('method').optional().isIn(['qr-code', 'manual', 'self-checkin']).withMessage('Invalid check-in method'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('qrData').optional().isString().withMessage('QR data must be a string')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const registration = await Registration.findById(req.params.id)
      .populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check authorization for event
    const event = registration.event;
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isCoOrganizer = event.coOrganizers.some(coOrg => coOrg.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isCoOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check-in users for this event'
      });
    }

    // Check if already checked in
    if (registration.checkIn.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'User is already checked in'
      });
    }

    const { method = 'manual', location = '', qrData } = req.body;

    // Validate QR code if provided
    if (method === 'qr-code' && qrData) {
      const parsedQR = parseQRData(qrData);
      if (!parsedQR.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format'
        });
      }

      const validation = validateCheckInQR(parsedQR.data, event._id.toString());
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      if (validation.registrationId !== registration._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'QR code does not match this registration'
        });
      }
    }

    // Perform check-in
    await registration.checkIn(method, location, req.user._id);

    // Award points for attendance
    const user = await User.findById(registration.user);
    await user.addPoints(20, 'Event attendance');

    res.json({
      success: true,
      message: 'User checked in successfully',
      data: { registration }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Join team using team code
// @route   POST /api/registrations/join-team
// @access  Private
router.post('/join-team', authenticate, [
  body('teamCode').trim().notEmpty().withMessage('Team code is required'),
  body('eventId').isMongoId().withMessage('Valid event ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { teamCode, eventId } = req.body;

    // Find team lead registration
    const teamLeadRegistration = await Registration.findOne({
      'teamInfo.teamCode': teamCode,
      event: eventId,
      'teamInfo.isTeamLead': true
    }).populate('event');

    if (!teamLeadRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or invalid team code'
      });
    }

    const event = teamLeadRegistration.event;

    // Check if user is already registered for this event
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if team is full
    const currentTeamSize = teamLeadRegistration.teamInfo.teamMembers.length + 1; // +1 for team lead
    if (currentTeamSize >= teamLeadRegistration.teamInfo.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Create registration for team member
    const memberRegistration = await Registration.create({
      user: req.user._id,
      event: eventId,
      status: 'confirmed',
      paymentStatus: event.registrationFee > 0 ? 'pending' : 'not-required',
      amountPaid: event.registrationFee || 0,
      teamInfo: {
        isTeamLead: false,
        teamCode: teamCode,
        teamName: teamLeadRegistration.teamInfo.teamName
      }
    });

    // Add member to team lead's registration
    await teamLeadRegistration.addTeamMember({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: 'Member'
    });

    // Update event participant count
    await event.addParticipant();

    // Award points
    await req.user.addPoints(10, 'Event registration');

    const populatedRegistration = await Registration.findById(memberRegistration._id)
      .populate('user', 'name email department')
      .populate('event', 'title startDate endDate location');

    res.status(201).json({
      success: true,
      message: 'Successfully joined the team',
      data: { registration: populatedRegistration }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update team information
// @route   PUT /api/registrations/:id/team
// @access  Private
router.put('/:id/team', authenticate, [
  body('teamName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Team name must be between 2 and 50 characters')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user is team lead
    if (!registration.teamInfo?.isTeamLead || registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team lead can update team information'
      });
    }

    const { teamName } = req.body;

    if (teamName) {
      registration.teamInfo.teamName = teamName;
      await registration.save();
    }

    res.json({
      success: true,
      message: 'Team information updated successfully',
      data: { registration }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit feedback for event
// @route   POST /api/registrations/:id/feedback
// @access  Private
router.post('/:id/feedback', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments cannot exceed 1000 characters'),
  body('recommendations').optional().trim().isLength({ max: 500 }).withMessage('Recommendations cannot exceed 500 characters'),
  body('wouldRecommend').optional().isBoolean().withMessage('Would recommend must be a boolean')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const registration = await Registration.findById(req.params.id)
      .populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user owns the registration
    if (registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit feedback for this registration'
      });
    }

    // Check if event is completed
    if (new Date() < registration.event.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit feedback before event completion'
      });
    }

    // Check if feedback already submitted
    if (registration.feedback?.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted'
      });
    }

    const { rating, comments, recommendations, wouldRecommend } = req.body;

    await registration.submitFeedback({
      rating,
      comments,
      recommendations,
      wouldRecommend
    });

    // Award points for feedback
    await req.user.addPoints(5, 'Event feedback');

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { registration }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;