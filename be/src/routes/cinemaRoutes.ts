import express from 'express';
import CinemaController from '../controllers/CinemaController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { validateCinemaCreate, validationHandler } from '../middlewares/validators';

const router = express.Router();

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
