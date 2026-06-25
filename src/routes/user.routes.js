const { Router } = require('express');
const { getUsers, getProfile, updateProfile, createPost, uploadImage, removeImage } = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

const router = Router();

router.get('/', authMiddleware, getUsers);
router.get('/profile/:userId', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);
router.post('/posts', authMiddleware, upload.single('image'), createPost);
router.post('/images/upload', authMiddleware, upload.single('image'), uploadImage);
router.post('/images/remove', authMiddleware, removeImage);

module.exports = router;
