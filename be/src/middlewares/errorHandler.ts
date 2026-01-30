import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { IApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.INTERNAL_ERROR;

  const response: IApiResponse<null> = {
    success: false,
    message,
  };

  if (err.errors) {
    response.errors = Array.isArray(err.errors)
      ? err.errors.map((e: any) => e.msg || e.message)
      : [err.errors];
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFound = (req: Request, res: Response) => {
  const response: IApiResponse<null> = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(HTTP_STATUS.NOT_FOUND).json(response);
};

export default {
  errorHandler,
  notFound,
};
