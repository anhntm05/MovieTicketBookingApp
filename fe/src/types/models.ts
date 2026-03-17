export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  posterUrl: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  releaseDate: string;
}

export interface Cinema {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Screen {
  id: string;
  cinemaId: string;
  name: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  price: number;
  movie?: Movie;
  screen?: Screen & { cinema?: Cinema };
}

export interface Seat {
  id: string;
  screenId: string;
  row: string; // e.g., 'A'
  number: number; // e.g., 1
  type: 'STANDARD' | 'VIP';
}

export interface SeatAvailability extends Seat {
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
}

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  showtime?: Showtime;
}

export interface Comment {
  id: string;
  movieId: string;
  userId: string;
  content: string;
  rating: number;
  status: 'APPROVED' | 'HIDDEN' | 'PENDING';
  createdAt: string;
  user?: { id: string; fullName: string };
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
