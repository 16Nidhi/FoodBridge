const mongoose = require('mongoose');

/**
 * Donation Schema
 *
 * Represents a food donation posted by a donor.
 *
 * Status lifecycle:
 *   posted → accepted → picked_up → delivered
 *                                 → expired (if not acted upon in time)
 *
 * NGO Priority Logic:
 *   - When posted, the donation is NOT yet visible to independent volunteers.
 *   - After NGO_WINDOW_HOURS (defined in donationController), it is
 *     automatically made visible to volunteers (openToVolunteers = true).
 *   - This gives NGOs the first chance to assign their own volunteer.
 */
const donationSchema = new mongoose.Schema(
    {
        // Type/description of food being donated (e.g., "Rice and Curry", "Bread")
        foodType: {
            type: String,
            required: [true, 'Food type is required'],
            trim: true,
        },

        // Optional free-text description provided by the donor
        description: {
            type: String,
            trim: true,
            default: '',
        },

        // Category such as "Cooked Food", "Bakery", "Produce", etc.
        category: {
            type: String,
            trim: true,
            default: 'Other',
        },

        // Quantity description (e.g., "20 servings", "5 kg")
        quantity: {
            type: String,
            required: [true, 'Quantity is required'],
            trim: true,
        },

        // Pickup location provided by the donor
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },

        // When the food was prepared (used to calculate expiryTime)
        preparedTime: {
            type: Date,
            required: [true, 'Prepared time is required'],
        },

        // Auto-calculated: preparedTime + 4 hours (set in pre-save hook)
        expiryTime: {
            type: Date,
        },

        // The donor who created this donation
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // The volunteer assigned to pick up the food (null until assigned)
        assignedVolunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // The NGO that accepted this donation (null until an NGO claims it)
        assignedNGO: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // Current state in the donation lifecycle
        status: {
            type: String,
            enum: ['posted', 'accepted', 'picked_up', 'delivered', 'expired'],
            default: 'posted',
        },

        // Timestamp of when the NGO accepted (used internally for tracking)
        ngoAcceptedAt: {
            type: Date,
            default: null,
        },

        // Becomes true after the NGO window expires so volunteers can see it
        openToVolunteers: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ----------------------------
// Pre-save Hook: Calculate Expiry Time
// ----------------------------

// Automatically sets expiryTime to preparedTime + 4 hours
donationSchema.pre('save', function (next) {
    if (this.isModified('preparedTime') && this.preparedTime) {
        const EXPIRY_HOURS = 4;
        this.expiryTime = new Date(
            this.preparedTime.getTime() + EXPIRY_HOURS * 60 * 60 * 1000
        );
    }
    next();
});

module.exports = mongoose.model('Donation', donationSchema);
