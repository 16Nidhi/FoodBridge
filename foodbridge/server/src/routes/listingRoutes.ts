import express from 'express';
import { createListing, getListings, updateListing, deleteListing } from '../controllers/listingController';

const router = express.Router();

// Route to create a new food listing
router.post('/', createListing);

// Route to get all food listings
router.get('/', getListings);

// Route to update a food listing by ID
router.put('/:id', updateListing);

// Route to delete a food listing by ID
router.delete('/:id', deleteListing);

export default router;