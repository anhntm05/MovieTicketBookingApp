import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';
const baseEnvPath = path.resolve(process.cwd(), '.env');
const envSpecificPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);

if (fs.existsSync(baseEnvPath)) {
  dotenv.config({ path: baseEnvPath });
}

if (fs.existsSync(envSpecificPath)) {
  dotenv.config({ path: envSpecificPath, override: true });
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-ticket-booking',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001',
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export default config;
