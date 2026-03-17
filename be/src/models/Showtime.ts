import { Schema, model } from 'mongoose';
import { IShowtime } from '../types';
import { SHOWTIME_STATUS } from '../utils/constants';

const showtimeSchema = new Schema<any>(
  {
    movie: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please provide a movie'],
    },
    screen: {
      type: Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Please provide a screen'],
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide an end time'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    status: {
      type: String,
      enum: [SHOWTIME_STATUS.SCHEDULED, SHOWTIME_STATUS.CANCELLED, SHOWTIME_STATUS.COMPLETED],
      default: SHOWTIME_STATUS.SCHEDULED,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
showtimeSchema.index({ movie: 1, screen: 1, startTime: 1 });

export const Showtime = model<IShowtime>('Showtime', showtimeSchema);
