const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        // The user who receives the notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // The user who triggered the notification (optional)
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // The type of notification
        type: {
            type: String,
            enum: ['donation_claimed', 'donation_completed', 'new_rating', 'verification_approved', 'verification_rejected'],
            required: true,
        },
        // The message to be displayed
        message: {
            type: String,
            required: true,
        },
        // Whether the notification has been read
        read: {
            type: Boolean,
            default: false,
        },
        // Link to the relevant page (e.g., a donation page)
        link: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
