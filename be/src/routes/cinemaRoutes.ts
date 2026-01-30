import express from 'express';
import CinemaController from '../controllers/CinemaController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { validateCinemaCreate, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/cinemas:
 *   get:
 *     summary: Get all cinemas
 *     description: Retrieve a list of all available cinemas with their details
 *     tags: [Cinemas]
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
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location city
 *     responses:
 *       200:
 *         description: Cinemas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cinema'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   name: "CGV Hanoi"
 *                   location: "Hanoi"
 *                   address: "123 Tran Hung Dao, Hanoi"
 *                   facilities: ["IMAX", "4DX", "Premium Seats"]
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   name: "CGV Ho Chi Minh"
 *                   location: "Ho Chi Minh City"
 *                   address: "456 Nguyen Hue, Ho Chi Minh City"
 *                   facilities: ["IMAX", "Standard"]
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new cinema
 *     description: Add a new cinema to the system (Admin only)
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *               location:
 *                 type: string
 *               address:
 *                 type: string
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             name: "CGV Central"
 *             location: "Da Nang"
 *             address: "789 Han Mac Tu, Da Nang"
 *             facilities: ["IMAX", "4DX", "Premium", "Standard"]
 *     responses:
 *       201:
 *         description: Cinema created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Server error
 *
 * /api/cinemas/{id}:
 *   get:
 *     summary: Get cinema by ID
 *     description: Retrieve detailed information about a specific cinema
 *     tags: [Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Cinema' }
 *       404:
 *         description: Cinema not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update cinema information
 *     description: Update cinema details (Admin only)
 *     tags: [Cinemas]
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
 *               name: { type: string }
 *               location: { type: string }
 *               address: { type: string }
 *               facilities: { type: array, items: { type: string } }
 *           example:
 *             facilities: ["IMAX", "4DX", "Premium", "Standard", "Luxury"]
 *     responses:
 *       200:
 *         description: Cinema updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Cinema not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a cinema
 *     description: Remove a cinema from the system (Admin only)
 *     tags: [Cinemas]
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
 *         description: Cinema deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Cinema not found
 *       500:
 *         description: Server error
 */

/**
 * Cinema Routes
 */

// GET /api/cinemas
router.get('/', CinemaController.getAllCinemas);

// GET /api/cinemas/:id
router.get('/:id', CinemaController.getCinemaById);

// POST /api/cinemas (Admin only)
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateCinemaCreate,
  validationHandler,
  CinemaController.createCinema
);

// PUT /api/cinemas/:id (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validateCinemaCreate,
  validationHandler,
  CinemaController.updateCinema
);

// DELETE /api/cinemas/:id (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, CinemaController.deleteCinema);

export default router;
