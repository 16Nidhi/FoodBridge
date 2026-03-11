const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 *
 * Supports four roles: donor, volunteer, ngo, admin.
 * Passwords are hashed automatically before saving via a pre-save hook.
 * Volunteers accumulate deliveriesCompleted and an average rating over time.
 */
const userSchema = new mongoose.Schema(
    {
        // Full name of the user
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },

        // Unique email used for login
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Hashed password (plain text is never stored)
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },

        // Contact phone number
        phone: {
            type: String,
            trim: true,
        },

        // Role determines what the user can do on the platform
        role: {
            type: String,
            enum: ['donor', 'volunteer', 'ngo', 'admin'],
            default: 'donor',
        },

        // Whether admin has verified this user (mainly for volunteers and NGOs)
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        // Average rating given by NGOs after deliveries (volunteers only)
        rating: {
            type: Number,
            default: 0,
        },

        // Total number of successful deliveries (volunteers only)
        deliveriesCompleted: {
            type: Number,
            default: 0,
        },
    },
    {
        // Automatically adds createdAt and updatedAt fields
        timestamps: true,
    }
);

// ----------------------------
// Pre-save Hook: Hash Password
// ----------------------------

// Runs before every save — only hashes when password field has been changed
userSchema.pre('save', async function (next) {
    // If password was not modified, skip hashing
    if (!this.isModified('password')) return next();

    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ----------------------------
// Instance Method: Compare Password
// ----------------------------

// Compares a plain-text password against the stored hash during login
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
