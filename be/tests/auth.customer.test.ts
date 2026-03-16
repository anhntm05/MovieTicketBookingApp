import request from 'supertest';
import app from '../src/app';
import { clearDatabase, seedCatalog, startTestDatabase, stopTestDatabase } from './helpers/testUtils';

describe('Customer auth and discovery flows', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('registers and logs in a customer', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Customer One',
      email: 'customer.one@example.com',
      password: 'Customer123!',
      phone: '0909000001',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.user.role).toBe('customer');

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'customer.one@example.com',
      password: 'Customer123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBeDefined();
  });

  it('returns paginated movie and showtime discovery data', async () => {
    const { movie, showtime } = await seedCatalog();

    const movieResponse = await request(app).get('/api/movies');
    expect(movieResponse.status).toBe(200);
    expect(movieResponse.body.data).toHaveLength(1);
    expect(movieResponse.body.data[0]._id).toBe(movie._id.toString());

    const showtimeResponse = await request(app).get('/api/showtimes');
    expect(showtimeResponse.status).toBe(200);
    expect(showtimeResponse.body.data).toHaveLength(1);
    expect(showtimeResponse.body.data[0]._id).toBe(showtime._id.toString());

    const seatsResponse = await request(app).get(`/api/showtimes/${showtime._id.toString()}/seats`);
    expect(seatsResponse.status).toBe(200);
    expect(seatsResponse.body.data).toHaveLength(6);
  });
});
