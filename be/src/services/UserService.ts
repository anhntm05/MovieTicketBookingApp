import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { generateToken } from '../utils/jwt';
import {
  ICreateStaffRequest,
  IUser,
  IUserAnalyticsPayload,
  IUserAnalyticsSelectedUser,
  IUserRequest,
  UserRole,
  UserStatus,
} from '../types';
import { ERROR_MESSAGES, PAGINATION, PAYMENT_STATUS, USER_ROLES, USER_STATUS } from '../utils/constants';

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

  static async getUserAnalytics(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters?: { role?: UserRole; status?: UserStatus; search?: string; userId?: string }
  ): Promise<IUserAnalyticsPayload> {
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

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setMilliseconds(previousMonthEnd.getMilliseconds() - 1);
    const skip = (page - 1) * limit;

    const [users, total, totalUsers, activeUsers, currentMonthUsers, previousMonthUsers, completedPurchaserGroups] =
      await Promise.all([
        User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(query),
        User.countDocuments(),
        User.countDocuments({ status: USER_STATUS.ACTIVE }),
        User.countDocuments({ createdAt: { $gte: currentMonthStart, $lte: now } }),
        User.countDocuments({ createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
        Payment.aggregate([
          { $match: { status: PAYMENT_STATUS.COMPLETED } },
          {
            $lookup: {
              from: 'bookings',
              localField: 'booking',
              foreignField: '_id',
              as: 'booking',
            },
          },
          { $unwind: '$booking' },
          { $group: { _id: '$booking.user' } },
          { $count: 'total' },
        ]),
      ]);

    const directory = users.map((user) => ({
      id: user._id!.toString(),
      fullName: user.name,
      email: user.email,
      role: user.role.toUpperCase() as Uppercase<UserRole>,
      status: user.status.toUpperCase() as Uppercase<UserStatus>,
    }));

    const selectedUserId = filters?.userId || directory[0]?.id;
    const selectedUser = selectedUserId ? await this.getUserAnalyticsDetail(selectedUserId) : undefined;
    const totalPurchasers = completedPurchaserGroups[0]?.total || 0;

    return {
      summary: {
        totalUsers,
        totalUsersChange: this.calculateGrowth(currentMonthUsers, previousMonthUsers),
        activeUsers,
        activeUserRate: totalUsers ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0,
        totalPurchasers,
        purchaserRate: totalUsers ? Number(((totalPurchasers / totalUsers) * 100).toFixed(1)) : 0,
        userGrowthRate: this.calculateGrowth(currentMonthUsers, previousMonthUsers),
      },
      directory,
      selectedUser,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private static async getUserAnalyticsDetail(userId: string): Promise<IUserAnalyticsSelectedUser | undefined> {
    const user = await User.findById(userId);
    if (!user) {
      return undefined;
    }

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title' },
          {
            path: 'screen',
            select: 'name cinema',
            populate: { path: 'cinema', select: 'name' },
          },
        ],
      })
      .lean();

    const bookingIds = bookings.map((booking: any) => booking._id);
    const payments = bookingIds.length
      ? await Payment.find({
          booking: { $in: bookingIds },
          status: PAYMENT_STATUS.COMPLETED,
        })
          .sort({ paidAt: -1 })
          .lean()
      : [];

    const bookingMap = new Map(bookings.map((booking: any) => [booking._id.toString(), booking]));
    const totalSpent = payments.reduce((sum, payment: any) => sum + Number(payment.amount || 0), 0);
    const paidBookingIds = new Set(payments.map((payment: any) => payment.booking.toString()));
    const tickets = bookings
      .filter((booking: any) => paidBookingIds.has(booking._id.toString()) || booking.paymentStatus === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, booking: any) => sum + (Array.isArray(booking.seats) ? booking.seats.length : 0), 0);

    const cinemaCounts = new Map<string, number>();
    for (const booking of bookings as any[]) {
      const cinemaName = booking.showtime?.screen?.cinema?.name;
      if (!cinemaName) continue;
      cinemaCounts.set(cinemaName, (cinemaCounts.get(cinemaName) || 0) + 1);
    }

    const favoriteCinema =
      Array.from(cinemaCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No favorite cinema yet';

    const recentPurchases = payments.slice(0, 5).map((payment: any) => {
      const booking = bookingMap.get(payment.booking.toString());

      return {
        id: payment._id!.toString(),
        title: booking?.showtime?.movie?.title || 'Untitled movie',
        date: payment.paidAt || payment.createdAt || new Date(),
        price: Number(payment.amount || 0),
      };
    });

    return {
      id: user._id!.toString(),
      fullName: user.name,
      email: user.email,
      role: user.role.toUpperCase() as Uppercase<UserRole>,
      status: user.status.toUpperCase() as Uppercase<UserStatus>,
      totalSpent,
      tickets,
      favoriteCinema,
      recentPurchases,
    };
  }

  private static calculateGrowth(current: number, previous: number) {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
}

export default UserService;
