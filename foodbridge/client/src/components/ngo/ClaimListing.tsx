import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { claimFoodListing } from '../../store/slices/listingSlice';
import { useParams } from 'react-router-dom';

const ClaimListing = () => {
    const { listingId } = useParams();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [listing, setListing] = useState(null);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await fetch(`/api/listings/${listingId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch listing');
                }
                const data = await response.json();
                setListing(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [listingId]);

    const handleClaim = () => {
        dispatch(claimFoodListing(listingId));
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Claim Food Listing</h1>
            {listing && (
                <div>
                    <h2>{listing.title}</h2>
                    <p>{listing.description}</p>
                    <button onClick={handleClaim}>Claim Listing</button>
                </div>
            )}
        </div>
    );
};

export default ClaimListing;