import { Schema, model } from 'mongoose';
import { ISeat } from '../types';
import { SEAT_STATUS } from '../utils/constants';

const seatSchema = new Schema<any>(
  {
    screen: {
      type: Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Please provide a screen'],
    },
    row: {
      type: String,
      required: [true, 'Please provide a row'],
      trim: true,
    },
    number: {
      type: Number,
      required: [true, 'Please provide a seat number'],
      min: 1,
    },
    type: {
      type: String,
      enum: ['standard', 'vip', 'premium'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: [SEAT_STATUS.ACTIVE, SEAT_STATUS.BLOCKED],
      default: SEAT_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for uniqueness
seatSchema.index({ screen: 1, row: 1, number: 1 }, { unique: true });

export const Seat = model<ISeat>('Seat', seatSchema);
