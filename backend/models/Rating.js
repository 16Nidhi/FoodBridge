const mongoose = require('mongoose');

/**
 * Rating Schema
 *
 * An NGO submits a rating for a volunteer after a successful delivery.
 * Adding a rating also triggers an update to the volunteer's
 * average rating and deliveriesCompleted count in the User collection.
 */
const ratingSchema = new mongoose.Schema(
    {
        // The volunteer being rated
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // The NGO giving the rating
        ngoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Numeric rating from 1 (poor) to 5 (excellent)
        rating: {
            type: Number,
            required: [true, 'Rating value is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },

        // Optional text review accompanying the rating
        review: {
            type: String,
            trim: true,
        },
    },
    {
        // createdAt is used to sort ratings by most recent
        timestamps: true,
    }
);

module.exports = mongoose.model('Rating', ratingSchema);
