import { Request, Response } from 'express';
import { HTTP_STATUS } from '../utils/constants';
import { IApiResponse } from '../types';
import NotificationService from '../services/NotificationService';
import logger from '../utils/logger';

export class NotificationController {
  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const filter = (req.query.filter as 'all' | 'bookings' | 'social' | undefined) || 'all';

      const result = await NotificationService.getUserNotifications(userId, page, limit, filter);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.notifications,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get notifications error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user!.userId);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Notification updated successfully',
        data: notification,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Mark notification as read error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const modifiedCount = await NotificationService.markAllAsRead(req.user!.userId);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Notifications updated successfully',
        data: { modifiedCount },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Mark all notifications as read error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default NotificationController;
