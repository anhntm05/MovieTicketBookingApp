export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  CustomerMain: undefined;
  StaffMain: undefined;
  AdminMain: undefined;
  MovieDetail: { movieId: string };
  ShowtimeDetail: { showtimeId: string };
  BookingPayment: { showtimeId: string; selectedSeatIds: string[] };
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
