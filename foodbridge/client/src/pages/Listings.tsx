import React, { useEffect, useState } from 'react';
import { fetchFoodListings } from '../services/api';
import ListingCard from '../components/common/ListingCard';
import { FoodListing } from '../types';

const FALLBACK_LISTINGS: FoodListing[] = [
    {
        id: 'demo-1',
        donorId: 'demo-donor',
        description: 'Freshly packed vegetable pulao (approx. 20 servings)',
        quantity: 20,
        pickupLocation: 'MG Road, Bengaluru',
        expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
    {
        id: 'demo-2',
        donorId: 'demo-donor',
        description: 'Bakery surplus: mixed bread and buns',
        quantity: 12,
        pickupLocation: 'Park Street, Kolkata',
        expiryDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
    {
        id: 'demo-3',
        donorId: 'demo-donor',
        description: 'Fruit boxes from event catering',
        quantity: 15,
        pickupLocation: 'Bandra West, Mumbai',
        expiryDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
];

const Listings: React.FC = () => {
    const [listings, setListings] = useState<FoodListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        const getListings = async () => {
            try {
                const data = await fetchFoodListings();
                setListings(data);
                setUsingFallback(false);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : String(err));
                setListings(FALLBACK_LISTINGS);
                setUsingFallback(true);
            } finally {
                setLoading(false);
            }
        };

        getListings();
    }, []);

    if (loading) {
        return (
            <main style={{ maxWidth: 1000, margin: '32px auto', padding: '0 16px' }}>
                <h1>Available Food Listings</h1>
                <p style={{ color: '#64748B' }}>Loading listings...</p>
            </main>
        );
    }

    return (
        <main style={{ maxWidth: 1000, margin: '32px auto', padding: '0 16px' }}>
            <h1>Available Food Listings</h1>
            <p style={{ color: '#64748B', marginTop: 6, marginBottom: 18 }}>
                Browse nearby surplus food available for pickup.
            </p>

            {usingFallback && (
                <div style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                    Live listings are unavailable right now ({error || 'network issue'}). Showing demo listings.
                </div>
            )}

            {!usingFallback && error && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                    Could not load listings: {error}
                </div>
            )}

            {listings.length === 0 && (
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 8, padding: 16, color: '#475569', marginBottom: 12 }}>
                    No listings available yet.
                </div>
            )}

            <div className="listings-container">
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
            </div>
        </main>
    );
};

export default Listings;