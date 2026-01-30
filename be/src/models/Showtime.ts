import { Schema, model } from 'mongoose';
import { IShowtime } from '../types';

const showtimeSchema = new Schema<IShowtime>(
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
showtimeSchema.index({ movie: 1, screen: 1, startTime: 1 });

export const Showtime = model<IShowtime>('Showtime', showtimeSchema);
