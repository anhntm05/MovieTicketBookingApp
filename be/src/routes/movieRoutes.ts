import express from 'express';
import MovieController from '../controllers/MovieController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validateMovieCreate, validationHandler } from '../middlewares/validators';
import { USER_ROLES } from '../utils/constants';

const router = express.Router();

/**
 * Movie Routes
 */

// GET /api/movies
router.get('/', MovieController.getAllMovies);

// GET /api/movies/:id
router.get('/:id', MovieController.getMovieById);

// POST /api/movies (Staff/Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  validateMovieCreate,
  validationHandler,
  MovieController.createMovie
);

// PUT /api/movies/:id (Staff/Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  validateMovieCreate,
  validationHandler,
  MovieController.updateMovie
);

// DELETE /api/movies/:id (Staff/Admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  MovieController.deleteMovie
);

export default router;
