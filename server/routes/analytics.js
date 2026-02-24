const router = require('express').Router();
const {
  getDashboardStats,
  getMostUsedUtilities,
  getBookingsPerWeek,
  getConflictRate,
  getRevenueData,
  getUserStats
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/most-used', protect, adminOnly, getMostUsedUtilities);
router.get('/bookings-per-week', protect, adminOnly, getBookingsPerWeek);
router.get('/conflict-rate', protect, adminOnly, getConflictRate);
router.get('/revenue', protect, adminOnly, getRevenueData);
router.get('/user-stats', protect, getUserStats);

module.exports = router;
