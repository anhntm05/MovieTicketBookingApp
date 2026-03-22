import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { Comment } from '../models/Comment';
import { generateToken } from '../utils/jwt';
import {
  ICreateStaffRequest,
  IUserDetailPayload,
  IUser,
  IUserAnalyticsPayload,
  IUserRequest,
  UserRole,
  UserStatus,
} from '../types';
import {
  BOOKING_STATUS,
  COMMENT_STATUS,
  ERROR_MESSAGES,
  PAGINATION,
  PAYMENT_STATUS,
  USER_ROLES,
  USER_STATUS,
} from '../utils/constants';

/**
 * User Service - Handles user related business logic
 */

export class UserService {

  /**
   * Register a new user
   */
  static async register(userData: IUserRequest): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error: any = new Error(ERROR_MESSAGES.USER_EXISTS);
      error.statusCode = 409;
      throw error;
    }

    const user = new User({
      ...userData,
      role: USER_ROLES.CUSTOMER,
      status: USER_STATUS.ACTIVE,
    });
    await user.save();

    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

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

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      const error: any = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;

    return {
      user: userWithoutPassword as Omit<IUser, 'password'>,
      token,
    };
  }

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
    filters?: { role?: UserRole; status?: UserStatus; search?: string }
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserDetail(userId: string): Promise<IUserDetailPayload> {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
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
      .sort({ createdAt: -1 })
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
    const comments = await Comment.find({
      user: userId,
      status: COMMENT_STATUS.APPROVED,
    })
      .populate('movie', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = payments.reduce((sum, payment: any) => sum + Number(payment.amount || 0), 0);
    const paidBookingIds = new Set(payments.map((payment: any) => payment.booking.toString()));
    const paidBookings = bookings.filter(
      (booking: any) =>
        paidBookingIds.has(booking._id.toString()) || booking.paymentStatus === PAYMENT_STATUS.COMPLETED
    );
    const tickets = paidBookings.reduce(
      (sum, booking: any) => sum + (Array.isArray(booking.seats) ? booking.seats.length : 0),
      0
    );
    const totalBookings = bookings.length;
    const cancelledBookings = bookings.filter((booking: any) => booking.status === BOOKING_STATUS.CANCELLED).length;
    const cancellationRate = totalBookings ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1)) : 0;
    const commentCount = comments.length;
    const latestFeedback = comments[0]
      ? {
          id: comments[0]._id!.toString(),
          movieTitle: comments[0].movie && typeof comments[0].movie === 'object' ? (comments[0].movie as any).title || 'Untitled movie' : 'Untitled movie',
          rating: Number(comments[0].rating || 0),
          content: comments[0].content || '',
          createdAt: comments[0].createdAt || new Date(),
        }
      : undefined;
    const tier = this.getTierMeta(totalSpent, tickets);
    const recentBookings = bookings.slice(0, 5).map((booking: any) => ({
      id: booking._id!.toString(),
      title: booking.showtime?.movie?.title || 'Untitled movie',
      date: booking.showtime?.startTime || booking.createdAt || new Date(),
      hall: booking.showtime?.screen?.name || 'Screen TBD',
      status: String(booking.status || BOOKING_STATUS.PENDING_PAYMENT).toUpperCase() as
        | 'CONFIRMED'
        | 'CANCELLED'
        | 'PENDING_PAYMENT'
        | 'EXPIRED',
      posterUrl: booking.showtime?.movie?.poster || undefined,
    }));
    const spendingTrend = this.buildSpendingTrend(payments);
    const monthsCovered = Math.max(1, spendingTrend.length);
    const averageTicketValue = tickets ? Number((totalSpent / tickets).toFixed(2)) : 0;
    const frequencyPerMonth = Number((paidBookings.length / monthsCovered).toFixed(1));

    return {
      user: {
        id: user._id!.toString(),
        fullName: user.name,
        email: user.email,
        role: user.role.toUpperCase() as Uppercase<UserRole>,
        status: user.status.toUpperCase() as Uppercase<UserStatus>,
        memberSince: user.createdAt || new Date(),
        tierLabel: tier.badgeLabel,
      },
      stats: {
        totalSpent,
        totalBookings,
        cancellationRate,
        commentCount,
      },
      recentBookings,
      latestFeedback,
      spendingTrend,
      loyalty: {
        tierLabel: tier.progressLabel,
        progressPercent: tier.progressPercent,
        frequencyPerMonth,
        averageTicketValue,
      },
    };
  }

  private static calculateGrowth(current: number, previous: number) {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private static buildSpendingTrend(payments: any[]) {
    const now = new Date();
    const points = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        amount: 0,
      };
    });
    const pointMap = new Map(points.map((point) => [point.key, point]));

    for (const payment of payments) {
      const paidAt = new Date(payment.paidAt || payment.createdAt || Date.now());
      const key = `${paidAt.getFullYear()}-${paidAt.getMonth()}`;
      const point = pointMap.get(key);
      if (!point) continue;
      point.amount += Number(payment.amount || 0);
    }

    return points.map(({ label, amount }) => ({ label, amount }));
  }

  private static getTierMeta(totalSpent: number, tickets: number) {
    const score = totalSpent + tickets * 25;

    if (score >= 2500) {
      return { badgeLabel: 'VIP MEMBER', progressLabel: 'Platinum Noir', progressPercent: 100 };
    }
    if (score >= 1600) {
      return { badgeLabel: 'GOLD MEMBER', progressLabel: 'Gold Elite', progressPercent: 85 };
    }
    if (score >= 800) {
      return { badgeLabel: 'SILVER MEMBER', progressLabel: 'Silver Select', progressPercent: 62 };
    }

    return { badgeLabel: 'RISING MEMBER', progressLabel: 'Bronze Circle', progressPercent: 34 };
  }
}

export default UserService;

