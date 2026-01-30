import express from 'express';
import PaymentController from '../controllers/PaymentController';
import { authenticate } from '../middlewares/auth';
import { validatePaymentProcess, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     description: Process payment for a booking using various payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking
 *               - method
 *               - amount
 *             properties:
 *               booking:
 *                 type: string
 *                 description: Booking ID
 *               method:
 *                 type: string
 *                 enum: ["credit_card", "debit_card", "paypal", "bank_transfer"]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               cardNumber:
 *                 type: string
 *                 description: Required for card payments (e.g., credit/debit)
 *               cardholderName:
 *                 type: string
 *                 description: Required for card payments
 *               expiryDate:
 *                 type: string
 *                 pattern: '^\d{2}/\d{2}$'
 *                 description: Expiry date in MM/YY format (for card payments)
 *               cvv:
 *                 type: string
 *                 pattern: '^\d{3,4}$'
 *                 description: CVV/CVC code (for card payments)
 *           example:
 *             booking: "507f1f77bcf86cd799439301"
 *             method: "credit_card"
 *             amount: 300000
 *             cardNumber: "4111111111111111"
 *             cardholderName: "John Doe"
 *             expiryDate: "12/25"
 *             cvv: "123"
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *             example:
 *               success: true
 *               message: "Payment processed successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439401"
 *                 booking: "507f1f77bcf86cd799439301"
 *                 amount: 300000
 *                 method: "credit_card"
 *                 status: "completed"
 *                 transactionId: "TXN-2024-001234"
 *                 createdAt: "2024-02-15T10:35:00Z"
 *       400:
 *         description: Validation error or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               success: false
 *               message: "Payment failed"
 *               errors: ["Invalid card number"]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error or payment gateway error
 *
 * /api/payments/{bookingId}:
 *   get:
 *     summary: Get payment by booking ID
 *     description: Retrieve payment information for a specific booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439401"
 *                 booking: "507f1f77bcf86cd799439301"
 *                 amount: 300000
 *                 method: "credit_card"
 *                 status: "completed"
 *                 transactionId: "TXN-2024-001234"
 *                 createdAt: "2024-02-15T10:35:00Z"
 *                 updatedAt: "2024-02-15T10:35:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only view own payment information
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

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
