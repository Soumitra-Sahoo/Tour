import { Schema, model, Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
}

export interface ITrip {
  _id: Types.ObjectId;
  name: string;
  startDate?: Date;
  endDate?: Date;
  shareToken: string;
  ownerId?: Types.ObjectId;
  treasurerId?: Types.ObjectId;
  status: 'active' | 'locked';
  categories: ICategory[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: true },
);

const tripSchema = new Schema<ITrip>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    startDate: { type: Date },
    endDate: { type: Date },
    shareToken: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Member' },
    treasurerId: { type: Schema.Types.ObjectId, ref: 'Member' },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    categories: {
      type: [categorySchema],
      default: (): { name: string }[] =>
        ['Food', 'Hotel', 'Transport', 'Tickets', 'Shopping', 'Activities', 'Other'].map(
          (name) => ({ name }),
        ),
    } as never,
  },
  { timestamps: true },
);

export const Trip = model<ITrip>('Trip', tripSchema);
