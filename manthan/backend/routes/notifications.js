const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unreadOnly = false, category, limit = 50, skip = 0 } = req.query;

    const notifications = await Notification.findForUser(req.user._id, {
      unreadOnly: unreadOnly === 'true',
      category,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create notification (Admin only)
// @route   POST /api/notifications
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and cannot exceed 100 characters'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required and cannot exceed 500 characters'),
  body('category').isIn(['event', 'registration', 'certificate', 'system', 'promotional', 'reminder']).withMessage('Invalid category'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error', 'reminder', 'announcement']).withMessage('Invalid type')
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

    const notificationData = {
      ...req.body,
      sender: req.user._id,
      status: 'sent'
    };

    const notification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;