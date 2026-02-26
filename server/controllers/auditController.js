const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }

    if (req.query.action && req.query.action !== 'all') {
      filter.action = req.query.action;
    }
    if (req.query.severity && req.query.severity !== 'all') {
      filter.severity = req.query.severity;
    }
    if (req.query.actorRole && req.query.actorRole !== 'all') {
      filter.actorRole = req.query.actorRole;
    }

    const queryText = (req.query.q || '').trim();
    if (queryText) {
      filter.$or = [
        { action: { $regex: queryText, $options: 'i' } },
        { requestPath: { $regex: queryText, $options: 'i' } },
        { ipAddress: { $regex: queryText, $options: 'i' } },
        { actorEmail: { $regex: queryText, $options: 'i' } }
      ];
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
