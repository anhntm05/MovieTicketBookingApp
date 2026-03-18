import { Schema, model } from 'mongoose';
import { IBooking } from '../types';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants';

const bookingSchema = new Schema<any>(
  {
    bookingCode: {
      type: String,
      required: [true, 'Please provide a booking code'],
      unique: true,
      index: true,
    },
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
    concessions: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        note: {
          type: String,
          default: '',
          trim: true,
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          min: 0,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: [true, 'Please provide a total price'],
      min: 0,
    },
    status: {
      type: String,
      enum: [
        BOOKING_STATUS.PENDING_PAYMENT,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.EXPIRED,
      ],
      default: BOOKING_STATUS.PENDING_PAYMENT,
    },
    paymentStatus: {
      type: String,
      enum: [
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.COMPLETED,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.REFUNDED,
      ],
      default: PAYMENT_STATUS.PENDING,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
bookingSchema.index({ showtime: 1, status: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
