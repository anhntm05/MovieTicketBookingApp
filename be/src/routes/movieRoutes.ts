import express from 'express';
import MovieController from '../controllers/MovieController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { validateMovieCreate, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     description: |
 *       Retrieve a list of all available movies with optional filtering and pagination.
 *       
 *       **Usage Tips:**
 *       - Use `page` and `limit` for pagination
 *       - Use `genre` to filter by movie type (e.g., "Action", "Drama", "Sci-Fi")
 *       - Use `search` to find movies by title
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination (starts at 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of movies per page
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (e.g., "Action", "Drama", "Sci-Fi")
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by movie title (partial match)
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: number }
 *                     limit: { type: number }
 *                     total: { type: number }
 *                     pages: { type: number }
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   title: "Avatar 2"
 *                   description: "Epic sci-fi adventure sequel with groundbreaking visuals"
 *                   genre: ["Action", "Sci-Fi"]
 *                   duration: 192
 *                   rating: 8.5
 *                   releaseDate: "2022-12-16"
 *                   poster: "https://example.com/avatar2.jpg"
 *                   trailer: "https://youtube.com/watch?v=example"
 *                   createdAt: "2024-01-10T08:00:00Z"
 *                   updatedAt: "2024-01-10T08:00:00Z"
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   title: "Oppenheimer"
 *                   description: "Biography of J. Robert Oppenheimer and the Manhattan Project"
 *                   genre: ["Drama", "History"]
 *                   duration: 180
 *                   rating: 8.6
 *                   releaseDate: "2023-07-21"
 *                   poster: "https://example.com/oppenheimer.jpg"
 *                   trailer: "https://youtube.com/watch?v=example"
 *                   createdAt: "2024-01-10T08:00:00Z"
 *                   updatedAt: "2024-01-10T08:00:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 25
 *                 pages: 3
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new movie
 *     description: |
 *       Add a new movie to the system. 
 *       **Admin only endpoint** - requires bearer token from authenticated admin account.
 *       
 *       **How to test:**
 *       1. First, register/login as admin using /api/auth endpoints
 *       2. Copy the JWT token from the response
 *       3. Click "Authorize" button and paste: `Bearer <your-token>`
 *       4. Click "Try it out" on this endpoint
 *       5. Fill in the movie details
 *       6. Click "Execute"
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovieRequest'
 *           example:
 *             title: "Inception"
 *             description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea"
 *             duration: 148
 *             genre: ["Sci-Fi", "Thriller", "Action"]
 *             rating: 8.8
 *             poster: "https://example.com/inception.jpg"
 *             trailer: "https://youtube.com/watch?v=YoHD2hxoogg"
 *             releaseDate: "2010-07-16"
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Movie' }
 *             example:
 *               success: true
 *               message: "Movie created successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439013"
 *                 title: "Inception"
 *                 description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea"
 *                 duration: 148
 *                 genre: ["Sci-Fi", "Thriller", "Action"]
 *                 rating: 8.8
 *                 poster: "https://example.com/inception.jpg"
 *                 trailer: "https://youtube.com/watch?v=YoHD2hxoogg"
 *                 releaseDate: "2010-07-16"
 *                 createdAt: "2024-01-20T12:00:00Z"
 *                 updatedAt: "2024-01-20T12:00:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Admin access required"
 *       500:
 *         description: Server error
 *
 * /api/movies/{id}:
 *   get:
 *     summary: Get a movie by ID
 *     description: Retrieve detailed information about a specific movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID (MongoDB ObjectId format)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Movie retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Movie' }
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 title: "Avatar 2"
 *                 description: "Epic sci-fi adventure sequel"
 *                 genre: ["Action", "Sci-Fi"]
 *                 duration: 192
 *                 rating: 8.5
 *                 releaseDate: "2022-12-16"
 *                 poster: "https://example.com/avatar2.jpg"
 *                 trailer: "https://youtube.com/watch?v=example"
 *                 createdAt: "2024-01-10T08:00:00Z"
 *                 updatedAt: "2024-01-10T08:00:00Z"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Movie not found"
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a movie
 *     description: Update movie information (Admin only)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovieRequest'
 *           example:
 *             title: "Avatar 3"
 *             description: "The next chapter in the Avatar saga"
 *             duration: 200
 *             genre: ["Action", "Sci-Fi"]
 *             rating: 8.9
 *             poster: "https://example.com/avatar3.jpg"
 *             trailer: "https://youtube.com/watch?v=example"
 *             releaseDate: "2024-12-20"
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Movie' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a movie
 *     description: Remove a movie from the system (Admin only)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example:
 *               success: true
 *               message: "Movie deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

/**
 * Movie Routes
 */

// GET /api/movies
router.get('/', MovieController.getAllMovies);

// GET /api/movies/:id
router.get('/:id', MovieController.getMovieById);

// POST /api/movies (Admin only)
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateMovieCreate,
  validationHandler,
  MovieController.createMovie
);

// PUT /api/movies/:id (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validateMovieCreate,
  validationHandler,
  MovieController.updateMovie
);

// DELETE /api/movies/:id (Admin only)
router.delete('/:id', authenticate, authorizeAdmin, MovieController.deleteMovie);

export default router;
