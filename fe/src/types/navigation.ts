import { NavigatorScreenParams } from '@react-navigation/native';

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
  BookingPayment: { showtimeId: string; selectedSeatIds: string[] };
  TicketDetail: { bookingId: string };
  Notifications: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
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

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Cinemas: undefined;
  Profile: undefined;
};
