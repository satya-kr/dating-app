const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { createOrder, verifyPayment, ALLOWED_RECHARGE_AMOUNTS } = require('../controllers/payment.controller');

const router = Router();

router.get('/amounts', (_, res) => res.json({ amounts: ALLOWED_RECHARGE_AMOUNTS }));
router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router;
