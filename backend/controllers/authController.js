const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ----------------------------
// Helper: Generate JWT Token
// ----------------------------

/**
 * Signs a JWT containing the user's MongoDB ID.
 * Expiry is controlled by JWT_EXPIRES_IN in .env (default: 7d).
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ----------------------------
// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
// ----------------------------

const register = async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email, password, and role.',
        });
    }

    try {
        // Prevent duplicate registrations with the same email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists.',
            });
        }

        // Create the user — the pre-save hook will automatically hash the password
        const user = await User.create({ name, email, password, phone, role });

        // Issue a token immediately so the user is logged in after registration
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ----------------------------
// @desc   Login user
// @route  POST /api/auth/login
// @access Public
// ----------------------------

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password.',
        });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Use a generic error message to avoid revealing which field is wrong
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Compare the entered plain-text password with the stored hash
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                verificationStatus: user.verificationStatus,
                rating: user.rating,
                deliveriesCompleted: user.deliveriesCompleted,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// ----------------------------
// @desc   Get currently logged-in user's profile
// @route  GET /api/auth/me
// @access Private
// ----------------------------

const getMe = async (req, res) => {
    try {
        // req.user is already populated by the protect middleware (no password field)
        const user = await User.findById(req.user._id).select('-password');

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { register, login, getMe };
