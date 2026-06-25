const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, required: true },
    caption: { type: String, default: '' },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
