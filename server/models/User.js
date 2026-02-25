const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String, default: null },
  avatar: { type: String, default: null },
  avatarPublicId: { type: String, default: null },
  role: { type: String, enum: ['superadmin', 'org_admin', 'member'], default: 'member' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  joinPinAttemptCount: { type: Number, default: 0, min: 0 },
  joinPinAttemptWindowStart: { type: Date, default: null },
  phone: { type: String, default: '' },
  phoneVerified: { type: Boolean, default: false },
  flatNumber: { type: String, default: '' },
  trustScore: { type: Number, default: 100 },
  totalUsageHours: { type: Number, default: 0 },
  penaltyCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
