const mongoose = require('mongoose');

const utilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: {
    type: String,
    enum: ['parking', 'community_hall', 'generator', 'ev_charger', 'water_tanker', 'other'],
    required: true
  },
  description: { type: String, default: '' },
  pricePerHour: { type: Number, required: true, min: 0 },
  maxHoursPerDay: { type: Number, default: 4 },
  maxHoursPerWeek: { type: Number, default: 12 },
  cooldownHours: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Utility', utilitySchema);
