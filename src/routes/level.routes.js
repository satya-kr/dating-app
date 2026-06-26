const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getLevelInfo, updateCallRate, recordCallDuration, getUserCallRate } = require('../controllers/level.controller');

const router = Router();

router.get('/info', authMiddleware, getLevelInfo);
router.post('/update-rate', authMiddleware, updateCallRate);
router.post('/record-duration', authMiddleware, recordCallDuration);
router.get('/user-rate/:userId', authMiddleware, getUserCallRate);

module.exports = router;
