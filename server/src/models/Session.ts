import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  mentor: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  subject: string;
  date: Date;
  timeSlot: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  meetingLink?: string;
  whatsappGroupLink?: string;
  whatsappNumber?: string;
  notes?: string;
}

const SessionSchema: Schema = new Schema(
  {
    mentor: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
    meetingLink: { type: String },
    whatsappGroupLink: { type: String },
    whatsappNumber: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

SessionSchema.index({ mentor: 1, date: 1 });
SessionSchema.index({ student: 1, status: 1 });

export default mongoose.model<ISession>('Session', SessionSchema);
