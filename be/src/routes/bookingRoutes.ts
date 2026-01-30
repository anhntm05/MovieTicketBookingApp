import express from 'express';
import BookingController from '../controllers/BookingController';
import { authenticate } from '../middlewares/auth';
import { validateBookingCreate, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new movie ticket booking (requires authentication)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - showtime
 *               - seats
 *             properties:
 *               showtime:
 *                 type: string
 *                 description: Showtime ID
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of seat IDs
 *           example:
 *             showtime: "507f1f77bcf86cd799439011"
 *             seats:
 *               - "507f1f77bcf86cd799439201"
 *               - "507f1f77bcf86cd799439202"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Booking' }
 *             example:
 *               success: true
 *               message: "Booking created successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439301"
 *                 user: "507f1f77bcf86cd799439011"
 *                 showtime: "507f1f77bcf86cd799439011"
 *                 seats: ["507f1f77bcf86cd799439201", "507f1f77bcf86cd799439202"]
 *                 totalPrice: 300000
 *                 status: "pending"
 *                 bookingDate: "2024-02-15T10:30:00Z"
 *       400:
 *         description: Validation error or seats unavailable
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     description: Retrieve detailed information about a specific booking (user must own the booking)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Booking' }
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439301"
 *                 user: "507f1f77bcf86cd799439011"
 *                 showtime: "507f1f77bcf86cd799439011"
 *                 seats: ["507f1f77bcf86cd799439201", "507f1f77bcf86cd799439202"]
 *                 totalPrice: 300000
 *                 status: "confirmed"
 *                 bookingDate: "2024-02-15T10:30:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only view own bookings
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 * /api/bookings/user/me:
 *   get:
 *     summary: Get my bookings
 *     description: Retrieve all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["pending", "confirmed", "cancelled"]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     description: Cancel an existing booking (user must own the booking, status must be pending or confirmed)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Booking' }
 *             example:
 *               success: true
 *               message: "Booking cancelled successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439301"
 *                 status: "cancelled"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only cancel own bookings
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 * /api/bookings/seats/hold:
 *   post:
 *     summary: Hold seats temporarily
 *     description: Hold seats for a short duration to prevent other users from booking (requires authentication)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - showtime
 *               - seats
 *             properties:
 *               showtime:
 *                 type: string
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             showtime: "507f1f77bcf86cd799439011"
 *             seats: ["507f1f77bcf86cd799439201"]
 *     responses:
 *       200:
 *         description: Seats held successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: true
 *               message: "Seats held for 10 minutes"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * Booking Routes - All require authentication
 */

// POST /api/bookings
router.post(
  '/',
  authenticate,
  validateBookingCreate,
  validationHandler,
  BookingController.createBooking
);

// GET /api/bookings/:id
router.get('/:id', authenticate, BookingController.getBookingById);

// GET /api/bookings/user/me (get user's bookings)
router.get('/user/me', authenticate, BookingController.getUserBookings);

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, BookingController.cancelBooking);

// POST /api/seats/hold
router.post('/seats/hold', authenticate, BookingController.holdSeats);

export default router;
