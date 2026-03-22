import { NavigatorScreenParams } from '@react-navigation/native';
import { Booking, Showtime } from './models';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  CustomerMain: NavigatorScreenParams<CustomerStackParamList> | undefined;
  StaffMain: undefined;
  AdminMain: undefined;
};

export type CustomerStackParamList = {
  Tabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  MovieDetail: { movieId: string };
  SeatSelection: { showtimeId: string };
  BookingPayment: {
    bookingId?: string;
    booking?: Booking;
    showtimeId?: string;
    showtime?: Showtime;
    selectedSeatIds?: string[];
    selectedSeatLabels?: string[];
  };
  TicketDetail: { bookingId: string };
  Notifications: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Movies: undefined;
  Cinemas: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type StaffTabParamList = {
  Movies: undefined;
  Showtimes: undefined;
  Comments: undefined;
  Profile: undefined;
};

export type AdminMovieStackParamList = {
  AdminMovieCatalog: undefined;
  AdminMovieDetail: { movieId?: string } | undefined;
};

export type AdminCinemaStackParamList = {
  AdminCinemaCatalog: undefined;
  AdminCinemaDetail: { cinemaId: string };
  AdminShowtimeCreate: { cinemaId: string };
  AdminScreenRoomCreate: { cinemaId: string };
};

export type AdminUserStackParamList = {
  AdminUserDirectory: undefined;
  AdminCustomerDetail: { userId: string };
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Revenue: undefined;
  Movies: NavigatorScreenParams<AdminMovieStackParamList> | undefined;
  Users: NavigatorScreenParams<AdminUserStackParamList> | undefined;
  Cinemas: NavigatorScreenParams<AdminCinemaStackParamList> | undefined;
  Profile: undefined;
};
