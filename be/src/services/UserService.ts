import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { ICreateStaffRequest, IUser, IUserRequest, UserRole, UserStatus } from '../types';
import { ERROR_MESSAGES, PAGINATION, USER_ROLES, USER_STATUS } from '../utils/constants';

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
    const user = new User({
      ...userData,
      role: USER_ROLES.CUSTOMER,
      status: USER_STATUS.ACTIVE,
    });
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

    if (user.status !== USER_STATUS.ACTIVE) {
      const error: any = new Error(ERROR_MESSAGES.UNAUTHORIZED);
      error.statusCode = 403;
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

  static async createStaff(
    userData: ICreateStaffRequest
  ): Promise<Omit<IUser, 'password'>> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error: any = new Error(ERROR_MESSAGES.USER_EXISTS);
      error.statusCode = 409;
      throw error;
    }

    const user = new User({
      ...userData,
      role: USER_ROLES.STAFF,
      status: USER_STATUS.ACTIVE,
    });
    await user.save();

    const result = user.toObject();
    delete (result as any).password;
    return result as Omit<IUser, 'password'>;
  }

  static async listUsers(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: { role?: UserRole; status?: UserStatus; search?: string }
  ): Promise<{ users: Array<Omit<IUser, 'password'>>; total: number; page: number; pages: number }> {
    const query: any = {};

    if (filters?.role) query.role = filters.role;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return {
      users: users.map((user) => {
        const result = user.toObject();
        delete (result as any).password;
        return result as Omit<IUser, 'password'>;
      }),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<Omit<IUser, 'password'>> {
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const result = user.toObject();
    delete (result as any).password;
    return result as Omit<IUser, 'password'>;
  }

  static async updateUserStatus(userId: string, status: UserStatus): Promise<Omit<IUser, 'password'>> {
    const user = await User.findByIdAndUpdate(userId, { status }, { new: true, runValidators: true });
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const result = user.toObject();
    delete (result as any).password;
    return result as Omit<IUser, 'password'>;
  }
}

export default UserService;
