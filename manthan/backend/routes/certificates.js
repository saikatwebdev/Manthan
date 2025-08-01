const express = require('express');
const { body, validationResult } = require('express-validator');
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticate, authorize, authorizeEventAccess } = require('../middleware/auth');
const { generateCertificate, saveCertificateFile, validateCertificateData } = require('../utils/certificateGenerator');

const router = express.Router();

// @desc    Generate certificate for registration
// @route   POST /api/certificates/generate
// @access  Private (Event Organizer, Admin)
router.post('/generate', authenticate, [
  body('registrationId').isMongoId().withMessage('Valid registration ID is required'),
  body('type').isIn(['participation', 'winner', 'completion', 'achievement', 'appreciation']).withMessage('Invalid certificate type'),
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('position').optional().trim().isLength({ max: 50 }).withMessage('Position cannot exceed 50 characters'),
  body('score').optional().isNumeric().withMessage('Score must be a number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { registrationId, type, title, position, score, description } = req.body;

    // Get registration with event and user details
    const registration = await Registration.findById(registrationId)
      .populate('user', 'name email department')
      .populate('event', 'title startDate endDate organizer department');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const event = registration.event;

    // Check authorization
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate certificates for this event'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: registration.user._id,
      event: event._id,
      type
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this user and event'
      });
    }

    // Generate unique certificate ID and verification code
    const certificateId = Certificate.generateCertificateId();
    const verificationCode = Certificate.generateVerificationCode();

    // Prepare certificate data
    const certificateData = {
      userName: registration.user.name,
      eventTitle: event.title,
      eventDate: event.startDate,
      certificateType: type,
      organizerName: req.user.name,
      department: registration.user.department || event.department,
      position,
      score,
      certificateId,
      verificationCode
    };

    // Validate certificate data
    validateCertificateData(certificateData);

    // Generate PDF certificate
    const pdfBuffer = await generateCertificate(certificateData);
    const filename = `cert_${certificateId}`;
    const filePath = await saveCertificateFile(pdfBuffer, filename);

    // Create certificate record
    const certificate = await Certificate.create({
      user: registration.user._id,
      event: event._id,
      registration: registration._id,
      certificateId,
      type,
      title: title || `Certificate of ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description,
      certificateUrl: filePath,
      verification: {
        verificationCode,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate/${verificationCode}`
      },
      metadata: {
        position,
        score,
        duration: `${Math.ceil((event.endDate - event.startDate) / (1000 * 60 * 60 * 24))} days`
      }
    });

    // Update registration certificate info
    registration.certificate = {
      isEligible: true,
      certificateId,
      certificateUrl: filePath,
      issuedAt: new Date()
    };
    await registration.save();

    // Award points to user
    const user = await User.findById(registration.user._id);
    const pointsMap = { participation: 25, winner: 100, completion: 50, achievement: 75, appreciation: 30 };
    await user.addPoints(pointsMap[type] || 25, `Certificate: ${type}`);

    // Add badge if winner
    if (type === 'winner') {
      await user.addBadge({
        name: 'Winner',
        icon: '🏆',
        description: `Winner of ${event.title}`,
        earnedAt: new Date()
      });
    }

    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('user', 'name email department')
      .populate('event', 'title startDate endDate');

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: { certificate: populatedCertificate }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's certificates
// @route   GET /api/certificates/my
// @access  Private
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    let query = { user: req.user._id };
    if (type) query.type = type;

    const certificates = await Certificate.find(query)
      .populate('event', 'title startDate endDate organizer')
      .sort({ issuedDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Certificate.countDocuments(query);

    res.json({
      success: true,
      data: {
        certificates,
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

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email department')
      .populate('event', 'title startDate endDate organizer');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check access permissions
    const isOwner = certificate.user._id.toString() === req.user._id.toString();
    const isOrganizer = certificate.event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this certificate'
      });
    }

    res.json({
      success: true,
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name')
      .populate('event', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check access permissions
    const isOwner = certificate.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // Record download
    await certificate.recordDownload(req.ip, req.get('User-Agent'));

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificate.certificateId}.pdf"`);

    // Send file
    res.sendFile(certificate.certificateUrl, { root: '.' });
  } catch (error) {
    next(error);
  }
});

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:verificationCode
// @access  Public
router.get('/verify/:verificationCode', async (req, res, next) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.verifyCertificate(verificationCode);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid verification code'
      });
    }

    res.json({
      success: true,
      message: 'Certificate verified successfully',
      data: {
        certificate: {
          certificateId: certificate.certificateId,
          userName: certificate.user.name,
          userEmail: certificate.user.email,
          eventTitle: certificate.event.title,
          eventDate: certificate.event.startDate,
          type: certificate.type,
          issuedDate: certificate.issuedDate,
          organizer: certificate.event.organizer.name,
          status: certificate.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get certificates for an event
// @route   GET /api/certificates/event/:eventId
// @access  Private (Event Organizer, Admin)
router.get('/event/:eventId', authenticate, authorizeEventAccess, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, type } = req.query;

    let query = { event: eventId };
    if (type) query.type = type;

    const certificates = await Certificate.find(query)
      .populate('user', 'name email department')
      .sort({ issuedDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Certificate.countDocuments(query);

    // Get statistics
    const stats = await Certificate.aggregate([
      { $match: { event: mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        certificates,
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

// @desc    Revoke certificate
// @route   PATCH /api/certificates/:id/revoke
// @access  Private (Admin only)
router.patch('/:id/revoke', authenticate, authorize('admin'), [
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already revoked'
      });
    }

    await certificate.revoke(req.user._id, reason);

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Share certificate on social media
// @route   POST /api/certificates/:id/share
// @access  Private
router.post('/:id/share', authenticate, [
  body('platform').isIn(['linkedin', 'twitter', 'facebook']).withMessage('Invalid social media platform')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { platform } = req.body;

    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name')
      .populate('event', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user owns the certificate
    if (certificate.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this certificate'
      });
    }

    // Record share
    await certificate.recordShare(platform);

    // Generate share URLs
    const shareText = `I just received a ${certificate.type} certificate for ${certificate.event.title}! 🎉`;
    const shareUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.verification.verificationCode}`;

    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    };

    res.json({
      success: true,
      message: 'Share URL generated successfully',
      data: {
        shareUrl: shareUrls[platform],
        text: shareText
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;