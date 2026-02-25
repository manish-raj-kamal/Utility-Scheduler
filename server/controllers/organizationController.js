const Organization = require('../models/Organization');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const AuditLog = require('../models/AuditLog');

const DIGITS_ONLY = /^\d+$/;
const SIX_DIGITS = /^\d{6}$/;
const EIGHT_DIGITS = /^\d{8}$/;
const HAS_ALPHABET = /[A-Za-z]/;

const generateOrganizationCode = () => String(Math.floor(10000000 + Math.random() * 90000000));
const PIN_ATTEMPT_LIMIT = 5;
const PIN_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;

const createOrganizationWithUniqueCode = async (payload, preferredCode = null) => {
  const maxAttempts = 10;
  let attempts = 0;
  let lastError;

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const organizationCode = attempts === 1 && preferredCode ? preferredCode : generateOrganizationCode();
      return await Organization.create({ ...payload, organizationCode });
    } catch (error) {
      lastError = error;
      if (error?.code !== 11000) throw error;
    }
  }

  throw lastError;
};

const getPinAttemptState = (user) => {
  const now = Date.now();
  const windowStart = user.joinPinAttemptWindowStart ? new Date(user.joinPinAttemptWindowStart).getTime() : null;
  const inWindow = Boolean(windowStart && now - windowStart < PIN_ATTEMPT_WINDOW_MS);
  const attemptsUsed = inWindow ? (user.joinPinAttemptCount || 0) : 0;
  return {
    now,
    inWindow,
    attemptsUsed,
    attemptsLeft: Math.max(0, PIN_ATTEMPT_LIMIT - attemptsUsed),
    blocked: attemptsUsed >= PIN_ATTEMPT_LIMIT
  };
};

const incrementPinAttempt = async (userId, user, inWindow, attemptsUsed) => {
  if (inWindow) {
    return User.findByIdAndUpdate(userId, { $set: { joinPinAttemptCount: attemptsUsed + 1 } });
  }
  return User.findByIdAndUpdate(userId, {
    $set: {
      joinPinAttemptWindowStart: new Date(),
      joinPinAttemptCount: 1
    }
  });
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone, organizationId, joinKey } = req.body;

    if (!name || !HAS_ALPHABET.test(name)) {
      return res.status(400).json({ message: 'Organization name must include at least one alphabet character' });
    }
    if (organizationId && !EIGHT_DIGITS.test(String(organizationId))) {
      return res.status(400).json({ message: 'Organization ID must be exactly 8 digits' });
    }
    if (joinKey !== undefined && joinKey !== null && String(joinKey).trim() !== '' && !SIX_DIGITS.test(String(joinKey).trim())) {
      return res.status(400).json({ message: 'Organization join key must be exactly 6 digits' });
    }

    const org = await createOrganizationWithUniqueCode({
      name,
      type: type || 'society',
      address: address || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      joinKey: String(joinKey || '').trim() || undefined,
      createdBy: req.user._id
    }, organizationId ? String(organizationId) : null);

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

