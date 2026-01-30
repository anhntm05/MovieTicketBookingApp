/**
 * TypeScript interfaces and types for the Movie Ticket Booking Application
 */

import { Types } from "mongoose";

// User Types
export interface IUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'admin';
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

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<IUser, 'password'>;
}

// Movie Types
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
}

// Cinema Types
export interface ICinema {
  _id?: string;
  name: string;
  location: string;
  address: string;
  facilities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICinemaRequest {
  name: string;
  location: string;
  address: string;
  facilities: string[];
}

// Screen Types
export interface IScreen {
  _id?: string;
  cinema: Types.ObjectId | string;
  name: string;
  totalSeats: number;
  seatLayout: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScreenRequest {
  cinema: string;
  name: string;
  totalSeats: number;
  seatLayout: Record<string, number>;
}

// Showtime Types
export interface IShowtime {
  _id?: string;
  movie: Types.ObjectId | string;
  screen: Types.ObjectId | string;
  startTime: Date;
  endTime: Date;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShowtimeRequest {
  movie: string;
  screen: string;
  startTime: Date;
  endTime: Date;
  price: number;
}

// Seat Types
export type SeatType = 'standard' | 'vip' | 'premium';

export interface ISeat {
  _id?: string;
  screen: Types.ObjectId | string;
  row: string;
  number: number;
  type: SeatType;
  isOccupied?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeatRequest {
  screen: string;
  row: string;
  number: number;
  type: SeatType;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBooking {
  _id?: string;
  user: Types.ObjectId | string;
  showtime: Types.ObjectId | string;
  seats: string[];
  totalPrice: number;
  status: BookingStatus;
  bookingDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBookingRequest {
  showtime: string;
  seats: string[];
}

// Payment Types
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface IPayment {
  _id?: string;
  booking: Types.ObjectId | string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentRequest {
  booking: string;
  amount: number;
  method: PaymentMethod;
}

// API Response Types
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

// JWT Payload
export interface IJWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

// Request Extensions
export interface IAuthRequest {
  user?: IJWTPayload;
  body?: any;
  params?: any;
  query?: any;
}

// Seat Hold Types
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
