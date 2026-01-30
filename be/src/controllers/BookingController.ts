import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import BookingService from '../services/BookingService';
import SeatService from '../services/SeatService';
import logger from '../utils/logger';

/**
 * Booking Controller - Handles booking endpoints
 */

export class BookingController {
  /**
   * Create booking - POST /api/bookings
   */
  static async createBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const booking = await BookingService.createBooking(userId!, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.BOOKING_CREATED,
        data: booking,
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Create booking error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get booking by ID - GET /api/bookings/:id
   */
  static async getBookingById(req: Request, res: Response) {
    try {
      const booking = await BookingService.getBookingById(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Booking retrieved successfully',
        data: booking,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get booking by ID error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get user bookings - GET /api/bookings/user/:userId
   */
  static async getUserBookings(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await BookingService.getUserBookings(userId!, page, limit);

      const response: IApiResponse<any> = {
        success: true,
        message: 'User bookings retrieved successfully',
        data: result.bookings,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get user bookings error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Cancel booking - PUT /api/bookings/:id/cancel
   */
  static async cancelBooking(req: Request, res: Response) {
    try {
      const booking = await BookingService.cancelBooking(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.BOOKING_CANCELLED,
        data: booking,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Cancel booking error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Hold seats temporarily - POST /api/seats/hold
   */
  static async holdSeats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { seatIds, expiryMinutes } = req.body;

      const holds = await SeatService.holdSeats(userId!, seatIds, expiryMinutes);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Seats held successfully',
        data: holds,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Hold seats error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default BookingController;
