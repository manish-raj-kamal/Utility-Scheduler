const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utility', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  duration: { type: Number, required: true }, // in hours
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UsageLog', usageLogSchema);
