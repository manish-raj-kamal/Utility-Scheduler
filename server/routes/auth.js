const router = require('express').Router();
const { register, login, getMe, googleLogin, registerWithOrg, sendRegistrationOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-register-otp', sendRegistrationOtp);
router.post('/register', register);
router.post('/register-org', registerWithOrg);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
