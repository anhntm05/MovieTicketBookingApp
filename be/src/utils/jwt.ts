import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { IJWTPayload } from '../types';

/**
 * Generate JWT token
 */
export const generateToken = (payload: Omit<IJWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiry as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwtSecret as string, options);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): IJWTPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret as string) as IJWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token: string): IJWTPayload | null => {
  try {
    return jwt.decode(token) as IJWTPayload | null;
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
};
