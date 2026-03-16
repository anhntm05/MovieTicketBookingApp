import { Types } from 'mongoose';

export type UserRole = 'customer' | 'staff' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'blocked';
export type MovieStatus = 'draft' | 'published' | 'archived';
export type CinemaStatus = 'active' | 'inactive';
export type ScreenStatus = 'active' | 'maintenance';
export type SeatType = 'standard' | 'vip' | 'premium';
export type SeatStatus = 'active' | 'blocked';
export type ShowtimeStatus = 'scheduled' | 'cancelled' | 'completed';
export type ShowtimeSeatStatus = 'available' | 'held' | 'booked' | 'blocked';
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'expired';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type CommentStatus = 'approved' | 'hidden';

export interface IUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface ICreateStaffRequest extends IUserRequest {}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<IUser, 'password'>;
}

export interface IMovie {
  _id?: string;
  title: string;
  description: string;
  duration: number;
  genre: string[];
  rating: number;
  poster: string;
  trailer: string;
  releaseDate: Date;
  status: MovieStatus;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMovieRequest {
  title: string;
  description: string;
  duration: number;
  genre: string[];
  rating: number;
  poster: string;
  trailer: string;
  releaseDate: Date;
  status?: MovieStatus;
}

export interface ICinema {
  _id?: string;
  name: string;
  location: string;
  address: string;
  facilities: string[];
  status: CinemaStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICinemaRequest {
  name: string;
  location: string;
  address: string;
  facilities: string[];
  status?: CinemaStatus;
}

export interface IScreen {
  _id?: string;
  cinema: Types.ObjectId | string;
  name: string;
  totalSeats: number;
  seatLayout: Record<string, number>;
  status: ScreenStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScreenRequest {
  cinema?: string;
  name: string;
  totalSeats: number;
  seatLayout: Record<string, number>;
  status?: ScreenStatus;
}

export interface IShowtime {
  _id?: string;
  movie: Types.ObjectId | string;
  screen: Types.ObjectId | string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: ShowtimeStatus;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShowtimeRequest {
  movie: string;
  screen: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status?: ShowtimeStatus;
}

export interface ISeat {
  _id?: string;
  screen: Types.ObjectId | string;
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeatRequest {
  screen?: string;
  row: string;
  number: number;
  type: SeatType;
  status?: SeatStatus;
}

export interface IShowtimeSeat {
  _id?: string;
  showtime: Types.ObjectId | string;
  seat: Types.ObjectId | string;
  price: number;
  status: ShowtimeSeatStatus;
  holdBy?: Types.ObjectId | string;
  holdExpiresAt?: Date | null;
  booking?: Types.ObjectId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBooking {
  _id?: string;
  bookingCode: string;
  user: Types.ObjectId | string;
  showtime: Types.ObjectId | string;
  seats: string[];
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  holdExpiresAt?: Date | null;
  cancelledAt?: Date | null;
  bookingDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBookingRequest {
  showtime: string;
  seats: string[];
}

export interface IPayment {
  _id?: string;
  booking: Types.ObjectId | string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  gatewayReference?: string;
  paidAt?: Date | null;
  refundedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentRequest {
  booking: string;
  amount: number;
  method: PaymentMethod;
}

export interface ICommentReply {
  _id?: Types.ObjectId | string;
  user: Types.ObjectId | string;
  role: UserRole;
  content: string;
  createdAt?: Date;
}

export interface IComment {
  _id?: string;
  movie: Types.ObjectId | string;
  user: Types.ObjectId | string;
  booking?: Types.ObjectId | string | null;
  rating: number;
  content: string;
  status: CommentStatus;
  replies: ICommentReply[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentRequest {
  movie: string;
  booking?: string;
  rating: number;
  content: string;
}

export interface ICommentReplyRequest {
  content: string;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IDashboardSummary {
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
  }>;
}

export interface IFinanceBreakdownItem {
  label: string;
  revenue: number;
  transactions: number;
}

export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IAuthRequest {
  user?: IJWTPayload;
  body?: any;
  params?: any;
  query?: any;
}

export interface ISeatHold {
  _id?: string;
  seat: Types.ObjectId | string;
  user: Types.ObjectId | string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeatHoldRequest {
  seatIds: string[];
  expiryMinutes?: number;
}
