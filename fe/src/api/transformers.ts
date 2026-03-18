import { AxiosResponse } from 'axios';
import {
  Booking,
  BookingConcession,
  Cinema,
  Comment,
  CommentReply,
  Movie,
  Screen,
  SeatAvailability,
  TicketDetail,
  Showtime,
} from '../types/models';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  errors?: string[];
}

export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
}

type AnyRecord = Record<string, any>;

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' ? (value as AnyRecord) : {};

const getId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  const record = toRecord(value);
  return String(record._id || record.id || '');
};

const upperSnake = (value?: string): string =>
  value ? value.replace(/[\s-]+/g, '_').toUpperCase() : '';

const ensureArray = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

const normalizeCommentUser = (raw: unknown) => {
  const user = toRecord(raw);
  const id = getId(user);

  if (!id && !user.name && !user.fullName && !user.email) {
    return undefined;
  }

  return {
    id,
    fullName: String(user.fullName || user.name || user.email || 'Anonymous'),
    role: upperSnake(user.role),
    email: String(user.email || ''),
  };
};

export const unwrapApiData = <T>(response: AxiosResponse<ApiEnvelope<T>>): T => response.data.data;

export const normalizeProfile = (raw: unknown): ProfileData => {
  const profile = toRecord(raw);

  return {
    id: getId(profile),
    email: String(profile.email || ''),
    fullName: String(profile.fullName || profile.name || ''),
    phone: String(profile.phone || ''),
    role: upperSnake(profile.role),
    status: upperSnake(profile.status),
  };
};

export const normalizeMovie = (raw: unknown): Movie => {
  const movie = toRecord(raw);

  return {
    id: getId(movie),
    title: String(movie.title || ''),
    description: String(movie.description || ''),
    duration: Number(movie.duration || 0),
    genre: ensureArray<string>(movie.genre).map(String),
    rating: Number(movie.rating || 0),
    posterUrl: String(movie.posterUrl || movie.poster || ''),
    trailerUrl: String(movie.trailerUrl || movie.trailer || ''),
    status: (upperSnake(movie.status) || 'PUBLISHED') as Movie['status'],
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString() : '',
  };
};

export const normalizeCinema = (raw: unknown): Cinema => {
  const cinema = toRecord(raw);

  return {
    id: getId(cinema),
    name: String(cinema.name || ''),
    location: String(cinema.location || ''),
    address: String(cinema.address || ''),
    facilities: ensureArray<string>(cinema.facilities).map(String),
    status: (upperSnake(cinema.status) || 'ACTIVE') as Cinema['status'],
  };
};

export const normalizeScreen = (raw: unknown): Screen => {
  const screen = toRecord(raw);
  const cinema = screen.cinema && typeof screen.cinema === 'object' ? normalizeCinema(screen.cinema) : undefined;

  return {
    id: getId(screen),
    cinemaId: cinema?.id || getId(screen.cinema),
    name: String(screen.name || ''),
    status: (upperSnake(screen.status) || 'ACTIVE') as Screen['status'],
    totalSeats: Number(screen.totalSeats || 0),
    cinema,
  };
};

export const normalizeShowtime = (raw: unknown): Showtime => {
  const showtime = toRecord(raw);
  const movie = showtime.movie && typeof showtime.movie === 'object' ? normalizeMovie(showtime.movie) : undefined;
  const screen = showtime.screen && typeof showtime.screen === 'object' ? normalizeScreen(showtime.screen) : undefined;

  return {
    id: getId(showtime),
    movieId: movie?.id || getId(showtime.movie),
    screenId: screen?.id || getId(showtime.screen),
    startTime: showtime.startTime ? new Date(showtime.startTime).toISOString() : '',
    endTime: showtime.endTime ? new Date(showtime.endTime).toISOString() : '',
    price: Number(showtime.price || 0),
    status: (upperSnake(showtime.status) || 'SCHEDULED') as Showtime['status'],
    movie,
    screen,
  };
};

export const normalizeSeatAvailability = (raw: unknown): SeatAvailability => {
  const seatAvailability = toRecord(raw);
  const seat = seatAvailability.seat ? toRecord(seatAvailability.seat) : seatAvailability;

  return {
    id: getId(seat),
    screenId: getId(seat.screen),
    row: String(seat.row || ''),
    number: Number(seat.number || 0),
    type: (upperSnake(seat.type) || 'STANDARD') as SeatAvailability['type'],
    status: (upperSnake(seatAvailability.status || seat.status) || 'AVAILABLE') as SeatAvailability['status'],
  };
};

