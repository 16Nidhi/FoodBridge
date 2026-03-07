import { Request, Response } from 'express';
import Claim from '../models/Claim';
import FoodListing from '../models/FoodListing';

// Create a new claim for a food listing
export const createClaim = async (req: Request, res: Response) => {
    try {
        const { foodListingId, userId } = req.body;

        const foodListing = await FoodListing.findById(foodListingId);
        if (!foodListing) {
            return res.status(404).json({ message: 'Food listing not found' });
        }

        const claim = new Claim({
            foodListing: foodListingId,
            user: userId,
            status: 'Pending',
        });

        await claim.save();
        res.status(201).json(claim);
    } catch (error) {
        res.status(500).json({ message: 'Error creating claim', error });
    }
};

// Get all claims for a specific user
export const getClaimsByUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const claims = await Claim.find({ user: userId }).populate('foodListing');

        res.status(200).json(claims);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching claims', error });
    }
};

// Update the status of a claim
export const updateClaimStatus = async (req: Request, res: Response) => {
    try {
        const { claimId } = req.params;
        const { status } = req.body;

        const updatedClaim = await Claim.findByIdAndUpdate(claimId, { status }, { new: true });
        if (!updatedClaim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        res.status(200).json(updatedClaim);
    } catch (error) {
        res.status(500).json({ message: 'Error updating claim status', error });
    }
};