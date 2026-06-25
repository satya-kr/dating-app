const ChatBlock = require('../models/chatBlock.model');

const blockUser = async (req, res) => {
  try {
    const { userId: blockedId } = req.body;
    const blockerId = req.userId;

    if (!blockedId) return res.status(400).json({ message: 'User ID required' });
    if (blockerId === blockedId) return res.status(400).json({ message: 'Cannot block yourself' });

    await ChatBlock.create({ blocker: blockerId, blocked: blockedId });
    res.json({ message: 'User blocked' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Already blocked' });
    res.status(500).json({ message: 'Internal server error' });
  }
};

const isBlocked = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.userId;

    const block = await ChatBlock.findOne({
      $or: [
        { blocker: currentUserId, blocked: otherUserId },
        { blocker: otherUserId, blocked: currentUserId },
      ],
    });

    res.json({ blocked: !!block, blockedByMe: block?.blocker.toString() === currentUserId });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { blockUser, isBlocked };
