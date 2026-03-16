import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import AdminService from '../services/AdminService';
import ScreenService from '../services/ScreenService';
import UserService from '../services/UserService';
import logger from '../utils/logger';

export class AdminController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const dashboard = await AdminService.getDashboard(startDate, endDate);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Dashboard retrieved successfully',
        data: dashboard,
      });
    } catch (error: any) {
      logger.error('Get dashboard error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getFinance(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const groupBy = (req.query.groupBy as 'day' | 'movie' | 'cinema' | 'method') || 'day';
      const finance = await AdminService.getFinance(startDate, endDate, groupBy);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Finance report retrieved successfully',
        data: finance.map((item: any) => ({
          label: item._id,
          revenue: item.revenue,
          transactions: item.transactions,
        })),
      });
    } catch (error: any) {
      logger.error('Get finance error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await UserService.listUsers(page, limit, {
        role: req.query.role as any,
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('List users error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createStaff(req: Request, res: Response) {
    try {
      const user = await UserService.createStaff(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.STAFF_CREATED,
        data: user,
      });
    } catch (error: any) {
      logger.error('Create staff error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const user = await UserService.updateUserRole(req.params.id, req.body.role);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Update user role error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const user = await UserService.updateUserStatus(req.params.id, req.body.status);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User status updated successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('Update user status error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createScreen(req: Request, res: Response) {
    try {
      const screen = await ScreenService.createScreen(req.params.cinemaId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.SCREEN_CREATED,
        data: screen,
      });
    } catch (error: any) {
      logger.error('Create screen error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getScreenSeats(req: Request, res: Response) {
    try {
      const seats = await ScreenService.getSeatsForScreen(req.params.screenId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Screen seats retrieved successfully',
        data: seats,
      });
    } catch (error: any) {
      logger.error('Get screen seats error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createSeatsBulk(req: Request, res: Response) {
    try {
      const seats = await ScreenService.createSeats(req.params.screenId, req.body.seats);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.SEATS_CREATED,
        data: seats,
      });
    } catch (error: any) {
      logger.error('Create seats bulk error:', error);
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default AdminController;
