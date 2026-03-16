import express from 'express';
import BookingController from '../controllers/BookingController';
import { authenticate } from '../middlewares/auth';
import { validateBookingCreate, validateBookingHold, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * Booking Routes - All require authentication
 */

// POST /api/bookings/hold
router.post(
  '/hold',
  authenticate,
  validateBookingHold,
  validationHandler,
  BookingController.holdSeats
);

// POST /api/bookings
router.post(
  '/',
  authenticate,
  validateBookingCreate,
  validationHandler,
  BookingController.createBooking
);

// GET /api/bookings/me
router.get('/me', authenticate, BookingController.getUserBookings);

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, BookingController.cancelBooking);

// GET /api/bookings/:id
router.get('/:id', authenticate, BookingController.getBookingById);

export default router;
