import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { Showtime } from '../models/Showtime';
import { IBooking, IBookingRequest } from '../types';
import { ERROR_MESSAGES, PAGINATION, BOOKING_STATUS } from '../utils/constants';
import SeatService from './SeatService';

/**
 * Booking Service - Handles booking related business logic
 */

export class BookingService {
  /**
   * Get all bookings (with optional filters)
   */
  static async getAllBookings(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      user?: string;
      status?: string;
    }
  ): Promise<{ bookings: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.user) {
      query.user = filters.user;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('showtime')
      .populate('seats')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    return {
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<any> {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('showtime')
      .populate('seats');

    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return booking;
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ bookings: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const bookings = await Booking.find({ user: userId })
      .populate('showtime')
      .populate('seats')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments({ user: userId });

    return {
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new booking
   */
  static async createBooking(
    userId: string,
    bookingData: IBookingRequest
  ): Promise<IBooking> {
    // Verify showtime exists
    const showtime = await Showtime.findById(bookingData.showtime);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Verify all seats exist and get their details
    const seats = await Seat.find({ _id: { $in: bookingData.seats } });
    if (seats.length !== bookingData.seats.length) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Check if any seat is occupied
    const occupiedSeats = seats.filter((s) => s.isOccupied);
    if (occupiedSeats.length > 0) {
      const error: any = new Error(ERROR_MESSAGES.SEATS_NOT_AVAILABLE);
      error.statusCode = 409;
      throw error;
    }

    // Calculate total price
    const baseSeatPrices: Record<string, number> = {
      standard: 1,
      vip: 1.5,
      premium: 2,
    };

    const totalPrice = seats.reduce((sum, seat) => {
      const multiplier = baseSeatPrices[seat.type] || 1;
      return sum + showtime.price * multiplier;
    }, 0);

    // Create booking
    const booking = new Booking({
      user: userId,
      showtime: bookingData.showtime,
      seats: bookingData.seats,
      totalPrice,
      status: BOOKING_STATUS.CONFIRMED,
    });

    await booking.save();

    // Mark seats as occupied
    await SeatService.markSeatsAsOccupied(bookingData.seats);

    // Release seat holds
    await SeatService.releaseSeatHolds(bookingData.seats);

    return booking;
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      const error: any = new Error('Booking is already cancelled');
      error.statusCode = 400;
      throw error;
    }

    // Mark seats as available
    await SeatService.markSeatsAsAvailable(booking.seats.map((s) => s.toString()));

    // Update booking status
    booking.status = BOOKING_STATUS.CANCELLED as any;
    await booking.save();

    return booking;
  }
}

export default BookingService;
