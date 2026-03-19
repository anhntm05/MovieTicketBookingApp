import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { IPayment, IPaymentRequest, UserRole } from '../types';
import { BOOKING_STATUS, ERROR_MESSAGES, PAGINATION, PAYMENT_STATUS, USER_ROLES } from '../utils/constants';
import BookingService from './BookingService';
import NotificationService from './NotificationService';
import ShowtimeSeatService from './ShowtimeSeatService';
import { Showtime } from '../models/Showtime';

export class PaymentService {
  static async getAllPayments(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      status?: string;
      method?: string;
    }
  ): Promise<{ payments: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.method) query.method = filters.method;

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

  static async getPaymentById(paymentId: string): Promise<any> {
    const payment = await Payment.findById(paymentId).populate('booking');

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }

  static async getPaymentByBookingId(bookingId: string, requesterId: string, role: UserRole): Promise<any> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await BookingService.expireBookingIfNeeded(booking);
    if (role === USER_ROLES.CUSTOMER && booking.user.toString() !== requesterId) {
      const error: any = new Error(ERROR_MESSAGES.FORBIDDEN);
      error.statusCode = 403;
      throw error;
    }

    const payment = await Payment.findOne({ booking: bookingId }).populate('booking');

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }

  static async processPayment(
    requesterId: string,
    role: UserRole,
    paymentData: IPaymentRequest
  ): Promise<IPayment> {
    const booking = await Booking.findById(paymentData.booking);
    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await BookingService.expireBookingIfNeeded(booking);

    if (role === USER_ROLES.CUSTOMER && booking.user.toString() !== requesterId) {
      const error: any = new Error(ERROR_MESSAGES.FORBIDDEN);
      error.statusCode = 403;
      throw error;
    }

    if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
      const error: any = new Error('Booking is not awaiting payment');
      error.statusCode = 400;
      throw error;
    }

    if (paymentData.amount !== booking.totalPrice) {
      const error: any = new Error('Payment amount does not match booking total');
      error.statusCode = 400;
      throw error;
    }

    const existingPayment = await Payment.findOne({
      booking: paymentData.booking,
      status: PAYMENT_STATUS.COMPLETED,
    });
    if (existingPayment) {
      const error: any = new Error('Payment has already been completed for this booking');
      error.statusCode = 409;
      throw error;
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const payment = new Payment({
      ...paymentData,
      transactionId,
      status: PAYMENT_STATUS.COMPLETED,
      paidAt: new Date(),
    });

    await payment.save();

    booking.status = BOOKING_STATUS.CONFIRMED as any;
    booking.paymentStatus = PAYMENT_STATUS.COMPLETED as any;
    await booking.save();
    await ShowtimeSeatService.confirmBooking(
      booking.showtime.toString(),
      booking.seats.map((seat) => seat.toString()),
      booking._id!.toString()
    );

    const showtime = await Showtime.findById(booking.showtime).populate('movie', 'title');
    const movieTitle = (showtime as any)?.movie?.title || 'your movie';
    await NotificationService.createNotification(
      NotificationService.buildBookingNotification(booking.user.toString(), 'booking_confirm', movieTitle)
    );

    return payment;
  }

  static async updatePaymentStatus(paymentId: string, status: string): Promise<IPayment> {
    const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });

    if (!payment) {
      const error: any = new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return payment;
  }
}

export default PaymentService;
