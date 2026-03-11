/**
 * restrictTo middleware factory
 *
 * Returns a middleware function that only allows users whose role
 * is included in the allowedRoles list.
 *
 * Usage (after the protect middleware):
 *   router.post('/donations', protect, restrictTo('donor'), createDonation);
 *
 * @param {...string} allowedRoles - One or more roles permitted for the route
 */
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is set by the protect middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated. Please log in.',
            });
        }

        // Check whether the user's role is in the allowed list
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Only ${allowedRoles.join(', ')} can access this route.`,
            });
        }

        // Role is permitted — proceed to the next handler
        next();
    };
};

module.exports = { restrictTo };
