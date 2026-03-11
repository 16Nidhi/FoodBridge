/**
 * helpers.js
 *
 * Shared utility functions used across controllers.
 * Keeping these here avoids repeating logic in multiple places.
 */

/**
 * Calculate when food will expire based on when it was prepared.
 *
 * @param {Date|string} preparedTime - When the food was prepared
 * @param {number} hoursValid - How many hours the food is safe to eat (default: 4)
 * @returns {Date} The expiry date/time
 */
const calculateExpiryTime = (preparedTime, hoursValid = 4) => {
    const prepared = new Date(preparedTime);
    return new Date(prepared.getTime() + hoursValid * 60 * 60 * 1000);
};

/**
 * Check whether the NGO priority window has elapsed for a donation.
 * After this window, independent volunteers can see the donation.
 *
 * @param {Date|string} createdAt - When the donation was first posted
 * @param {number} windowHours - Length of the NGO-exclusive window in hours (default: 2)
 * @returns {boolean} True if the window has passed and volunteers can claim it
 */
const isNGOWindowExpired = (createdAt, windowHours = 2) => {
    const windowMs = windowHours * 60 * 60 * 1000;
    return Date.now() - new Date(createdAt).getTime() > windowMs;
};

/**
 * Build a consistent success response object.
 *
 * @param {string} message - Human-readable success message
 * @param {object} data - Additional data to include in the response
 * @returns {object}
 */
const successResponse = (message, data = {}) => ({
    success: true,
    message,
    ...data,
});

/**
 * Build a consistent error response object.
 *
 * @param {string} message - Human-readable error message
 * @returns {object}
 */
const errorResponse = (message) => ({
    success: false,
    message,
});

module.exports = {
    calculateExpiryTime,
    isNGOWindowExpired,
    successResponse,
    errorResponse,
};
