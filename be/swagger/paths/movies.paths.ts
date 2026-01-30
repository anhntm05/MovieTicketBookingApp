// Movie Paths - OpenAPI 3.0 format
export const moviePaths = {
  '/api/movies': {
    get: {
      tags: ['Movies'],
      summary: 'Get all movies',
      description: `Retrieve a list of all available movies with optional filtering and pagination.

**Usage Tips:**
- Use \`page\` and \`limit\` for pagination
- Use \`genre\` to filter by movie type (e.g., "Action", "Drama", "Sci-Fi")
- Use \`search\` to find movies by title`,
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number', default: 1 },
          description: 'Page number for pagination (starts at 1)',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number', default: 10 },
          description: 'Number of movies per page',
        },
        {
          in: 'query',
          name: 'genre',
          schema: { type: 'string' },
          description: 'Filter by genre (e.g., "Action", "Drama", "Sci-Fi")',
        },
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search by movie title (partial match)',
        },
      ],
      responses: {
        200: {
          description: 'Movies retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Movie' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      pages: { type: 'number' },
                    },
                  },
                },
              },
              example: {
                success: true,
                data: [
                  {
                    _id: '507f1f77bcf86cd799439011',
                    title: 'Avatar 2',
                    description: 'Epic sci-fi adventure sequel with groundbreaking visuals',
                    genre: ['Action', 'Sci-Fi'],
                    duration: 192,
                    rating: 8.5,
                    releaseDate: '2022-12-16',
                    poster: 'https://example.com/avatar2.jpg',
                    trailer: 'https://youtube.com/watch?v=example',
                  },
                ],
                pagination: { page: 1, limit: 10, total: 25, pages: 3 },
              },
            },
          },
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['Movies'],
      summary: 'Create a new movie',
      description: `Add a new movie to the system. 
**Admin only endpoint** - requires bearer token from authenticated admin account.

**How to test:**
1. First, register/login as admin using /api/auth endpoints
2. Copy the JWT token from the response
3. Click "Authorize" button and paste: \`Bearer <your-token>\`
4. Click "Try it out" on this endpoint
5. Fill in the movie details
6. Click "Execute"`,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateMovieRequest' },
            example: {
              title: 'Inception',
              description: 'A thief who steals corporate secrets through dream-sharing technology',
              duration: 148,
              genre: ['Sci-Fi', 'Thriller', 'Action'],
              rating: 8.8,
              poster: 'https://example.com/inception.jpg',
              trailer: 'https://youtube.com/watch?v=YoHD2hxoogg',
              releaseDate: '2010-07-16',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Movie created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Movie' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        401: {
          description: 'Unauthorized - token missing or invalid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        403: {
          description: 'Forbidden - admin access required',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        500: {
          description: 'Server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/api/movies/{id}': {
    get: {
      tags: ['Movies'],
      summary: 'Get a movie by ID',
      description: 'Retrieve detailed information about a specific movie',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Movie ID (MongoDB ObjectId format)',
          example: '507f1f77bcf86cd799439011',
        },
      ],
      responses: {
        200: {
          description: 'Movie retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Movie' },
                },
              },
            },
          },
        },
        404: {
          description: 'Movie not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        500: {
          description: 'Server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    put: {
      tags: ['Movies'],
      summary: 'Update a movie',
      description: 'Update movie information (Admin only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Movie ID',
          example: '507f1f77bcf86cd799439011',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateMovieRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Movie updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/Movie' },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        403: {
          description: 'Forbidden - admin access required',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        404: {
          description: 'Movie not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        500: {
          description: 'Server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    delete: {
      tags: ['Movies'],
      summary: 'Delete a movie',
      description: 'Remove a movie from the system (Admin only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Movie ID',
          example: '507f1f77bcf86cd799439011',
        },
      ],
      responses: {
        200: {
          description: 'Movie deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
              example: {
                success: true,
                message: 'Movie deleted successfully',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        403: {
          description: 'Forbidden - admin access required',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        404: {
          description: 'Movie not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        500: {
          description: 'Server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
};
