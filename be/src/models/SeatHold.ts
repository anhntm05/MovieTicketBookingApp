import { Schema, model } from 'mongoose';
import { ISeatHold } from '../types';
import { SEAT_HOLD_EXPIRY_MINUTES } from '../utils/constants';

const seatHoldSchema = new Schema<ISeatHold>(
  {
    seat: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: [true, 'Please provide a seat'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + SEAT_HOLD_EXPIRY_MINUTES * 60 * 1000),
      index: { expires: 0 }, // TTL index - document will be automatically deleted after expiry
    },
  },
  {
    timestamps: true,
  }
);

export const SeatHold = model<ISeatHold>('SeatHold', seatHoldSchema);
