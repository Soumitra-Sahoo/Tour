import { Schema, model, Types } from 'mongoose';

export interface IAdvance {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  memberId: Types.ObjectId;
  amountPaise: number;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const advanceSchema = new Schema<IAdvance>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    amountPaise: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true, maxlength: 140 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  },
  { timestamps: true },
);

advanceSchema.index({ tripId: 1, createdAt: -1 });

export const Advance = model<IAdvance>('Advance', advanceSchema);
