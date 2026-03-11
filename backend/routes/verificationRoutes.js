const express = require('express');
const router = express.Router();
const { submitVerification } = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// POST /api/verifications — Volunteer submits their ID for review
// Body: { idDocument: "<url or path>" }
router.post('/', protect, restrictTo('volunteer'), submitVerification);

module.exports = router;
