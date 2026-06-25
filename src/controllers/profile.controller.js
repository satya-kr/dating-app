const User = require('../models/user.model');
const { completeProfileSchema } = require('../validators/profile.validator');

const completeProfile = async (req, res) => {
  try {
    const parsed = completeProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { lookingFor, gender, interestedIn, interests, state, city, bio } = parsed.data;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { lookingFor, gender, interestedIn, interests, state, city, bio, isProfileCompleted: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate and save profile completeness
    user.profileCompleteness = user.calculateProfileCompleteness();
    await user.save();

    res.json({ message: 'Profile completed', user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { completeProfile };
