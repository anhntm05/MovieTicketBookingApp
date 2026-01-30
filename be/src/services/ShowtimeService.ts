import { Showtime } from '../models/Showtime';
import { Seat } from '../models/Seat';
import { IShowtime, IShowtimeRequest, ISeat } from '../types';
import { ERROR_MESSAGES, PAGINATION } from '../utils/constants';

/**
 * Showtime Service - Handles showtime related business logic
 */

export class ShowtimeService {
  /**
   * Get all showtimes with filters
   */
  static async getAllShowtimes(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      movie?: string;
      screen?: string;
      cinema?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ showtimes: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.movie) {
      query.movie = filters.movie;
    }
    if (filters?.screen) {
      query.screen = filters.screen;
    }
    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters?.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters?.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;
    const showtimes = await Showtime.find(query)
      .populate('movie', 'title duration genre rating')
      .populate('screen', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ startTime: 1 });

    const total = await Showtime.countDocuments(query);

    return {
      showtimes,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get showtime by ID
   */
  static async getShowtimeById(showtimeId: string): Promise<any> {
    const showtime = await Showtime.findById(showtimeId)
      .populate('movie')
      .populate('screen');

    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return showtime;
  }

  /**
   * Create a new showtime
   */
  static async createShowtime(showtimeData: IShowtimeRequest): Promise<IShowtime> {
    // Validate that end time is after start time
    if (new Date(showtimeData.endTime) <= new Date(showtimeData.startTime)) {
      const error: any = new Error('End time must be after start time');
      error.statusCode = 400;
      throw error;
    }

    const showtime = new Showtime(showtimeData);
    await showtime.save();
    return showtime;
  }

  /**
   * Update showtime
   */
  static async updateShowtime(
    showtimeId: string,
    updateData: Partial<IShowtimeRequest>
  ): Promise<IShowtime> {
    const showtime = await Showtime.findByIdAndUpdate(showtimeId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return showtime;
  }

  /**
   * Delete showtime
   */
  static async deleteShowtime(showtimeId: string): Promise<void> {
    const showtime = await Showtime.findByIdAndDelete(showtimeId);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
  }
}

export default ShowtimeService;
