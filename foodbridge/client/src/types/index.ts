export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'donor' | 'ngo' | 'volunteer' | 'admin';
    verificationStatus?: 'pending' | 'approved' | 'rejected' | 'verified';
    location?: string;
    createdAt?: string | Date;
}

export interface Donation {
    _id: string;
    donor: User;
    foodItem: string;
    quantity: string;
    pickupLocation: string;
    pickupTime: string | Date;
    status: 'pending' | 'claimed' | 'completed';
    claimedBy?: User;
    createdAt: string | Date;
    description?: string;
    category?: string;
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

export interface Notification {
    _id: string;
    recipient: string;
    sender?: {
        _id: string;
        name: string;
    };
    type: 'donation_claimed' | 'donation_completed' | 'new_rating' | 'verification_approved' | 'verification_rejected';
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
}
