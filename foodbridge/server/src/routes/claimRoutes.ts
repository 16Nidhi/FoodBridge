import { Router } from 'express';
import { createClaim, getClaims, updateClaim, deleteClaim } from '../controllers/claimController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route to create a new claim
router.post('/', authenticate, createClaim);

// Route to get all claims
router.get('/', authenticate, getClaims);

// Route to update a claim by ID
router.put('/:id', authenticate, updateClaim);

// Route to delete a claim by ID
router.delete('/:id', authenticate, deleteClaim);

export default router;