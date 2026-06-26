const User = require('../models/user.model');
const Withdrawal = require('../models/withdrawal.model');

const MIN_WITHDRAWAL = 500;

// Get bank details
const getBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('bankDetails credits');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ bankDetails: user.bankDetails || {}, credits: user.credits });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save bank details
const saveBankDetails = async (req, res) => {
  try {
    const { accountNumber, ifscCode, bankName } = req.body;
    if (!accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ message: 'All bank details are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { bankDetails: { accountNumber, ifscCode, bankName } },
      { new: true }
    ).select('bankDetails');

    res.json({ message: 'Bank details saved', bankDetails: user.bankDetails });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.credits < amount) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    if (!user.bankDetails || !user.bankDetails.accountNumber || !user.bankDetails.ifscCode || !user.bankDetails.bankName) {
      return res.status(400).json({ message: 'BANK_DETAILS_REQUIRED' });
    }

    // Deduct credits and create withdrawal request
    user.credits = Math.round((user.credits - amount) * 100) / 100;
    await user.save();

    await Withdrawal.create({
      user: req.userId,
      amount,
      bankDetails: user.bankDetails,
    });

    res.json({ message: 'Withdrawal request submitted', credits: user.credits });
  } catch (error) {
    console.error('requestWithdrawal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get withdrawal history
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getBankDetails, saveBankDetails, requestWithdrawal, getWithdrawals };
