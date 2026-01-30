/**
 * Constants for the application
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
};

export const SEAT_TYPES = {
  STANDARD: 'standard',
  VIP: 'vip',
  PREMIUM: 'premium',
};

export const SEAT_HOLD_EXPIRY_MINUTES = 15; // Seats are held for 15 minutes

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  MOVIE_NOT_FOUND: 'Movie not found',
  CINEMA_NOT_FOUND: 'Cinema not found',
  SHOWTIME_NOT_FOUND: 'Showtime not found',
  BOOKING_NOT_FOUND: 'Booking not found',
  SEAT_NOT_FOUND: 'Seat not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  SEATS_NOT_AVAILABLE: 'One or more selected seats are not available',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INTERNAL_ERROR: 'Internal server error',
};

export const SUCCESS_MESSAGES = {
  REGISTERED: 'User registered successfully',
  LOGGED_IN: 'User logged in successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  MOVIE_CREATED: 'Movie created successfully',
  MOVIE_UPDATED: 'Movie updated successfully',
  MOVIE_DELETED: 'Movie deleted successfully',
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
};
