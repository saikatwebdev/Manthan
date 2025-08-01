const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'conference', 'networking', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  location: {
    venue: {
      type: String,
      required: [true, 'Venue is required']
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    onlineLink: String
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    min: [1, 'Maximum participants must be at least 1']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative']
  },
  prizes: [{
    position: String,
    amount: Number,
    description: String
  }],
  requirements: [String],
  agenda: [{
    time: String,
    activity: String,
    speaker: String,
    duration: String
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'department-only'],
    default: 'public'
  },
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  teamSize: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 1
    }
  },
  skills: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  certificates: {
    participation: {
      type: Boolean,
      default: true
    },
    winner: {
      type: Boolean,
      default: true
    },
    template: String
  },
  qrCode: {
    url: String,
    code: String
  },
  socialLinks: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  feedback: {
    enabled: {
      type: Boolean,
      default: true
    },
    questions: [String]
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    clickThroughs: {
      type: Number,
      default: 0
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ department: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for registration status
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return now <= this.registrationDeadline && 
         this.status === 'approved' && 
         this.currentParticipants < this.maxParticipants;
});

// Virtual for event status
eventSchema.virtual('eventStatus').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now >= this.startDate && now <= this.endDate) return 'ongoing';
  return 'completed';
});

// Virtual for duration
eventSchema.virtual('duration').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to validate dates
eventSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.registrationDeadline > this.startDate) {
    return next(new Error('Registration deadline must be before or on start date'));
  }
  
  if (this.isTeamEvent && this.teamSize.min > this.teamSize.max) {
    return next(new Error('Minimum team size cannot be greater than maximum team size'));
  }
  
  next();
});

// Method to increment participant count
eventSchema.methods.addParticipant = function() {
  if (this.currentParticipants < this.maxParticipants) {
    this.currentParticipants += 1;
    return this.save();
  }
  throw new Error('Event is full');
};

// Method to decrement participant count
eventSchema.methods.removeParticipant = function() {
  if (this.currentParticipants > 0) {
    this.currentParticipants -= 1;
    return this.save();
  }
  return this;
};

// Method to increment views
eventSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function() {
  return this.find({
    startDate: { $gte: new Date() },
    status: 'approved'
  }).sort({ startDate: 1 });
};

// Static method to find events by category
eventSchema.statics.findByCategory = function(category) {
  return this.find({
    category: category,
    status: 'approved'
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);