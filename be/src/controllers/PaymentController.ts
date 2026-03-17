import { Request, Response } from 'express';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import PaymentService from '../services/PaymentService';
import logger from '../utils/logger';

/**
 * Payment Controller - Handles payment endpoints
 */

export class PaymentController {
  /**
   * Process payment - POST /api/payments/process
   */
  static async processPayment(req: Request, res: Response) {
    try {
      const payment = await PaymentService.processPayment(req.user!.userId, req.user!.role, req.body);

      const response: IApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.PAYMENT_PROCESSED,
        data: payment,
      };

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error: any) {
      logger.error('Process payment error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get payment by booking ID - GET /api/payments/:bookingId
   */
  static async getPaymentByBookingId(req: Request, res: Response) {
    try {
      const payment = await PaymentService.getPaymentByBookingId(
        req.params.bookingId,
        req.user!.userId,
        req.user!.role
      );

      const response: IApiResponse<any> = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get payment error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }

  /**
   * Get payment by ID - GET /api/payments/:id
   */
  static async getPaymentById(req: Request, res: Response) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);

      const response: IApiResponse<any> = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      logger.error('Get payment by ID error:', error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const response: IApiResponse<null> = {
        success: false,
        message: error.message,
      };
      res.status(statusCode).json(response);
    }
  }
}

export default PaymentController;
