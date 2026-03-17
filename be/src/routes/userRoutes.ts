import express from 'express';
import UserController from '../controllers/UserController';
import { authenticate } from '../middlewares/auth';
import { validateUserUpdate, validationHandler } from '../middlewares/validators';

const router = express.Router();



// GET /api/users/profile
router.get('/profile', authenticate, UserController.getProfile);

// PUT /api/users/profile
router.put(
  '/profile',
  authenticate,
  validateUserUpdate,
  validationHandler,
  UserController.updateProfile
);

export default router;
