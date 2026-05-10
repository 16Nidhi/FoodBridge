const express = require('express');
const router = express.Router();
const { register, login, getMe, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Create a new account (public)
router.post('/register', register);

// POST /api/auth/login — Login and receive a JWT (public)
router.post('/login', login);

// GET /api/auth/me — Get the current user's profile (requires login)
router.get('/me', protect, getMe);

// PATCH /api/auth/me — Update the current user's profile (requires login)
router.patch('/me', protect, updateUserProfile);

module.exports = router;
