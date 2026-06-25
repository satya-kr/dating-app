const mongoose = require('mongoose');
const Message = require('../models/message.model');
const User = require('../models/user.model');

const getMessages = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get list of users the current user has chatted with + last message
const getChats = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.userId);

    const chats = await Message.aggregate([
      { $match: { $or: [{ sender: currentUserId }, { receiver: currentUserId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', currentUserId] }, '$receiver', '$sender'],
          },
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.isDeactivated': { $ne: true }, 'userInfo.status': 'active' } },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$userInfo._id',
            name: '$userInfo.name',
            email: '$userInfo.email',
            city: '$userInfo.city',
            gender: '$userInfo.gender',
          },
          lastMessage: 1,
          lastMessageAt: 1,
        },
      },
    ]);

    res.json({ chats });
  } catch (error) {
    console.error('getChats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getMessages, getChats };
