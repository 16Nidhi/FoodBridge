import mongoose, { Document, Schema } from 'mongoose';

interface IClaim extends Document {
    foodListingId: mongoose.Types.ObjectId;
    ngoId: mongoose.Types.ObjectId;
    volunteerId: mongoose.Types.ObjectId;
    claimedAt: Date;
    status: 'pending' | 'completed' | 'cancelled';
}

const ClaimSchema: Schema = new Schema({
    foodListingId: { type: mongoose.Types.ObjectId, required: true, ref: 'FoodListing' },
    ngoId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    volunteerId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    claimedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
});

const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);

export default Claim;