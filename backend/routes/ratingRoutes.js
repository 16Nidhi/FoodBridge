const express = require('express');
const router = express.Router();
const { addRating, getVolunteerRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// POST /api/ratings — NGO rates a volunteer after delivery
// Body: { volunteerId, rating (1–5), review? }
router.post('/', protect, restrictTo('ngo'), addRating);

// GET /api/ratings/:volunteerId — Get all ratings for a volunteer (any authenticated user)
router.get('/:volunteerId', protect, getVolunteerRatings);

module.exports = router;
