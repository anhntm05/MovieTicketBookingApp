// OpenAPI 3.0 User schema
export const userSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      name: { type: 'string', example: 'John Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      phone: { type: 'string', example: '+1234567890' },
      role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['name', 'email', 'phone', 'role'],
  },
  CreateUserRequest: {
    type: 'object',
    required: ['name', 'email', 'password', 'phone'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      phone: { type: 'string', pattern: '^\\+?[0-9]{9,}$' },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      phone: { type: 'string' },
    },
  },
};
