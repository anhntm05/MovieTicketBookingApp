export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  genre?: string[];
  rating?: number;
  posterUrl: string;
  trailerUrl?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  releaseDate: string;
}

export interface Cinema {
  id: string;
  name: string;
  location: string;
  address?: string;
  facilities?: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Screen {
  id: string;
  cinemaId: string;
  name: string;
  status?: 'ACTIVE' | 'MAINTENANCE';
  totalSeats?: number;
  cinema?: Cinema;
}

export interface Showtime {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  price: number;
  status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  movie?: Movie;
  screen?: Screen;
}

export interface Seat {
  id: string;
  screenId: string;
  row: string; // e.g., 'A'
  number: number; // e.g., 1
  type: 'STANDARD' | 'VIP' | 'PREMIUM';
}

export interface SeatAvailability extends Seat {
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
}

export interface Booking {
  id: string;
  bookingCode?: string;
  userId: string;
  showtimeId: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  totalAmount: number;
  createdAt: string;
  showtime?: Showtime;
}

export interface BookingConcession {
  name: string;
  note?: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TicketSeatDetail {
  id: string;
  row: string;
  number: number;
  type: Seat['type'];
  label: string;
}

export interface TicketDetail {
  bookingId: string;
  bookingCode: string;
  status: Booking['status'];
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  transactionId?: string;
  qrCodeValue: string;
  bookingDate?: string;
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    duration: number;
    genre: string[];
  };
  schedule: {
    startTime?: string;
    theater: string;
    hall: string;
    cinemaLocation?: string;
    cinemaAddress?: string;
  };
  seats: TicketSeatDetail[];
  concessions: BookingConcession[];
  summary: {
    ticketCount: number;
    ticketSubtotal: number;
    concessionsSubtotal: number;
    serviceFee: number;
    totalAmount: number;
  };
}

export interface Comment {
  id: string;
  movieId: string;
  movieTitle?: string;
  userId: string;
  content: string;
  rating: number;
  status: 'APPROVED' | 'HIDDEN';
  createdAt: string;
  user?: { id: string; fullName: string; role?: string; email?: string };
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { id: string; fullName: string, role: string };
}
