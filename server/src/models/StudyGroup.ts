import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyGroup extends Document {
  creator: mongoose.Types.ObjectId;
  name: string;
  description: string;
  subject: string;
  members: mongoose.Types.ObjectId[];
  resources: {
    title: string;
    url: string;
    addedBy: mongoose.Types.ObjectId;
  }[];
  tasks: {
    title: string;
    status: 'pending' | 'completed';
    assignedTo?: mongoose.Types.ObjectId;
  }[];
}

const StudyGroupSchema: Schema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    tasks: [
      {
        title: { type: String, required: true },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ]
  },
  { timestamps: true }
);

StudyGroupSchema.index({ name: 'text', subject: 'text' });

export default mongoose.model<IStudyGroup>('StudyGroup', StudyGroupSchema);
