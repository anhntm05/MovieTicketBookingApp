import { startServer } from './app';
import logger from './utils/logger';

/**
 * Application Entry Point
 */

async function main() {
  try {
    await startServer();
  } catch (error) {
    logger.error('Application error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
