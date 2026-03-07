import mongoose, { Document, Schema } from 'mongoose';

interface IPickup extends Document {
    donorId: mongoose.Types.ObjectId;
    ngoId: mongoose.Types.ObjectId;
    volunteerId: mongoose.Types.ObjectId;
    pickupDate: Date;
    pickupTime: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

const PickupSchema: Schema = new Schema({
    donorId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    ngoId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    volunteerId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, required: true },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
});

const Pickup = mongoose.model<IPickup>('Pickup', PickupSchema);

export default Pickup;