const Rating = require('../models/Rating');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { createNotification } = require('../utils/helpers');

// ----------------------------
// @desc   Submit a rating for a user involved in a donation
// @route  POST /api/ratings
// @access Private
// ----------------------------
const addRating = async (req, res) => {
    const { ratedUserId, donationId, rating, review } = req.body;

    if (!ratedUserId || !donationId || !rating) {
        return res.status(400).json({
            success: false,
            message: 'ratedUserId, donationId, and rating are required.',
        });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be a number between 1 and 5.',
        });
    }

    try {
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Logic to ensure the rater was part of the transaction
        const raterId = req.user._id.toString();
        const donorId = donation.donor.toString();
        const claimedById = donation.claimedBy ? donation.claimedBy.toString() : null;

        const isRaterDonor = raterId === donorId;
        const isRaterClaimer = raterId === claimedById;

        if (!isRaterDonor && !isRaterClaimer) {
            return res.status(403).json({ success: false, message: 'You were not part of this transaction.' });
        }
        
        // Prevent rating yourself
        if (ratedUserId === raterId) {
            return res.status(400).json({ success: false, message: 'You cannot rate yourself.' });
        }

        // Ensure the rated user was the other party in the transaction
        if ((isRaterDonor && ratedUserId !== claimedById) || (isRaterClaimer && ratedUserId !== donorId)) {
             return res.status(403).json({ success: false, message: 'You can only rate the other party in the transaction.' });
        }

        // Prevent double-rating for the same donation
        const existingRating = await Rating.findOne({ donationId, ratedBy: raterId });
        if (existingRating) {
            return res.status(400).json({ success: false, message: 'You have already rated this transaction.' });
        }

        const newRating = await Rating.create({
            ratedUser: ratedUserId,
            ratedBy: raterId,
            donationId,
            rating,
            review,
        });

        // Recalculate the user's average rating
        const allRatings = await Rating.find({ ratedUser: ratedUserId });
        const totalSum = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalSum / allRatings.length;

        await User.findByIdAndUpdate(ratedUserId, {
            rating: parseFloat(averageRating.toFixed(2)),
        });

        // Notify the user who was rated
        await createNotification({
            recipient: ratedUserId,
            sender: raterId,
            type: 'new_rating',
            message: `${req.user.name} gave you a ${rating}-star rating.`,
            link: `/profile/${ratedUserId}`, // Link to the user's profile
        });

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully.',
            rating: newRating,
        });
    } catch (error) {
        console.error('Add rating error:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting rating.' });
    }
};

// ----------------------------
// @desc   Get all ratings for a specific user
// @route  GET /api/ratings/:userId
// @access Private
// ----------------------------
const getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;

        const ratings = await Rating.find({ ratedUser: userId })
            .populate('ratedBy', 'name email role')
            .populate('donationId', 'foodItem')
            .sort({ createdAt: -1 });

        const user = await User.findById(userId).select('name rating role');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            user,
            count: ratings.length,
            ratings,
        });
    } catch (error) {
        console.error('Get user ratings error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching ratings.' });
    }
};

module.exports = { addRating, getUserRatings };
