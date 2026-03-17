import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../src/config/database';
import { generateToken } from '../../src/utils/jwt';
import { User } from '../../src/models/User';
import { Movie } from '../../src/models/Movie';
import { Cinema } from '../../src/models/Cinema';
import { Screen } from '../../src/models/Screen';
import { Seat } from '../../src/models/Seat';
import { Showtime } from '../../src/models/Showtime';
import ShowtimeSeatService from '../../src/services/ShowtimeSeatService';
import { USER_ROLES } from '../../src/utils/constants';

let mongoServer: MongoMemoryServer | null = null;

export const startTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
};

export const stopTestDatabase = async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

export const createUser = async (overrides: Record<string, any> = {}) => {
  return User.create({
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: 'Password123!',
    phone: '0123456789',
    role: USER_ROLES.CUSTOMER,
    status: 'active',
    ...overrides,
  });
};

export const authHeader = (user: any) => ({
  Authorization: `Bearer ${generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  })}`,
});

export const seedCatalog = async () => {
  const movie = await Movie.create({
    title: 'Seed Movie',
    description: 'Seed description',
    duration: 120,
    genre: ['Action'],
    rating: 8.5,
    poster: 'https://example.com/poster.jpg',
    trailer: 'https://example.com/trailer.mp4',
    releaseDate: new Date('2025-01-01T00:00:00.000Z'),
    status: 'published',
  });

  const cinema = await Cinema.create({
    name: 'Seed Cinema',
    location: 'District 1',
    address: '1 Example Street',
    facilities: ['Parking'],
    status: 'active',
  });

  const screen = await Screen.create({
    cinema: cinema._id,
    name: 'Screen 1',
    totalSeats: 6,
    seatLayout: { A: 3, B: 3 },
    status: 'active',
  });

  const seats = await Seat.insertMany([
    { screen: screen._id, row: 'A', number: 1, type: 'standard', status: 'active' },
    { screen: screen._id, row: 'A', number: 2, type: 'standard', status: 'active' },
    { screen: screen._id, row: 'A', number: 3, type: 'vip', status: 'active' },
    { screen: screen._id, row: 'B', number: 1, type: 'standard', status: 'active' },
    { screen: screen._id, row: 'B', number: 2, type: 'vip', status: 'active' },
    { screen: screen._id, row: 'B', number: 3, type: 'premium', status: 'active' },
  ]);

  const showtime = await Showtime.create({
    movie: movie._id,
    screen: screen._id,
    startTime: new Date('2026-04-01T10:00:00.000Z'),
    endTime: new Date('2026-04-01T12:00:00.000Z'),
    price: 100000,
    status: 'scheduled',
  });

  await ShowtimeSeatService.initializeForShowtime(showtime._id.toString());

  return { movie, cinema, screen, seats, showtime };
};
