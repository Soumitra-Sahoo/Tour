import { Schema, model, Types } from 'mongoose';

export interface IShare {
  memberId: Types.ObjectId;
  amountPaise: number;
}

export interface IExpense {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  note?: string;
  category: string;
  amountPaise: number;
  splitType: 'equal' | 'custom';
  payers: IShare[];
  participants: IShare[];
  createdBy: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shareSchema = new Schema<IShare>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amountPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const expenseSchema = new Schema<IExpense>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    note: { type: String, trim: true, maxlength: 140 },
    category: { type: String, required: true, trim: true },
    amountPaise: { type: Number, required: true, min: 1 },
    splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
    payers: {
      type: [shareSchema],
      required: true,
      validate: {
        validator: (v: IShare[]) => v.length >= 1,
        message: 'An expense must have at least one payer.',
      },
    },
    participants: {
      type: [shareSchema],
      required: true,
      validate: {
        validator: (v: IShare[]) => v.length >= 2,
        message: 'An expense must have at least 2 participants.',
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    idempotencyKey: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
);

expenseSchema.index({ tripId: 1, createdAt: -1 });
// Prevent the exact same double-submit within the same trip.
expenseSchema.index({ tripId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Expense = model<IExpense>('Expense', expenseSchema);
