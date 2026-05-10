const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file are protected
router.use(protect);

// GET /api/notifications — Get all notifications for the logged-in user
router.get('/', getMyNotifications);

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read — Mark a single notification as read
router.patch('/:id/read', markAsRead);

module.exports = router;
