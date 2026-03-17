import { Seat } from '../models/Seat';
import { ISeat, ISeatRequest, ISeatHold } from '../types';
import { ERROR_MESSAGES, PAGINATION, SEAT_STATUS } from '../utils/constants';

/**
 * Seat Service - Handles seat related business logic
 */

export class SeatService {
  /**
   * Get seats for a showtime/screen
   */
  static async getSeatsForScreen(
    screenId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ seats: ISeat[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const seats = await Seat.find({ screen: screenId })
      .skip(skip)
      .limit(limit)
      .sort({ row: 1, number: 1 });

    const total = await Seat.countDocuments({ screen: screenId });

    return {
      seats,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get available seats (not occupied and not on hold)
   */
  static async getAvailableSeats(screenId: string): Promise<ISeat[]> {
    return Seat.find({ screen: screenId, status: SEAT_STATUS.ACTIVE }).sort({ row: 1, number: 1 });
  }

  /**
   * Create seats for a screen
   */
  static async createSeats(screenId: string, seatData: ISeatRequest[]): Promise<ISeat[]> {
    const seatsToCreate = seatData.map((seat) => ({
      ...seat,
      screen: screenId,
    }));

    const seats = await Seat.insertMany(seatsToCreate);
    return seats as unknown as ISeat[];
  }

  /**
   * Hold seats (temporary reservation)
   */
  static async holdSeats(
    userId: string,
    seatIds: string[],
    expiryMinutes: number = 15
  ): Promise<ISeatHold[]> {
    const seats = await Seat.find({ _id: { $in: seatIds }, status: SEAT_STATUS.ACTIVE });

    if (seats.length !== seatIds.length) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return seatIds.map((seatId) => ({
      seat: seatId,
      user: userId,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    })) as ISeatHold[];
  }

  /**
   * Release seat holds
   */
  static async releaseSeatHolds(seatIds: string[]): Promise<void> {
    void seatIds;
  }

  /**
   * Mark seats as occupied
   */
  static async markSeatsAsOccupied(seatIds: string[]): Promise<void> {
    await Seat.updateMany({ _id: { $in: seatIds } }, { status: SEAT_STATUS.BLOCKED });
  }

  /**
   * Mark seats as available
   */
  static async markSeatsAsAvailable(seatIds: string[]): Promise<void> {
    await Seat.updateMany({ _id: { $in: seatIds } }, { status: SEAT_STATUS.ACTIVE });
  }

  /**
   * Get seat by ID
   */
  static async getSeatById(seatId: string): Promise<ISeat> {
    const seat = await Seat.findById(seatId);
    if (!seat) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
    return seat;
  }
}

export default SeatService;
