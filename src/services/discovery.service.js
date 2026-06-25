const mongoose = require('mongoose');
const User = require('../models/user.model');
const Swipe = require('../models/swipe.model');
const Match = require('../models/match.model');

// Stage 3: Intent scoring matrix
const INTENT_SCORES = {
  'date_date': 100,
  'friend_friend': 100,
  'date_not_decided': 70,
  'not_decided_date': 70,
  'friend_not_decided': 70,
  'not_decided_friend': 70,
  'date_friend': 10,
  'friend_date': 10,
  'not_decided_not_decided': 50,
};

// Stage 4: Location scoring
const getLocationScore = (distanceKm) => {
  if (distanceKm === 0) return 40; // Same city
  if (distanceKm <= 20) return 30;
  if (distanceKm <= 50) return 20;
  if (distanceKm <= 100) return 10;
  return 0;
};

// Stage 5: Activity scoring
const getActivityScore = (lastActive) => {
  if (!lastActive) return 0;
  const hoursAgo = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 0.5) return 30; // Online now (within 30 min)
  if (hoursAgo < 24) return 20;
  if (hoursAgo < 168) return 10; // 7 days
  return 0;
};

// Stage 2: Mutual compatibility check
const isMutuallyCompatible = (userA, userB) => {
  const aInterestedIn = userA.interestedIn || 'any';
  const bInterestedIn = userB.interestedIn || 'any';

  const aMatchesB = aInterestedIn === 'any' || aInterestedIn === userB.gender;
  const bMatchesA = bInterestedIn === 'any' || bInterestedIn === userA.gender;

  return aMatchesB && bMatchesA;
};

// Stage 7: Behavioral similarity
const getBehavioralScore = (userA, candidate, swipeHistory) => {
  if (!swipeHistory || swipeHistory.length === 0) return 50; // Neutral if no history

  let matchCount = 0;
  let total = 0;

  // Check gender preference from swipe history
  const likedGenders = {};
  const likedCities = {};
  const likedInterests = {};

  swipeHistory.forEach((swipe) => {
    if (swipe.swiped) {
      const u = swipe.swiped;
      if (u.gender) likedGenders[u.gender] = (likedGenders[u.gender] || 0) + 1;
      if (u.city) likedCities[u.city] = (likedCities[u.city] || 0) + 1;
      if (u.interests) {
        u.interests.forEach((i) => {
          likedInterests[i] = (likedInterests[i] || 0) + 1;
        });
      }
    }
  });

  const totalLikes = swipeHistory.length || 1;

  // Gender match
  if (candidate.gender && likedGenders[candidate.gender]) {
    matchCount += (likedGenders[candidate.gender] / totalLikes) * 30;
  }
  total += 30;

  // City match
  if (candidate.city && likedCities[candidate.city]) {
    matchCount += (likedCities[candidate.city] / totalLikes) * 40;
  }
  total += 40;

  // Interest overlap
  if (candidate.interests && candidate.interests.length > 0) {
    const interestScore = candidate.interests.reduce((acc, interest) => {
      return acc + (likedInterests[interest] || 0);
    }, 0);
    matchCount += Math.min((interestScore / totalLikes) * 30, 30);
  }
  total += 30;

  return Math.round((matchCount / total) * 100);
};

