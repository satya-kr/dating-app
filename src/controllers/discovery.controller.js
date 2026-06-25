const { discoverUsers, swipeUser } = require('../services/discovery.service');
const Match = require('../models/match.model');

const discover = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await discoverUsers(req.userId, { page, limit });
    res.json(result);
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const swipe = async (req, res) => {
  try {
    const { userId: swipedId, direction } = req.body;

    if (!swipedId || !['left', 'right'].includes(direction)) {
      return res.status(400).json({ message: 'Invalid swipe data' });
    }

    const result = await swipeUser(req.userId, swipedId, direction);

    res.json({
      message: direction === 'right' ? 'Liked' : 'Passed',
      matched: result.matched,
      match: result.match || null,
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({ users: req.userId })
      .populate('users', '-password')
      .sort({ matchedAt: -1 });

    const formatted = matches.map((match) => {
      const otherUser = match.users.find((u) => u._id.toString() !== req.userId);
      return {
        matchId: match._id,
        user: otherUser,
        matchedAt: match.matchedAt,
      };
    });

    res.json({ matches: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { discover, swipe, getMatches };
