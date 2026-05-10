const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
    {
        // The user being rated
        ratedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // The user giving the rating
        ratedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // The donation this rating is associated with
        donationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Donation',
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
