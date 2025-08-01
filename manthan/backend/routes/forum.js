const express = require('express');
const { body, validationResult } = require('express-validator');
const ForumPost = require('../models/ForumPost');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get forum posts
// @route   GET /api/forum
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20, search } = req.query;

    let posts;
    if (search) {
      posts = await ForumPost.searchPosts(search, { category, limit: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) });
    } else {
      posts = await ForumPost.findByCategory(category || 'general', { limit: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) });
    }

    res.json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create forum post
// @route   POST /api/forum
// @access  Private
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be between 10 and 5000 characters'),
  body('category').isIn(['general', 'team-formation', 'help', 'announcement', 'event-discussion', 'project-showcase', 'networking']).withMessage('Invalid category')
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

    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = await ForumPost.create(postData);
    
    const populatedPost = await ForumPost.findById(post._id)
      .populate('author', 'name avatar department');

    res.status(201).json({
      success: true,
      message: 'Forum post created successfully',
      data: { post: populatedPost }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single forum post
// @route   GET /api/forum/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name avatar department')
      .populate('replies.author', 'name avatar department')
      .populate('relatedEvent', 'title startDate');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    // Add view if user is authenticated
    if (req.user) {
      await post.addView(req.user._id, req.ip);
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Like/Unlike forum post
// @route   POST /api/forum/:id/like
// @access  Private
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    const hasLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());

    if (hasLiked) {
      await post.removeLike(req.user._id);
    } else {
      await post.addLike(req.user._id);
    }

    res.json({
      success: true,
      message: hasLiked ? 'Post unliked' : 'Post liked',
      data: { liked: !hasLiked }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Apply for team
// @route   POST /api/forum/:id/apply
// @access  Private
router.post('/:id/apply', authenticate, [
  body('message').trim().isLength({ min: 10, max: 500 }).withMessage('Application message must be between 10 and 500 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array')
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

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    const { message, skills } = req.body;

    await post.applyForTeam(req.user._id, { message, skills });

    res.json({
      success: true,
      message: 'Team application submitted successfully'
    });
  } catch (error) {
    if (error.message.includes('already applied') || error.message.includes('not looking for team') || error.message.includes('already complete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

module.exports = router;