// Showtime Paths - OpenAPI 3.0 format
export const showtimePaths = {
  '/api/showtimes': {
    get: {
      tags: ['Showtimes'],
      summary: 'Get all showtimes',
      description: 'Retrieve a list of all showtimes with filtering options',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number', default: 1 },
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number', default: 10 },
        },
        {
          in: 'query',
          name: 'movieId',
          schema: { type: 'string' },
          description: 'Filter by movie ID',
        },
        {
          in: 'query',
          name: 'cinemaId',
          schema: { type: 'string' },
          description: 'Filter by cinema ID',
        },
        {
          in: 'query',
          name: 'date',
          schema: { type: 'string', format: 'date' },
          description: 'Filter by date (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Showtimes retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Showtime' },
                  },
                },
              },
              example: {
                success: true,
                data: [
                  {
                    _id: '507f1f77bcf86cd799439011',
                    movie: '507f1f77bcf86cd799439001',
                    screen: '507f1f77bcf86cd799439101',
                    startTime: '2024-02-15T14:30:00Z',
                    endTime: '2024-02-15T16:22:00Z',
                    price: 150000,
                  },
                ],
              },
            },
          },
        },
        500: {
          description: 'Server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    post: {
      tags: ['Showtimes'],
      summary: 'Create a new showtime',
      description: 'Add a new movie showtime (Admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['movie', 'screen', 'startTime', 'endTime', 'price'],
              properties: {
                movie: { type: 'string', description: 'Movie ID' },
                screen: { type: 'string', description: 'Screen ID' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                price: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Showtime created successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden - admin access required' },
        500: { description: 'Server error' },
      },
    },
  },
  '/api/showtimes/{id}': {
    get: {
      tags: ['Showtimes'],
      summary: 'Get showtime by ID',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Showtime retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Showtime' },
                },
              },
            },
          },
        },
        404: { description: 'Showtime not found' },
        500: { description: 'Server error' },
      },
    },
    put: {
      tags: ['Showtimes'],
      summary: 'Update a showtime',
      description: 'Update showtime information (Admin only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                movie: { type: 'string' },
                screen: { type: 'string' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                price: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Showtime updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Showtime not found' },
        500: { description: 'Server error' },
      },
    },
    delete: {
      tags: ['Showtimes'],
      summary: 'Delete a showtime',
      description: 'Remove a showtime from the system (Admin only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: { description: 'Showtime deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Showtime not found' },
        500: { description: 'Server error' },
      },
    },
  },
  '/api/showtimes/{showtimeId}/seats': {
    get: {
      tags: ['Showtimes'],
      summary: 'Get available seats for a showtime',
      description: 'Retrieve list of available seats for a specific showtime',
      parameters: [
        {
          in: 'path',
          name: 'showtimeId',
          required: true,
          schema: { type: 'string' },
          description: 'Showtime ID',
        },
      ],
      responses: {
        200: {
          description: 'Available seats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Seat' },
                  },
                },
              },
            },
          },
        },
        404: { description: 'Showtime not found' },
        500: { description: 'Server error' },
      },
    },
  },
};
