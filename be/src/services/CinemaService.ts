import { Cinema } from '../models/Cinema';
import { Screen } from '../models/Screen';
import { ICinema, ICinemaRequest, IScreen, IScreenRequest } from '../types';
import { ERROR_MESSAGES, PAGINATION } from '../utils/constants';

/**
 * Cinema Service - Handles cinema related business logic
 */

export class CinemaService {
  /**
   * Get all cinemas
   */
  static async getAllCinemas(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      location?: string;
      name?: string;
      status?: string;
    }
  ): Promise<{ cinemas: ICinema[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }
    if (filters?.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;
    const cinemas = await Cinema.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Cinema.countDocuments(query);

    return {
      cinemas,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get cinema by ID with screens
   */
  static async getCinemaById(cinemaId: string): Promise<{ cinema: ICinema; screens: IScreen[] }> {
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      const error: any = new Error(ERROR_MESSAGES.CINEMA_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const screens = await Screen.find({ cinema: cinemaId });

    return {
      cinema,
      screens,
    };
  }

  /**
   * Create a new cinema
   */
  static async createCinema(cinemaData: ICinemaRequest): Promise<ICinema> {
    const cinema = new Cinema(cinemaData);
    await cinema.save();
    return cinema;
  }

  /**
   * Update cinema
   */
  static async updateCinema(cinemaId: string, updateData: Partial<ICinemaRequest>): Promise<ICinema> {
    const cinema = await Cinema.findByIdAndUpdate(cinemaId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!cinema) {
      const error: any = new Error(ERROR_MESSAGES.CINEMA_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return cinema;
  }

  /**
   * Delete cinema
   */
  static async deleteCinema(cinemaId: string): Promise<void> {
    const cinema = await Cinema.findByIdAndDelete(cinemaId);
    if (!cinema) {
      const error: any = new Error(ERROR_MESSAGES.CINEMA_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Delete associated screens
    await Screen.deleteMany({ cinema: cinemaId });
  }
}

export default CinemaService;
