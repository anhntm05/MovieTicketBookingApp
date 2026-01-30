import { Seat } from '../models/Seat';
import { SeatHold } from '../models/SeatHold';
import { ISeat, ISeatRequest, ISeatHold } from '../types';
import { ERROR_MESSAGES, PAGINATION, SEAT_HOLD_EXPIRY_MINUTES } from '../utils/constants';

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
    // Get all occupied seats
    const occupiedSeats = await Seat.find({
      screen: screenId,
      isOccupied: true,
    });

    const occupiedSeatIds = new Set(occupiedSeats.map((s) => s._id!.toString()));

    // Get all held seats
    const heldSeats = await SeatHold.find({});
    const heldSeatIds = new Set(heldSeats.map((s) => s.seat.toString()));

    // Get all seats and filter available ones
    const allSeats = await Seat.find({ screen: screenId });
    return allSeats.filter(
      (seat) => !occupiedSeatIds.has(seat._id!.toString()) && !heldSeatIds.has(seat._id!.toString())
    );
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
    return seats;
  }

  /**
   * Hold seats (temporary reservation)
   */
  static async holdSeats(
    userId: string,
    seatIds: string[],
    expiryMinutes: number = SEAT_HOLD_EXPIRY_MINUTES
  ): Promise<ISeatHold[]> {
    // Check if seats are available
    const seats = await Seat.find({ _id: { $in: seatIds } });

    if (seats.length !== seatIds.length) {
      const error: any = new Error(ERROR_MESSAGES.SEAT_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Remove existing holds for these seats
    await SeatHold.deleteMany({ seat: { $in: seatIds } });

    // Create new holds
    const holds = await SeatHold.insertMany(
      seatIds.map((seatId) => ({
        seat: seatId,
        user: userId,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      }))
    );

    return holds;
  }

  /**
   * Release seat holds
   */
  static async releaseSeatHolds(seatIds: string[]): Promise<void> {
    await SeatHold.deleteMany({ seat: { $in: seatIds } });
  }

  /**
   * Mark seats as occupied
   */
  static async markSeatsAsOccupied(seatIds: string[]): Promise<void> {
    await Seat.updateMany({ _id: { $in: seatIds } }, { isOccupied: true });
  }

  /**
   * Mark seats as available
   */
  static async markSeatsAsAvailable(seatIds: string[]): Promise<void> {
    await Seat.updateMany({ _id: { $in: seatIds } }, { isOccupied: false });
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
