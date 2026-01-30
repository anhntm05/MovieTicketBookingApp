// OpenAPI 3.0 Booking schema
export const bookingSchemas = {
  Booking: {
    type: 'object',
    required: ['user', 'showtime', 'seats', 'totalPrice', 'status', 'bookingDate'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      user: { type: 'string', example: 'UserId' },
      showtime: { type: 'string', example: 'ShowtimeId' },
      seats: {
        type: 'array',
        items: { type: 'string' },
        example: ['A1', 'A2'],
      },
      totalPrice: { type: 'number', example: 20.0 },
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'cancelled'],
        example: 'confirmed',
      },
      bookingDate: { type: 'string', format: 'date-time', example: '2024-01-01T18:00:00Z' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateBookingRequest: {
    type: 'object',
    required: ['showtime', 'seats'],
    properties: {
      showtime: { type: 'string' },
      seats: { type: 'array', items: { type: 'string' }, minItems: 1 },
    },
  },
  UpdateBookingRequest: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
    },
  },
};
