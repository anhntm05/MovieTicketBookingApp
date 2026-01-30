import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import ShowtimeService from '../services/ShowtimeService';
import { Seat } from '../models/Seat';
import logger from '../utils/logger';

/**
 * Showtime Controller - Handles showtime endpoints
 */

export class ShowtimeController {
  /**
   * Get all showtimes with filters (by movie, cinema, date) - GET /api/showtimes
   */
  static async getAllShowtimes(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (req.query.movie) filters.movie = req.query.movie;
      if (req.query.cinema) filters.cinema = req.query.cinema;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await ShowtimeService.getAllShowtimes(page, limit, filters);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Showtimes retrieved successfully',
        data: result.showtimes,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get all showtimes error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get showtime by ID - GET /api/showtimes/:id
   */
  static async getShowtimeById(req: Request, res: Response) {
    try {
      const result = await ShowtimeService.getShowtimeById(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Showtime retrieved successfully',
        data: result,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get showtime by ID error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Create showtime - POST /api/showtimes (Admin)
   */
  static async createShowtime(req: Request, res: Response) {
    try {
      const showtime = await ShowtimeService.createShowtime(req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Showtime created successfully',
        data: showtime,
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Create showtime error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Update showtime - PUT /api/showtimes/:id (Admin)
   */
  static async updateShowtime(req: Request, res: Response) {
    try {
      const showtime = await ShowtimeService.updateShowtime(req.params.id, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Showtime updated successfully',
        data: showtime,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Update showtime error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Delete showtime - DELETE /api/showtimes/:id (Admin)
   */
  static async deleteShowtime(req: Request, res: Response) {
    try {
      await ShowtimeService.deleteShowtime(req.params.id);

      const response: IApiResponse<null> = {
        success: true,
        message: 'Showtime deleted successfully',
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Delete showtime error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get available seats for a showtime - GET /api/showtimes/:showtimeId/seats
   */
  static async getAvailableSeats(req: Request, res: Response) {
    try {
      const { showtimeId } = req.params;

      // Get all seats for the screen associated with this showtime
      const showtime = await ShowtimeService.getShowtimeById(showtimeId);

      const seats = await Seat.find({ screen: showtime.screen, isOccupied: false });

      const response: IApiResponse<any> = {
        success: true,
        message: 'Available seats retrieved successfully',
        data: seats,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get available seats error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default ShowtimeController;
