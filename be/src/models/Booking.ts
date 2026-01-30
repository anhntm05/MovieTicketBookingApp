import { Schema, model } from 'mongoose';
import { IBooking } from '../types';

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    showtime: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Please provide a showtime'],
    },
    seats: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Seat',
      },
    ],
    totalPrice: {
      type: Number,
      required: [true, 'Please provide a total price'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for user queries
bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
