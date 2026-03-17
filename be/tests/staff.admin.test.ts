import request from 'supertest';
import app from '../src/app';
import { authHeader, clearDatabase, createUser, seedCatalog, startTestDatabase, stopTestDatabase } from './helpers/testUtils';

describe('Admin and staff flows', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('allows admin to create a staff account and the staff user can log in', async () => {
    const admin = await createUser({
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin',
    });

    const createStaffResponse = await request(app)
      .post('/api/admin/staff')
      .set(authHeader(admin))
      .send({
        name: 'New Staff',
        email: 'staff.new@example.com',
        password: 'Staff123!',
        phone: '0909000002',
      });

    expect(createStaffResponse.status).toBe(201);
    expect(createStaffResponse.body.data.role).toBe('staff');

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'staff.new@example.com',
      password: 'Staff123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.role).toBe('staff');
  });

  it('allows staff to create a movie but blocks finance access', async () => {
    const staff = await createUser({
      email: 'staff@example.com',
      password: 'Staff123!',
      role: 'staff',
    });

    const movieResponse = await request(app)
      .post('/api/movies')
      .set(authHeader(staff))
      .send({
        title: 'Staff Movie',
        description: 'Created by staff',
        duration: 110,
        genre: ['Drama'],
        rating: 7.9,
        poster: 'https://example.com/staff-movie.jpg',
        trailer: 'https://example.com/staff-movie.mp4',
        releaseDate: '2025-06-01T00:00:00.000Z',
        status: 'published',
      });

    expect(movieResponse.status).toBe(201);
    expect(movieResponse.body.data.title).toBe('Staff Movie');

    const financeResponse = await request(app).get('/api/admin/finance').set(authHeader(staff));
    expect(financeResponse.status).toBe(403);
  });

  it('allows staff to create a showtime and initializes showtime seats', async () => {
    const staff = await createUser({
      email: 'ops.staff@example.com',
      password: 'Staff123!',
      role: 'staff',
    });
    const { movie, screen } = await seedCatalog();

    const showtimeResponse = await request(app)
      .post('/api/showtimes')
      .set(authHeader(staff))
      .send({
        movie: movie._id.toString(),
        screen: screen._id.toString(),
        startTime: '2026-04-02T10:00:00.000Z',
        endTime: '2026-04-02T12:00:00.000Z',
        price: 120000,
        status: 'scheduled',
      });

    expect(showtimeResponse.status).toBe(201);

    const seatsResponse = await request(app).get(`/api/showtimes/${showtimeResponse.body.data._id}/seats`);
    expect(seatsResponse.status).toBe(200);
    expect(seatsResponse.body.data).toHaveLength(6);
  });
});
