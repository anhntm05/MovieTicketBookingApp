import express from 'express';
import AuthController from '../controllers/AuthController';
import { validateUserRegistration, validateUserLogin, validationHandler } from '../middlewares/validators';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Create a new user account with email and password.
 *       
 *       **Tips for Swagger Testing:**
 *       1. Click "Try it out" button
 *       2. Fill in the example values in the Request body
 *       3. Click "Execute" button
 *       4. You will receive a JWT token in the response
 *       5. Copy the token from the response
 *       6. Click the "Authorize" button at the top right
 *       7. Paste the token in format: `Bearer <your-token>`
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Must be unique and valid email format
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password must be at least 6 characters long
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{9,}$'
 *                 description: Phone number (at least 9 digits, can include + prefix)
 *           example:
 *             name: John Doe
 *             email: john.doe@example.com
 *             password: SecurePass123
 *             phone: "+1234567890"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: User registered successfully
 *               data:
 *                 user:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   name: John Doe
 *                   email: john.doe@example.com
 *                   phone: "+1234567890"
 *                   role: user
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTcwNTE0NTAwMH0.Z8W..."
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email is already registered
 *               errors: ["Email must be unique"]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: |
 *       Authenticate user with email and password to receive JWT token.
 *       
 *       **Testing the Token:**
 *       1. Click "Try it out"
 *       2. Enter your credentials
 *       3. Click "Execute"
 *       4. Copy the token from the response
 *       5. Use the "Authorize" button (top right) to add the token
 *       6. All authenticated endpoints will automatically include this token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password
 *           example:
 *             email: john.doe@example.com
 *             password: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 user:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   name: John Doe
 *                   email: john.doe@example.com
 *                   phone: "+1234567890"
 *                   role: user
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTcwNTE0NTAwMH0.Z8W..."
 *       401:
 *         description: Invalid credentials (wrong email or password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors: ["Email is required", "Password is required"]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Internal server error
 */

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
