const express = require('express');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 50, department, timeframe = 'all' } = req.query;

    let query = { isActive: true, points: { $gt: 0 } };
    if (department) query.department = department;

    const users = await User.find(query)
      .select('name department points badges avatar year')
      .sort({ points: -1, createdAt: 1 })
      .limit(parseInt(limit));

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get department leaderboard
// @route   GET /api/leaderboard/department/:department
// @access  Public
router.get('/department/:department', async (req, res, next) => {
  try {
    const { department } = req.params;
    const { limit = 20 } = req.query;

    const users = await User.find({
      department: new RegExp(department, 'i'),
      isActive: true,
      points: { $gt: 0 }
    })
    .select('name department points badges avatar year')
    .sort({ points: -1, createdAt: 1 })
    .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;