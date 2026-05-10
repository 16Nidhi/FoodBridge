const Donation = require('../models/Donation');
const { createNotification } = require('../utils/helpers');

/**
 * NGO Priority Window:
 * After a donation is posted, NGOs have this many hours of exclusive access.
 * If no NGO accepts within this window, independent volunteers can also see it.
 */
const NGO_WINDOW_HOURS = 2;
const NGO_WINDOW_MS = NGO_WINDOW_HOURS * 60 * 60 * 1000;

// ----------------------------
// Internal Helper
// ----------------------------

/**
 * Opens donations to independent volunteers whose NGO window has expired.
 * Called automatically before fetching donations to keep the feed up to date.
 */
const openExpiredDonationsToVolunteers = async () => {
    const windowCutoff = new Date(Date.now() - NGO_WINDOW_MS);

    await Donation.updateMany(
        {
            status: 'posted',          // Only donations not yet accepted
            openToVolunteers: false,   // Not yet visible to volunteers
            createdAt: { $lte: windowCutoff }, // Posted before the cutoff
        },
        { $set: { openToVolunteers: true } }
    );
};

// ----------------------------
// @desc   Create a new donation
// @route  POST /api/donations
// @access Private — Donor only
// ----------------------------

const createDonation = async (req, res) => {
    const { foodItem, quantity, pickupLocation, pickupTime } = req.body;

    if (!foodItem || !quantity || !pickupLocation || !pickupTime) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields for the donation.',
        });
    }

    try {
        const donation = await Donation.create({
            foodItem,
            quantity,
            pickupLocation,
            pickupTime: new Date(pickupTime),
            donor: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: 'Donation posted successfully.',
            donation,
        });
    } catch (error) {
        console.error('Create donation error:', error);
        res.status(500).json({ success: false, message: 'Server error while creating donation.' });
    }
};

// ----------------------------
// @desc   Get donations (filtered by role)
// @route  GET /api/donations
// @access Private — NGO, Volunteer, Admin
// ----------------------------

const getAllDonations = async (req, res) => {
    try {
        const { search, foodType, location } = req.query;
        let filter = {};

        // Admins see all donations, others see only pending
        if (req.user.role !== 'admin') {
            filter.status = 'pending';
        }

        if (search) {
            filter.$or = [
                { foodItem: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (foodType) {
            filter.foodType = foodType;
        }

        if (location) {
            filter.pickupLocation = { $regex: location, $options: 'i' };
        }

        const donations = await Donation.find(filter)
            .populate('donor', 'name email')
            .populate('claimedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching donations.' });
    }
};

// ----------------------------
// @desc   Get a single donation by ID
// @route  GET /api/donations/:id
// @access Private
// ----------------------------
const getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('donor', 'name email')
            .populate('claimedBy', 'name email');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        res.status(200).json({ success: true, donation });
    } catch (error) {
        console.error('Get donation by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ----------------------------
// @desc   Get donations for the logged-in user (donor, NGO, volunteer)
// @route  GET /api/donations/my
// @access Private
// ----------------------------
const getMyDonations = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'donor') {
            filter.donor = req.user._id;
        } else { // For NGO and Volunteer
            filter.claimedBy = req.user._id;
        }

        const donations = await Donation.find(filter)
            .populate('donor', 'name email')
            .populate('claimedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('Get my donations error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching your donations.' });
    }
};

// ----------------------------
// @desc   Claim a donation
// @route  PATCH /api/donations/:id/claim
// @access Private - NGO, Volunteer
// ----------------------------
const claimDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        if (donation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This donation is no longer available.',
            });
        }

        donation.status = 'claimed';
        donation.claimedBy = req.user._id;
        await donation.save();

        // Notify the donor
        await createNotification({
            recipient: donation.donor,
            sender: req.user._id,
            type: 'donation_claimed',
            message: `${req.user.name} has claimed your donation of "${donation.foodItem}".`,
            link: `/donations/${donation._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Donation claimed successfully.',
            donation,
        });
    } catch (error) {
        console.error('Claim donation error:', error);
        res.status(500).json({ success: false, message: 'Server error while claiming donation.' });
    }
};

// ----------------------------
// @desc   Mark a donation as completed
// @route  PATCH /api/donations/:id/complete
// @access Private - NGO, Volunteer
// ----------------------------
const completeDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        if (donation.status !== 'claimed') {
            return res.status(400).json({
                success: false,
                message: 'Donation must be claimed first.',
            });
        }

        if (donation.claimedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to complete this donation.',
            });
        }

        donation.status = 'completed';
        await donation.save();

        // Notify the donor
        await createNotification({
            recipient: donation.donor,
            sender: req.user._id,
            type: 'donation_completed',
            message: `Your donation of "${donation.foodItem}" has been successfully delivered.`,
            link: `/donations/${donation._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Donation marked as completed.',
            donation,
        });
    } catch (error) {
        console.error('Complete donation error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ----------------------------
// @desc   Update a donation
// @route  PUT /api/donations/:id
// @access Private - Donor only
// ----------------------------
const updateDonation = async (req, res) => {
    try {
        let donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        if (donation.donor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own donations.',
            });
        }

        donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, donation });
    } catch (error) {
        console.error('Update donation error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ----------------------------
// @desc   Delete a donation
// @route  DELETE /api/donations/:id
// @access Private - Donor only
// ----------------------------
const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        if (donation.donor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own donations.',
            });
        }

        await donation.remove();

        res.status(200).json({ success: true, message: 'Donation removed.' });
    } catch (error) {
        console.error('Delete donation error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


module.exports = {
    createDonation,
    getAllDonations,
    getDonationById,
    getMyDonations,
    claimDonation,
    completeDonation,
    updateDonation,
    deleteDonation,
};
