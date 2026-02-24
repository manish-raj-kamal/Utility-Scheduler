const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, trustScore, penaltyCount } = req.body;

    // org_admin can only update users in their org and cannot set superadmin role
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'superadmin') {
      if (target.organizationId?.toString() !== req.user.organizationId?.toString()) {
        return res.status(403).json({ message: 'Cannot update users outside your organization' });
      }
      if (role === 'superadmin') {
        return res.status(403).json({ message: 'Cannot assign superadmin role' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, trustScore, penaltyCount },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'superadmin') {
      if (target.organizationId?.toString() !== req.user.organizationId?.toString()) {
        return res.status(403).json({ message: 'Cannot delete users outside your organization' });
      }
      if (target.role === 'superadmin') {
        return res.status(403).json({ message: 'Cannot delete a superadmin' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
