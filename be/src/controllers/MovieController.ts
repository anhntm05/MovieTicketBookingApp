import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import MovieService from '../services/MovieService';
import logger from '../utils/logger';

/**
 * Movie Controller - Handles movie endpoints
 */

export class MovieController {
  /**
   * Get all movies - GET /api/movies
   */
  static async getAllMovies(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (req.query.genre) filters.genre = req.query.genre;
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating as string);
      if (req.query.maxRating) filters.maxRating = parseFloat(req.query.maxRating as string);
      if (req.query.title) filters.title = req.query.title;

      const result = await MovieService.getAllMovies(page, limit, filters);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Movies retrieved successfully',
        data: result.movies,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get all movies error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get movie by ID - GET /api/movies/:id
   */
  static async getMovieById(req: Request, res: Response) {
    try {
      const movie = await MovieService.getMovieById(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Movie retrieved successfully',
        data: movie,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get movie by ID error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Create movie - POST /api/movies (Admin)
   */
  static async createMovie(req: Request, res: Response) {
    try {
      const movie = await MovieService.createMovie(req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.MOVIE_CREATED,
        data: movie,
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Create movie error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Update movie - PUT /api/movies/:id (Admin)
   */
  static async updateMovie(req: Request, res: Response) {
    try {
      const movie = await MovieService.updateMovie(req.params.id, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.MOVIE_UPDATED,
        data: movie,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Update movie error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Delete movie - DELETE /api/movies/:id (Admin)
   */
  static async deleteMovie(req: Request, res: Response) {
    try {
      await MovieService.deleteMovie(req.params.id);

      const response: IApiResponse<null> = {
        success: true,
        message: SUCCESS_MESSAGES.MOVIE_DELETED,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Delete movie error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default MovieController;
