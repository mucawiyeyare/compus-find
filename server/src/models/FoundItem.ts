import mongoose, { Schema, Document } from 'mongoose';

export interface IFoundItem extends Document {
  reporter: mongoose.Types.ObjectId;
  lostItem?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date;
  image?: string;
  images?: string[];
  status: 'found_pending' | 'found' | 'claimed' | 'returned';
  claimVerificationCode: string;
  claimedBy?: mongoose.Types.ObjectId;
}

const FoundItemSchema: Schema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lostItem: { type: Schema.Types.ObjectId, ref: 'LostItem' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateFound: { type: Date, required: true },
    image: { type: String },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['found_pending', 'found', 'claimed', 'returned'],
      default: 'found_pending'
    },
    claimVerificationCode: { type: String, required: true },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

FoundItemSchema.index({ status: 1 });
FoundItemSchema.index({ category: 1 });
FoundItemSchema.index({ reporter: 1 });

export default mongoose.model<IFoundItem>('FoundItem', FoundItemSchema);
