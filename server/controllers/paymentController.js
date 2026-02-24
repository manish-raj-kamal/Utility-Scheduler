const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Utility = require('../models/Utility');
const Notification = require('../models/Notification');

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('utilityId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const duration = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
    const amount = Math.round(booking.utilityId.pricePerHour * duration * 100); // in paise

    const order = await getRazorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: `booking_${bookingId}`
    });

    const payment = await Payment.create({
      userId: req.user._id,
      bookingId,
      amount: amount / 100,
      razorpayOrderId: order.id,
      status: 'created'
    });

    res.json({
      orderId: order.id,
      amount,
      currency: 'INR',
      paymentId: payment._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment error', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'paid' });

    await Notification.create({
      userId: payment.userId,
      title: 'Payment Successful',
      message: `Payment of ₹${payment.amount} received.`,
      type: 'payment'
    });

    res.json({ message: 'Payment verified', payment });
  } catch (error) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRazorpayKey = async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};