export const normalizeBooking = (raw: unknown): Booking => {
  const booking = toRecord(raw);
  const showtime = booking.showtime && typeof booking.showtime === 'object' ? normalizeShowtime(booking.showtime) : undefined;

  return {
    id: getId(booking),
    bookingCode: String(booking.bookingCode || ''),
    userId: getId(booking.user),
    showtimeId: showtime?.id || getId(booking.showtime),
    status: (upperSnake(booking.status) || 'PENDING_PAYMENT') as Booking['status'],
    totalAmount: Number(booking.totalAmount || booking.totalPrice || 0),
    createdAt: booking.bookingDate
      ? new Date(booking.bookingDate).toISOString()
      : booking.createdAt
        ? new Date(booking.createdAt).toISOString()
        : '',
    showtime,
  };
};

export const normalizeBookingConcession = (raw: unknown): BookingConcession => {
  const concession = toRecord(raw);

  return {
    name: String(concession.name || ''),
    note: String(concession.note || ''),
    qty: Number(concession.qty || 0),
    unitPrice: Number(concession.unitPrice || 0),
    totalPrice: Number(concession.totalPrice || Number(concession.qty || 0) * Number(concession.unitPrice || 0)),
  };
};

export const normalizeTicketDetail = (raw: unknown): TicketDetail => {
  const ticket = toRecord(raw);
  const movie = toRecord(ticket.movie);
  const schedule = toRecord(ticket.schedule);
  const summary = toRecord(ticket.summary);

  return {
    bookingId: getId(ticket.bookingId || ticket.booking || ticket),
    bookingCode: String(ticket.bookingCode || ''),
    status: (upperSnake(ticket.status) || 'CONFIRMED') as TicketDetail['status'],
    paymentStatus: (upperSnake(ticket.paymentStatus) || 'PENDING') as TicketDetail['paymentStatus'],
    paymentMethod: upperSnake(ticket.paymentMethod) as TicketDetail['paymentMethod'],
    transactionId: String(ticket.transactionId || ''),
    qrCodeValue: String(ticket.qrCodeValue || ticket.bookingCode || ''),
    bookingDate: ticket.bookingDate ? new Date(ticket.bookingDate).toISOString() : '',
    movie: {
      id: getId(movie),
      title: String(movie.title || ''),
      posterUrl: String(movie.posterUrl || movie.poster || ''),
      duration: Number(movie.duration || 0),
      genre: ensureArray<string>(movie.genre).map(String),
    },
    schedule: {
      startTime: schedule.startTime ? new Date(schedule.startTime).toISOString() : '',
      theater: String(schedule.theater || ''),
      hall: String(schedule.hall || ''),
      cinemaLocation: String(schedule.cinemaLocation || ''),
      cinemaAddress: String(schedule.cinemaAddress || ''),
    },
    seats: ensureArray(ticket.seats).map((seat) => {
      const seatRecord = toRecord(seat);

      return {
        id: getId(seatRecord),
        row: String(seatRecord.row || ''),
        number: Number(seatRecord.number || 0),
        type: (upperSnake(seatRecord.type) || 'STANDARD') as TicketDetail['seats'][number]['type'],
        label: String(seatRecord.label || `${seatRecord.row || ''}${seatRecord.number || ''}`),
      };
    }),
    concessions: ensureArray(ticket.concessions).map(normalizeBookingConcession),
    summary: {
      ticketCount: Number(summary.ticketCount || 0),
      ticketSubtotal: Number(summary.ticketSubtotal || 0),
      concessionsSubtotal: Number(summary.concessionsSubtotal || 0),
      serviceFee: Number(summary.serviceFee || 0),
      totalAmount: Number(summary.totalAmount || 0),
    },
  };
};

export const normalizeCommentReply = (raw: unknown, commentId = ''): CommentReply => {
  const reply = toRecord(raw);

  return {
    id: getId(reply),
    commentId,
    userId: getId(reply.user),
    content: String(reply.content || ''),
    createdAt: reply.createdAt ? new Date(reply.createdAt).toISOString() : '',
    user: normalizeCommentUser(reply.user),
  };
};

export const normalizeComment = (raw: unknown): Comment => {
  const comment = toRecord(raw);
  const commentId = getId(comment);

  return {
    id: commentId,
    movieId: getId(comment.movie),
    movieTitle: String(comment.movie?.title || ''),
    userId: getId(comment.user),
    content: String(comment.content || ''),
    rating: Number(comment.rating || 0),
    status: (upperSnake(comment.status) || 'APPROVED') as Comment['status'],
    createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : '',
    user: normalizeCommentUser(comment.user),
    replies: ensureArray(comment.replies).map((reply) => normalizeCommentReply(reply, commentId)),
  };
};

export const normalizeUserSummary = (raw: unknown) => {
  const user = normalizeProfile(raw);

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as 'CUSTOMER' | 'STAFF' | 'ADMIN',
    status: user.status,
  };
};
