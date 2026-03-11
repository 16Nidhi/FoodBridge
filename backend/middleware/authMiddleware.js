const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware
 *
 * Verifies the JWT token sent in the Authorization header.
 * Attaches the decoded user (without password) to req.user.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
    let token;

    // Check if the Authorization header exists and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Reject requests without a token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please log in to access this route.',
        });
    }

    try {
        // Verify the token signature and decode the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch full user from DB, excluding the password field
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.',
            });
        }

        // Attach user to request so downstream middleware/controllers can use it
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token is invalid or has expired. Please log in again.',
        });
    }
};

module.exports = { protect };
