import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  category: 'workshop' | 'seminar' | 'conference' | 'news' | 'deadline';
  date: Date;
  location: string;
  creator: mongoose.Types.ObjectId;
  attendees: mongoose.Types.ObjectId[];
}

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['workshop', 'seminar', 'conference', 'news', 'deadline'],
      required: true
    },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);
