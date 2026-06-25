const User = require('../models/user.model');
const ProfileLike = require('../models/profileLike.model');
const ChatBlock = require('../models/chatBlock.model');

// Run every hour - check for accounts past their deletion date
const runDeletionCron = () => {
  setInterval(async () => {
    try {
      const now = new Date();

      const usersToDelete = await User.find({
        status: 'deleted',
        deletionScheduledAt: { $lte: now },
      }).select('_id');

      if (usersToDelete.length === 0) return;

      const userIds = usersToDelete.map((u) => u._id);

      // Soft delete: wipe personal data
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          name: 'Deleted User',
          email: '',
          phone: '',
          password: '',
          bio: '',
          interests: [],
          city: '',
          isProfileCompleted: false,
          status: 'deleted',
          isDeactivated: true,
        }
      );

      await ProfileLike.deleteMany({ $or: [{ liker: { $in: userIds } }, { liked: { $in: userIds } }] });
      await ChatBlock.deleteMany({ $or: [{ blocker: { $in: userIds } }, { blocked: { $in: userIds } }] });

      console.log(`Permanently deleted ${userIds.length} accounts`);
    } catch (error) {
      console.error('Deletion cron error:', error);
    }
  }, 60 * 60 * 1000); // Every hour
};

module.exports = { runDeletionCron };
