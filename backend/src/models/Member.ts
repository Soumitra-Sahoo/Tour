import { Schema, model, Types } from 'mongoose';

export interface IMember {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  name: string;
  memberCode: string; // unpredictable 4-digit numeric code
  isOwner: boolean;
  createdAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    memberCode: { type: String, required: true, trim: true, match: /^\d{4}$/ },
    isOwner: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A member code must be unique within a trip (not globally).
memberSchema.index({ tripId: 1, memberCode: 1 }, { unique: true });

export const Member = model<IMember>('Member', memberSchema);
