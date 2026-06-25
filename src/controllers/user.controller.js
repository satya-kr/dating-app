const User = require('../models/user.model');
const Post = require('../models/post.model');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter, gender } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { _id: { $ne: req.userId } };

    // Gender filter - show matching gender + users who haven't set gender
    if (gender && gender !== 'all') {
      query.gender = { $in: [gender, ''] };
    }

    // Filter logic
    if (filter === 'new') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: oneWeekAgo };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'gender', 'interestedIn', 'lookingFor', 'bio', 'city', 'state', 'interests'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'interests') {
          updates[field] = JSON.parse(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    user.profileCompleteness = user.calculateProfileCompleteness();
    await user.save();

    res.json({ user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload image to user's images array
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const user = await User.findById(req.userId);
    if (user.images.length >= 5) {
      return res.status(400).json({ message: 'Max 5 images allowed' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    user.images.push(imagePath);
    await user.save();

    res.json({ message: 'Image uploaded', images: user.images });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove image from user's images array
const removeImage = async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ message: 'Image path required' });

    const user = await User.findById(req.userId);
    user.images = user.images.filter((img) => img !== imagePath);
    await user.save();

    res.json({ message: 'Image removed', images: user.images });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPost = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const post = await Post.create({
      user: req.userId,
      image: `/uploads/${req.file.filename}`,
      caption: req.body.caption || '',
    });
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getUsers, getProfile, updateProfile, createPost, uploadImage, removeImage };

// Note: changePassword is in account routes
