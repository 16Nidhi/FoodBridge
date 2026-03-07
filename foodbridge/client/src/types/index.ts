export interface User {
    id: string;
    name: string;
    email: string;
    role: 'donor' | 'ngo' | 'volunteer' | 'admin';
}

export interface FoodListing {
    id: string;
    donorId: string;
    description: string;
    quantity: number;
    pickupLocation: string;
    expiryDate: Date;
}

export interface Claim {
    id: string;
    listingId: string;
    ngoId: string;
    claimedAt: Date;
}

export interface PickupScheduleType {
    id: string;
    date: string;
    location: string;
    details: string;
}
