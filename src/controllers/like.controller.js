const User = require('../models/user.model');
const ProfileLike = require('../models/profileLike.model');
const Message = require('../models/message.model');

// Like a user's profile (once per user)
const likeProfile = async (req, res) => {
  try {
    const { userId: targetUserId } = req.body;
    const currentUserId = req.userId;

    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    // Check if already liked
    const existing = await ProfileLike.findOne({ liker: currentUserId, liked: targetUserId });
    if (existing) {
      return res.status(409).json({ message: 'Already liked', hasLiked: true });
    }

    await ProfileLike.create({ liker: currentUserId, liked: targetUserId });
    await User.findByIdAndUpdate(targetUserId, { $inc: { profileLikes: 1 } });

    res.json({ message: 'Profile liked', hasLiked: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already liked', hasLiked: true });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if current user has liked a profile
const hasLikedProfile = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const existing = await ProfileLike.exists({ liker: req.userId, liked: targetUserId });
    res.json({ hasLiked: !!existing });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like a message (once per message, increases receiver's messageLikes)
const likeMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const currentUserId = req.userId;

    if (!messageId) {
      return res.status(400).json({ message: 'Message ID required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Can only like other's messages
    if (message.sender.toString() === currentUserId) {
      return res.status(400).json({ message: 'Cannot like your own message' });
    }

    // Check if already liked
    if (message.likedBy && message.likedBy.includes(currentUserId)) {
      return res.status(409).json({ message: 'Already liked this message' });
    }

    // Add like to message
    await Message.findByIdAndUpdate(messageId, { $addToSet: { likedBy: currentUserId } });

    // Increase sender's messageLikes
    await User.findByIdAndUpdate(message.sender, { $inc: { messageLikes: 1 } });

    res.json({ message: 'Message liked' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { likeProfile, hasLikedProfile, likeMessage };
