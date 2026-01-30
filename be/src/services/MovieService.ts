import { Movie } from '../models/Movie';
import { IMovie, IMovieRequest } from '../types';
import { ERROR_MESSAGES, PAGINATION } from '../utils/constants';

/**
 * Movie Service - Handles movie related business logic
 */

export class MovieService {
  /**
   * Get all movies with pagination and filters
   */
  static async getAllMovies(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: {
      genre?: string;
      minRating?: number;
      maxRating?: number;
      releaseAfter?: Date;
      releaseBefore?: Date;
      title?: string;
    }
  ): Promise<{ movies: IMovie[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.genre) {
      query.genre = filters.genre;
    }
    if (filters?.minRating !== undefined) {
      query.rating = { $gte: filters.minRating };
    }
    if (filters?.maxRating !== undefined) {
      query.rating = { ...query.rating, $lte: filters.maxRating };
    }
    if (filters?.releaseAfter) {
      query.releaseDate = { $gte: filters.releaseAfter };
    }
    if (filters?.releaseBefore) {
      query.releaseDate = { ...query.releaseDate, $lte: filters.releaseBefore };
    }
    if (filters?.title) {
      query.title = { $regex: filters.title, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const movies = await Movie.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Movie.countDocuments(query);

    return {
      movies,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get movie by ID
   */
  static async getMovieById(movieId: string): Promise<IMovie> {
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const error: any = new Error(ERROR_MESSAGES.MOVIE_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
    return movie;
  }

  /**
   * Create a new movie
   */
  static async createMovie(movieData: IMovieRequest): Promise<IMovie> {
    const movie = new Movie(movieData);
    await movie.save();
    return movie;
  }

  /**
   * Update movie
   */
  static async updateMovie(movieId: string, updateData: Partial<IMovieRequest>): Promise<IMovie> {
    const movie = await Movie.findByIdAndUpdate(movieId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      const error: any = new Error(ERROR_MESSAGES.MOVIE_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    return movie;
  }

  /**
   * Delete movie
   */
  static async deleteMovie(movieId: string): Promise<void> {
    const movie = await Movie.findByIdAndDelete(movieId);
    if (!movie) {
      const error: any = new Error(ERROR_MESSAGES.MOVIE_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }
  }
}

export default MovieService;
