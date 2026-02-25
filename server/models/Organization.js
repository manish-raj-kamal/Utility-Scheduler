const mongoose = require('mongoose');

const generateJoinKey = () => String(Math.floor(100000 + Math.random() * 900000));
const generateOrganizationCode = () => String(Math.floor(100000 + Math.random() * 900000));

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
  organizationCode: {
    type: String,
    unique: true,
    sparse: true,
    match: /^\d+$/
  },
  joinKey: { type: String, default: generateJoinKey, minlength: 6, maxlength: 6 },
  isJoinable: { type: Boolean, default: true },
  memberCount: { type: Number, default: 0, min: 0 },

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
organizationSchema.pre('save', function () {
  if (this.manualApproved) {
    this.verificationLevel = 3;
  } else if (this.documentsUploaded) {
    this.verificationLevel = 2;
  } else if (this.emailVerified || this.phoneVerified) {
    this.verificationLevel = 1;
  } else {
    this.verificationLevel = 0;
  }

  if (!this.joinKey || String(this.joinKey).length !== 6) {
    this.joinKey = generateJoinKey();
  }

  if (!this.organizationCode) {
    this.organizationCode = generateOrganizationCode();
  }
});

organizationSchema.methods.regenerateJoinKey = function () {
  this.joinKey = generateJoinKey();
  return this.joinKey;
};

module.exports = mongoose.model('Organization', organizationSchema);
