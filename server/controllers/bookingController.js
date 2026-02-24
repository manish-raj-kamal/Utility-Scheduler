const Booking = require('../models/Booking');
const Utility = require('../models/Utility');
const UsageLog = require('../models/UsageLog');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const {
  calculateFairnessScore,
  detectConflicts,
  checkUsageLimits,
  promoteFromWaitlist
} = require('../utils/fairnessEngine');

// Level-0 orgs get reduced booking limits
const LEVEL0_MAX_BOOKINGS_PER_WEEK = 3;

exports.requestBooking = async (req, res) => {
  try {
    const { utilityId, startTime, endTime } = req.body;
    const utility = await Utility.findById(utilityId);
    if (!utility || !utility.isActive) {
      return res.status(404).json({ message: 'Utility not found or inactive' });
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    if (start < new Date()) {
      return res.status(400).json({ message: 'Cannot book in the past' });
    }

    // ── Level-0 org restriction: max bookings per week ──
    if (req.user.role !== 'superadmin' && req.user.organizationId) {
      const org = await Organization.findById(req.user.organizationId);
      if (org && org.verificationLevel === 0) {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekBookingCount = await Booking.countDocuments({
          userId: req.user._id,
          status: { $in: ['approved', 'waitlist'] },
          startTime: { $gte: weekStart, $lte: weekEnd }
        });

        if (weekBookingCount >= LEVEL0_MAX_BOOKINGS_PER_WEEK) {
          return res.status(403).json({
            message: `Unverified organizations are limited to ${LEVEL0_MAX_BOOKINGS_PER_WEEK} bookings per week. Verify your organization to unlock unlimited bookings.`,
            requiredLevel: 1,
            currentLevel: 0
          });
        }
      }
    }

    // Check usage limits
    const limitCheck = await checkUsageLimits(req.user._id, utilityId, utility, start, end);
    if (!limitCheck.allowed) {
      return res.status(400).json({ message: limitCheck.reason });
    }

    // Calculate fairness score
    const fairnessScore = await calculateFairnessScore(req.user._id, utilityId, utility);

    // Detect conflicts
    const conflicts = await detectConflicts(utilityId, start, end);

    let status = 'approved';
    if (conflicts.length > 0) {
      // Check if any existing booking has lower fairness score
      const hasHigherPriority = conflicts.every(async (c) => {
        const cScore = await calculateFairnessScore(c.userId._id, utilityId, utility);
        return fairnessScore > cScore;
      });

      if (hasHigherPriority && conflicts.length === 1) {
        // Bump existing to waitlist
        const existingBooking = conflicts[0];
        existingBooking.status = 'waitlist';
        await existingBooking.save();
        await Notification.create({
          userId: existingBooking.userId._id || existingBooking.userId,
          title: 'Booking Waitlisted',
          message: `Your booking for ${utility.name} was moved to waitlist due to fair allocation.`,
          type: 'waitlist'
        });
        status = 'approved';
      } else {
        status = 'waitlist';
      }
    }

    const duration = (end - start) / (1000 * 60 * 60);
    const orgId = req.user.organizationId || utility.organizationId;
    const booking = await Booking.create({
      userId: req.user._id,
      utilityId,
      organizationId: orgId,
      startTime: start,
      endTime: end,
      status,
      fairnessScore,
      paymentStatus: utility.pricePerHour > 0 ? 'pending' : 'free'
    });

    // Create usage log if approved
    if (status === 'approved') {
      await UsageLog.create({
        userId: req.user._id,
        utilityId,
        organizationId: orgId,
        duration,
        date: start
      });

      // Update user usage
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalUsageHours: duration }
      });
    }

    // Notification
    await Notification.create({
      userId: req.user._id,
      title: status === 'approved' ? 'Booking Confirmed' : 'Added to Waitlist',
      message: status === 'approved'
        ? `Your booking for ${utility.name} is confirmed.`
        : `You've been added to the waitlist for ${utility.name}.`,
      type: 'booking'
    });

    const populated = await Booking.findById(booking._id)
      .populate('utilityId', 'name type pricePerHour')
      .populate('userId', 'name email flatNumber');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('utilityId', 'name type pricePerHour')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }
    const bookings = await Booking.find(filter)
      .populate('utilityId', 'name type pricePerHour')
      .populate('userId', 'name email flatNumber')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCalendar = async (req, res) => {
  try {
    const { utilityId, start, end } = req.query;
    const query = { status: 'approved' };
    if (req.user.role !== 'superadmin') {
      query.organizationId = req.user.organizationId;
    }
    if (utilityId) query.utilityId = utilityId;
    if (start && end) {
      query.startTime = { $gte: new Date(start) };
      query.endTime = { $lte: new Date(end) };
    }
    const bookings = await Booking.find(query)
      .populate('utilityId', 'name type')
      .populate('userId', 'name flatNumber');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString() && !['org_admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    const utility = await Utility.findById(booking.utilityId);

    // Try to promote from waitlist
    const promoted = await promoteFromWaitlist(booking.utilityId, booking.startTime, booking.endTime);
    if (promoted) {
      await Notification.create({
        userId: promoted.userId,
        title: 'Booking Promoted!',
        message: `Your waitlisted booking for ${utility?.name || 'a utility'} has been approved.`,
        type: 'booking'
      });
    }

    await Notification.create({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking for ${utility?.name || 'a utility'} has been cancelled.`,
      type: 'cancellation'
    });

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.adminOverride = async (req, res) => {
  try {
    const { bookingId, newStatus } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const oldStatus = booking.status;
    booking.status = newStatus;
    await booking.save();

    await AuditLog.create({
      action: 'ADMIN_OVERRIDE_BOOKING',
      performedBy: req.user._id,
      details: { bookingId, oldStatus, newStatus }
    });

    await Notification.create({
      userId: booking.userId,
      title: 'Booking Updated by Admin',
      message: `Your booking status was changed from ${oldStatus} to ${newStatus} by admin.`,
      type: 'system'
    });

    res.json({ message: 'Booking overridden', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
