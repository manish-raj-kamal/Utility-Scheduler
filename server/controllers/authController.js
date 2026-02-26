const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../utils/mailer');
const { createOtp, verifyOtp } = require('../utils/otpStore');

const HAS_ALPHABET = /[A-Za-z]/;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const buildUserPayload = async (userDoc) => {
  let organizationName = null;
  let organizationCode = null;
  let organizationJoinKey = null;

  if (userDoc.organizationId) {
    const org = await Organization.findById(userDoc.organizationId).select('name organizationCode joinKey');
    organizationName = org?.name || null;
    organizationCode = org?.organizationCode || null;
    if (userDoc.role === 'org_admin') {
      organizationJoinKey = org?.joinKey || null;
    }
  }

  return {
    _id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    organizationId: userDoc.organizationId,
    organizationName,
    organizationCode,
    organizationJoinKey,
    flatNumber: userDoc.flatNumber,
    trustScore: userDoc.trustScore,
    totalUsageHours: userDoc.totalUsageHours,
    penaltyCount: userDoc.penaltyCount,
    phone: userDoc.phone,
    avatar: userDoc.avatar,
    createdAt: userDoc.createdAt
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Send registration OTP (public — no auth needed)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'User already exists with this email' });

    const { otp } = createOtp(email);

    await sendEmail({
      to: email,
      subject: 'Your FairSlot Registration OTP',
      text: `Your OTP is: ${otp}\nIt expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f1530;">Verify your email</h2>
          <p style="color:#5a6a8e;">Use the code below to complete your registration:</p>
          <div style="background:#f0f5ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:2rem;font-weight:800;letter-spacing:6px;color:#2f6fed;">${otp}</span>
          </div>
          <p style="color:#8a95b8;font-size:0.85rem;">This code expires in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent', email });
  } catch (error) {
    // Rate-limit or other OTP errors
    if (error.message.includes('wait')) {
      return res.status(429).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, flatNumber, role, organizationId, emailOtp } = req.body;

    // Verify email OTP
    if (!emailOtp) return res.status(400).json({ message: 'Email OTP is required' });
    try {
      verifyOtp(email, emailOtp);
    } catch (otpErr) {
      return res.status(400).json({ message: otpErr.message });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    // Public registration always creates a 'member' — only superadmin can create org_admin via admin panel
    const user = await User.create({
      name,
      email,
      password,
      flatNumber,
      role: role || 'member',
      organizationId: organizationId || null
    });

    if (user.organizationId) {
      await Organization.findByIdAndUpdate(user.organizationId, { $inc: { memberCount: 1 } });
    }

    const token = generateToken(user._id);
    const userPayload = await buildUserPayload(user);
    res.status(201).json({
      token,
      user: userPayload
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    const userPayload = await buildUserPayload(user);
    res.json({
      token,
      user: userPayload
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const payload = await buildUserPayload(user);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google account if user exists by email but not yet linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user from Google profile
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || null,
        flatNumber: ''
      });
    }

    const token = generateToken(user._id);
    const userPayload = await buildUserPayload(user);
    res.json({
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Register as organization head  (creates org + user in one step)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.registerWithOrg = async (req, res) => {
  try {
    const { name, email, password, phone, orgName, orgType, orgAddress, contactEmail, joinKey, emailOtp } = req.body;

    // Verify email OTP
    if (!emailOtp) return res.status(400).json({ message: 'Email OTP is required' });
    try {
      verifyOtp(email, emailOtp);
    } catch (otpErr) {
      return res.status(400).json({ message: otpErr.message });
    }

    if (!orgName) return res.status(400).json({ message: 'Organization name is required' });
    if (!HAS_ALPHABET.test(orgName)) {
      return res.status(400).json({ message: 'Organization name must include at least one alphabet character' });
    }
    if (joinKey !== undefined && joinKey !== null && String(joinKey).trim() !== '' && !/^\d{6}$/.test(String(joinKey).trim())) {
      return res.status(400).json({ message: 'Organization join key must be exactly 6 digits' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    // 1. Create the organization at Level 0
    const org = await Organization.create({
      name: orgName,
      type: orgType || 'society',
      address: orgAddress || '',
      contactEmail: contactEmail || email, // default org contact to user's email
      joinKey: String(joinKey || '').trim() || undefined
    });

    // 2. Create the user as org_admin
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'org_admin',
      organizationId: org._id,
      flatNumber: ''
    });

    // 3. Link creator back
    org.createdBy = user._id;
    org.memberCount = 1;
    await org.save();

    // 4. Audit log
    await AuditLog.create({
      action: 'REGISTER_WITH_ORG',
      performedBy: user._id,
      organizationId: org._id,
      details: { orgName: org.name, userName: user.name }
    });

    const token = generateToken(user._id);
    const userPayload = await buildUserPayload(user);
    res.status(201).json({
      token,
      user: userPayload
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
