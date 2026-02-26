const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

const sanitizeQuery = (query) => {
  if (!query || typeof query !== 'object') return {};

  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value.map((item) => String(item).slice(0, 200))];
      }
      return [key, String(value).slice(0, 200)];
    })
  );
};

const normalizeIp = (ip = '') => String(ip).replace(/^::ffff:/, '');

const getRequestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return normalizeIp(forwarded.split(',')[0].trim());
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return normalizeIp(realIp.trim());
  }

  return normalizeIp(req.ip || req.socket?.remoteAddress || '');
};

const inferSeverity = (action = '') => {
  const upper = String(action).toUpperCase();
  if (upper.includes('DELETE') || upper.includes('REJECT') || upper.includes('CANCEL')) {
    return 'warning';
  }
  if (upper.includes('OVERRIDE') || upper.includes('SUPERADMIN')) {
    return 'critical';
  }
  return 'info';
};

const logAudit = async (req, payload) => {
  if (!req?.user?._id || !payload?.action) return null;

  const requestId = req.headers['x-request-id'] || req.id || crypto.randomUUID();

  return AuditLog.create({
    action: payload.action,
    performedBy: payload.performedBy || req.user._id,
    actorRole: req.user.role || '',
    actorEmail: req.user.email || '',
    organizationId: payload.organizationId ?? req.user.organizationId ?? null,
    entityType: payload.entityType || '',
    entityId: payload.entityId ? String(payload.entityId) : '',
    severity: payload.severity || inferSeverity(payload.action),
    ipAddress: getRequestIp(req),
    userAgent: req.headers['user-agent'] || '',
    requestMethod: req.method || '',
    requestPath: req.originalUrl || req.url || '',
    requestQuery: sanitizeQuery(req.query),
    requestId,
    responseStatus: req.res?.statusCode || null,
    timestamp: new Date(),
    details: payload.details || {}
  });
};

module.exports = { logAudit };
