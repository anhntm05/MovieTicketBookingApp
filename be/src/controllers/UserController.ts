import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import UserService from '../services/UserService';
import logger from '../utils/logger';

/**
 * User Controller - Handles user endpoints
 */

export class UserController {
  /**
   * Get user profile - GET /api/users/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const user = await UserService.getUserById(userId!);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get profile error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Update user profile - PUT /api/users/profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const user = await UserService.updateProfile(userId!, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: user,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default UserController;
