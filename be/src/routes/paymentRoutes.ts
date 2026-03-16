import express from 'express';
import PaymentController from '../controllers/PaymentController';
import { authenticate } from '../middlewares/auth';
import { validatePaymentProcess, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * Payment Routes - All require authentication
 */

// POST /api/payments/process
router.post(
  '/process',
  authenticate,
  validatePaymentProcess,
  validationHandler,
  PaymentController.processPayment
);

// GET /api/payments/:bookingId
router.get('/:bookingId', authenticate, PaymentController.getPaymentByBookingId);

export default router;
