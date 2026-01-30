import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../swagger/swagger';
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
 * API Documentation
 */
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    deepLinking: true,
    presets: [
      require('swagger-ui-express').presets.apis,
      require('swagger-ui-express').SwaggerUIBundle.presets.definitions,
    ],
    layout: 'BaseLayout',
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'],
    requestInterceptor: (request: any) => {
      return request;
    },
    responseInterceptor: (response: any) => {
      return response;
    },
  },
  customCss: `
    .topbar { display: none }
    .swagger-ui .btn { background-color: #1890ff; color: white; }
    .swagger-ui .btn.authorize { background-color: #52c41a; }
    .swagger-ui .model { background-color: #fafafa; }
    .swagger-ui .model-example { background-color: #f5f5f5; }
  `,
  customSiteTitle: 'Movie Ticket Booking API - Interactive Documentation',
  customfavIcon: 'https://favicon.io/emoji-favicons/movie-camera/',
  swaggerUIBundleConfig: {
    presets: ['intl'],
  },
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
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
