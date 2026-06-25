const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { deactivateAccount, deleteAccount, getBlockedUsers, unblockUser, changePassword } = require('../controllers/account.controller');

const router = Router();

router.post('/deactivate', authMiddleware, deactivateAccount);
router.post('/delete', authMiddleware, deleteAccount);
router.post('/change-password', authMiddleware, changePassword);
router.get('/blocked', authMiddleware, getBlockedUsers);
router.post('/unblock', authMiddleware, unblockUser);

module.exports = router;
