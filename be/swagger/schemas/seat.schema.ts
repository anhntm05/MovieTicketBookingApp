// OpenAPI 3.0 Seat schema
export const seatSchemas = {
  Seat: {
    type: 'object',
    required: ['screen', 'row', 'number', 'type'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      screen: { type: 'string', example: 'ScreenId' },
      row: { type: 'string', example: 'A' },
      number: { type: 'number', example: 1 },
      type: {
        type: 'string',
        enum: ['standard', 'vip', 'premium'],
        example: 'standard',
      },
      isOccupied: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateSeatRequest: {
    type: 'object',
    required: ['screen', 'row', 'number', 'type'],
    properties: {
      screen: { type: 'string' },
      row: { type: 'string' },
      number: { type: 'number', minimum: 1 },
      type: { type: 'string', enum: ['standard', 'vip', 'premium'] },
    },
  },
  UpdateSeatRequest: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['standard', 'vip', 'premium'] },
      isOccupied: { type: 'boolean' },
    },
  },
};
