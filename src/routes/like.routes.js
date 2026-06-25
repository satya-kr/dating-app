const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { likeProfile, hasLikedProfile, likeMessage } = require('../controllers/like.controller');

const router = Router();

router.post('/profile', authMiddleware, likeProfile);
router.get('/profile/:userId', authMiddleware, hasLikedProfile);
router.post('/message', authMiddleware, likeMessage);

module.exports = router;
