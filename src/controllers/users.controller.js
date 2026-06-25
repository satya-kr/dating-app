const mongoose = require('mongoose');
const User = require('../models/user.model');
const ChatBlock = require('../models/chatBlock.model');
const ProfileLike = require('../models/profileLike.model');
const Message = require('../models/message.model');

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { filter, gender, sortBy, state, city } = req.query;

    // Get blocked user IDs (both directions)
    const blocks = await ChatBlock.find({
      $or: [{ blocker: req.userId }, { blocked: req.userId }],
    }).lean();

    const blockedIds = blocks.map((b) =>
      b.blocker.toString() === req.userId ? b.blocked : b.blocker
    );

    let excludeIds = [...blockedIds];

    // Exclude users who have been BOTH liked AND chatted with
    const [likedUsers, chattedReceivers, chattedSenders] = await Promise.all([
      ProfileLike.find({ liker: req.userId }).select('liked').lean(),
      Message.distinct('receiver', { sender: new mongoose.Types.ObjectId(req.userId) }),
      Message.distinct('sender', { receiver: new mongoose.Types.ObjectId(req.userId) }),
    ]);

    const likedSet = new Set(likedUsers.map((l) => l.liked.toString()));
    const chattedSet = new Set([
      ...chattedReceivers.map((id) => id.toString()),
      ...chattedSenders.map((id) => id.toString()),
    ]);

    // Only exclude if user is in BOTH sets
    const interactedIds = [...likedSet].filter((id) => chattedSet.has(id));

    excludeIds = [...excludeIds, ...interactedIds];

    const query = {
      _id: { $ne: new mongoose.Types.ObjectId(req.userId), $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isDeactivated: { $ne: true },
      status: { $nin: ['deactivated', 'deleted', 'banned'] },
    };

    if (filter && filter !== 'all' && filter !== 'new' && filter !== 'foryou') {
      query.lookingFor = filter;
    }

    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    if (state && state !== 'all') {
      query.state = state;
    }

    if (city && city !== 'all') {
      query.city = city;
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'likes') {
      sortOption = { profileLikes: -1, messageLikes: -1, createdAt: -1 };
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort(sortOption).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getUsers };
