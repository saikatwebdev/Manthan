const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'reminder', 'announcement'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['event', 'registration', 'certificate', 'system', 'promotional', 'reminder'],
    required: true
  },
  recipients: {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [{
      type: String,
      enum: ['student', 'organizer', 'admin']
    }],
    departments: [String],
    all: {
      type: Boolean,
      default: false
    }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relatedRegistration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled', 'failed'],
    default: 'draft'
  },
  delivery: {
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failureReason: String
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failureReason: String
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failureReason: String
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  actions: [{
    label: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'button', 'api-call']
    }
  }],
  metadata: {
    templateId: String,
    variables: mongoose.Schema.Types.Mixed,
    source: {
      type: String,
      enum: ['manual', 'automated', 'scheduled', 'trigger'],
      default: 'manual'
    },
    trigger: String
  },
  analytics: {
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ 'recipients.users': 1 });
notificationSchema.index({ 'recipients.roles': 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ category: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for read status
notificationSchema.virtual('isRead').get(function() {
  return this.readBy && this.readBy.length > 0;
});

// Virtual for expiry status
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to mark as read by user
notificationSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.analytics.opened += 1;
    
    // Calculate open rate
    if (this.analytics.delivered > 0) {
      this.analytics.openRate = (this.analytics.opened / this.analytics.delivered) * 100;
    }
    
    return this.save();
  }
  
  return this;
};

// Method to record click
notificationSchema.methods.recordClick = function() {
  this.analytics.clicked += 1;
  
  // Calculate click rate
  if (this.analytics.delivered > 0) {
    this.analytics.clickRate = (this.analytics.clicked / this.analytics.delivered) * 100;
  }
  
  return this.save();
};

// Method to mark delivery status
notificationSchema.methods.markDelivered = function(channel, success = true, reason = null) {
  if (this.delivery[channel]) {
    this.delivery[channel].sent = success;
    this.delivery[channel].sentAt = new Date();
    
    if (!success && reason) {
      this.delivery[channel].failureReason = reason;
    }
    
    if (success) {
      this.analytics.delivered += 1;
    }
  }
  
  // Update overall status
  const allChannels = ['email', 'push', 'sms'];
  const enabledChannels = allChannels.filter(channel => this.delivery[channel].enabled);
  const sentChannels = enabledChannels.filter(channel => this.delivery[channel].sent);
  
  if (sentChannels.length === enabledChannels.length) {
    this.status = 'sent';
  } else if (sentChannels.length > 0) {
    this.status = 'sent'; // Partial success is still considered sent
  } else {
    this.status = 'failed';
  }
  
  return this.save();
};

// Static method to find notifications for user
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const {
    unreadOnly = false,
    category = null,
    limit = 50,
    skip = 0
  } = options;
  
  let query = {
    $or: [
      { 'recipients.users': userId },
      { 'recipients.all': true }
    ],
    status: 'sent',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  };
  
  if (unreadOnly) {
    query['readBy.user'] = { $ne: userId };
  }
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .populate('sender', 'name avatar')
    .populate('relatedEvent', 'title startDate')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(data) {
  return this.create({
    ...data,
    sender: null, // System notifications don't have a sender
    metadata: {
      ...data.metadata,
      source: 'automated'
    }
  });
};

// Static method to send bulk notification
notificationSchema.statics.sendBulkNotification = function(notificationData, recipientIds) {
  return this.create({
    ...notificationData,
    recipients: {
      users: recipientIds,
      all: false
    },
    status: 'scheduled'
  });
};

module.exports = mongoose.model('Notification', notificationSchema);