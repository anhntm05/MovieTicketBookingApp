import { Seat } from '../models/Seat';
import { Showtime } from '../models/Showtime';
import { ShowtimeSeat } from '../models/ShowtimeSeat';
import { IShowtimeSeat } from '../types';
import { ERROR_MESSAGES, SEAT_HOLD_EXPIRY_MINUTES, SHOWTIME_SEAT_STATUS } from '../utils/constants';

export class ShowtimeSeatService {
  static async initializeForShowtime(showtimeId: string): Promise<IShowtimeSeat[]> {
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const seats = await Seat.find({ screen: showtime.screen, status: 'active' });
    if (seats.length === 0) {
      return [];
    }

    const existing = await ShowtimeSeat.countDocuments({ showtime: showtimeId });
    if (existing > 0) {
      return ShowtimeSeat.find({ showtime: showtimeId }).populate('seat');
    }

    const docs = await ShowtimeSeat.insertMany(
      seats.map((seat) => ({
        showtime: showtimeId,
        seat: seat._id,
        price: showtime.price,
        status: SHOWTIME_SEAT_STATUS.AVAILABLE,
      }))
    );

    return docs as unknown as IShowtimeSeat[];
  }

  static async releaseExpiredHolds(showtimeId?: string): Promise<void> {
    const now = new Date();
    const query: any = {
      status: SHOWTIME_SEAT_STATUS.HELD,
      holdExpiresAt: { $lte: now },
    };

    if (showtimeId) query.showtime = showtimeId;

    await ShowtimeSeat.updateMany(query, {
      status: SHOWTIME_SEAT_STATUS.AVAILABLE,
      holdBy: null,
      holdExpiresAt: null,
      booking: null,
    });
  }

  static async getSeatsForShowtime(showtimeId: string): Promise<any[]> {
    await this.releaseExpiredHolds(showtimeId);
    return ShowtimeSeat.find({ showtime: showtimeId })
      .populate('seat')
      .sort({ 'seat.row': 1, 'seat.number': 1 });
  }

  static async holdSeats(
    showtimeId: string,
    userId: string,
    seatIds: string[],
    expiryMinutes: number = SEAT_HOLD_EXPIRY_MINUTES
  ): Promise<IShowtimeSeat[]> {
    await this.releaseExpiredHolds(showtimeId);

    const showtimeSeats = await ShowtimeSeat.find({
      showtime: showtimeId,
      seat: { $in: seatIds },
    });

    if (showtimeSeats.length !== seatIds.length) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const unavailable = showtimeSeats.find((item) => {
      if (item.status === SHOWTIME_SEAT_STATUS.BOOKED || item.status === SHOWTIME_SEAT_STATUS.BLOCKED) {
        return true;
      }
      return item.status === SHOWTIME_SEAT_STATUS.HELD && item.holdBy?.toString() !== userId;
    });

    if (unavailable) {
      const error: any = new Error(ERROR_MESSAGES.SEATS_NOT_AVAILABLE);
      error.statusCode = 409;
      throw error;
    }

    const holdExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await ShowtimeSeat.updateMany(
      {
        showtime: showtimeId,
        seat: { $in: seatIds },
      },
      {
        status: SHOWTIME_SEAT_STATUS.HELD,
        holdBy: userId,
        holdExpiresAt,
      }
    );

    return ShowtimeSeat.find({
      showtime: showtimeId,
      seat: { $in: seatIds },
    }).populate('seat');
  }

  static async assertSeatsReservable(showtimeId: string, userId: string, seatIds: string[]): Promise<IShowtimeSeat[]> {
    await this.releaseExpiredHolds(showtimeId);

    const showtimeSeats = await ShowtimeSeat.find({
      showtime: showtimeId,
      seat: { $in: seatIds },
    });

    if (showtimeSeats.length !== seatIds.length) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const unavailable = showtimeSeats.find((item) => {
      if (item.status === SHOWTIME_SEAT_STATUS.BOOKED || item.status === SHOWTIME_SEAT_STATUS.BLOCKED) {
        return true;
      }

      return item.status === SHOWTIME_SEAT_STATUS.HELD && item.holdBy?.toString() !== userId;
    });

    if (unavailable) {
      const error: any = new Error(ERROR_MESSAGES.SEATS_NOT_AVAILABLE);
      error.statusCode = 409;
      throw error;
    }

    return showtimeSeats;
  }

  static async attachBooking(
    showtimeId: string,
    userId: string,
    seatIds: string[],
    bookingId: string,
    holdExpiresAt: Date
  ): Promise<void> {
    await ShowtimeSeat.updateMany(
      { showtime: showtimeId, seat: { $in: seatIds } },
      {
        status: SHOWTIME_SEAT_STATUS.HELD,
        holdBy: userId,
        holdExpiresAt,
        booking: bookingId,
      }
    );
  }

  static async confirmBooking(showtimeId: string, seatIds: string[], bookingId: string): Promise<void> {
    await ShowtimeSeat.updateMany(
      { showtime: showtimeId, seat: { $in: seatIds }, booking: bookingId },
      {
        status: SHOWTIME_SEAT_STATUS.BOOKED,
        holdBy: null,
        holdExpiresAt: null,
      }
    );
  }

  static async releaseBooking(showtimeId: string, seatIds: string[], bookingId?: string): Promise<void> {
    const query: any = {
      showtime: showtimeId,
      seat: { $in: seatIds },
    };
    if (bookingId) {
      query.booking = bookingId;
    }

    await ShowtimeSeat.updateMany(query, {
      status: SHOWTIME_SEAT_STATUS.AVAILABLE,
      holdBy: null,
      holdExpiresAt: null,
      booking: null,
    });
  }
}

export default ShowtimeSeatService;
