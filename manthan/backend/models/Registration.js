const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'waitlisted', 'checked-in', 'completed'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'not-required'],
    default: 'not-required'
  },
  paymentId: String,
  amountPaid: {
    type: Number,
    default: 0
  },
  teamInfo: {
    isTeamLead: {
      type: Boolean,
      default: false
    },
    teamName: String,
    teamMembers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      role: String,
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    teamCode: String,
    maxMembers: Number
  },
  responses: [{
    question: String,
    answer: String,
    type: {
      type: String,
      enum: ['text', 'multiple-choice', 'checkbox', 'file']
    }
  }],
  specialRequirements: String,
  dietaryRestrictions: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  checkIn: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: Date,
    checkInMethod: {
      type: String,
      enum: ['qr-code', 'manual', 'self-checkin']
    },
    checkInLocation: String,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  attendance: {
    sessions: [{
      sessionName: String,
      attended: Boolean,
      checkInTime: Date,
      checkOutTime: Date
    }],
    totalSessions: Number,
    attendedSessions: Number,
    attendancePercentage: {
      type: Number,
      default: 0
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    recommendations: String,
    wouldRecommend: Boolean,
    submittedAt: Date
  },
  certificate: {
    isEligible: {
      type: Boolean,
      default: false
    },
    certificateId: String,
    certificateUrl: String,
    issuedAt: Date,
    downloadCount: {
      type: Number,
      default: 0
    }
  },
  qrCode: {
    code: String,
    url: String
  },
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    confirmationSent: {
      type: Boolean,
      default: false
    },
    followUpSent: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    registrationSource: {
      type: String,
      enum: ['web', 'mobile', 'admin', 'import'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ 'teamInfo.teamCode': 1 });
registrationSchema.index({ registrationDate: -1 });

// Virtual for team size
registrationSchema.virtual('teamSize').get(function() {
  return this.teamInfo && this.teamInfo.teamMembers ? 
         this.teamInfo.teamMembers.length + 1 : 1; // +1 for team lead
});

// Virtual for registration age (days since registration)
registrationSchema.virtual('registrationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.registrationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate attendance percentage
registrationSchema.pre('save', function(next) {
  if (this.attendance && this.attendance.totalSessions > 0) {
    this.attendance.attendancePercentage = 
      (this.attendance.attendedSessions / this.attendance.totalSessions) * 100;
  }
  next();
});

// Method to add team member
registrationSchema.methods.addTeamMember = function(memberData) {
  if (!this.teamInfo) {
    this.teamInfo = { teamMembers: [] };
  }
  
  if (this.teamInfo.teamMembers.length >= (this.teamInfo.maxMembers - 1)) {
    throw new Error('Team is full');
  }
  
  this.teamInfo.teamMembers.push(memberData);
  return this.save();
};

// Method to remove team member
registrationSchema.methods.removeTeamMember = function(userId) {
  if (this.teamInfo && this.teamInfo.teamMembers) {
    this.teamInfo.teamMembers = this.teamInfo.teamMembers.filter(
      member => member.user.toString() !== userId.toString()
    );
    return this.save();
  }
  return this;
};

// Method to check in user
registrationSchema.methods.checkIn = function(method = 'manual', location = '', checkedInBy = null) {
  this.checkIn.isCheckedIn = true;
  this.checkIn.checkInTime = new Date();
  this.checkIn.checkInMethod = method;
  this.checkIn.checkInLocation = location;
  if (checkedInBy) this.checkIn.checkedInBy = checkedInBy;
  
  this.status = 'checked-in';
  return this.save();
};

// Method to mark session attendance
registrationSchema.methods.markSessionAttendance = function(sessionName, attended = true) {
  if (!this.attendance) {
    this.attendance = { sessions: [], totalSessions: 0, attendedSessions: 0 };
  }
  
  const existingSession = this.attendance.sessions.find(s => s.sessionName === sessionName);
  
  if (existingSession) {
    const wasAttended = existingSession.attended;
    existingSession.attended = attended;
    existingSession.checkInTime = attended ? new Date() : existingSession.checkInTime;
    
    // Update attended count
    if (attended && !wasAttended) {
      this.attendance.attendedSessions += 1;
    } else if (!attended && wasAttended) {
      this.attendance.attendedSessions -= 1;
    }
  } else {
    this.attendance.sessions.push({
      sessionName,
      attended,
      checkInTime: attended ? new Date() : null
    });
    
    this.attendance.totalSessions += 1;
    if (attended) this.attendance.attendedSessions += 1;
  }
  
  return this.save();
};

// Method to submit feedback
registrationSchema.methods.submitFeedback = function(feedbackData) {
  this.feedback = {
    ...feedbackData,
    submittedAt: new Date()
  };
  return this.save();
};

// Static method to find registrations by event
registrationSchema.statics.findByEvent = function(eventId, status = null) {
  const query = { event: eventId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('user', 'name email department year')
    .populate('event', 'title startDate endDate')
    .sort({ registrationDate: -1 });
};

// Static method to find user's registrations
registrationSchema.statics.findByUser = function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('event', 'title startDate endDate location category')
    .sort({ registrationDate: -1 });
};

// Static method to get event statistics
registrationSchema.statics.getEventStats = function(eventId) {
  return this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Registration', registrationSchema);