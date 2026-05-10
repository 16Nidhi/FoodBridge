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

/**
 * Create and save a new notification.
 *
 * @param {object} details - Notification details
 * @param {string} details.recipient - The user ID of the person to notify
 * @param {string} [details.sender] - The user ID of the person who triggered the event
 * @param {'donation_claimed'|'donation_completed'|'new_rating'|'verification_approved'|'verification_rejected'} details.type - The type of notification
 * @param {string} details.message - The notification message
 * @param {string} [details.link] - A URL link related to the notification
 */
const createNotification = async (details) => {
    try {
        await Notification.create(details);
    } catch (error) {
        console.error('Failed to create notification:', error);
        // We don't throw an error here because a failed notification
        // should not block the primary action (e.g., claiming a donation).
    }
};

module.exports = {
    calculateExpiryTime,
    isNGOWindowExpired,
    successResponse,
    errorResponse,
    createNotification,
};
