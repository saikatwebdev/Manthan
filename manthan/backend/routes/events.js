const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { authenticate, authorize, authorizeEventAccess, optionalAuth } = require('../middleware/auth');
const { generateEventQR } = require('../utils/qrCode');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @desc    Get all events with filtering and pagination
// @route   GET /api/events
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'conference', 'networking', 'other']),
  query('department').optional().isString(),
  query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled']),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('search').optional().isString().isLength({ max: 100 })
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

    const {
      page = 1,
      limit = 20,
      category,
      department,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc',
      featured = false,
      upcoming = false
    } = req.query;

    // Build query
    let query = {};

    // Public users can only see approved events
    if (!req.user || req.user.role === 'student') {
      query.status = 'approved';
      query.visibility = { $in: ['public', 'department-only'] };
    } else if (req.user.role === 'organizer') {
      // Organizers can see their own events and approved public events
      query.$or = [
        { organizer: req.user._id },
        { coOrganizers: req.user._id },
        { status: 'approved', visibility: { $in: ['public', 'department-only'] } }
      ];
    }
    // Admins can see all events (no additional filter)

    // Apply filters
    if (category) query.category = category;
    if (department) query.department = new RegExp(department, 'i');
    if (status && req.user && ['organizer', 'admin'].includes(req.user.role)) {
      query.status = status;
    }

    // Date filters
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Upcoming events filter
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sortOptions = {};
    const validSortFields = ['startDate', 'createdAt', 'title', 'currentParticipants'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.startDate = 1;
    }

    // Execute query with pagination
    const events = await Event.find(query)
      .populate('organizer', 'name department')
      .populate('coOrganizers', 'name department')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Event.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          current: parseInt(page),
          pages: totalPages,
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email department bio avatar')
      .populate('coOrganizers', 'name email department bio avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check visibility permissions
    if (event.visibility === 'private' && 
        (!req.user || (req.user._id.toString() !== event.organizer._id.toString() && 
         req.user.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this event'
      });
    }

    // Increment view count if user is authenticated
    if (req.user) {
      await event.incrementViews();
    }

    // Get registration status if user is logged in
    let userRegistration = null;
    if (req.user) {
      userRegistration = await Registration.findOne({
        user: req.user._id,
        event: event._id
      });
    }

    res.json({
      success: true,
      data: {
        event,
        userRegistration
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer, Admin)
router.post('/', authenticate, authorize('organizer', 'admin'), upload.array('images', 5), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('shortDescription').optional().trim().isLength({ max: 200 }).withMessage('Short description cannot exceed 200 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('category').isIn(['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'conference', 'networking', 'other']),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('registrationDeadline').isISO8601().withMessage('Registration deadline must be a valid date'),
  body('location.venue').trim().notEmpty().withMessage('Venue is required'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('registrationFee').optional().isFloat({ min: 0 }).withMessage('Registration fee must be non-negative')
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

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: `/uploads/events/${file.filename}`,
          caption: req.body[`imageCaption${index}`] || '',
          isPrimary: index === 0
        });
      });
    }

    // Create event data
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      images,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    };

    // Parse JSON fields if they exist
    if (req.body.location && typeof req.body.location === 'string') {
      eventData.location = JSON.parse(req.body.location);
    }
    if (req.body.teamSize && typeof req.body.teamSize === 'string') {
      eventData.teamSize = JSON.parse(req.body.teamSize);
    }
    if (req.body.prizes && typeof req.body.prizes === 'string') {
      eventData.prizes = JSON.parse(req.body.prizes);
    }

    const event = await Event.create(eventData);

    // Generate QR code for the event
    if (event.status === 'approved') {
      try {
        const qrCode = await generateEventQR(event._id, event._id);
        event.qrCode = {
          url: qrCode.dataURL,
          code: qrCode.code
        };
        await event.save();
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
      }
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event: populatedEvent }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Event Organizer, Admin)
router.put('/:id', authenticate, authorizeEventAccess, upload.array('images', 5), [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('shortDescription').optional().trim().isLength({ max: 200 }).withMessage('Short description cannot exceed 200 characters'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('category').optional().isIn(['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'conference', 'networking', 'other']),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('registrationDeadline').optional().isISO8601().withMessage('Registration deadline must be a valid date'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('registrationFee').optional().isFloat({ min: 0 }).withMessage('Registration fee must be non-negative')
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

    const event = req.event; // From authorizeEventAccess middleware

    // Check if event can be edited
    if (event.status === 'completed' || event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit completed or cancelled events'
      });
    }

    // Process new uploaded images
    const newImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        newImages.push({
          url: `/uploads/events/${file.filename}`,
          caption: req.body[`imageCaption${index}`] || '',
          isPrimary: false
        });
      });
    }

    // Merge existing images with new ones
    const existingImages = event.images || [];
    const allImages = [...existingImages, ...newImages];

    // Update event data
    const updateData = { ...req.body };
    
    // Parse JSON fields if they exist
    if (req.body.location && typeof req.body.location === 'string') {
      updateData.location = JSON.parse(req.body.location);
    }
    if (req.body.teamSize && typeof req.body.teamSize === 'string') {
      updateData.teamSize = JSON.parse(req.body.teamSize);
    }
    if (req.body.prizes && typeof req.body.prizes === 'string') {
      updateData.prizes = JSON.parse(req.body.prizes);
    }

    updateData.images = allImages;

    // If significant changes, set status back to pending (unless admin)
    const significantFields = ['startDate', 'endDate', 'location', 'maxParticipants'];
    const hasSignificantChanges = significantFields.some(field => 
      req.body[field] && req.body[field] !== event[field]
    );

    if (hasSignificantChanges && req.user.role !== 'admin' && event.status === 'approved') {
      updateData.status = 'pending';
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email department');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Event Organizer, Admin)
router.delete('/:id', authenticate, authorizeEventAccess, async (req, res, next) => {
  try {
    const event = req.event;

    // Check if event has registrations
    const registrationCount = await Registration.countDocuments({ event: event._id });
    
    if (registrationCount > 0 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with existing registrations. Cancel the event instead.'
      });
    }

    // Soft delete by updating status
    if (registrationCount > 0) {
      event.status = 'cancelled';
      await event.save();
      
      res.json({
        success: true,
        message: 'Event cancelled successfully'
      });
    } else {
      // Hard delete if no registrations
      await Event.findByIdAndDelete(event._id);
      
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Approve/Reject event
// @route   PATCH /api/events/:id/status
// @access  Private (Admin only)
router.patch('/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('rejectionReason').optional().trim().isLength({ max: 500 }).withMessage('Rejection reason cannot exceed 500 characters')
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

    const { status, rejectionReason } = req.body;

    const updateData = {
      status,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('organizer', 'name email department');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Generate QR code if approved
    if (status === 'approved') {
      try {
        const qrCode = await generateEventQR(event._id, event._id);
        event.qrCode = {
          url: qrCode.dataURL,
          code: qrCode.code
        };
        await event.save();
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
      }
    }

    res.json({
      success: true,
      message: `Event ${status} successfully`,
      data: { event }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get events by organizer
// @route   GET /api/events/organizer/:organizerId
// @access  Public
router.get('/organizer/:organizerId', optionalAuth, async (req, res, next) => {
  try {
    const { organizerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    let query = { organizer: organizerId };

    // Apply visibility filters based on user role
    if (!req.user || req.user.role === 'student') {
      query.status = 'approved';
      query.visibility = { $in: ['public', 'department-only'] };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name department')
      .sort({ startDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
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

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Public
router.get('/featured/list', optionalAuth, async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'approved',
      visibility: 'public',
      startDate: { $gte: new Date() }
    })
    .populate('organizer', 'name department')
    .sort({ 'analytics.views': -1, startDate: 1 })
    .limit(6);

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search events
// @route   GET /api/events/search
// @access  Public
router.get('/search/query', optionalAuth, [
  query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('category').optional().isIn(['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'conference', 'networking', 'other']),
  query('department').optional().isString()
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

    const { q, category, department, page = 1, limit = 20 } = req.query;

    let query = {
      $text: { $search: q },
      status: 'approved',
      visibility: { $in: ['public', 'department-only'] }
    };

    if (category) query.category = category;
    if (department) query.department = new RegExp(department, 'i');

    const events = await Event.find(query, { score: { $meta: 'textScore' } })
      .populate('organizer', 'name department')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
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

module.exports = router;