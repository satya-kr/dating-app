const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getUsers } = require('../controllers/users.controller');

const router = Router();

router.get('/', authMiddleware, getUsers);

module.exports = router;
