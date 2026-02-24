const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');

exports.createOrganization = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone } = req.body;
    const org = await Organization.create({
      name,
      type: type || 'society',
      address: address || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      createdBy: req.user._id
    });

    await AuditLog.create({
      action: 'CREATE_ORGANIZATION',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { organizationId: org._id, name: org.name }
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).populate('createdBy', 'name email');
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // org_admin can only view their own org
    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name, type, address, isActive, contactEmail, contactPhone } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { name, type, address, isActive, contactEmail, contactPhone },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    await AuditLog.create({
      action: 'UPDATE_ORGANIZATION',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { updates: req.body }
    });

    res.json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    await AuditLog.create({
      action: 'DELETE_ORGANIZATION',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { name: org.name }
    });

    res.json({ message: 'Organization deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
