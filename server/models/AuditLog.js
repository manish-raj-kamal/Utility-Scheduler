const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true, index: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actorRole: { type: String, default: '' },
  actorEmail: { type: String, default: '' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
  entityType: { type: String, default: '', trim: true },
  entityId: { type: String, default: '' },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  requestMethod: { type: String, default: '' },
  requestPath: { type: String, default: '' },
  requestQuery: { type: mongoose.Schema.Types.Mixed, default: {} },
  requestId: { type: String, default: '' },
  responseStatus: { type: Number, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
});

auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
