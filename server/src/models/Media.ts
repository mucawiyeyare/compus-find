import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  publicId?: string;
  uploadedAt: Date;
}

const MediaSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

MediaSchema.index({ userId: 1 });
MediaSchema.index({ uploadedAt: -1 });

export default mongoose.model<IMedia>('Media', MediaSchema);
