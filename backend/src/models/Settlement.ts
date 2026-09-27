import { Schema, model, Types } from 'mongoose';

export interface ISettlement {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  fromMemberId: Types.ObjectId;
  toMemberId: Types.ObjectId;
  amountPaise: number;
  status: 'pending' | 'paid';
  createdAt: Date;
  paidAt?: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    fromMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    toMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending', index: true },
    paidAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

settlementSchema.index({ tripId: 1, status: 1 });

export const Settlement = model<ISettlement>('Settlement', settlementSchema);
