const Verification = require('../models/Verification');
const User = require('../models/User');

// ----------------------------
// @desc   Volunteer submits a verification request
// @route  POST /api/verifications
// @access Private — Volunteer only
// ----------------------------

const submitVerification = async (req, res) => {
    const { idDocument } = req.body;

    if (!idDocument) {
        return res.status(400).json({
            success: false,
            message: 'Please provide the ID document (URL or file path).',
        });
    }

    try {
        // Each volunteer can only have one verification on record
        const existingRequest = await Verification.findOne({ volunteerId: req.user._id });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: `You have already submitted a verification request. Current status: ${existingRequest.status}.`,
            });
        }

        const verification = await Verification.create({
            volunteerId: req.user._id,
            idDocument,
        });

        res.status(201).json({
            success: true,
            message: 'Verification request submitted. An admin will review it shortly.',
            verification,
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting verification.' });
    }
};

// ----------------------------
// @desc   Admin: get all verification requests
// @route  GET /api/admin/verifications
// @access Private — Admin only
// ----------------------------

const getAllVerifications = async (req, res) => {
    try {
        // Optional filter: ?status=pending
        const filter = req.query.status ? { status: req.query.status } : {};

        const verifications = await Verification.find(filter)
            .populate('volunteerId', 'name email phone')
            .populate('reviewedBy', 'name email')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, count: verifications.length, verifications });
    } catch (error) {
        console.error('Get verifications error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching verifications.' });
    }
};

// ----------------------------
// @desc   Admin: approve or reject a verification request
// @route  PATCH /api/admin/verifications/:id
// @access Private — Admin only
// ----------------------------

const reviewVerification = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Status must be one of the two valid review decisions
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be "approved" or "rejected".',
        });
    }

    try {
        const verification = await Verification.findById(id);

        if (!verification) {
            return res.status(404).json({ success: false, message: 'Verification request not found.' });
        }

        // Update the verification record
        verification.status = status;
        verification.reviewedBy = req.user._id;
        await verification.save();

        // Mirror the decision on the volunteer's User document
        await User.findByIdAndUpdate(verification.volunteerId, {
            verificationStatus: status,
        });

        res.status(200).json({
            success: true,
            message: `Verification has been ${status}.`,
            verification,
        });
    } catch (error) {
        console.error('Review verification error:', error);
        res.status(500).json({ success: false, message: 'Server error while reviewing verification.' });
    }
};

module.exports = { submitVerification, getAllVerifications, reviewVerification };
