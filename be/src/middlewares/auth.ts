import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { verifyToken } from '../utils/jwt';
import { IApiResponse, IJWTPayload, UserRole } from '../types';
import { User } from '../models/User';

/**
 * Extend Express Request interface
 */
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

/**
 * Authenticate JWT token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      const response: IApiResponse<null> = {
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      };
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      const response: IApiResponse<null> = {
        success: false,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
      };
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    }

    User.findById(payload.userId)
      .select('status role email')
      .then((user) => {
        if (!user || user.status !== 'active') {
          const response: IApiResponse<null> = {
            success: false,
            message: ERROR_MESSAGES.UNAUTHORIZED,
          };
          return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
        }

        req.user = {
          ...payload,
          role: user.role as UserRole,
          email: user.email,
        };
        next();
      })
      .catch(() => {
        const response: IApiResponse<null> = {
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        };
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
      });
  } catch (error) {
    const response: IApiResponse<null> = {
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
  }
};

/**
 * Authorize admin role
 */
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    const response: IApiResponse<null> = {
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN,
    };
    return res.status(HTTP_STATUS.FORBIDDEN).json(response);
  }

  next();
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const response: IApiResponse<null> = {
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      };
      return res.status(HTTP_STATUS.FORBIDDEN).json(response);
    }

    next();
  };
};

export default {
  authenticate,
  authorizeAdmin,
  authorizeRoles,
};
