import React, { useEffect, useState } from 'react';
import { fetchFoodListings } from '../services/api';
import ListingCard from '../components/common/ListingCard';

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getListings = async () => {
            try {
                const data = await fetchFoodListings();
                setListings(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getListings();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Available Food Listings</h1>
            <div className="listings-container">
                {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                ))}
            </div>
        </div>
    );
};

export default Listings;