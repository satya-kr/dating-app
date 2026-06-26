const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { name, email, phone, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, isProfileCompleted: user.isProfileCompleted, profileLikes: user.profileLikes, messageLikes: user.messageLikes, wallet: user.wallet },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Permanently deleted - cannot login
    if (user.status === 'deleted' && user.deletionScheduledAt && new Date() > user.deletionScheduledAt) {
      return res.status(403).json({ message: 'This account has been permanently deleted' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reactivate if deactivated or pending deletion
    if (user.isDeactivated || user.status === 'deactivated' || user.status === 'deleted') {
      user.isDeactivated = false;
      user.deactivatedAt = undefined;
      user.deletionScheduledAt = undefined;
      user.status = 'active';
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, isProfileCompleted: user.isProfileCompleted, profileLikes: user.profileLikes, messageLikes: user.messageLikes, wallet: user.wallet },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login };
