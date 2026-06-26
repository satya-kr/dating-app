const User = require('../models/user.model');
const ChatBlock = require('../models/chatBlock.model');
const { changePasswordSchema } = require('../validators/password.validator');

// Change password
const changePassword = async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { oldPassword, newPassword } = parsed.data;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) return res.status(401).json({ message: 'Old password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Deactivate account
const deactivateAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      isDeactivated: true,
      deactivatedAt: new Date(),
      status: 'deactivated',
    });
    res.json({ message: 'Account deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete account (schedules deletion after 15 days)
const deleteAccount = async (req, res) => {
  try {
    const deletionDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(req.userId, {
      isDeactivated: true,
      deactivatedAt: new Date(),
      deletionScheduledAt: deletionDate,
      status: 'deleted',
    });
    res.json({ message: 'Account scheduled for deletion in 15 days' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get blocked users list
const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await ChatBlock.find({ blocker: req.userId })
      .populate('blocked', 'name email city gender')
      .sort({ createdAt: -1 });

    const blockedUsers = blocks.map((b) => ({
      blockId: b._id,
      user: b.blocked,
      blockedAt: b.createdAt,
    }));

    res.json({ blockedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const { userId: blockedId } = req.body;
    await ChatBlock.deleteOne({ blocker: req.userId, blocked: blockedId });
    res.json({ message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get wallet balance
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.wallet });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Deduct from wallet (called after call ends)
const deductWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wallet < amount) return res.status(400).json({ message: 'Insufficient balance' });

    user.wallet = Math.round((user.wallet - amount) * 100) / 100;
    await user.save();

    res.json({ balance: user.wallet });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deactivateAccount, deleteAccount, getBlockedUsers, unblockUser, changePassword, getWallet, deductWallet };
