import express from 'express';
import AuthController from '../controllers/AuthController';
import { validateUserRegistration, validateUserLogin, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * Authentication Routes
 */

// POST /api/auth/register
router.post(
  '/register',
  validateUserRegistration,
  validationHandler,
  AuthController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validateUserLogin,
  validationHandler,
  AuthController.login
);

export default router;
