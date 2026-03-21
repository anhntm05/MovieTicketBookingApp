import { Booking } from '../models/Booking';
import { Cinema } from '../models/Cinema';
import { Comment } from '../models/Comment';
import { Movie } from '../models/Movie';
import { Payment } from '../models/Payment';
import { Showtime } from '../models/Showtime';
import { User } from '../models/User';
import { BOOKING_STATUS, PAYMENT_STATUS, USER_ROLES } from '../utils/constants';

export class AdminService {
  static async getDashboard(startDate?: Date, endDate?: Date) {
    const bookingDateQuery = this.buildDateQuery(startDate, endDate);
    const paymentDateQuery = this.buildDateQuery(startDate, endDate, 'paidAt');

    const [usersByRole, movies, cinemas, showtimes, comments, bookings, payments, topMovies, occupancyStats, totalSeatCapacity] =
      await Promise.all([
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Movie.countDocuments(),
        Cinema.countDocuments(),
        Showtime.countDocuments(),
        Comment.countDocuments(this.buildDateQuery(startDate, endDate)),
        Booking.aggregate([
          { $match: bookingDateQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Payment.aggregate([
          { $match: { ...paymentDateQuery, status: PAYMENT_STATUS.COMPLETED } },
          {
            $group: {
              _id: '$status',
              totalRevenue: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        Booking.aggregate([
          { $match: bookingDateQuery },
          {
            $lookup: {
              from: 'showtimes',
              localField: 'showtime',
              foreignField: '_id',
              as: 'showtime',
            },
          },
          { $unwind: '$showtime' },
          {
            $lookup: {
              from: 'movies',
              localField: 'showtime.movie',
              foreignField: '_id',
              as: 'movie',
            },
          },
          { $unwind: '$movie' },
          {
            $group: {
              _id: '$movie._id',
              title: { $first: '$movie.title' },
              poster: { $first: '$movie.poster' },
              genre: { $first: '$movie.genre' },
              bookings: { $sum: 1 },
              revenue: { $sum: '$totalPrice' },
            },
          },
          { $sort: { bookings: -1, revenue: -1 } },
          { $limit: 5 },
        ]),
        Booking.aggregate([
          { $match: { ...bookingDateQuery, status: BOOKING_STATUS.CONFIRMED } },
          {
            $group: {
              _id: null,
              bookedSeats: { $sum: { $size: '$seats' } },
            },
          },
        ]),
        Showtime.aggregate([
          { $match: this.buildDateQuery(startDate, endDate, 'startTime') },
          {
            $lookup: {
              from: 'screens',
              localField: 'screen',
              foreignField: '_id',
              as: 'screen',
            },
          },
          { $unwind: '$screen' },
          {
            $group: {
              _id: null,
              seats: { $sum: '$screen.totalSeats' },
            },
          },
        ]),
      ]);

    const roleMap = new Map(usersByRole.map((item) => [item._id, item.count]));
    const users = {
      customers: roleMap.get(USER_ROLES.CUSTOMER) || 0,
      staff: roleMap.get(USER_ROLES.STAFF) || 0,
      admins: roleMap.get(USER_ROLES.ADMIN) || 0,
    };

    const paymentSummary = payments[0] || { totalRevenue: 0, count: 0 };
    const bookingSummary = bookings.reduce(
      (acc, item) => {
        if (item._id === BOOKING_STATUS.PENDING_PAYMENT) acc.pendingPayment = item.count;
        if (item._id === BOOKING_STATUS.CONFIRMED) acc.confirmed = item.count;
        if (item._id === BOOKING_STATUS.CANCELLED) acc.cancelled = item.count;
        if (item._id === BOOKING_STATUS.EXPIRED) acc.expired = item.count;
        acc.total += item.count;
        return acc;
      },
      { total: 0, pendingPayment: 0, confirmed: 0, cancelled: 0, expired: 0 }
    );

    const bookedSeats = occupancyStats[0]?.bookedSeats || 0;
    const seatCapacity = totalSeatCapacity[0]?.seats || 0;

    return {
      users: {
        total: users.customers + users.staff + users.admins,
        customers: users.customers,
        staff: users.staff,
        admins: users.admins,
      },
      movies,
      cinemas,
      showtimes,
      comments,
      bookings: bookingSummary,
      payments: {
        totalRevenue: paymentSummary.totalRevenue || 0,
        completed: paymentSummary.count || 0,
        refunded: 0,
        failed: 0,
      },
      occupancyRate: seatCapacity === 0 ? 0 : Number(((bookedSeats / seatCapacity) * 100).toFixed(2)),
      topMovies: topMovies.map((item) => ({
        movieId: item._id.toString(),
        title: item.title,
        bookings: item.bookings,
        revenue: item.revenue,
        posterUrl: item.poster,
        genre: Array.isArray(item.genre) ? item.genre.map(String) : [],
      })),
    };
  }

  static async getFinance(startDate?: Date, endDate?: Date, groupBy: 'day' | 'movie' | 'cinema' | 'method' = 'day') {
    const match = {
      ...this.buildDateQuery(startDate, endDate, 'paidAt'),
      status: PAYMENT_STATUS.COMPLETED,
    };

    if (groupBy === 'method') {
      return Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$method',
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);
    }

    if (groupBy === 'movie') {
      return Payment.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'booking',
          },
        },
        { $unwind: '$booking' },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'booking.showtime',
            foreignField: '_id',
            as: 'showtime',
          },
        },
        { $unwind: '$showtime' },
        {
          $lookup: {
            from: 'movies',
            localField: 'showtime.movie',
            foreignField: '_id',
            as: 'movie',
          },
        },
        { $unwind: '$movie' },
        {
          $group: {
            _id: '$movie.title',
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);
    }

    if (groupBy === 'cinema') {
      return Payment.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'booking',
          },
        },
        { $unwind: '$booking' },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'booking.showtime',
            foreignField: '_id',
            as: 'showtime',
          },
        },
        { $unwind: '$showtime' },
        {
          $lookup: {
            from: 'screens',
            localField: 'showtime.screen',
            foreignField: '_id',
            as: 'screen',
          },
        },
        { $unwind: '$screen' },
        {
          $lookup: {
            from: 'cinemas',
            localField: 'screen.cinema',
            foreignField: '_id',
            as: 'cinema',
          },
        },
        { $unwind: '$cinema' },
        {
          $group: {
            _id: '$cinema.name',
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);
    }

    return Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$paidAt',
            },
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private static buildDateQuery(startDate?: Date, endDate?: Date, field: string = 'createdAt') {
    const query: any = {};
    if (startDate || endDate) {
      query[field] = {};
      if (startDate) query[field].$gte = startDate;
      if (endDate) query[field].$lte = endDate;
    }
    return query;
  }
}

export default AdminService;
