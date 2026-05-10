const express = require('express');
const router = express.Router();
const { addRating, getUserRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ratings — Rate a user for a completed donation
// Body: { ratedUserId, donationId, rating (1–5), review? }
router.post('/', protect, addRating);

// GET /api/ratings/:userId — Get all ratings for a user
router.get('/:userId', protect, getUserRatings);

module.exports = router;
