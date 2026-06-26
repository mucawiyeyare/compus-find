import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  sender: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  isResolved: boolean;
}

const ContactMessageSchema: Schema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isResolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ContactMessageSchema.index({ isResolved: 1 });
ContactMessageSchema.index({ sender: 1 });

export default mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
