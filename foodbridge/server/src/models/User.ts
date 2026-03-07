import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'donor' | 'ngo' | 'volunteer' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['donor', 'ngo', 'volunteer', 'admin'], required: true },
}, {
    timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);