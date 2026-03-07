export interface User {
    id: string;
    name: string;
    email: string;
    role: 'donor' | 'ngo' | 'volunteer';
}

export interface FoodListing {
    id: string;
    donorId: string;
    description: string;
    quantity: number;
    pickupLocation: string;
    createdAt: Date;
}

export interface Claim {
    id: string;
    listingId: string;
    ngoId: string;
    claimedAt: Date;
}

export interface Pickup {
    id: string;
    claimId: string;
    volunteerId: string;
    scheduledAt: Date;
}