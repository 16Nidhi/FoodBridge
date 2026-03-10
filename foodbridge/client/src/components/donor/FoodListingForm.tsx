import React, { useState } from 'react';

const FoodListingForm: React.FC = () => {
    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Logic to handle form submission, e.g., API call to submit food listing
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="foodName">Food Name:</label>
                <input
                    type="text"
                    id="foodName"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="quantity">Quantity:</label>
                <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="description">Description:</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="expiryDate">Expiry Date:</label>
                <input
                    type="date"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Submit Food Listing</button>
        </form>
    );
};

export default FoodListingForm;