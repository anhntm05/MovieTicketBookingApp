import { userSchemas } from './user.schema';
import { movieSchemas } from './movie.schema';
import { cinemaSchemas } from './cinema.schema';
import { showtimeSchemas } from './showtime.schema';
import { bookingSchemas } from './booking.schema';
import { paymentSchemas } from './payment.schema';
import { seatSchemas } from './seat.schema';
import { commonSchemas } from './common.schema';

export const allSchemas = {
  ...userSchemas,
  ...movieSchemas,
  ...cinemaSchemas,
  ...showtimeSchemas,
  ...bookingSchemas,
  ...paymentSchemas,
  ...seatSchemas,
  ...commonSchemas,
};
