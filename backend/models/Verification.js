const mongoose = require('mongoose');

/**
 * Verification Schema
 *
 * Stores ID verification requests submitted by volunteers.
 * An admin reviews each request and sets the status to approved or rejected.
 * One verification record per volunteer (enforced by unique index on volunteerId).
 */
const verificationSchema = new mongoose.Schema({
    // The volunteer who submitted this request
    volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Only one active verification request per volunteer
    },

    // URL or file path of the uploaded identity document
    idDocument: {
        type: String,
        required: [true, 'ID document is required'],
        trim: true,
    },

    // Current review status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    // When the volunteer submitted the request
    submittedAt: {
        type: Date,
        default: Date.now,
    },

    // The admin who reviewed this request (null until reviewed)
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
});

module.exports = mongoose.model('Verification', verificationSchema);
