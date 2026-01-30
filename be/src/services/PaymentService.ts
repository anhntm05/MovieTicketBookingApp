import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { IPayment, IPaymentRequest } from '../types';
import { ERROR_MESSAGES, PAYMENT_STATUS, PAGINATION } from '../utils/constants';

/**
 * Payment Service - Handles payment related business logic
 */

export class PaymentService {
  /**
   * Get all payments (admin only)
   */
  static async getAllPayments(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      status?: string;
      method?: string;
    }
  ): Promise<{ payments: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.method) {
      query.method = filters.method;
    }

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .populate('booking', 'user totalPrice status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<any> {
    const payment = await Payment.findById(paymentId).populate('booking');

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }

  /**
   * Get payment by booking ID
   */
  static async getPaymentByBookingId(bookingId: string): Promise<any> {
    const payment = await Payment.findOne({ booking: bookingId }).populate('booking');

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }

  /**
   * Process payment
   */
  static async processPayment(paymentData: IPaymentRequest): Promise<IPayment> {
    // Verify booking exists
    const booking = await Booking.findById(paymentData.booking);
    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Verify amount matches booking total
    if (paymentData.amount !== booking.totalPrice) {
      const error: any = new Error('Payment amount does not match booking total');
      error.statusCode = 400;
      throw error;
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create payment record
    const payment = new Payment({
      ...paymentData,
      transactionId,
      status: PAYMENT_STATUS.COMPLETED,
    });

    await payment.save();

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    return payment;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: string
  ): Promise<IPayment> {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }
}

export default PaymentService;
