const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    isProfileCompleted: { type: Boolean, default: false },
    profileLikes: { type: Number, default: 0 },
    messageLikes: { type: Number, default: 0 },
    lookingFor: { type: String, enum: ['date', 'friend', 'not_decided'] },
    gender: { type: String, enum: ['male', 'female', 'transgender'] },
    interestedIn: { type: String, enum: ['male', 'female', 'transgender', 'any'], default: 'any' },
    interests: { type: [String], validate: [v => v.length <= 5, 'Max 5 interests allowed'] },
    city: { type: String },
    state: { type: String },
    bio: { type: String },
    images: { type: [String], default: [], validate: [v => v.length <= 5, 'Max 5 images allowed'] },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    lastActive: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'banned', 'deactivated', 'deleted'], default: 'active' },
    isDeactivated: { type: Boolean, default: false },
    deactivatedAt: { type: Date },
    deletionScheduledAt: { type: Date },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ city: 1, gender: 1, status: 1 });
userSchema.index({ gender: 1, interestedIn: 1, lookingFor: 1 });
userSchema.index({ lastActive: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.calculateProfileCompleteness = function () {
  let score = 0;
  if (this.name) score += 15;
  if (this.bio && this.bio.length >= 10) score += 20;
  if (this.gender) score += 15;
  if (this.interestedIn) score += 10;
  if (this.lookingFor) score += 10;
  if (this.city) score += 10;
  if (this.interests && this.interests.length > 0) score += 10;
  if (this.location && this.location.coordinates[0] !== 0) score += 10;
  return score;
};

module.exports = mongoose.model('User', userSchema);
