import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
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
import commentRoutes from './routes/commentRoutes';
import adminRoutes from './routes/adminRoutes';

import logger from './utils/logger';
import { initSocket } from './socket';

export const createApp = (): Express => {
  const app: Express = express();

  /**
   * Middleware Setup
   */

  const corsOptions = {
    origin: [...config.corsOrigin.split(','), 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  };
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  const apiPrefix = '/api';

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/movies`, movieRoutes);
  app.use(`${apiPrefix}/cinemas`, cinemaRoutes);
  app.use(`${apiPrefix}/showtimes`, showtimeRoutes);
  app.use(`${apiPrefix}/bookings`, bookingRoutes);
  app.use(`${apiPrefix}/payments`, paymentRoutes);
  app.use(`${apiPrefix}/comments`, commentRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export const startServer = async () => {
  try {
    const port = config.port;
    await connectDB(config.mongoUri);
    const app = createApp();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const app = createApp();

export default app;
