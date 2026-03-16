import { Booking } from '../models/Booking';
import { Movie } from '../models/Movie';
import { Screen } from '../models/Screen';
import { Showtime } from '../models/Showtime';
import { ShowtimeSeat } from '../models/ShowtimeSeat';
import { IShowtime, IShowtimeRequest } from '../types';
import { BOOKING_STATUS, ERROR_MESSAGES, PAGINATION, SHOWTIME_STATUS } from '../utils/constants';
import ShowtimeSeatService from './ShowtimeSeatService';

export class ShowtimeService {
  static async getAllShowtimes(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      movie?: string;
      screen?: string;
      cinema?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ): Promise<{ showtimes: any[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.movie) query.movie = filters.movie;
    if (filters?.screen) query.screen = filters.screen;
    if (filters?.status) query.status = filters.status;
    if (filters?.cinema) {
      const screens = await Screen.find({ cinema: filters.cinema }).select('_id');
      query.screen = { $in: screens.map((screen) => screen._id) };
    }
    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters?.startDate) query.startTime.$gte = filters.startDate;
      if (filters?.endDate) query.startTime.$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    const showtimes = await Showtime.find(query)
      .populate('movie', 'title duration genre rating poster status')
      .populate({
        path: 'screen',
        select: 'name cinema status totalSeats',
        populate: {
          path: 'cinema',
          select: 'name location address',
        },
      })
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

  static async getShowtimeById(showtimeId: string): Promise<any> {
    const showtime = await Showtime.findById(showtimeId)
      .populate('movie')
      .populate({
        path: 'screen',
        populate: {
          path: 'cinema',
        },
      });

    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return showtime;
  }

  static async createShowtime(showtimeData: IShowtimeRequest, actorId?: string): Promise<IShowtime> {
    const startTime = new Date(showtimeData.startTime);
    const endTime = new Date(showtimeData.endTime);

    if (endTime <= startTime) {
      const error: any = new Error('End time must be after start time');
      error.statusCode = 400;
      throw error;
    }

    const movie = await Movie.findById(showtimeData.movie);
    if (!movie) {
      const error: any = new Error(ERROR_MESSAGES.MOVIE_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const screen = await Screen.findById(showtimeData.screen);
    if (!screen) {
      const error: any = new Error(ERROR_MESSAGES.SCREEN_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await this.ensureNoOverlap(showtimeData.screen, startTime, endTime);

    const showtime = new Showtime({
      ...showtimeData,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await showtime.save();
    await ShowtimeSeatService.initializeForShowtime(showtime._id!.toString());
    return showtime;
  }

  static async updateShowtime(
    showtimeId: string,
    updateData: Partial<IShowtimeRequest>,
    actorId?: string
  ): Promise<IShowtime> {
    const existingShowtime = await Showtime.findById(showtimeId);
    if (!existingShowtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const startTime = updateData.startTime ? new Date(updateData.startTime) : existingShowtime.startTime;
    const endTime = updateData.endTime ? new Date(updateData.endTime) : existingShowtime.endTime;
    const screenId = (updateData.screen || existingShowtime.screen).toString();

    if (endTime <= startTime) {
      const error: any = new Error('End time must be after start time');
      error.statusCode = 400;
      throw error;
    }

    await this.ensureNoOverlap(screenId, startTime, endTime, showtimeId);

    const showtime = await Showtime.findByIdAndUpdate(
      showtimeId,
      {
        ...updateData,
        updatedBy: actorId,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await ShowtimeSeatService.initializeForShowtime(showtime._id!.toString());
    return showtime;
  }

  static async deleteShowtime(showtimeId: string): Promise<void> {
    const activeBookings = await Booking.countDocuments({
      showtime: showtimeId,
      status: { $in: [BOOKING_STATUS.PENDING_PAYMENT, BOOKING_STATUS.CONFIRMED] },
    });
    if (activeBookings > 0) {
      const error: any = new Error('Showtime has active bookings and cannot be deleted');
      error.statusCode = 409;
      throw error;
    }

    const showtime = await Showtime.findByIdAndDelete(showtimeId);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await ShowtimeSeat.deleteMany({ showtime: showtimeId });
  }

  static async getAvailableSeats(showtimeId: string): Promise<any[]> {
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      const error: any = new Error(ERROR_MESSAGES.SHOWTIME_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await ShowtimeSeatService.initializeForShowtime(showtimeId);
    return ShowtimeSeatService.getSeatsForShowtime(showtimeId);
  }

  private static async ensureNoOverlap(
    screenId: string,
    startTime: Date,
    endTime: Date,
    excludeShowtimeId?: string
  ): Promise<void> {
    const query: any = {
      screen: screenId,
      status: SHOWTIME_STATUS.SCHEDULED,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };

    if (excludeShowtimeId) {
      query._id = { $ne: excludeShowtimeId };
    }

    const overlap = await Showtime.findOne(query);
    if (overlap) {
      const error: any = new Error('Showtime overlaps with an existing schedule for this screen');
      error.statusCode = 409;
      throw error;
    }
  }
}

export default ShowtimeService;
