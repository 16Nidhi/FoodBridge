import { Request, Response } from 'express';
import FoodListing from '../models/FoodListing';

// Create a new food listing
export const createListing = async (req: Request, res: Response) => {
    try {
        const newListing = new FoodListing(req.body);
        await newListing.save();
        res.status(201).json(newListing);
    } catch (error) {
        res.status(500).json({ message: 'Error creating listing', error });
    }
};

// Get all food listings
export const getAllListings = async (req: Request, res: Response) => {
    try {
        const listings = await FoodListing.find();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings', error });
    }
};

// Get a single food listing by ID
export const getListingById = async (req: Request, res: Response) => {
    try {
        const listing = await FoodListing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.status(200).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing', error });
    }
};

// Update a food listing by ID
export const updateListing = async (req: Request, res: Response) => {
    try {
        const updatedListing = await FoodListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.status(200).json(updatedListing);
    } catch (error) {
        res.status(500).json({ message: 'Error updating listing', error });
    }
};

// Delete a food listing by ID
export const deleteListing = async (req: Request, res: Response) => {
    try {
        const deletedListing = await FoodListing.findByIdAndDelete(req.params.id);
        if (!deletedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting listing', error });
    }
};