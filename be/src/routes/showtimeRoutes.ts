import express from 'express';
import ShowtimeController from '../controllers/ShowtimeController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validateShowtimeCreate, validationHandler } from '../middlewares/validators';
import { USER_ROLES } from '../utils/constants';

const router = express.Router();

/**
 * Showtime Routes
 */

// GET /api/showtimes
router.get('/', ShowtimeController.getAllShowtimes);

// GET /api/showtimes/:id
router.get('/:id', ShowtimeController.getShowtimeById);

// POST /api/showtimes (Staff/Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  validateShowtimeCreate,
  validationHandler,
  ShowtimeController.createShowtime
);

// PUT /api/showtimes/:id (Staff/Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  validateShowtimeCreate,
  validationHandler,
  ShowtimeController.updateShowtime
);

// DELETE /api/showtimes/:id (Staff/Admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  ShowtimeController.deleteShowtime
);

// GET /api/showtimes/:showtimeId/seats
router.get('/:showtimeId/seats', ShowtimeController.getAvailableSeats);

export default router;
