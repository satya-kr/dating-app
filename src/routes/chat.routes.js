const { Router } = require('express');
const { getMessages, getChats, getCallHistory } = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.get('/messages/:userId', authMiddleware, getMessages);
router.get('/list', authMiddleware, getChats);
router.get('/calls', authMiddleware, getCallHistory);

module.exports = router;
