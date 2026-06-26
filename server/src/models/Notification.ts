import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // 'item_match', 'message', 'session_request', etc.
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
