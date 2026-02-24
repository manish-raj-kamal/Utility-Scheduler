const router = require('express').Router();
const {
  requestBooking,
  getMyBookings,
  getAllBookings,
  getCalendar,
  cancelBooking,
  adminOverride
} = require('../controllers/bookingController');
const { protect, adminOnly, checkOrganizationAccess, checkVerificationLevel } = require('../middleware/auth');

// Level 0 orgs can book, but with tighter limits enforced inside the controller.
// Level 1+ required for full features.
router.post('/request', protect, checkOrganizationAccess, requestBooking);
router.get('/my', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);
router.get('/calendar', protect, checkOrganizationAccess, getCalendar);
router.post('/cancel/:id', protect, cancelBooking);
router.post('/admin/override', protect, adminOnly, adminOverride);

module.exports = router;
