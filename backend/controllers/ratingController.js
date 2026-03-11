const Rating = require('../models/Rating');
const User = require('../models/User');

// ----------------------------
// @desc   NGO submits a rating for a volunteer
// @route  POST /api/ratings
// @access Private — NGO only
// ----------------------------

const addRating = async (req, res) => {
    const { volunteerId, rating, review } = req.body;

    if (!volunteerId || !rating) {
        return res.status(400).json({
            success: false,
            message: 'volunteerId and rating are required.',
        });
    }

    // Validate rating range before hitting the database
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be a number between 1 and 5.',
        });
    }

    try {
        // Confirm the target user exists and is actually a volunteer
        const volunteer = await User.findById(volunteerId);

        if (!volunteer || volunteer.role !== 'volunteer') {
            return res.status(404).json({ success: false, message: 'Volunteer not found.' });
        }

        // Save the new rating
        const newRating = await Rating.create({
            volunteerId,
            ngoId: req.user._id,
            rating,
            review,
        });

        // ----------------------------
        // Recalculate the volunteer's average rating
        // ----------------------------

        // Fetch ALL ratings for this volunteer to calculate the true average
        const allRatings = await Rating.find({ volunteerId });
        const totalSum = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalSum / allRatings.length;

        // Update the volunteer's average rating and increment their delivery count
        await User.findByIdAndUpdate(volunteerId, {
            rating: parseFloat(averageRating.toFixed(2)),
            $inc: { deliveriesCompleted: 1 },
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
// @desc   Get all ratings for a specific volunteer
// @route  GET /api/ratings/:volunteerId
// @access Private
// ----------------------------

const getVolunteerRatings = async (req, res) => {
    try {
        const { volunteerId } = req.params;

        // Get all ratings for this volunteer, with NGO names populated
        const ratings = await Rating.find({ volunteerId })
            .populate('ngoId', 'name email')
            .sort({ createdAt: -1 });

        // Include volunteer summary stats alongside the ratings list
        const volunteer = await User.findById(volunteerId)
            .select('name rating deliveriesCompleted verificationStatus');

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found.' });
        }

        res.status(200).json({
            success: true,
            volunteer,
            count: ratings.length,
            ratings,
        });
    } catch (error) {
        console.error('Get volunteer ratings error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching ratings.' });
    }
};

module.exports = { addRating, getVolunteerRatings };
