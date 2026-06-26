import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  author: string;
  category: string;
  description: string;
  coverImage?: string;
  status: 'available' | 'reserved' | 'collected';
  reservedBy?: mongoose.Types.ObjectId;
}

const BookSchema: Schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, default: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200' },
    status: { type: String, enum: ['available', 'reserved', 'collected'], default: 'available' },
    reservedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

BookSchema.index({ status: 1 });
BookSchema.index({ category: 1 });

export default mongoose.model<IBook>('Book', BookSchema);
