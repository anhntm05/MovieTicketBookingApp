// OpenAPI 3.0 Showtime schema
export const showtimeSchemas = {
  Showtime: {
    type: 'object',
    required: ['movie', 'screen', 'startTime', 'endTime', 'price'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      movie: { type: 'string', example: 'Inception' },
      screen: { type: 'string', example: 'Screen 1' },
      startTime: { type: 'string', format: 'date-time', example: '2024-01-01T19:00:00Z' },
      endTime: { type: 'string', format: 'date-time', example: '2024-01-01T21:30:00Z' },
      price: { type: 'number', example: 10.5 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateShowtimeRequest: {
    type: 'object',
    required: ['movie', 'screen', 'startTime', 'endTime', 'price'],
    properties: {
      movie: { type: 'string' },
      screen: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      price: { type: 'number', minimum: 0 },
    },
  },
  UpdateShowtimeRequest: {
    type: 'object',
    properties: {
      movie: { type: 'string' },
      screen: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      price: { type: 'number' },
    },
  },
};
