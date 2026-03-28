export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  status: string;
}

export interface AuthPayload {
  token: string;
  user: Record<string, unknown>;
}

export interface DashboardSummary {
  users: {
    total: number;
    customers: number;
    staff: number;
    admins: number;
  };
  movies: number;
  cinemas: number;
  showtimes: number;
  comments: number;
  bookings: {
    total: number;
    pendingPayment: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  };
  payments: {
    totalRevenue: number;
    completed: number;
    refunded: number;
    failed: number;
  };
  occupancyRate: number;
  topMovies: Array<{
    movieId: string;
    title: string;
    bookings: number;
    revenue: number;
    posterUrl?: string;
    genre?: string[];
  }>;
}

export interface FinancePoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface RevenueStreamData {
  summary: {
    totalRevenue: number;
    todayRevenue: number;
    averageOrderValue: number;
    completedPayments: number;
    revenueChange: number;
    todayChange: number;
    completedChange: number;
  };
  trend: Array<{
    label: string;
    revenue: number;
  }>;
  health: {
    refundRate: number;
    failureRate: number;
    alertTitle: string;
    alertMessage: string;
    alertSeverity: 'warning' | 'critical';
  };
  liveTransactions: Array<{
    id: string;
    movie: string;
    customer: string;
    time: string;
    amount: number;
    status: 'SUCCESS' | 'REFUNDED' | 'FAILED';
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
}

export interface MovieCatalogItem {
  movieId: string;
  title: string;
  genre: string[];
  duration: number;
  revenue: number;
  bookings: number;
  showtimes: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  posterUrl?: string;
  releaseDate?: string;
  createdAt?: string;
}

export interface UsersAnalytics {
  summary: {
    totalUsers: number;
    totalUsersChange: number;
    activeUsers: number;
    activeUserRate: number;
    totalPurchasers: number;
    purchaserRate: number;
    userGrowthRate: number;
  };
  directory: DirectoryUser[];
  pagination: Pagination;
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED';
}

export interface UserDetail {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    memberSince: string;
    tierLabel: string;
  };
  stats: {
    totalSpent: number;
    totalBookings: number;
    cancellationRate: number;
    commentCount: number;
  };
  recentBookings: Array<{
    id: string;
    title: string;
    date: string;
    hall: string;
    status: string;
    posterUrl?: string;
  }>;
  latestFeedback?: {
    id: string;
    movieTitle: string;
    rating: number;
    content: string;
    createdAt: string;
  };
  spendingTrend: Array<{
    label: string;
    amount: number;
  }>;
  loyalty: {
    tierLabel: string;
    progressPercent: number;
    frequencyPerMonth: number;
    averageTicketValue: number;
  };
}

export interface CinemaListItem {
  _id?: string;
  id?: string;
  name: string;
  address: string;
  location: string;
  status: string;
  facilities?: string[];
}

export interface CinemaOpsDetail {
  cinema: {
    id: string;
    name: string;
    location: string;
    address: string;
    status: string;
    facilities: string[];
    screenCount: number;
    totalSeats: number;
    screenNames: string[];
    screens: Array<{
      id: string;
      name: string;
      totalSeats: number;
      hallType: string;
      projectionType: string;
      audioSystem: string;
      status: string;
    }>;
  };
  summary: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    averageDailyBookings: number;
    occupancyRate: number;
  };
  trends: {
    weekly: Array<{
      label: string;
      revenue: number;
    }>;
    monthly: Array<{
      label: string;
      revenue: number;
    }>;
  };
  showingMovies: Array<{
    movieId: string;
    title: string;
    slots: number;
    posterUrl?: string;
    isTrending: boolean;
  }>;
  bookingDistribution: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}

export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  status: string;
}
