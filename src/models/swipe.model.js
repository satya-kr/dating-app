const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema(
  {
    swiper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    swiped: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    direction: { type: String, enum: ['left', 'right'], required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true });
swipeSchema.index({ swiper: 1, direction: 1 });
swipeSchema.index({ swiped: 1, direction: 1 });
swipeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for left swipes

module.exports = mongoose.model('Swipe', swipeSchema);
