const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  label: { type: String, required: true },
  hoursRequired: { type: Number, required: true },
  maxRate: { type: Number, required: true },
  creditPercent: { type: Number, default: 10 },
}, { _id: false });

const appConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'call_pricing' },
  defaultRatePerMinute: { type: Number, default: 15 },
  levels: { type: [levelSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('AppConfig', appConfigSchema);
