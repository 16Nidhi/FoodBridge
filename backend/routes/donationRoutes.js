const express = require('express');
const router = express.Router();
const {
    createDonation,
    getAllDonations,
    getMyDonations,
    acceptDonation,
    volunteerAcceptDonation,
    markPickedUp,
    markDelivered,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// All routes below require the user to be logged in
router.use(protect);

// POST /api/donations — Donor creates a new donation
router.post('/', restrictTo('donor'), createDonation);

// GET /api/donations — View available donations (NGOs see all, volunteers see open ones)
router.get('/', restrictTo('ngo', 'volunteer', 'admin'), getAllDonations);

// GET /api/donations/my-donations — Donor views their own posted donations
// NOTE: This must be declared BEFORE /:id routes to avoid conflicts
router.get('/my-donations', restrictTo('donor'), getMyDonations);

// PATCH /api/donations/accept — NGO accepts a donation (body: { donationId, volunteerId? })
router.patch('/accept', restrictTo('ngo'), acceptDonation);

// PATCH /api/donations/volunteer-accept — Volunteer self-accepts an open pickup
router.patch('/volunteer-accept', restrictTo('volunteer'), volunteerAcceptDonation);

// PATCH /api/donations/picked-up — Volunteer marks food as collected (body: { donationId })
router.patch('/picked-up', restrictTo('volunteer'), markPickedUp);

// PATCH /api/donations/delivered — NGO confirms the food was delivered (body: { donationId })
router.patch('/delivered', restrictTo('ngo'), markDelivered);

module.exports = router;
