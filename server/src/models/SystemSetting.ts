import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  platformName: string;
  logoUrl?: string;
  theme: string;
  emailNotifications: boolean;
  twoFactorAuth: boolean;
  aiModelName: string;
  maxUploadSizeMb: number;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema: Schema = new Schema(
  {
    platformName: { type: String, default: 'Smart Campus Connect' },
    logoUrl: { type: String, default: '' },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    emailNotifications: { type: Boolean, default: true },
    twoFactorAuth: { type: Boolean, default: false },
    aiModelName: { type: String, default: 'gemini-1.5-flash' },
    maxUploadSizeMb: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
