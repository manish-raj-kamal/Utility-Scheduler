const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Flexible role checker — pass allowed roles as arguments.
 * Usage: checkRole('org_admin', 'superadmin')
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied — insufficient role' });
  };
};

// Convenience aliases (backward-compatible naming)
const adminOnly = checkRole('org_admin', 'superadmin');
const superadminOnly = checkRole('superadmin');

/**
 * Ensures the requesting user belongs to the same org as the resource,
 * or is a superadmin (who can access everything).
 * Must be used AFTER protect middleware so req.user is set.
 */
const checkOrganizationMembership = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  if (!req.user.organizationId) {
    return res.status(403).json({ message: 'No organization assigned' });
  }
  // Attach orgId to req for downstream controllers
  req.organizationId = req.user.organizationId;
  next();
};

// Backward-compatible alias
const checkOrganizationAccess = checkOrganizationMembership;

/**
 * Restrict actions based on the user's organization verificationLevel.
 * Usage: checkVerificationLevel(1)  — requires Level ≥ 1
 * Superadmins bypass the check.
 */
const checkVerificationLevel = (minLevel) => {
  return async (req, res, next) => {
    if (req.user.role === 'superadmin') return next();

    if (!req.user.organizationId) {
      return res.status(403).json({ message: 'No organization assigned — cannot perform this action' });
    }

    try {
      const org = await Organization.findById(req.user.organizationId);
      if (!org) return res.status(404).json({ message: 'Organization not found' });

      if (org.verificationLevel < minLevel) {
        return res.status(403).json({
          message: `This feature requires organization verification level ${minLevel}. Current level: ${org.verificationLevel}`,
          requiredLevel: minLevel,
          currentLevel: org.verificationLevel
        });
      }

      req.organization = org;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

module.exports = {
  protect,
  checkRole,
  adminOnly,
  superadminOnly,
  checkOrganizationMembership,
  checkOrganizationAccess,
  checkVerificationLevel
};