exports.createSelfOrganization = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone, organizationId, joinKey } = req.body;

    if (req.user.role === 'superadmin') {
      return res.status(403).json({ message: 'Superadmin cannot create membership organizations via this endpoint' });
    }
    if (req.user.role === 'org_admin') {
      return res.status(403).json({ message: 'Org admin cannot join or create another organization unless account is deleted' });
    }
    if (req.user.organizationId) {
      return res.status(400).json({ message: 'You already belong to an organization' });
    }
    if (!name || !HAS_ALPHABET.test(name)) {
      return res.status(400).json({ message: 'Organization name must include at least one alphabet character' });
    }
    if (organizationId && !EIGHT_DIGITS.test(String(organizationId))) {
      return res.status(400).json({ message: 'Organization ID must be exactly 8 digits' });
    }
    if (joinKey !== undefined && joinKey !== null && String(joinKey).trim() !== '' && !SIX_DIGITS.test(String(joinKey).trim())) {
      return res.status(400).json({ message: 'Organization join key must be exactly 6 digits' });
    }

    const org = await createOrganizationWithUniqueCode({
      name,
      type: type || 'society',
      address: address || '',
      contactEmail: contactEmail || req.user.email || '',
      contactPhone: contactPhone || '',
      joinKey: String(joinKey || '').trim() || undefined,
      createdBy: req.user._id,
      memberCount: 1
    }, organizationId ? String(organizationId) : null);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { organizationId: org._id, role: 'org_admin' },
      { new: true }
    ).select('-password');

    await AuditLog.create({
      action: 'SELF_CREATE_ORGANIZATION',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { organizationCode: org.organizationCode, name: org.name }
    });

    res.status(201).json({ message: 'Organization created successfully', organization: org, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.searchOrganizations = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q && !DIGITS_ONLY.test(q) && q.length < 2) {
      return res.status(400).json({ message: 'Search by name requires at least 2 characters' });
    }

    const query = {
      isActive: true,
      isJoinable: true
    };

    if (q) {
      if (DIGITS_ONLY.test(q)) {
        query.$or = [
          { organizationCode: { $regex: `^${q}` } },
          { name: { $regex: q, $options: 'i' } }
        ];
      } else {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { address: { $regex: q, $options: 'i' } }
        ];
      }
    }

    const organizations = await Organization.find(query)
      .select('_id organizationCode name type address verificationLevel isJoinable memberCount')
      .sort({ name: 1 })
      .limit(50);

    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinWithKey = async (req, res) => {
  try {
    const { orgId, joinKey } = req.body;

    if (!orgId || !joinKey) {
      return res.status(400).json({ message: 'Org ID and Join Key are required' });
    }
    if (!EIGHT_DIGITS.test(String(orgId))) {
      return res.status(400).json({ message: 'Org ID must be exactly 8 digits' });
    }
    if (!SIX_DIGITS.test(String(joinKey))) {
      return res.status(400).json({ message: 'Join Key must be exactly 6 digits' });
    }

    if (req.user.role === 'superadmin') {
      return res.status(403).json({ message: 'Superadmin cannot join organizations' });
    }
    if (req.user.role === 'org_admin') {
      return res.status(403).json({ message: 'Org admin cannot join another organization unless account is deleted' });
    }

    if (req.user.organizationId) {
      return res.status(400).json({ message: 'You already belong to an organization' });
    }

    const freshUser = await User.findById(req.user._id).select('joinPinAttemptCount joinPinAttemptWindowStart');
    const attemptState = getPinAttemptState(freshUser || {});
    if (attemptState.blocked) {
      return res.status(429).json({
        message: 'Join key attempts exceeded (5 in 24 hours). Use approval request method.',
        method: 'approval_only',
        attemptsLeft: 0
      });
    }

    const org = await Organization.findOne({ organizationCode: String(orgId) });
    if (!org || !org.isActive) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    if (!org.isJoinable) {
      return res.status(403).json({ message: 'Organization is not accepting direct joins' });
    }
    if (org.joinKey !== String(joinKey).trim()) {
      await incrementPinAttempt(req.user._id, freshUser, attemptState.inWindow, attemptState.attemptsUsed);
      const attemptsLeft = Math.max(0, attemptState.attemptsLeft - 1);
      return res.status(400).json({ message: 'Invalid join key', attemptsLeft });
    }

    await User.findByIdAndUpdate(req.user._id, { organizationId: org._id });
    await Organization.findByIdAndUpdate(org._id, { $inc: { memberCount: 1 } });

    await JoinRequest.updateMany(
      { userId: req.user._id, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: req.user._id
        }
      }
    );

    await AuditLog.create({
      action: 'JOIN_ORGANIZATION_WITH_KEY',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { organizationId: org._id, organizationName: org.name }
    });

    const user = await User.findById(req.user._id).select('-password');
    res.json({ message: 'Joined organization successfully', user, organizationId: org._id, orgId: org.organizationCode });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.requestToJoin = async (req, res) => {
  try {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ message: 'Org ID is required' });
    }
    if (!EIGHT_DIGITS.test(String(orgId))) {
      return res.status(400).json({ message: 'Org ID must be exactly 8 digits' });
    }

    if (req.user.role === 'superadmin') {
      return res.status(403).json({ message: 'Superadmin cannot request organization membership' });
    }
    if (req.user.role === 'org_admin') {
      return res.status(403).json({ message: 'Org admin cannot request another organization unless account is deleted' });
    }

    if (req.user.organizationId) {
      return res.status(400).json({ message: 'You already belong to an organization' });
    }

    const org = await Organization.findOne({ organizationCode: String(orgId) });
    if (!org || !org.isActive) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const existingPending = await JoinRequest.findOne({
      userId: req.user._id,
      organizationId: org._id,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ message: 'A join request is already pending for this organization' });
    }

    const joinRequest = await JoinRequest.create({
      userId: req.user._id,
      organizationId: org._id,
      status: 'pending'
    });

    await AuditLog.create({
      action: 'REQUEST_JOIN_ORGANIZATION',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { joinRequestId: joinRequest._id }
    });

    res.status(201).json(joinRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ userId: req.user._id })
      .populate('organizationId', 'name type isJoinable')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPendingJoinRequests = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(400).json({ message: 'No organization assigned' });
    }

    const requests = await JoinRequest.find({
      organizationId: req.user.organizationId,
      status: 'pending'
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reviewJoinRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const joinRequest = await JoinRequest.findById(req.params.requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: `Join request is already ${joinRequest.status}` });
    }

    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== joinRequest.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status === 'approved') {
      const targetUser = await User.findById(joinRequest.userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'Target user not found' });
      }
      if (targetUser.organizationId) {
        joinRequest.status = 'rejected';
        joinRequest.reviewedAt = new Date();
        joinRequest.reviewedBy = req.user._id;
        await joinRequest.save();
        return res.status(400).json({ message: 'User already belongs to an organization' });
      }

      targetUser.organizationId = joinRequest.organizationId;
      await targetUser.save();
      await Organization.findByIdAndUpdate(joinRequest.organizationId, { $inc: { memberCount: 1 } });
    }

    joinRequest.status = status;
    joinRequest.reviewedAt = new Date();
    joinRequest.reviewedBy = req.user._id;
    await joinRequest.save();

    await AuditLog.create({
      action: status === 'approved' ? 'APPROVE_JOIN_REQUEST' : 'REJECT_JOIN_REQUEST',
      performedBy: req.user._id,
      organizationId: joinRequest.organizationId,
      details: {
        joinRequestId: joinRequest._id,
        targetUserId: joinRequest.userId,
        status
      }
    });

    res.json({ message: `Join request ${status}`, joinRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.regenerateJoinKey = async (req, res) => {
  try {
    const orgId = req.user.role === 'superadmin'
      ? (req.params.id || req.body.organizationId || req.user.organizationId)
      : req.user.organizationId;

    if (!orgId) return res.status(400).json({ message: 'Organization ID is required' });

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    if (req.user.role !== 'superadmin' && req.user.organizationId?.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newKey = org.regenerateJoinKey();
    await org.save();

    await AuditLog.create({
      action: 'REGENERATE_ORG_JOIN_KEY',
      performedBy: req.user._id,
      organizationId: org._id,
      details: { organizationId: org._id }
    });

    res.json({ message: 'Join key regenerated', organizationId: org._id, joinKey: newKey });
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
