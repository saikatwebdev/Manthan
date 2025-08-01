const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Check if user is event organizer or admin
const authorizeEventAccess = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    const eventId = req.params.id || req.params.eventId;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is admin, event organizer, or co-organizer
    const isAuthorized = 
      req.user.role === 'admin' ||
      event.organizer.toString() === req.user._id.toString() ||
      event.coOrganizers.some(coOrg => coOrg.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this event'
      });
    }

    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user owns the resource or is admin
const authorizeOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${model}`);
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${model} not found`
        });
      }

      // Check if user is admin or owns the resource
      const isAuthorized = 
        req.user.role === 'admin' ||
        resource.user?.toString() === req.user._id.toString() ||
        resource.author?.toString() === req.user._id.toString() ||
        resource.organizer?.toString() === req.user._id.toString();

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: `Not authorized to access this ${model.toLowerCase()}`
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but that's okay for optional auth
        // Continue without setting req.user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This could be enhanced with Redis for production
  // For now, we'll use a simple in-memory store
  const userAttempts = req.app.locals.userAttempts || {};
  const userId = req.user._id.toString();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!userAttempts[userId]) {
    userAttempts[userId] = { count: 1, firstAttempt: now };
  } else {
    const timePassed = now - userAttempts[userId].firstAttempt;
    
    if (timePassed > windowMs) {
      // Reset the window
      userAttempts[userId] = { count: 1, firstAttempt: now };
    } else {
      userAttempts[userId].count += 1;
      
      if (userAttempts[userId].count > maxAttempts) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.'
        });
      }
    }
  }

  req.app.locals.userAttempts = userAttempts;
  next();
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// Middleware to log user actions
const logUserAction = (action) => {
  return (req, res, next) => {
    // Log user action for audit trail
    console.log(`User ${req.user._id} performed action: ${action} at ${new Date().toISOString()}`);
    
    // In production, you might want to store this in a database
    // or send to a logging service
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeEventAccess,
  authorizeOwnership,
  optionalAuth,
  sensitiveOperationLimit,
  requireVerification,
  logUserAction
};