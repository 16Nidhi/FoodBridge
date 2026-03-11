const express = require('express');
const router = express.Router();
const { getAllUsers, getAllDonations, getStats } = require('../controllers/adminController');
const { getAllVerifications, reviewVerification } = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// All routes in this file require an authenticated admin
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/admin/users — List all users (filter: ?role=volunteer)
router.get('/users', getAllUsers);

// GET /api/admin/donations — List all donations (filter: ?status=delivered)
router.get('/donations', getAllDonations);

// GET /api/admin/stats — Platform statistics summary
router.get('/stats', getStats);

// GET /api/admin/verifications — All volunteer verification requests (filter: ?status=pending)
router.get('/verifications', getAllVerifications);

// PATCH /api/admin/verifications/:id — Approve or reject a verification
// Body: { status: "approved" | "rejected" }
router.patch('/verifications/:id', reviewVerification);

module.exports = router;
