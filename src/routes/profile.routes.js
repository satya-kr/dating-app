const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { completeProfile } = require('../controllers/profile.controller');

const router = Router();

router.put('/complete', authMiddleware, completeProfile);

module.exports = router;
