const Booking = require('../models/Booking');
const UsageLog = require('../models/UsageLog');

/**
 * Fair Booking Engine
 * score = priorityWeight + (1 / (1 + hoursUsedLast7Days)) - cooldownPenalty
 */

const calculateFairnessScore = async (userId, utilityId, utility) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get hours used in last 7 days for this utility
  const recentLogs = await UsageLog.find({
    userId,
    utilityId,
    date: { $gte: sevenDaysAgo }
  });

  const hoursUsedLast7Days = recentLogs.reduce((sum, log) => sum + log.duration, 0);

  // Check cooldown - last booking end time
  const lastBooking = await Booking.findOne({
    userId,
    utilityId,
    status: 'approved',
    endTime: { $lte: new Date() }
  }).sort({ endTime: -1 });

  let cooldownPenalty = 0;
  if (lastBooking) {
    const hoursSinceLastUse = (Date.now() - new Date(lastBooking.endTime).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastUse < utility.cooldownHours) {
      cooldownPenalty = (utility.cooldownHours - hoursSinceLastUse) / utility.cooldownHours;
    }
  }

  const priorityWeight = 1;
  const score = priorityWeight + (1 / (1 + hoursUsedLast7Days)) - cooldownPenalty;

  return Math.round(score * 1000) / 1000;
};

const detectConflicts = async (utilityId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    utilityId,
    status: 'approved',
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return await Booking.find(query).populate('userId', 'name email flatNumber');
};

const checkUsageLimits = async (userId, utilityId, utility, startTime, endTime) => {
  const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

  // Check max hours per day
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startTime);
  dayEnd.setHours(23, 59, 59, 999);

  const dayBookings = await Booking.find({
    userId,
    utilityId,
    status: 'approved',
    startTime: { $gte: dayStart, $lte: dayEnd }
  });

  const dayHours = dayBookings.reduce((sum, b) => {
    return sum + (new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60);
  }, 0);

  if (dayHours + duration > utility.maxHoursPerDay) {
    return { allowed: false, reason: `Exceeds daily limit of ${utility.maxHoursPerDay} hours` };
  }

  // Check max hours per week
  const weekStart = new Date(startTime);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekBookings = await Booking.find({
    userId,
    utilityId,
    status: 'approved',
    startTime: { $gte: weekStart, $lte: weekEnd }
  });

  const weekHours = weekBookings.reduce((sum, b) => {
    return sum + (new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60);
  }, 0);

  if (weekHours + duration > utility.maxHoursPerWeek) {
    return { allowed: false, reason: `Exceeds weekly limit of ${utility.maxHoursPerWeek} hours` };
  }

  return { allowed: true };
};

const promoteFromWaitlist = async (utilityId, startTime, endTime) => {
  const waitlisted = await Booking.find({
    utilityId,
    status: 'waitlist',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).sort({ fairnessScore: -1 });

  for (const booking of waitlisted) {
    const conflicts = await detectConflicts(utilityId, booking.startTime, booking.endTime);
    if (conflicts.length === 0) {
      booking.status = 'approved';
      await booking.save();
      return booking;
    }
  }
  return null;
};

module.exports = {
  calculateFairnessScore,
  detectConflicts,
  checkUsageLimits,
  promoteFromWaitlist
};
