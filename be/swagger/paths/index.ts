import { authPaths } from './auth.paths';
import { moviePaths } from './movies.paths';
import { cinemaPaths } from './cinemas.paths';
import { showtimePaths } from './showtimes.paths';
import { bookingPaths } from './bookings.paths';
import { paymentPaths } from './payments.paths';

export const allPaths = {
  ...authPaths,
  ...moviePaths,
  ...cinemaPaths,
  ...showtimePaths,
  ...bookingPaths,
  ...paymentPaths,
};

