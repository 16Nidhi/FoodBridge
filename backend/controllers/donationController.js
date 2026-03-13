const Donation = require('../models/Donation');

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
    const { foodType, quantity, location, preparedTime, description, category } = req.body;

    if (!foodType || !quantity || !location || !preparedTime) {
        return res.status(400).json({
            success: false,
            message: 'Please provide foodType, quantity, location, and preparedTime.',
        });
    }

    try {
        // donorId is taken from the authenticated user (not from request body)
        const donation = await Donation.create({
            foodType,
            quantity,
            location,
            preparedTime: new Date(preparedTime),
            donorId: req.user._id,
            description: description || '',
            category: category || 'Other',
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
        // Before sending data, update any donations whose NGO window has expired
        await openExpiredDonationsToVolunteers();

        let filter = {};

        if (req.user.role === 'ngo') {
            // NGOs see all posted donations (priority access)
            filter = { status: 'posted' };
        } else if (req.user.role === 'volunteer') {
            // Volunteers only see donations that NGOs didn't accept in time
            filter = { status: 'posted', openToVolunteers: true };
        }
        // Admin has no filter → sees everything

        const donations = await Donation.find(filter)
            .populate('donorId', 'name email phone')
            .populate('assignedVolunteer', 'name email phone rating')
            .populate('assignedNGO', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching donations.' });
    }
};

// ----------------------------
// @desc   Get the logged-in donor's own donations
// @route  GET /api/donations/my-donations
// @access Private — Donor only
// ----------------------------

const getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donorId: req.user._id })
            .populate('assignedVolunteer', 'name email phone rating')
            .populate('assignedNGO', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('Get my donations error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching your donations.' });
    }
};

// ----------------------------
// @desc   NGO accepts a donation and optionally assigns a volunteer
// @route  PATCH /api/donations/accept
// @access Private — NGO only
// ----------------------------

const acceptDonation = async (req, res) => {
    const { donationId, volunteerId } = req.body;

    if (!donationId) {
        return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    try {
        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Only allow accepting donations that are still in "posted" state
        if (donation.status !== 'posted') {
            return res.status(400).json({
                success: false,
                message: 'This donation is no longer available for acceptance.',
            });
        }

        // Assign this NGO and move to accepted status
        donation.assignedNGO = req.user._id;
        donation.status = 'accepted';
        donation.ngoAcceptedAt = new Date();

        // NGO can optionally assign a specific volunteer from their roster
        if (volunteerId) {
            donation.assignedVolunteer = volunteerId;
        }

        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Donation accepted successfully.',
            donation,
        });
    } catch (error) {
        console.error('Accept donation error:', error);
        res.status(500).json({ success: false, message: 'Server error while accepting donation.' });
    }
};

// ----------------------------
// @desc   Volunteer marks a donation as picked up
// @route  PATCH /api/donations/picked-up
// @access Private — Volunteer only
// ----------------------------

const markPickedUp = async (req, res) => {
    const { donationId } = req.body;

    if (!donationId) {
        return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    try {
        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Donation must be in "accepted" state before it can be picked up
        if (donation.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Donation must be accepted before it can be marked as picked up.',
            });
        }

        // Check if this volunteer is assigned or if pickup is open (no prior assignment)
        const isAssignedVolunteer =
            donation.assignedVolunteer &&
            donation.assignedVolunteer.toString() === req.user._id.toString();

        const isOpenPickup = !donation.assignedVolunteer && donation.openToVolunteers;

        if (!isAssignedVolunteer && !isOpenPickup) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to this donation.',
            });
        }

        // If this is an open pickup, assign the volunteer now
        if (isOpenPickup) {
            donation.assignedVolunteer = req.user._id;
        }

        donation.status = 'picked_up';
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Donation marked as picked up.',
            donation,
        });
    } catch (error) {
        console.error('Mark picked up error:', error);
        res.status(500).json({ success: false, message: 'Server error while updating donation.' });
    }
};

// ----------------------------
// @desc   NGO confirms delivery of a donation
// @route  PATCH /api/donations/delivered
// @access Private — NGO only
// ----------------------------

const markDelivered = async (req, res) => {
    const { donationId } = req.body;

    if (!donationId) {
        return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    try {
        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Can only mark as delivered if it has been picked up first
        if (donation.status !== 'picked_up') {
            return res.status(400).json({
                success: false,
                message: 'Donation must be picked up before it can be marked as delivered.',
            });
        }

        // Only the NGO that accepted this donation can confirm delivery
        if (donation.assignedNGO.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the assigned NGO can confirm delivery of this donation.',
            });
        }

        donation.status = 'delivered';
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Donation marked as delivered successfully.',
            donation,
        });
    } catch (error) {
        console.error('Mark delivered error:', error);
        res.status(500).json({ success: false, message: 'Server error while confirming delivery.' });
    }
};

// ----------------------------
// @desc   Volunteer self-accepts an open pickup (before physical pickup)
// @route  PATCH /api/donations/volunteer-accept
// @access Private — Volunteer only
// ----------------------------

const volunteerAcceptDonation = async (req, res) => {
    const { donationId } = req.body;

    if (!donationId) {
        return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    try {
        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Must be visible to volunteers and not already accepted by another volunteer
        if (!donation.openToVolunteers && donation.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'This donation is not yet available for volunteer pickup.',
            });
        }

        if (donation.assignedVolunteer) {
            return res.status(400).json({
                success: false,
                message: 'This pickup has already been accepted by another volunteer.',
            });
        }

        donation.assignedVolunteer = req.user._id;
        // Keep status as 'posted' → 'accepted' to mark volunteer assignment
        if (donation.status === 'posted') {
            donation.status = 'accepted';
        }
        await donation.save();

        res.status(200).json({
            success: true,
            message: 'Pickup accepted! Head to the donor location.',
            donation,
        });
    } catch (error) {
        console.error('Volunteer accept error:', error);
        res.status(500).json({ success: false, message: 'Server error while accepting pickup.' });
    }
};

module.exports = {
    createDonation,
    getAllDonations,
    getMyDonations,
    acceptDonation,
    volunteerAcceptDonation,
    markPickedUp,
    markDelivered,
};
