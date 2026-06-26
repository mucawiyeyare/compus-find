import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId; // Empty if study group message
  studyGroup?: mongoose.Types.ObjectId; // Empty if one-to-one message
  content: string;
  fileUrl?: string;
  fileType?: string;
  readBy: mongoose.Types.ObjectId[];
}

const MessageSchema: Schema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User' },
    studyGroup: { type: Schema.Types.ObjectId, ref: 'StudyGroup' },
    content: { type: String, required: true },
    fileUrl: { type: String },
    fileType: { type: String },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

MessageSchema.index({ receiver: 1, sender: 1 });
MessageSchema.index({ studyGroup: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
