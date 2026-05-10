const Notification = require('../models/Notification');

// ----------------------------
// @desc   Get all notifications for the logged-in user
// @route  GET /api/notifications
// @access Private
// ----------------------------
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notifications.length, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching notifications.' });
    }
};

// ----------------------------
// @desc   Mark a notification as read
// @route  PATCH /api/notifications/:id/read
// @access Private
// ----------------------------
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({ success: true, message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ----------------------------
// @desc   Mark all notifications as read
// @route  PATCH /api/notifications/read-all
// @access Private
// ----------------------------
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


module.exports = { getMyNotifications, markAsRead, markAllAsRead };
