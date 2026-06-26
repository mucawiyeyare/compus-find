import mongoose, { Schema, Document } from 'mongoose';

export interface IMentor extends Document {
  user: mongoose.Types.ObjectId;
  bio: string;
  department: string;
  subjects: string[];
  skills: string[];
  availability: {
    day: string; // e.g., 'Monday', 'Tuesday'
    slots: string[]; // e.g., ['10:00 AM', '02:00 PM']
  }[];
  rating: number;
  reviewsCount: number;
}

const MentorSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, required: true },
    department: { type: String, required: true },
    subjects: { type: [String], required: true },
    skills: { type: [String], required: true },
    availability: [
      {
        day: { type: String, required: true },
        slots: { type: [String], required: true }
      }
    ],
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

MentorSchema.index({ department: 1 });
MentorSchema.index({ subjects: 1 });

export default mongoose.model<IMentor>('Mentor', MentorSchema);
