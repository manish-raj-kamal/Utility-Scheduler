const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
