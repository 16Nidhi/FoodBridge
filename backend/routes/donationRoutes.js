const express = require('express');
const router = express.Router();
const {
    createDonation,
    getAllDonations,
    getDonationById,
    getMyDonations,
    claimDonation,
    completeDonation,
    updateDonation,
    deleteDonation,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// All routes below require the user to be logged in
router.use(protect);

router
    .route('/')
    .post(restrictTo('donor'), createDonation)
    .get(getAllDonations);

router.get('/my', getMyDonations);

router
    .route('/:id')
    .get(getDonationById)
    .put(restrictTo('donor'), updateDonation)
    .delete(restrictTo('donor'), deleteDonation);

router.patch('/:id/claim', restrictTo('ngo', 'volunteer'), claimDonation);
router.patch('/:id/complete', restrictTo('ngo', 'volunteer'), completeDonation);

module.exports = router;
