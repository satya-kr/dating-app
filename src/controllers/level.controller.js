const User = require('../models/user.model');
const AppConfig = require('../models/appConfig.model');

const DEFAULT_LEVELS = [
  { level: 1, label: 'Bronze', hoursRequired: 10, maxRate: 20, creditPercent: 10 },
  { level: 2, label: 'Silver', hoursRequired: 25, maxRate: 25, creditPercent: 10 },
  { level: 3, label: 'Gold', hoursRequired: 40, maxRate: 35, creditPercent: 10 },
  { level: 4, label: 'Platinum', hoursRequired: 65, maxRate: 45, creditPercent: 10 },
  { level: 5, label: 'Diamond', hoursRequired: 100, maxRate: 70, creditPercent: 10 },
  { level: 6, label: 'Elite', hoursRequired: 120, maxRate: 0, creditPercent: 10 }, // 0 = unlimited (min default)
];

// Seed/get config
const getOrCreateConfig = async () => {
  let config = await AppConfig.findOne({ key: 'call_pricing' });
  if (!config) {
    config = await AppConfig.create({
      key: 'call_pricing',
      defaultRatePerMinute: 15,
      levels: DEFAULT_LEVELS,
    });
  }
  return config;
};

// Get levels and user's current level info
const getLevelInfo = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const user = await User.findById(req.userId).select('totalCallDuration callLevel callRatePerMinute credits');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalHours = user.totalCallDuration / 3600;
    // Determine unlocked level
    let unlockedLevel = 0;
    for (const lvl of config.levels) {
      if (totalHours >= lvl.hoursRequired) {
        unlockedLevel = lvl.level;
      }
    }

    res.json({
      levels: config.levels,
      defaultRate: config.defaultRatePerMinute,
      currentLevel: user.callLevel,
      unlockedLevel,
      currentRate: user.callRatePerMinute,
      totalHours: Math.floor(totalHours * 10) / 10,
      totalSeconds: user.totalCallDuration,
      credits: user.credits,
    });
  } catch (error) {
    console.error('getLevelInfo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update call rate (user selects their rate based on unlocked level)
const updateCallRate = async (req, res) => {
  try {
    const { rate } = req.body;
    if (!rate || rate < 0) return res.status(400).json({ message: 'Invalid rate' });

    const config = await getOrCreateConfig();
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalHours = user.totalCallDuration / 3600;
    let unlockedLevel = 0;
    let maxAllowedRate = config.defaultRatePerMinute;

    for (const lvl of config.levels) {
      if (totalHours >= lvl.hoursRequired) {
        unlockedLevel = lvl.level;
        if (lvl.maxRate > 0) {
          maxAllowedRate = lvl.maxRate;
        } else {
          maxAllowedRate = Infinity; // level 6 = unlimited
        }
      }
    }

    if (unlockedLevel === 0) {
      return res.status(403).json({ message: 'You have not unlocked any level yet' });
    }

    if (rate < config.defaultRatePerMinute) {
      return res.status(400).json({ message: `Rate cannot be less than ₹${config.defaultRatePerMinute}/min` });
    }

    // Level 1-5: can only set default or their unlocked level's fixed rate
    if (unlockedLevel < 6) {
      const validRates = [config.defaultRatePerMinute];
      for (const lvl of config.levels) {
        if (lvl.level <= unlockedLevel && lvl.maxRate > 0) {
          validRates.push(lvl.maxRate);
        }
      }
      if (!validRates.includes(rate)) {
        return res.status(400).json({ message: `You can only set ₹${validRates.join(' or ₹')}/min at your current level` });
      }
    }
    // Level 6: any rate >= default is allowed

    user.callRatePerMinute = rate;
    user.callLevel = unlockedLevel;
    await user.save();

    res.json({ message: 'Call rate updated', callRatePerMinute: user.callRatePerMinute, callLevel: user.callLevel });
  } catch (error) {
    console.error('updateCallRate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Called after a call ends - update receiver's total duration and credit earnings
const recordCallDuration = async (req, res) => {
  try {
    const { receiverId, duration, charge } = req.body;
    if (!receiverId || !duration || duration <= 0) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const config = await getOrCreateConfig();
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    // Update total call duration
    receiver.totalCallDuration = (receiver.totalCallDuration || 0) + duration;

    // Calculate level
    const totalHours = receiver.totalCallDuration / 3600;
    let newLevel = 0;
    let creditPercent = 0;
    for (const lvl of config.levels) {
      if (totalHours >= lvl.hoursRequired) {
        newLevel = lvl.level;
        creditPercent = lvl.creditPercent;
      }
    }

    // Credit earnings (only if level >= 1)
    if (newLevel >= 1 && charge > 0) {
      const credit = Math.round(charge * (creditPercent / 100) * 100) / 100;
      receiver.credits = Math.round(((receiver.credits || 0) + credit) * 100) / 100;
    }

    if (newLevel > receiver.callLevel) {
      receiver.callLevel = newLevel;
    }

    await receiver.save();

    res.json({ message: 'Duration recorded', totalCallDuration: receiver.totalCallDuration, credits: receiver.credits, callLevel: receiver.callLevel });
  } catch (error) {
    console.error('recordCallDuration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get another user's call rate (for caller to see before calling)
const getUserCallRate = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('callRatePerMinute callLevel');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ callRatePerMinute: user.callRatePerMinute, callLevel: user.callLevel });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getLevelInfo, updateCallRate, recordCallDuration, getUserCallRate, getOrCreateConfig };
