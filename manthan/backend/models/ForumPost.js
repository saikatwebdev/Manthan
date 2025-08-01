const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'team-formation', 'help', 'announcement', 'event-discussion', 'project-showcase', 'networking'],
    required: true
  },
  type: {
    type: String,
    enum: ['discussion', 'question', 'announcement', 'team-request', 'project-showcase'],
    default: 'discussion'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  visibility: {
    type: String,
    enum: ['public', 'event-participants', 'department', 'private'],
    default: 'public'
  },
  department: String,
  teamFormation: {
    isLookingForTeam: {
      type: Boolean,
      default: false
    },
    skillsRequired: [String],
    maxTeamSize: Number,
    currentTeamSize: {
      type: Number,
      default: 1
    },
    teamMembers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String,
      joinedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      }
    }],
    applications: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      skills: [String],
      appliedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      }
    }],
    isTeamComplete: {
      type: Boolean,
      default: false
    }
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Reply content cannot exceed 2000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      content: String,
      editedAt: Date
    }]
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookmarkedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'archived', 'deleted', 'flagged'],
    default: 'active'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationReason: String,
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'off-topic', 'duplicate', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    replyCount: {
      type: Number,
      default: 0
    },
    bookmarkCount: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
forumPostSchema.index({ author: 1 });
forumPostSchema.index({ category: 1, type: 1 });
forumPostSchema.index({ relatedEvent: 1 });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ 'teamFormation.isLookingForTeam': 1 });
forumPostSchema.index({ status: 1, visibility: 1 });
forumPostSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for like count
forumPostSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for reply count
forumPostSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Virtual for view count
forumPostSchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

// Pre-save middleware to update analytics
forumPostSchema.pre('save', function(next) {
  this.analytics.likeCount = this.likes ? this.likes.length : 0;
  this.analytics.replyCount = this.replies ? this.replies.length : 0;
  this.analytics.viewCount = this.views ? this.views.length : 0;
  this.analytics.bookmarkCount = this.bookmarks ? this.bookmarks.length : 0;
  
  // Calculate engagement score
  this.analytics.engagementScore = 
    (this.analytics.likeCount * 2) + 
    (this.analytics.replyCount * 3) + 
    (this.analytics.viewCount * 0.1) + 
    (this.analytics.bookmarkCount * 1.5);
  
  next();
});

// Method to add like
forumPostSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  
  return this;
};

// Method to remove like
forumPostSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add bookmark
forumPostSchema.methods.addBookmark = function(userId) {
  const existingBookmark = this.bookmarks.find(bookmark => bookmark.user.toString() === userId.toString());
  
  if (!existingBookmark) {
    this.bookmarks.push({ user: userId });
    return this.save();
  }
  
  return this;
};

// Method to add view
forumPostSchema.methods.addView = function(userId, ipAddress) {
  // Check if user has viewed recently (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentView = this.views.find(view => 
    view.user.toString() === userId.toString() && 
    view.viewedAt > oneHourAgo
  );
  
  if (!recentView) {
    this.views.push({ user: userId, ipAddress });
    return this.save();
  }
  
  return this;
};

// Method to add reply
forumPostSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData);
  return this.save();
};

// Method to apply for team
forumPostSchema.methods.applyForTeam = function(userId, applicationData) {
  if (!this.teamFormation.isLookingForTeam) {
    throw new Error('This post is not looking for team members');
  }
  
  if (this.teamFormation.isTeamComplete) {
    throw new Error('Team is already complete');
  }
  
  const existingApplication = this.teamFormation.applications.find(
    app => app.user.toString() === userId.toString()
  );
  
  if (existingApplication) {
    throw new Error('You have already applied for this team');
  }
  
  this.teamFormation.applications.push({
    user: userId,
    ...applicationData
  });
  
  return this.save();
};

// Method to accept team application
forumPostSchema.methods.acceptTeamApplication = function(applicationId) {
  const application = this.teamFormation.applications.id(applicationId);
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  if (this.teamFormation.currentTeamSize >= this.teamFormation.maxTeamSize) {
    throw new Error('Team is already full');
  }
  
  application.status = 'accepted';
  
  this.teamFormation.teamMembers.push({
    user: application.user,
    role: application.skills[0] || 'Member'
  });
  
  this.teamFormation.currentTeamSize += 1;
  
  if (this.teamFormation.currentTeamSize >= this.teamFormation.maxTeamSize) {
    this.teamFormation.isTeamComplete = true;
  }
  
  return this.save();
};

// Static method to find posts by category
forumPostSchema.statics.findByCategory = function(category, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt' } = options;
  
  return this.find({ category, status: 'active' })
    .populate('author', 'name avatar department')
    .populate('relatedEvent', 'title startDate')
    .sort({ [sortBy]: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to search posts
forumPostSchema.statics.searchPosts = function(query, options = {}) {
  const { category, tags, limit = 20, skip = 0 } = options;
  
  let searchQuery = {
    $text: { $search: query },
    status: 'active'
  };
  
  if (category) searchQuery.category = category;
  if (tags && tags.length > 0) searchQuery.tags = { $in: tags };
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .populate('author', 'name avatar department')
    .populate('relatedEvent', 'title startDate')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('ForumPost', forumPostSchema);