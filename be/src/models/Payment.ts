import { Schema, model } from 'mongoose';
import { IPayment } from '../types';
import { PAYMENT_STATUS } from '../utils/constants';

const paymentSchema = new Schema<any>(
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
      enum: [
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.COMPLETED,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.REFUNDED,
      ],
      default: PAYMENT_STATUS.PENDING,
    },
    transactionId: {
      type: String,
      required: [true, 'Please provide a transaction ID'],
      unique: true,
    },
    gatewayReference: {
      type: String,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for booking queries
paymentSchema.index({ booking: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
