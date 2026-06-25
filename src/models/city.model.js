const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, required: true },
  },
  { timestamps: true }
);

citySchema.index({ state: 1 });
citySchema.index({ name: 'text' });

module.exports = mongoose.model('City', citySchema);
