import { Schema, model } from 'mongoose';
import { IShowtimeSeat } from '../types';
import { SHOWTIME_SEAT_STATUS } from '../utils/constants';

const showtimeSeatSchema = new Schema<any>(
  {
    showtime: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Please provide a showtime'],
    },
    seat: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: [true, 'Please provide a seat'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    status: {
      type: String,
      enum: [
        SHOWTIME_SEAT_STATUS.AVAILABLE,
        SHOWTIME_SEAT_STATUS.HELD,
        SHOWTIME_SEAT_STATUS.BOOKED,
        SHOWTIME_SEAT_STATUS.BLOCKED,
      ],
      default: SHOWTIME_SEAT_STATUS.AVAILABLE,
    },
    holdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

showtimeSeatSchema.index({ showtime: 1, seat: 1 }, { unique: true });
showtimeSeatSchema.index({ showtime: 1, status: 1 });

export const ShowtimeSeat = model<IShowtimeSeat>('ShowtimeSeat', showtimeSeatSchema);
