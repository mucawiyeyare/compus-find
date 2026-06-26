import mongoose, { Schema, Document } from 'mongoose';

export interface ILostItem extends Document {
  reporter: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  contact?: string;
  dateLost: Date;
  image?: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'lost' | 'found_pending' | 'found' | 'completed' | 'cancelled';
  aiMatches: {
    foundItem: mongoose.Types.ObjectId;
    score: number;
  }[];
}

const LostItemSchema: Schema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    contact: { type: String },
    dateLost: { type: Date, required: true },
    image: { type: String },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'lost', 'found_pending', 'found', 'completed', 'cancelled'],
      default: 'pending'
    },
    aiMatches: [
      {
        foundItem: { type: Schema.Types.ObjectId, ref: 'FoundItem' },
        score: { type: Number }
      }
    ]
  },
  { timestamps: true }
);

LostItemSchema.index({ status: 1 });
LostItemSchema.index({ category: 1 });
LostItemSchema.index({ reporter: 1 });

export default mongoose.model<ILostItem>('LostItem', LostItemSchema);
