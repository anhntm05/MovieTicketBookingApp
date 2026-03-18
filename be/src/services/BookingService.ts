import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { Showtime } from '../models/Showtime';
import { ShowtimeSeat } from '../models/ShowtimeSeat';
import { IBooking, IBookingRequest, ITicketDetail, UserRole } from '../types';
import {
  BOOKING_STATUS,
  ERROR_MESSAGES,
  PAGINATION,
  PAYMENT_STATUS,
  SEAT_HOLD_EXPIRY_MINUTES,
  SHOWTIME_STATUS,
  USER_ROLES,
} from '../utils/constants';
import ShowtimeSeatService from './ShowtimeSeatService';

export class BookingService {
  private static readonly bookingPopulate = [
    {
      path: 'showtime',
      populate: [
        { path: 'movie', select: 'title poster description duration genre rating releaseDate status' },
        {
          path: 'screen',
          select: 'name cinema totalSeats status',
          populate: {
            path: 'cinema',
            select: 'name location address facilities status',
          },
        },
      ],
    },
    { path: 'seats', select: 'row number type status screen' },
  ];

  static async getAllBookings(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      user?: string;
      status?: string;
    }
  ): Promise<{ bookings: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.user) query.user = filters.user;
    if (filters?.status) query.status = filters.status;

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate(this.bookingPopulate)
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

  static async getBookingById(bookingId: string, requesterId: string, role: UserRole): Promise<any> {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate(this.bookingPopulate);

    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await this.expireBookingIfNeeded(booking);
    this.assertBookingAccess(booking, requesterId, role);

    return booking;
  }

  static async getUserBookings(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ bookings: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const bookings = await Booking.find({ user: userId })
      .populate(this.bookingPopulate)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    await Promise.all(bookings.map((booking) => this.expireBookingIfNeeded(booking)));

    const total = await Booking.countDocuments({ user: userId });

    return {
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async createBooking(userId: string, bookingData: IBookingRequest): Promise<IBooking> {
    const showtime = await Showtime.findById(bookingData.showtime);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    if (showtime.status !== SHOWTIME_STATUS.SCHEDULED) {
      const error: any = new Error('Showtime is not available for booking');
      error.statusCode = 409;
      throw error;
    }

    await ShowtimeSeatService.initializeForShowtime(bookingData.showtime);
    const showtimeSeats = await ShowtimeSeatService.assertSeatsReservable(
      bookingData.showtime,
      userId,
      bookingData.seats
    );

    let holdExpiresAt = showtimeSeats[0]?.holdExpiresAt || null;
    const needsHold = showtimeSeats.some(
      (showtimeSeat) =>
        showtimeSeat.status !== 'held' ||
        showtimeSeat.holdBy?.toString() !== userId ||
        !showtimeSeat.holdExpiresAt
    );

    if (needsHold || !holdExpiresAt) {
      const heldSeats = await ShowtimeSeatService.holdSeats(bookingData.showtime, userId, bookingData.seats);
      holdExpiresAt =
        heldSeats[0]?.holdExpiresAt || new Date(Date.now() + SEAT_HOLD_EXPIRY_MINUTES * 60 * 1000);
    }

    const totalPrice = showtimeSeats.reduce((sum, seat) => sum + seat.price, 0);
    const booking = new Booking({
      bookingCode: this.generateBookingCode(),
      user: userId,
      showtime: bookingData.showtime,
      seats: bookingData.seats,
      totalPrice,
      status: BOOKING_STATUS.PENDING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      holdExpiresAt,
    });

    await booking.save();
    await ShowtimeSeatService.attachBooking(
      bookingData.showtime,
      userId,
      bookingData.seats,
      booking._id!.toString(),
      holdExpiresAt || new Date(Date.now() + SEAT_HOLD_EXPIRY_MINUTES * 60 * 1000)
    );

    return booking;
  }

  static async getTicketDetail(
    bookingId: string,
    requesterId: string,
    role: UserRole
  ): Promise<ITicketDetail> {
    const booking = await Booking.findById(bookingId).populate(this.bookingPopulate);

    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await this.expireBookingIfNeeded(booking);
    this.assertBookingAccess(booking, requesterId, role);

    const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    const bookedShowtimeSeats = await ShowtimeSeat.find({
      showtime: booking.showtime,
      booking: booking._id,
    }).select('price seat');
    const showtime = booking.showtime as any;
    const screen = showtime?.screen as any;
    const cinema = screen?.cinema as any;
    const movie = showtime?.movie as any;
    const seats = Array.isArray(booking.seats)
      ? [...booking.seats]
          .map((seat: any) => ({
            id: seat?._id?.toString?.() || seat?.id?.toString?.() || '',
            row: String(seat?.row || ''),
            number: Number(seat?.number || 0),
            type: seat?.type || 'standard',
            label: `${seat?.row || ''}${seat?.number || ''}`,
          }))
          .sort((a, b) => {
            if (a.row === b.row) {
              return a.number - b.number;
            }

            return a.row.localeCompare(b.row);
          })
      : [];

    const concessions = Array.isArray(booking.concessions)
      ? booking.concessions.map((item: any) => ({
          name: String(item?.name || ''),
          note: String(item?.note || ''),
          qty: Number(item?.qty || 0),
          unitPrice: Number(item?.unitPrice || 0),
          totalPrice: Number(item?.totalPrice || Number(item?.qty || 0) * Number(item?.unitPrice || 0)),
        }))
      : [];

    const ticketSubtotal =
      bookedShowtimeSeats.length > 0
        ? bookedShowtimeSeats.reduce((sum, item: any) => sum + Number(item.price || 0), 0)
        : Number(showtime?.price || 0) * seats.length;
    const concessionsSubtotal = concessions.reduce(
      (sum, item) => sum + Number(item.totalPrice || item.qty * item.unitPrice || 0),
      0
    );
    const totalAmount = Number(booking.totalPrice || 0);
    const serviceFee = Math.max(totalAmount - ticketSubtotal - concessionsSubtotal, 0);

    return {
      bookingId: booking._id!.toString(),
      bookingCode: String(booking.bookingCode || ''),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: payment?.method,
      transactionId: payment?.transactionId,
      qrCodeValue: payment?.transactionId || booking.bookingCode,
      bookingDate: booking.bookingDate,
      movie: {
        id: movie?._id?.toString?.() || '',
        title: String(movie?.title || ''),
        poster: String(movie?.poster || ''),
        duration: Number(movie?.duration || 0),
        genre: Array.isArray(movie?.genre) ? movie.genre.map(String) : [],
      },
      schedule: {
        startTime: showtime?.startTime,
        theater: String(cinema?.name || ''),
        hall: String(screen?.name || ''),
        cinemaLocation: String(cinema?.location || ''),
        cinemaAddress: String(cinema?.address || ''),
      },
      seats,
      concessions,
      summary: {
        ticketCount: seats.length,
        ticketSubtotal,
        concessionsSubtotal,
        serviceFee,
        totalAmount,
      },
    };
  }

  static async holdSeats(
    userId: string,
    payload: { showtime: string; seats: string[]; expiryMinutes?: number }
  ) {
    const showtime = await Showtime.findById(payload.showtime);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await ShowtimeSeatService.initializeForShowtime(payload.showtime);
    return ShowtimeSeatService.holdSeats(payload.showtime, userId, payload.seats, payload.expiryMinutes);
  }

  static async cancelBooking(bookingId: string, requesterId: string, role: UserRole): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error: any = new Error(ERROR_MESSAGES.BOOKING_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await this.expireBookingIfNeeded(booking);
    this.assertBookingAccess(booking, requesterId, role);

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      const error: any = new Error('Booking is already cancelled');
      error.statusCode = 400;
      throw error;
    }
    if (booking.status === BOOKING_STATUS.EXPIRED) {
      const error: any = new Error('Booking is already expired');
      error.statusCode = 400;
      throw error;
    }

    booking.status = BOOKING_STATUS.CANCELLED as any;
    booking.cancelledAt = new Date();
    await booking.save();
    await ShowtimeSeatService.releaseBooking(
      booking.showtime.toString(),
      booking.seats.map((seat) => seat.toString()),
      booking._id!.toString()
    );

    return booking;
  }

  static async expireBookingIfNeeded(booking: any): Promise<void> {
    if (
      booking.status === BOOKING_STATUS.PENDING_PAYMENT &&
      booking.holdExpiresAt &&
      new Date(booking.holdExpiresAt).getTime() <= Date.now()
    ) {
      booking.status = BOOKING_STATUS.EXPIRED;
      await booking.save();
      await ShowtimeSeatService.releaseBooking(
        booking.showtime.toString(),
        booking.seats.map((seat: any) => seat.toString()),
        booking._id!.toString()
      );
    }
  }

  private static assertBookingAccess(booking: any, requesterId: string, role: UserRole): void {
    if (role !== USER_ROLES.CUSTOMER) {
      return;
    }

    if (booking.user.toString() !== requesterId) {
      const error: any = new Error(ERROR_MESSAGES.FORBIDDEN);
      error.statusCode = 403;
      throw error;
    }
  }

  private static generateBookingCode(): string {
    return `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}

export default BookingService;
