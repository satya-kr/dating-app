const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const ALLOWED_RECHARGE_AMOUNTS = [150, 304, 520, 900, 1075, 2150];

// Create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!ALLOWED_RECHARGE_AMOUNTS.includes(amount)) {
      return res.status(400).json({ message: 'Invalid recharge amount' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `w_${req.userId.slice(-8)}_${Date.now().toString(36)}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Verify payment and add to wallet
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Add amount to wallet (amount comes in INR)
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { wallet: amount } },
      { new: true }
    );

    res.json({ message: 'Payment successful', balance: user.wallet });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

module.exports = { createOrder, verifyPayment, ALLOWED_RECHARGE_AMOUNTS };
