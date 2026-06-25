const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { blockUser, isBlocked } = require('../controllers/block.controller');

const router = Router();

router.post('/', authMiddleware, blockUser);
router.get('/:userId', authMiddleware, isBlocked);

module.exports = router;
