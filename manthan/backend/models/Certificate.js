const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['participation', 'winner', 'completion', 'achievement', 'appreciation'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  issuedDate: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,
  certificateUrl: {
    type: String,
    required: true
  },
  templateUsed: String,
  metadata: {
    position: String, // For winner certificates
    score: Number,
    grade: String,
    skills: [String],
    duration: String,
    instructor: String
  },
  verification: {
    verificationCode: {
      type: String,
      unique: true,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    verificationUrl: String
  },
  downloads: {
    count: {
      type: Number,
      default: 0
    },
    lastDownloaded: Date,
    downloadHistory: [{
      downloadedAt: Date,
      ipAddress: String,
      userAgent: String
    }]
  },
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    shareCount: {
      type: Number,
      default: 0
    },
    socialShares: {
      linkedin: Number,
      twitter: Number,
      facebook: Number
    }
  },
  blockchain: {
    isBlockchainVerified: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    blockNumber: Number,
    contractAddress: String
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'pending'],
    default: 'active'
  },
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedReason: String
}, {
  timestamps: true
});

// Indexes
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ 'verification.verificationCode': 1 });
certificateSchema.index({ user: 1, event: 1 });
certificateSchema.index({ issuedDate: -1 });
certificateSchema.index({ status: 1 });

// Virtual for certificate age
certificateSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.issuedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for expiry status
certificateSchema.virtual('isExpired').get(function() {
  if (!this.validUntil) return false;
  return new Date() > this.validUntil;
});

// Method to increment download count
certificateSchema.methods.recordDownload = function(ipAddress, userAgent) {
  this.downloads.count += 1;
  this.downloads.lastDownloaded = new Date();
  this.downloads.downloadHistory.push({
    downloadedAt: new Date(),
    ipAddress,
    userAgent
  });
  
  // Keep only last 100 download records
  if (this.downloads.downloadHistory.length > 100) {
    this.downloads.downloadHistory = this.downloads.downloadHistory.slice(-100);
  }
  
  return this.save();
};

// Method to record social share
certificateSchema.methods.recordShare = function(platform) {
  this.sharing.shareCount += 1;
  if (this.sharing.socialShares[platform]) {
    this.sharing.socialShares[platform] += 1;
  }
  return this.save();
};

// Method to revoke certificate
certificateSchema.methods.revoke = function(revokedBy, reason) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

// Static method to generate unique certificate ID
certificateSchema.statics.generateCertificateId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `CERT-${timestamp}-${random}`.toUpperCase();
};

// Static method to generate verification code
certificateSchema.statics.generateVerificationCode = function() {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
};

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = function(verificationCode) {
  return this.findOne({
    'verification.verificationCode': verificationCode,
    status: 'active'
  }).populate('user', 'name email')
    .populate('event', 'title startDate endDate organizer');
};

module.exports = mongoose.model('Certificate', certificateSchema);