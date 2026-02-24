const crypto = require('crypto');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../utils/mailer');

// ── Generate 6-digit OTP ──
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1 · Send email OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.sendEmailOtp = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId).select('+emailOtp +emailOtpExpiry');
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Only org_admin of this org or superadmin
    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const email = req.body.email || org.contactEmail;
    if (!email) return res.status(400).json({ message: 'No contact email provided' });

    const otp = generateOtp();
    org.emailOtp = otp;
    org.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    if (!org.contactEmail) org.contactEmail = email;
    await org.save();

    await sendEmail({
      to: email,
      subject: 'Your Organization Verification OTP',
      text: `Your OTP is: ${otp}\nIt expires in 10 minutes.`,
      html: `<h2>Your OTP: <strong>${otp}</strong></h2><p>Expires in 10 minutes.</p>`
    });

    res.json({ message: 'OTP sent', email });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2 · Verify email OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.verifyEmailOtp = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId).select('+emailOtp +emailOtpExpiry');
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    if (!org.emailOtp || !org.emailOtpExpiry) {
      return res.status(400).json({ message: 'No OTP was requested' });
    }
    if (new Date() > org.emailOtpExpiry) {
      return res.status(400).json({ message: 'OTP has expired — request a new one' });
    }
    if (otp !== org.emailOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    org.emailVerified = true;
    org.emailOtp = null;
    org.emailOtpExpiry = null;
    await org.save(); // pre-save hook recalculates verificationLevel

    await AuditLog.create({
      action: 'ORG_EMAIL_VERIFIED',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { email: org.contactEmail }
    });

    res.json({ message: 'Email verified', verificationLevel: org.verificationLevel, org });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3 · Upload organization documents  (Level 1→2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.uploadDocuments = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const docs = req.files.map((f) => ({
      name: f.originalname,
      path: f.path,
      uploadedAt: new Date()
    }));

    org.documents.push(...docs);
    org.documentsUploaded = true;
    await org.save();

    await AuditLog.create({
      action: 'ORG_DOCUMENTS_UPLOADED',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { count: docs.length, names: docs.map((d) => d.name) }
    });

    res.json({ message: 'Documents uploaded', verificationLevel: org.verificationLevel, org });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4 · Superadmin manually approves org  (→ Level 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.approveOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    org.manualApproved = true;
    await org.save();

    await AuditLog.create({
      action: 'ORG_MANUALLY_APPROVED',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { approvedBy: req.user.name }
    });

    res.json({ message: 'Organization approved (Level 3)', verificationLevel: org.verificationLevel, org });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5 · Get verification status for an org
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.getVerificationStatus = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      verificationLevel: org.verificationLevel,
      emailVerified: org.emailVerified,
      phoneVerified: org.phoneVerified,
      documentsUploaded: org.documentsUploaded,
      manualApproved: org.manualApproved,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      documents: org.documents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
