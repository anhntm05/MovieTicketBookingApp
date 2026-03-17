import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import UserService from '../services/UserService';
import logger from '../utils/logger';

/**
 * Auth Controller - Handles authentication endpoints
 */

export class AuthController {
  /**
   * Register new user - POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      const { user, token } = await UserService.register(req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.REGISTERED,
        data: { user, token },
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Register error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Login user - POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, token } = await UserService.login(email, password);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.LOGGED_IN,
        data: { user, token },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Login error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default AuthController;
