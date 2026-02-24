const router = require('express').Router();
const { createOrder, verifyPayment, getMyPayments, getRazorpayKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/key', protect, getRazorpayKey);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my', protect, getMyPayments);

module.exports = router;
