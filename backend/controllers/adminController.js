const User = require('../models/User');
const Donation = require('../models/Donation');
const Verification = require('../models/Verification');

// ----------------------------
// @desc   Get all users (with optional role filter)
// @route  GET /api/admin/users
// @access Private — Admin only
// ----------------------------

const getAllUsers = async (req, res) => {
    try {
        // Allow filtering by role: /api/admin/users?role=volunteer
        const filter = req.query.role ? { role: req.query.role } : {};

        const users = await User.find(filter)
            .select('-password')          // Never return passwords
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching users.' });
    }
};

// ----------------------------
// @desc   Get all donations
// @route  GET /api/admin/donations
// @access Private — Admin only
// ----------------------------

const getAllDonations = async (req, res) => {
    try {
        // Allow filtering by status: /api/admin/donations?status=delivered
        const filter = req.query.status ? { status: req.query.status } : {};

        const donations = await Donation.find(filter)
            .populate('donorId', 'name email')
            .populate('assignedVolunteer', 'name email rating')
            .populate('assignedNGO', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('Admin get donations error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching donations.' });
    }
};

// ----------------------------
// @desc   Get platform-wide statistics summary
// @route  GET /api/admin/stats
// @access Private — Admin only
// ----------------------------

const getStats = async (req, res) => {
    try {
        // Run all count queries in parallel for performance
        const [
            totalUsers,
            totalDonors,
            totalVolunteers,
            totalNGOs,
            totalDonations,
            deliveredDonations,
            activeDonations,
            pendingVerifications,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'donor' }),
            User.countDocuments({ role: 'volunteer' }),
            User.countDocuments({ role: 'ngo' }),
            Donation.countDocuments(),
            Donation.countDocuments({ status: 'delivered' }),
            Donation.countDocuments({ status: { $in: ['posted', 'accepted', 'picked_up'] } }),
            Verification.countDocuments({ status: 'pending' }),
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalDonors,
                totalVolunteers,
                totalNGOs,
                totalDonations,
                deliveredDonations,
                activeDonations,
                pendingVerifications,
            },
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching statistics.' });
    }
};

module.exports = { getAllUsers, getAllDonations, getStats };
