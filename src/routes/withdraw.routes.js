const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getBankDetails, saveBankDetails, requestWithdrawal, getWithdrawals } = require('../controllers/withdraw.controller');

const router = Router();

router.get('/bank', authMiddleware, getBankDetails);
router.post('/bank', authMiddleware, saveBankDetails);
router.post('/request', authMiddleware, requestWithdrawal);
router.get('/history', authMiddleware, getWithdrawals);

module.exports = router;
