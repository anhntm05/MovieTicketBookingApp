import { Schema, model } from 'mongoose';
import { IPayment } from '../types';

const paymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Please provide a booking'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: 0,
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
      required: [true, 'Please provide a payment method'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      required: [true, 'Please provide a transaction ID'],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for booking queries
paymentSchema.index({ booking: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
