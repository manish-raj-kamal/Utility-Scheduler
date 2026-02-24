const Utility = require('../models/Utility');
const AuditLog = require('../models/AuditLog');

exports.getAll = async (req, res) => {
  try {
    const filter = { isActive: true };
    // Superadmin can optionally filter by org; org users always scoped
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }
    const utilities = await Utility.find(filter).sort({ createdAt: -1 });
    res.json(utilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const utility = await Utility.findById(req.params.id);
    if (!utility) return res.status(404).json({ message: 'Utility not found' });
    // Ensure same org (unless superadmin)
    if (req.user.role !== 'superadmin' && utility.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(utility);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const orgId = req.user.role === 'superadmin'
      ? (req.body.organizationId || req.user.organizationId)
      : req.user.organizationId;
    if (!orgId) return res.status(400).json({ message: 'Organization ID is required' });

    const utility = await Utility.create({ ...req.body, organizationId: orgId });
    await AuditLog.create({
      action: 'CREATE_UTILITY',
      performedBy: req.user._id,
      organizationId: orgId,
      details: { utilityId: utility._id, name: utility.name }
    });
    res.status(201).json(utility);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const utility = await Utility.findById(req.params.id);
    if (!utility) return res.status(404).json({ message: 'Utility not found' });
    if (req.user.role !== 'superadmin' && utility.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(utility, req.body);
    await utility.save();

    await AuditLog.create({
      action: 'UPDATE_UTILITY',
      performedBy: req.user._id,
      organizationId: utility.organizationId,
      details: { utilityId: utility._id, updates: req.body }
    });
    res.json(utility);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const utility = await Utility.findById(req.params.id);
    if (!utility) return res.status(404).json({ message: 'Utility not found' });
    if (req.user.role !== 'superadmin' && utility.organizationId?.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    utility.isActive = false;
    await utility.save();

    await AuditLog.create({
      action: 'DELETE_UTILITY',
      performedBy: req.user._id,
      organizationId: utility.organizationId,
      details: { utilityId: utility._id, name: utility.name }
    });
    res.json({ message: 'Utility deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
