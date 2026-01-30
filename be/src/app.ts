import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDefinition } from '../swagger/swagger.config';
import { swaggerUiOptions, getSwaggerHtml } from '../swagger/swagger.ui';
import { config } from './config';
import { connectDB } from './config/database';
import requestLogger from './middlewares/requestLogger';
import { errorHandler, notFound } from './middlewares/errorHandler';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import cinemaRoutes from './routes/cinemaRoutes';
import showtimeRoutes from './routes/showtimeRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';

import logger from './utils/logger';

const app: Express = express();

/**
 * Middleware Setup
 */

// CORS Configuration - Allow Swagger UI and other clients
const corsOptions = {
  origin: [...config.corsOrigin.split(','), 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

/**
 * Database Connection
 */
connectDB(config.mongoUri);

/**
 * API Documentation - Modern Dark Theme with Theme Toggle
 */

// Serve static assets for Swagger UI (CSS, JS files)
// Serve local Swagger UI distribution files (scripts/styles)
app.use('/api-docs', express.static(path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist')));
app.use('/api-docs', express.static(path.join(__dirname, '../swagger/styles')));
app.use('/api-docs', express.static(path.join(__dirname, '../swagger')));

// Serve custom Swagger UI with theme toggle
app.get('/api-docs', (req, res) => {
  const specUrl = `${config.nodeEnv === 'production' ? '' : 'http://localhost:' + config.port}/api-docs/openapi.json`;
  res.send(getSwaggerHtml(specUrl));
});

// OpenAPI JSON Spec endpoint
app.get('/api-docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDefinition);
});

// Fallback: Legacy Swagger UI endpoint for compatibility
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDefinition, swaggerUiOptions));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDefinition);
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
const apiPrefix = '/api';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/movies`, movieRoutes);
app.use(`${apiPrefix}/cinemas`, cinemaRoutes);
app.use(`${apiPrefix}/showtimes`, showtimeRoutes);
app.use(`${apiPrefix}/bookings`, bookingRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);

/**
 * Error Handling
 */

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Server Startup
 */
export const startServer = async () => {
  try {
    const port = config.port;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Documentation: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

export default app;
