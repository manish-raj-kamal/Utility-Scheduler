const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, checkRole, superadminOnly } = require('../middleware/auth');
const {
  sendEmailOtp,
  verifyEmailOtp,
  uploadDocuments,
  approveOrganization,
  getVerificationStatus
} = require('../controllers/verificationController');

// ── Multer config for document uploads ──
const uploadsDir = path.join(__dirname, '..', 'uploads', 'org-docs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|png|jpe?g|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('Only PDF/PNG/JPG files allowed'), ext && mime);
  }
});

// ── Routes ──

// Get verification status
router.get('/:orgId/status', protect, getVerificationStatus);

// Email OTP flow
router.post('/:orgId/email/send-otp', protect, checkRole('org_admin', 'superadmin'), sendEmailOtp);
router.post('/:orgId/email/verify-otp', protect, checkRole('org_admin', 'superadmin'), verifyEmailOtp);

// Document upload (up to 5 files)
router.post(
  '/:orgId/documents',
  protect,
  checkRole('org_admin', 'superadmin'),
  upload.array('documents', 5),
  uploadDocuments
);

// Superadmin manual approval
router.post('/:orgId/approve', protect, superadminOnly, approveOrganization);

module.exports = router;
