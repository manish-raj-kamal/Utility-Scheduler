const User = require('../models/User');
const Organization = require('../models/Organization');
const { uploadBuffer, destroyImage } = require('../utils/cloudinary');
const { logAudit } = require('../utils/auditLogger');

const HAS_ALPHABET = /[A-Za-z]/;

const getUserPayload = async (userDoc) => {
  let organizationName = null;
  let organizationCode = null;
  let organizationJoinKey = null;

  if (userDoc.organizationId) {
    const org = await Organization.findById(userDoc.organizationId).select('name organizationCode joinKey');
    organizationName = org?.name || null;
    organizationCode = org?.organizationCode || null;
    if (userDoc.role === 'org_admin') {
      organizationJoinKey = org?.joinKey || null;
    }
  }

  return {
    _id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    organizationId: userDoc.organizationId,
    organizationName,
    organizationCode,
    organizationJoinKey,
    phone: userDoc.phone,
    flatNumber: userDoc.flatNumber,
    trustScore: userDoc.trustScore,
    totalUsageHours: userDoc.totalUsageHours,
    penaltyCount: userDoc.penaltyCount,
    avatar: userDoc.avatar,
    createdAt: userDoc.createdAt
  };
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, orgName, joinKey } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ message: 'Name is required' });
      user.name = trimmedName;
    }

    if (orgName !== undefined || joinKey !== undefined) {
      if (user.role !== 'org_admin') {
        return res.status(403).json({ message: 'Only org_admin can update organization details' });
      }
      if (!user.organizationId) {
        return res.status(400).json({ message: 'No organization assigned' });
      }

      const orgUpdates = {};

      if (orgName !== undefined) {
        const normalizedOrgName = String(orgName).trim();
        if (!normalizedOrgName || !HAS_ALPHABET.test(normalizedOrgName)) {
          return res.status(400).json({ message: 'Organization name must include at least one alphabet character' });
        }
        orgUpdates.name = normalizedOrgName;
      }

      if (joinKey !== undefined) {
        const normalizedJoinKey = String(joinKey).trim();
        if (!/^\d{6}$/.test(normalizedJoinKey)) {
          return res.status(400).json({ message: 'Organization join key must be exactly 6 digits' });
        }
        orgUpdates.joinKey = normalizedJoinKey;
      }

      await Organization.findByIdAndUpdate(user.organizationId, orgUpdates);
    }

    await user.save();
    const payload = await getUserPayload(user);
    res.json({ message: 'Profile updated', user: payload });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadMyAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    const uploaded = await uploadBuffer(req.file.buffer, 'utility-scheduler/avatars');

    if (user.avatarPublicId) {
      await destroyImage(user.avatarPublicId);
    }

    user.avatar = uploaded.secure_url;
    user.avatarPublicId = uploaded.public_id;
    await user.save();

    const payload = await getUserPayload(user);
    res.json({ message: 'Profile photo updated', user: payload });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarPublicId) {
      await destroyImage(user.avatarPublicId);
    }

    if (user.organizationId) {
      await Organization.findByIdAndUpdate(user.organizationId, { $inc: { memberCount: -1 } });
    }

    await logAudit(req, {
      action: 'DELETE_OWN_ACCOUNT',
      performedBy: user._id,
      organizationId: user.organizationId || null,
      entityType: 'user',
      entityId: user._id,
      details: { email: user.email, role: user.role }
    });

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

    const before = {
      role: target.role,
      trustScore: target.trustScore,
      penaltyCount: target.penaltyCount
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, trustScore, penaltyCount },
      { new: true }
    ).select('-password');

    await logAudit(req, {
      action: 'UPDATE_USER',
      organizationId: user.organizationId || req.user.organizationId || null,
      entityType: 'user',
      entityId: user._id,
      details: {
        targetUserId: user._id,
        before,
        after: {
          role: user.role,
          trustScore: user.trustScore,
          penaltyCount: user.penaltyCount
        }
      }
    });

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

    if (target.avatarPublicId) {
      await destroyImage(target.avatarPublicId);
    }

    await User.findByIdAndDelete(req.params.id);

    if (target.organizationId) {
      await Organization.findByIdAndUpdate(target.organizationId, { $inc: { memberCount: -1 } });
    }

    await logAudit(req, {
      action: 'DELETE_USER',
      organizationId: target.organizationId || req.user.organizationId || null,
      entityType: 'user',
      entityId: target._id,
      details: {
        targetUserId: target._id,
        targetEmail: target.email,
        targetRole: target.role
      }
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
