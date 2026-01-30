import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import CinemaService from '../services/CinemaService';
import logger from '../utils/logger';

/**
 * Cinema Controller - Handles cinema endpoints
 */

export class CinemaController {
  /**
   * Get all cinemas - GET /api/cinemas
   */
  static async getAllCinemas(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (req.query.location) filters.location = req.query.location;
      if (req.query.name) filters.name = req.query.name;

      const result = await CinemaService.getAllCinemas(page, limit, filters);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Cinemas retrieved successfully',
        data: result.cinemas,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get all cinemas error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get cinema by ID - GET /api/cinemas/:id
   */
  static async getCinemaById(req: Request, res: Response) {
    try {
      const result = await CinemaService.getCinemaById(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Cinema retrieved successfully',
        data: result,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get cinema by ID error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Create cinema - POST /api/cinemas (Admin)
   */
  static async createCinema(req: Request, res: Response) {
    try {
      const cinema = await CinemaService.createCinema(req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Cinema created successfully',
        data: cinema,
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Create cinema error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Update cinema - PUT /api/cinemas/:id (Admin)
   */
  static async updateCinema(req: Request, res: Response) {
    try {
      const cinema = await CinemaService.updateCinema(req.params.id, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Cinema updated successfully',
        data: cinema,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Update cinema error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Delete cinema - DELETE /api/cinemas/:id (Admin)
   */
  static async deleteCinema(req: Request, res: Response) {
    try {
      await CinemaService.deleteCinema(req.params.id);

      const response: IApiResponse<null> = {
        success: true,
        message: 'Cinema deleted successfully',
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Delete cinema error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default CinemaController;
