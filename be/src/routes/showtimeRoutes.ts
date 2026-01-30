import express from 'express';
import ShowtimeController from '../controllers/ShowtimeController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { validateShowtimeCreate, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/showtimes:
 *   get:
 *     summary: Get all showtimes
 *     description: Retrieve a list of all showtimes with filtering options
 *     tags: [Showtimes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *         description: Filter by movie ID
 *       - in: query
 *         name: cinemaId
 *         schema:
 *           type: string
 *         description: Filter by cinema ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Showtimes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Showtime'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   movie: "507f1f77bcf86cd799439001"
 *                   screen: "507f1f77bcf86cd799439101"
 *                   startTime: "2024-02-15T14:30:00Z"
 *                 endTime: "2024-02-15T16:22:00Z"
 *                   price: 150000
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new showtime
 *     description: Add a new movie showtime (Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie
 *               - screen
 *               - startTime
 *               - endTime
 *               - price
 *             properties:
 *               movie:
 *                 type: string
 *                 description: Movie ID
 *               screen:
 *                 type: string
 *                 description: Screen ID
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *                 minimum: 0
 *           example:
 *             movie: "507f1f77bcf86cd799439001"
 *             screen: "507f1f77bcf86cd799439101"
 *             startTime: "2024-02-15T14:30:00Z"
 *             endTime: "2024-02-15T16:22:00Z"
 *             price: 150000
 *     responses:
 *       201:
 *         description: Showtime created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 * /api/showtimes/{id}:
 *   get:
 *     summary: Get showtime by ID
 *     description: Retrieve detailed information about a specific showtime
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Showtime retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Showtime' }
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update showtime
 *     description: Update showtime details (Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               price: { type: number }
 *           example:
 *             price: 160000
 *     responses:
 *       200:
 *         description: Showtime updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a showtime
 *     description: Remove a showtime from the system (Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Showtime deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Server error
 *
 * /api/showtimes/{showtimeId}/seats:
 *   get:
 *     summary: Get available seats for a showtime
 *     description: Retrieve the list of available seats for a specific showtime
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available seats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Seat'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439201"
 *                   row: "A"
 *                   number: 1
 *                   type: "standard"
 *                   isOccupied: false
 *                 - _id: "507f1f77bcf86cd799439202"
 *                   row: "A"
 *                   number: 2
 *                   type: "standard"
 *                   isOccupied: false
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Server error
 */

/**
 * Showtime Routes
 */

// GET /api/showtimes
router.get('/', ShowtimeController.getAllShowtimes);

// GET /api/showtimes/:id
router.get('/:id', ShowtimeController.getShowtimeById);

// POST /api/showtimes (Admin only)
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateShowtimeCreate,
  validationHandler,
  ShowtimeController.createShowtime
);

// PUT /api/showtimes/:id (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validateShowtimeCreate,
  validationHandler,
  ShowtimeController.updateShowtime
);

// DELETE /api/showtimes/:id (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, ShowtimeController.deleteShowtime);

// GET /api/showtimes/:showtimeId/seats
router.get('/:showtimeId/seats', ShowtimeController.getAvailableSeats);

export default router;
