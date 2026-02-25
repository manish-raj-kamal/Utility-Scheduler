const router = require('express').Router();
const {
  requestBooking,
  getMyBookings,
  getAllBookings,
  getCalendar,
  cancelBooking,
  adminOverride
} = require('../controllers/bookingController');
const { protect, adminOnly, checkOrganizationMembership, checkVerificationLevel } = require('../middleware/auth');

// Level 0 orgs can book, but with tighter limits enforced inside the controller.
// Level 1+ required for full features.
router.post('/request', protect, checkOrganizationMembership, requestBooking);
router.get('/my', protect, checkOrganizationMembership, getMyBookings);
router.get('/all', protect, adminOnly, checkOrganizationMembership, getAllBookings);
router.get('/calendar', protect, checkOrganizationMembership, getCalendar);
router.post('/cancel/:id', protect, checkOrganizationMembership, cancelBooking);
router.post('/admin/override', protect, adminOnly, checkOrganizationMembership, adminOverride);

module.exports = router;
