const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { discover, swipe, getMatches } = require('../controllers/discovery.controller');

const router = Router();

router.get('/discover', authMiddleware, discover);
router.post('/swipe', authMiddleware, swipe);
router.get('/matches', authMiddleware, getMatches);

module.exports = router;
