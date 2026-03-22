import { Booking } from '../models/Booking';
import { Cinema } from '../models/Cinema';
import { Comment } from '../models/Comment';
import { Movie } from '../models/Movie';
import { Payment } from '../models/Payment';
import { Showtime } from '../models/Showtime';
import { IAdminMovieCatalogItem, IRevenueStreamData, IRevenueTrendPoint } from '../types';
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

  static async getMovieCatalog(
    options: {
      search?: string;
      sort?: 'recent' | 'revenue' | 'title';
      status?: string;
    } = {}
  ): Promise<IAdminMovieCatalogItem[]> {
    const match: Record<string, unknown> = {};

    if (options.search?.trim()) {
      match.title = { $regex: options.search.trim(), $options: 'i' };
    }

    if (options.status && options.status !== 'all') {
      match.status = options.status;
    }

    let sortStage: Record<string, 1 | -1>;

    if (options.sort === 'revenue') {
      sortStage = { revenue: -1, bookings: -1, createdAt: -1 };
    } else if (options.sort === 'title') {
      sortStage = { title: 1, createdAt: -1 };
    } else {
      sortStage = { createdAt: -1, title: 1 };
    }

    return Movie.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'showtimes',
          localField: '_id',
          foreignField: 'movie',
          as: 'showtimeDocs',
        },
      },
      {
        $lookup: {
          from: 'bookings',
          let: { showtimeIds: '$showtimeDocs._id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$showtime', '$$showtimeIds'] },
              },
            },
          ],
          as: 'bookingDocs',
        },
      },
      {
        $lookup: {
          from: 'payments',
          let: { bookingIds: '$bookingDocs._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$booking', '$$bookingIds'] },
                    { $eq: ['$status', PAYMENT_STATUS.COMPLETED] },
                  ],
                },
              },
            },
          ],
          as: 'paymentDocs',
        },
      },
      {
        $addFields: {
          showtimes: { $size: '$showtimeDocs' },
          bookings: { $size: '$bookingDocs' },
          revenue: { $sum: '$paymentDocs.amount' },
        },
      },
      {
        $project: {
          movieId: { $toString: '$_id' },
          title: 1,
          genre: 1,
          duration: 1,
          status: 1,
          posterUrl: '$poster',
          releaseDate: 1,
          createdAt: 1,
          showtimes: 1,
          bookings: 1,
          revenue: { $ifNull: ['$revenue', 0] },
        },
      },
      { $sort: sortStage },
    ]);
  }

  static async getRevenueStream(range: 'today' | '7d' | '30d' = 'today'): Promise<IRevenueStreamData> {
    const now = new Date();
    const { startDate, previousStartDate, bucketCount } = this.getRevenueRange(range, now);
    const completedMatch = { status: PAYMENT_STATUS.COMPLETED, paidAt: { $gte: startDate, $lte: now } };
    const previousCompletedMatch = { status: PAYMENT_STATUS.COMPLETED, paidAt: { $gte: previousStartDate, $lt: startDate } };
    const rangeCreatedMatch = { createdAt: { $gte: startDate, $lte: now } };

    const [
      totalRevenueSummary,
      todayRevenueSummary,
      rangeRevenueSummary,
      previousRevenueSummary,
      rangeCompletedCount,
      previousCompletedCount,
      rangePaymentCounts,
      trendPayments,
      topPerformers,
      livePayments,
      issueHotspots,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            paidAt: { $gte: this.startOfDay(now), $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: completedMatch },
        { $group: { _id: null, total: { $sum: '$amount' }, average: { $avg: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: previousCompletedMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments(completedMatch),
      Payment.countDocuments(previousCompletedMatch),
      Payment.aggregate([
        { $match: rangeCreatedMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.find(completedMatch).select('amount paidAt').lean(),
      Payment.aggregate([
        { $match: completedMatch },
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
            _id: '$movie._id',
            name: { $first: '$movie.title' },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Payment.find({ createdAt: { $gte: startDate, $lte: now } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({
          path: 'booking',
          populate: [
            { path: 'user', select: 'name' },
            {
              path: 'showtime',
              populate: [{ path: 'movie', select: 'title' }],
            },
          ],
        })
        .lean(),
      Payment.aggregate([
        {
          $match: {
            ...rangeCreatedMatch,
            status: { $in: [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.FAILED] },
          },
        },
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
            incidents: { $sum: 1 },
            refunds: {
              $sum: {
                $cond: [{ $eq: ['$status', PAYMENT_STATUS.REFUNDED] }, 1, 0],
              },
            },
            failures: {
              $sum: {
                $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0],
              },
            },
          },
        },
        { $sort: { incidents: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const totalRevenue = totalRevenueSummary[0]?.total || 0;
    const todayRevenue = todayRevenueSummary[0]?.total || 0;
    const currentRevenue = rangeRevenueSummary[0]?.total || 0;
    const previousRevenue = previousRevenueSummary[0]?.total || 0;
    const averageOrderValue = rangeRevenueSummary[0]?.average || 0;
    const paymentCountMap = new Map(rangePaymentCounts.map((item) => [item._id, item.count]));
    const totalTransactions = Array.from(paymentCountMap.values()).reduce((sum, count) => sum + count, 0);
    const refundCount = paymentCountMap.get(PAYMENT_STATUS.REFUNDED) || 0;
    const failureCount = paymentCountMap.get(PAYMENT_STATUS.FAILED) || 0;
    const refundRate = totalTransactions ? (refundCount / totalTransactions) * 100 : 0;
    const failureRate = totalTransactions ? (failureCount / totalTransactions) * 100 : 0;
    const hotspot = issueHotspots[0];
    const alertSeverity = refundRate >= 5 || failureRate >= 3 ? 'critical' : 'warning';

    const trend = this.buildRevenueTrend(
      trendPayments.map((payment: any) => ({
        amount: Number(payment.amount || 0),
        paidAt: payment.paidAt ? new Date(payment.paidAt) : now,
      })),
      startDate,
      now,
      range,
      bucketCount
    );

    return {
      summary: {
        totalRevenue,
        todayRevenue,
        averageOrderValue,
        completedPayments: rangeCompletedCount,
        revenueChange: this.calculateChange(currentRevenue, previousRevenue),
        todayChange: this.calculateChange(todayRevenue, previousRevenue),
        completedChange: this.calculateChange(rangeCompletedCount, previousCompletedCount),
      },
      trend,
      health: {
        refundRate: Number(refundRate.toFixed(1)),
        failureRate: Number(failureRate.toFixed(1)),
        alertTitle: hotspot ? 'ANOMALY ALERT' : 'SYSTEM STABLE',
        alertMessage: hotspot
          ? `Unexpected payment issues at ${hotspot._id}. Refunds: ${hotspot.refunds}, failures: ${hotspot.failures}.`
          : 'No abnormal payment activity detected in the selected period.',
        alertSeverity,
      },
      liveTransactions: livePayments.map((payment: any) => ({
        id: payment.transactionId || payment._id.toString(),
        movie: payment.booking?.showtime?.movie?.title || 'Unknown movie',
        customer: payment.booking?.user?.name || 'Walk-in customer',
        time: this.formatTime(payment.paidAt || payment.createdAt),
        amount: Number(payment.amount || 0),
        status:
          payment.status === PAYMENT_STATUS.COMPLETED
            ? 'SUCCESS'
            : payment.status === PAYMENT_STATUS.REFUNDED
              ? 'REFUNDED'
              : 'FAILED',
      })),
      topPerformers: topPerformers.map((item: any) => ({
        id: item._id.toString(),
        name: item.name,
        revenue: Number(item.revenue || 0),
      })),
    };
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

  private static getRevenueRange(range: 'today' | '7d' | '30d', now: Date) {
    const startDate = new Date(now);

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    }

    const previousStartDate = new Date(startDate);
    previousStartDate.setMilliseconds(previousStartDate.getMilliseconds() - (now.getTime() - startDate.getTime()));

    return {
      startDate,
      previousStartDate,
      bucketCount: 7,
    };
  }

  private static buildRevenueTrend(
    payments: Array<{ amount: number; paidAt: Date }>,
    startDate: Date,
    endDate: Date,
    range: 'today' | '7d' | '30d',
    bucketCount: number
  ): IRevenueTrendPoint[] {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const bucketSize = Math.max(Math.ceil((endMs - startMs + 1) / bucketCount), 1);
    const formatter =
      range === 'today'
        ? new Intl.DateTimeFormat('en-US', { hour: 'numeric' })
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(startMs + bucketSize * index);
      return {
        label: formatter.format(bucketStart),
        revenue: 0,
      };
    });

    for (const payment of payments) {
      const paymentTime = payment.paidAt.getTime();
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((paymentTime - startMs) / bucketSize)));
      buckets[index].revenue += payment.amount;
    }

    return buckets.map((bucket) => ({
      label: bucket.label,
      revenue: Number(bucket.revenue.toFixed(2)),
    }));
  }

  private static calculateChange(current: number, previous: number) {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private static startOfDay(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private static formatTime(dateValue?: Date | string) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export default AdminService;
