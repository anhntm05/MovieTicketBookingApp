import request from 'supertest';
import app from '../src/app';
import { authHeader, clearDatabase, createUser, seedCatalog, startTestDatabase, stopTestDatabase } from './helpers/testUtils';

describe('Booking, payment, and comment flows', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('holds seats, books them, processes payment, and releases them on cancellation', async () => {
    const customerOne = await createUser({
      email: 'customer.one@example.com',
      password: 'Customer123!',
      role: 'customer',
    });
    const customerTwo = await createUser({
      email: 'customer.two@example.com',
      password: 'Customer456!',
      role: 'customer',
    });
    const { seats, showtime } = await seedCatalog();
    const seatIds = [seats[0]._id.toString(), seats[1]._id.toString()];

    const holdResponse = await request(app)
      .post('/api/bookings/hold')
      .set(authHeader(customerOne))
      .send({
        showtime: showtime._id.toString(),
        seats: seatIds,
      });

    expect(holdResponse.status).toBe(200);
    expect(holdResponse.body.data).toHaveLength(2);

    const conflictingHoldResponse = await request(app)
      .post('/api/bookings/hold')
      .set(authHeader(customerTwo))
      .send({
        showtime: showtime._id.toString(),
        seats: seatIds,
      });

    expect(conflictingHoldResponse.status).toBe(409);

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set(authHeader(customerOne))
      .send({
        showtime: showtime._id.toString(),
        seats: seatIds,
      });

    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.data.status).toBe('pending_payment');
    expect(bookingResponse.body.data.totalPrice).toBe(200000);

    const paymentResponse = await request(app)
      .post('/api/payments/process')
      .set(authHeader(customerOne))
      .send({
        booking: bookingResponse.body.data._id,
        amount: 200000,
        method: 'credit_card',
      });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.data.status).toBe('completed');

    const ticketDetailResponse = await request(app)
      .get(`/api/bookings/${bookingResponse.body.data._id}/ticket-detail`)
      .set(authHeader(customerOne));
    expect(ticketDetailResponse.status).toBe(200);
    expect(ticketDetailResponse.body.data.bookingId).toBe(bookingResponse.body.data._id);
    expect(ticketDetailResponse.body.data.schedule.theater).toBe('Seed Cinema');
    expect(ticketDetailResponse.body.data.seats).toHaveLength(2);
    expect(ticketDetailResponse.body.data.summary.ticketSubtotal).toBe(200000);
    expect(ticketDetailResponse.body.data.qrCodeValue).toMatch(/^TXN-/);

    const bookingHistoryResponse = await request(app).get('/api/bookings/me').set(authHeader(customerOne));
    expect(bookingHistoryResponse.status).toBe(200);
    expect(bookingHistoryResponse.body.data).toHaveLength(1);

    const forbiddenBookingResponse = await request(app)
      .get(`/api/bookings/${bookingResponse.body.data._id}`)
      .set(authHeader(customerTwo));
    expect(forbiddenBookingResponse.status).toBe(403);

    const cancelResponse = await request(app)
      .put(`/api/bookings/${bookingResponse.body.data._id}/cancel`)
      .set(authHeader(customerOne));
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.data.status).toBe('cancelled');

    const seatsResponse = await request(app).get(`/api/showtimes/${showtime._id.toString()}/seats`);
    expect(seatsResponse.status).toBe(200);
    const releasedSeats = seatsResponse.body.data.filter((item: any) => seatIds.includes(item.seat._id));
    expect(releasedSeats.every((item: any) => item.status === 'available')).toBe(true);
  });

  it('creates customer comments, allows staff replies, and hides moderated comments from public lists', async () => {
    const customer = await createUser({
      email: 'comment.customer@example.com',
      password: 'Customer123!',
      role: 'customer',
    });
    const staff = await createUser({
      email: 'comment.staff@example.com',
      password: 'Staff123!',
      role: 'staff',
    });
    const admin = await createUser({
      email: 'comment.admin@example.com',
      password: 'Admin123!',
      role: 'admin',
    });
    const { movie } = await seedCatalog();

    const createCommentResponse = await request(app)
      .post('/api/comments')
      .set(authHeader(customer))
      .send({
        movie: movie._id.toString(),
        rating: 5,
        content: 'Great movie.',
      });

    expect(createCommentResponse.status).toBe(201);

    const commentId = createCommentResponse.body.data._id;
    const replyResponse = await request(app)
      .post(`/api/comments/${commentId}/replies`)
      .set(authHeader(staff))
      .send({
        content: 'Thanks for the feedback.',
      });

    expect(replyResponse.status).toBe(200);
    expect(replyResponse.body.data.replies).toHaveLength(1);

    const publicCommentsResponse = await request(app).get(`/api/comments/movies/${movie._id.toString()}`);
    expect(publicCommentsResponse.status).toBe(200);
    expect(publicCommentsResponse.body.data).toHaveLength(1);

    const hideResponse = await request(app)
      .patch(`/api/comments/${commentId}/status`)
      .set(authHeader(admin))
      .send({
        status: 'hidden',
      });

    expect(hideResponse.status).toBe(200);

    const hiddenPublicCommentsResponse = await request(app).get(`/api/comments/movies/${movie._id.toString()}`);
    expect(hiddenPublicCommentsResponse.status).toBe(200);
    expect(hiddenPublicCommentsResponse.body.data).toHaveLength(0);
  });
});
