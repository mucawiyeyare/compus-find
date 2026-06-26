import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'mentor' | 'admin';
  avatar?: string;
  department?: string;
  points: number;
  badges: string[];
  googleId?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120' },
    department: { type: String },
    points: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

// Indexes for quick lookups
UserSchema.index({ email: 1 });
UserSchema.index({ points: -1 });

export default mongoose.model<IUser>('User', UserSchema);