// Main discovery function
const discoverUsers = async (userId, { page = 1, limit = 20 } = {}) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error('User not found');

  // ============ STAGE 1: Candidate Generation ============

  // Get recently swiped left (within 24h)
  const recentLeftSwipes = await Swipe.find({
    swiper: userId,
    direction: 'left',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).select('swiped').lean();

  // Get all right swipes (already liked)
  const rightSwipes = await Swipe.find({
    swiper: userId,
    direction: 'right',
  }).select('swiped').lean();

  const excludeIds = [
    userId,
    ...recentLeftSwipes.map((s) => s.swiped.toString()),
    ...rightSwipes.map((s) => s.swiped.toString()),
  ].map((id) => new mongoose.Types.ObjectId(id));

  // Base query - exclude self, blocked, banned, swiped
  const baseQuery = {
    _id: { $nin: excludeIds },
    status: 'active',
    isProfileCompleted: true,
  };

  // Location filter (within 100km if user has location)
  let candidates;
  if (currentUser.location && currentUser.location.coordinates[0] !== 0) {
    candidates = await User.find({
      ...baseQuery,
      location: {
        $nearSphere: {
          $geometry: currentUser.location,
          $maxDistance: 100000, // 100km in meters
        },
      },
    }).select('-password').limit(500).lean();
  } else {
    // Fallback: bucket by city first, then others
    const sameCityUsers = await User.find({
      ...baseQuery,
      city: currentUser.city,
    }).select('-password').limit(300).lean();

    const otherUsers = await User.find({
      ...baseQuery,
      city: { $ne: currentUser.city },
    }).select('-password').limit(200).lean();

    candidates = [...sameCityUsers, ...otherUsers];
  }

  // ============ STAGE 2: Mutual Compatibility Filter ============
  candidates = candidates.filter((candidate) => isMutuallyCompatible(currentUser, candidate));

  // ============ STAGE 7: Get behavioral data ============
  const swipeHistory = await Swipe.find({
    swiper: userId,
    direction: 'right',
  }).populate('swiped', 'gender city interests').limit(50).lean();

  // ============ STAGES 3-8: Score & Rank ============
  const scoredCandidates = candidates.map((candidate) => {
    // Stage 3: Intent
    const intentKey = `${currentUser.lookingFor}_${candidate.lookingFor}`;
    const intentScore = INTENT_SCORES[intentKey] || 50;

    // Stage 4: Location
    let locationScore = 0;
    if (candidate.city && currentUser.city && candidate.city.toLowerCase() === currentUser.city.toLowerCase()) {
      locationScore = 40;
    } else if (candidate.location && currentUser.location) {
      // Calculate approximate distance if both have coordinates
      const dist = getDistanceKm(
        currentUser.location.coordinates,
        candidate.location.coordinates
      );
      locationScore = getLocationScore(dist);
    }

    // Stage 5: Activity
    const activityScore = getActivityScore(candidate.lastActive);

    // Stage 7: Behavioral
    const behavioralScore = getBehavioralScore(currentUser, candidate, swipeHistory);

    // Profile completeness
    const profileScore = candidate.profileCompleteness || 50;

    // Stage 8: Final ranking score
    const matchScore =
      intentScore * 0.35 +
      locationScore * 0.25 +
      activityScore * 0.15 +
      profileScore * 0.10 +
      behavioralScore * 0.15;

    return { ...candidate, matchScore };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  // ============ STAGE 6: Popularity Balancing ============
  const totalCount = scoredCandidates.length;
  const highCompatCount = Math.floor(limit * 0.7);
  const newUserCount = Math.floor(limit * 0.2);
  const randomCount = limit - highCompatCount - newUserCount;

  // Top scored users (70%)
  const highCompat = scoredCandidates.slice(0, highCompatCount);

  // New users (20%) - registered within 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsers = scoredCandidates
    .filter((u) => new Date(u.createdAt) >= sevenDaysAgo && !highCompat.find((h) => h._id.toString() === u._id.toString()))
    .slice(0, newUserCount);

  // Random exploration (10%)
  const remaining = scoredCandidates.filter(
    (u) => !highCompat.find((h) => h._id.toString() === u._id.toString()) &&
           !newUsers.find((n) => n._id.toString() === u._id.toString())
  );
  const randomUsers = shuffleArray(remaining).slice(0, randomCount);

  // Combine and shuffle slightly for variety
  let finalResults = [...highCompat, ...newUsers, ...randomUsers];

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = finalResults.slice(startIndex, startIndex + limit);

  return {
    users: paginatedResults.map(({ password, matchScore, ...user }) => ({
      ...user,
      _matchScore: matchScore, // include for debugging, remove in production
    })),
    pagination: {
      page,
      limit,
      total: finalResults.length,
      hasMore: startIndex + limit < finalResults.length,
    },
  };
};

// Swipe action
const swipeUser = async (swiperId, swipedId, direction) => {
  // Save swipe (left swipes expire after 24h via TTL)
  const swipeData = {
    swiper: swiperId,
    swiped: swipedId,
    direction,
  };

  if (direction === 'left') {
    swipeData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  await Swipe.findOneAndUpdate(
    { swiper: swiperId, swiped: swipedId },
    swipeData,
    { upsert: true, new: true }
  );

  // Stage 9: Check for mutual like
  if (direction === 'right') {
    const otherSwipe = await Swipe.findOne({
      swiper: swipedId,
      swiped: swiperId,
      direction: 'right',
    });

    if (otherSwipe) {
      // Mutual like - create match
      const existingMatch = await Match.findOne({
        users: { $all: [swiperId, swipedId] },
      });

      if (!existingMatch) {
        const match = await Match.create({
          users: [swiperId, swipedId],
        });
        return { matched: true, match };
      }
    }
  }

  return { matched: false };
};

// Helper: Haversine distance in km
const getDistanceKm = (coords1, coords2) => {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Helper: shuffle array
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

module.exports = { discoverUsers, swipeUser };
