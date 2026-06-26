import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  uploader: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileType: string; // pdf, doc, ppt, etc.
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
}

const NoteSchema: Schema = new Schema(
  {
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    downloadsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

NoteSchema.index({ category: 1 });
NoteSchema.index({ downloadsCount: -1 });

export default mongoose.model<INote>('Note', NoteSchema);
