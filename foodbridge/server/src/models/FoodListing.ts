import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodListing extends Document {
    title: string;
    description: string;
    quantity: number;
    location: string;
    expiryDate: Date;
    donorId: mongoose.Types.ObjectId;
    claimed: boolean;
}

const FoodListingSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    location: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    donorId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    claimed: { type: Boolean, default: false }
});

const FoodListing = mongoose.model<IFoodListing>('FoodListing', FoodListingSchema);

export default FoodListing;