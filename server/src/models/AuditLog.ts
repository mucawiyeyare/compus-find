import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  details?: any;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
