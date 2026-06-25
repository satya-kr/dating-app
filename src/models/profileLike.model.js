const mongoose = require('mongoose');

const profileLikeSchema = new mongoose.Schema(
  {
    liker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    liked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

profileLikeSchema.index({ liker: 1, liked: 1 }, { unique: true });

module.exports = mongoose.model('ProfileLike', profileLikeSchema);
