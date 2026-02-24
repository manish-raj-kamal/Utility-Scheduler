const Booking = require('../models/Booking');
const UsageLog = require('../models/UsageLog');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Utility = require('../models/Utility');

// Helper: build org filter
const orgFilter = (user, field = 'organizationId') => {
  if (user.role === 'superadmin') return {};
  return { [field]: user.organizationId };
};

exports.getDashboardStats = async (req, res) => {
  try {
    const of = orgFilter(req.user);
    const totalBookings = await Booking.countDocuments(of);
    const activeBookings = await Booking.countDocuments({ ...of, status: 'approved' });
    const waitlistedBookings = await Booking.countDocuments({ ...of, status: 'waitlist' });
    const totalUsers = await User.countDocuments(of);
    const totalUtilities = await Utility.countDocuments({ ...of, isActive: true });

    // Revenue: need to join via users in the org
    let revenueMatch = { status: 'paid' };
    if (req.user.role !== 'superadmin') {
      const orgUserIds = await User.find({ organizationId: req.user.organizationId }).distinct('_id');
      revenueMatch.userId = { $in: orgUserIds };
    }
    const totalRevenue = await Payment.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalBookings,
      activeBookings,
      waitlistedBookings,
      totalUsers,
      totalUtilities,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMostUsedUtilities = async (req, res) => {
  try {
    const matchStage = req.user.role !== 'superadmin'
      ? { $match: { organizationId: req.user.organizationId } }
      : { $match: {} };

    const data = await UsageLog.aggregate([
      matchStage,
      { $group: { _id: '$utilityId', totalHours: { $sum: '$duration' }, count: { $sum: 1 } } },
      { $sort: { totalHours: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'utilities',
          localField: '_id',
          foreignField: '_id',
          as: 'utility'
        }
      },
      { $unwind: '$utility' },
      {
        $project: {
          name: '$utility.name',
          type: '$utility.type',
          totalHours: 1,
          count: 1
        }
      }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBookingsPerWeek = async (req, res) => {
  try {
    const matchStage = req.user.role !== 'superadmin'
      ? { $match: { organizationId: req.user.organizationId } }
      : { $match: {} };

    const data = await Booking.aggregate([
      matchStage,
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$startTime' },
            month: { $month: '$startTime' },
            week: { $isoWeek: '$startTime' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } },
      { $limit: 12 }
    ]);
    res.json(data.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getConflictRate = async (req, res) => {
  try {
    const of = orgFilter(req.user);
    const total = await Booking.countDocuments(of);
    const waitlisted = await Booking.countDocuments({ ...of, status: 'waitlist' });
    const rejected = await Booking.countDocuments({ ...of, status: 'rejected' });
    const conflictRate = total > 0 ? ((waitlisted + rejected) / total * 100).toFixed(1) : 0;
    res.json({ total, waitlisted, rejected, conflictRate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRevenueData = async (req, res) => {
  try {
    let matchFilter = { status: 'paid' };
    if (req.user.role !== 'superadmin') {
      const orgUserIds = await User.find({ organizationId: req.user.organizationId }).distinct('_id');
      matchFilter.userId = { $in: orgUserIds };
    }

    const data = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalBookings = await Booking.countDocuments({ userId });
    const activeBookings = await Booking.countDocuments({ userId, status: 'approved' });
    const cancelledBookings = await Booking.countDocuments({ userId, status: 'cancelled' });

    const usageLogs = await UsageLog.find({ userId });
    const totalHours = usageLogs.reduce((sum, log) => sum + log.duration, 0);

    const payments = await Payment.aggregate([
      { $match: { userId: req.user._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSpent: payments[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
