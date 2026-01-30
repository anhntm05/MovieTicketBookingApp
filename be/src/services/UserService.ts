import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { IUser, IUserRequest } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

/**
 * User Service - Handles user related business logic
 */

export class UserService {
  /**
   * Register a new user
   */
  static async register(userData: IUserRequest): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error: any = new Error(ERROR_MESSAGES.USER_EXISTS);
      error.statusCode = 409;
      throw error;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;

    return {
      user: userWithoutPassword as Omit<IUser, 'password'>,
      token,
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      const error: any = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    // Generate token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;

    return {
      user: userWithoutPassword as Omit<IUser, 'password'>,
      token,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<Omit<IUser, 'password'>> {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;
    return userWithoutPassword as Omit<IUser, 'password'>;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updateData: Partial<IUserRequest>
  ): Promise<Omit<IUser, 'password'>> {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;
    return userWithoutPassword as Omit<IUser, 'password'>;
  }
}

export default UserService;
