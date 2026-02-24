const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['society', 'college', 'company', 'other'],
    default: 'society'
  },
  address: { type: String, default: '' },
  contactEmail: { type: String, default: '', trim: true, lowercase: true },
  contactPhone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },

  // ── Verification fields ──
  verificationLevel: { type: Number, default: 0, min: 0, max: 3 },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  documentsUploaded: { type: Boolean, default: false },
  manualApproved: { type: Boolean, default: false },

  // Uploaded document paths
  documents: [{
    name: { type: String },
    path: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // OTP helpers (temp, cleared after verification)
  emailOtp: { type: String, default: null, select: false },
  emailOtpExpiry: { type: Date, default: null, select: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Recalculate verificationLevel on save
organizationSchema.pre('save', function (next) {
  if (this.manualApproved) {
    this.verificationLevel = 3;
  } else if (this.documentsUploaded) {
    this.verificationLevel = 2;
  } else if (this.emailVerified || this.phoneVerified) {
    this.verificationLevel = 1;
  } else {
    this.verificationLevel = 0;
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
