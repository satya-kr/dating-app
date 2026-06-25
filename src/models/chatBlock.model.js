const mongoose = require('mongoose');

const chatBlockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

chatBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
chatBlockSchema.index({ blocked: 1 });

module.exports = mongoose.model('ChatBlock', chatBlockSchema);
