// OpenAPI 3.0 Cinema schema
export const cinemaSchemas = {
  Cinema: {
    type: 'object',
    required: ['name', 'location', 'address'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      name: { type: 'string', example: 'CGV Hanoi' },
      location: { type: 'string', example: 'Hanoi' },
      address: { type: 'string', example: '123 Tran Hung Dao, Hanoi' },
      facilities: {
        type: 'array',
        items: { type: 'string' },
        example: ['IMAX', '4DX', 'Premium Seats'],
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateCinemaRequest: {
    type: 'object',
    required: ['name', 'location', 'address'],
    properties: {
      name: { type: 'string', minLength: 1 },
      location: { type: 'string' },
      address: { type: 'string' },
      facilities: { type: 'array', items: { type: 'string' } },
    },
  },
  UpdateCinemaRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      location: { type: 'string' },
      address: { type: 'string' },
      facilities: { type: 'array', items: { type: 'string' } },
    },
  },
};
