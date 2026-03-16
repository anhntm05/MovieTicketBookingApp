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
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
};

export const MOVIE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const CINEMA_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const SCREEN_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
};

export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const COMMENT_STATUS = {
  APPROVED: 'approved',
  HIDDEN: 'hidden',
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

export const SEAT_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};

export const SHOWTIME_STATUS = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const SHOWTIME_SEAT_STATUS = {
  AVAILABLE: 'available',
  HELD: 'held',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
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
  SCREEN_NOT_FOUND: 'Screen not found',
  SHOWTIME_NOT_FOUND: 'Showtime not found',
  BOOKING_NOT_FOUND: 'Booking not found',
  SEAT_NOT_FOUND: 'Seat not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  COMMENT_NOT_FOUND: 'Comment not found',
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
  STAFF_CREATED: 'Staff account created successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  MOVIE_CREATED: 'Movie created successfully',
  MOVIE_UPDATED: 'Movie updated successfully',
  MOVIE_DELETED: 'Movie deleted successfully',
  SCREEN_CREATED: 'Screen created successfully',
  SEATS_CREATED: 'Seats created successfully',
  COMMENT_CREATED: 'Comment created successfully',
  COMMENT_REPLIED: 'Comment replied successfully',
  COMMENT_STATUS_UPDATED: 'Comment status updated successfully',
  BOOKING_CREATED: 'Booking created successfully',
  SEATS_HELD: 'Seats held successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
};
