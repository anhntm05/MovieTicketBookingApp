import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../utils/constants';
import { IApiResponse } from '../types';

/**
 * Validation error handler middleware
 */
export const validationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: IApiResponse<null> = {
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err: any) => err.msg),
    };
    return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
  next();
};

/**
 * Validation rules for User
 */
export const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9\-\+\s]+$/)
    .withMessage('Invalid phone number'),
];

export const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9\-\+\s]+$/)
    .withMessage('Invalid phone number'),
];

export const validateCreateStaff = [
  ...validateUserRegistration,
];

export const validateUserRoleUpdate = [
  body('role')
    .trim()
    .isIn(['customer', 'staff', 'admin'])
    .withMessage('Invalid role'),
];

export const validateUserStatusUpdate = [
  body('status')
    .trim()
    .isIn(['active', 'inactive', 'blocked'])
    .withMessage('Invalid status'),
];

/**
 * Validation rules for Movie
 */
export const validateMovieCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number'),
  body('genre')
    .isArray({ min: 1 })
    .withMessage('Genre must be an array with at least one item'),
  body('rating')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  body('poster')
    .trim()
    .isURL()
    .withMessage('Invalid poster URL'),
  body('trailer')
    .trim()
    .isURL()
    .withMessage('Invalid trailer URL'),
  body('releaseDate')
    .isISO8601()
    .withMessage('Invalid release date'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid movie status'),
];

/**
 * Validation rules for Cinema
 */
export const validateCinemaCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('facilities')
    .optional()
    .isArray()
    .withMessage('Facilities must be an array'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid cinema status'),
];

export const validateScreenCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Screen name is required'),
  body('totalSeats')
    .isInt({ min: 1 })
    .withMessage('Total seats must be a positive integer'),
  body('seatLayout')
    .isObject()
    .withMessage('Seat layout must be an object'),
  body('status')
    .optional()
    .isIn(['active', 'maintenance'])
    .withMessage('Invalid screen status'),
];

export const validateSeatBulkCreate = [
  body('seats')
    .isArray({ min: 1 })
    .withMessage('Seats must be a non-empty array'),
  body('seats.*.row')
    .trim()
    .notEmpty()
    .withMessage('Seat row is required'),
  body('seats.*.number')
    .isInt({ min: 1 })
    .withMessage('Seat number must be a positive integer'),
  body('seats.*.type')
    .isIn(['standard', 'vip', 'premium'])
    .withMessage('Invalid seat type'),
  body('seats.*.status')
    .optional()
    .isIn(['active', 'blocked'])
    .withMessage('Invalid seat status'),
];

/**
 * Validation rules for Showtime
 */
export const validateShowtimeCreate = [
  body('movie')
    .trim()
    .notEmpty()
    .withMessage('Movie is required')
    .isMongoId()
    .withMessage('Invalid movie ID'),
  body('screen')
    .trim()
    .notEmpty()
    .withMessage('Screen is required')
    .isMongoId()
    .withMessage('Invalid screen ID'),
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time'),
  body('endTime')
    .isISO8601()
    .withMessage('Invalid end time'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('status')
    .optional()
    .isIn(['scheduled', 'cancelled', 'completed'])
    .withMessage('Invalid showtime status'),
];

/**
 * Validation rules for Booking
 */
export const validateBookingCreate = [
  body('showtime')
    .trim()
    .notEmpty()
    .withMessage('Showtime is required')
    .isMongoId()
    .withMessage('Invalid showtime ID'),
  body('seats')
    .isArray({ min: 1 })
    .withMessage('Seats must be an array with at least one seat')
    .custom((value) => {
      return value.every((seat: string) => {
        try {
          return /^[0-9a-f]{24}$/i.test(seat);
        } catch {
          return false;
        }
      });
    })
    .withMessage('Invalid seat IDs'),
];

export const validateBookingHold = [
  body('showtime')
    .trim()
    .notEmpty()
    .withMessage('Showtime is required')
    .isMongoId()
    .withMessage('Invalid showtime ID'),
  body('seats')
    .isArray({ min: 1 })
    .withMessage('Seats must be an array with at least one seat')
    .custom((value) => Array.isArray(value) && value.every((seat: string) => /^[0-9a-f]{24}$/i.test(seat)))
    .withMessage('Invalid seat IDs'),
  body('expiryMinutes')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Expiry minutes must be between 1 and 30'),
];

/**
 * Validation rules for Payment
 */
export const validatePaymentProcess = [
  body('booking')
    .trim()
    .notEmpty()
    .withMessage('Booking is required')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('method')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method'),
];

export const validateCommentCreate = [
  body('movie')
    .trim()
    .notEmpty()
    .withMessage('Movie is required')
    .isMongoId()
    .withMessage('Invalid movie ID'),
  body('booking')
    .optional()
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Comment content must be between 3 and 1000 characters'),
];

export const validateCommentReply = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Reply content is required')
    .isLength({ min: 2, max: 1000 })
    .withMessage('Reply content must be between 2 and 1000 characters'),
];

export const validateCommentStatusUpdate = [
  body('status')
    .trim()
    .isIn(['approved', 'hidden'])
    .withMessage('Invalid comment status'),
];

export default {
  validationHandler,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCreateStaff,
  validateUserRoleUpdate,
  validateUserStatusUpdate,
  validateMovieCreate,
  validateCinemaCreate,
  validateScreenCreate,
  validateSeatBulkCreate,
  validateShowtimeCreate,
  validateBookingCreate,
  validateBookingHold,
  validatePaymentProcess,
  validateCommentCreate,
  validateCommentReply,
  validateCommentStatusUpdate,
};
