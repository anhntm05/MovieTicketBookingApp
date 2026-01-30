// OpenAPI 3.0 Movie schema
export const movieSchemas = {
  Movie: {
    type: 'object',
    required: ['title', 'duration', 'genre'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      title: { type: 'string', example: 'Inception' },
      description: { type: 'string', example: 'A mind-bending thriller' },
      duration: { type: 'number', example: 148 },
      genre: {
        type: 'array',
        items: { type: 'string' },
        example: ['Sci-Fi', 'Thriller', 'Action'],
      },
      rating: { type: 'number', minimum: 0, maximum: 10, example: 8.8 },
      poster: { type: 'string', format: 'uri', example: 'https://example.com/poster.jpg' },
      trailer: { type: 'string', format: 'uri', example: 'https://youtube.com/watch?v=example' },
      releaseDate: { type: 'string', format: 'date', example: '2024-12-25' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateMovieRequest: {
    type: 'object',
    required: ['title', 'duration', 'genre', 'rating', 'poster', 'trailer', 'releaseDate'],
    properties: {
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      duration: { type: 'number', minimum: 1 },
      genre: { type: 'array', items: { type: 'string' } },
      rating: { type: 'number', minimum: 0, maximum: 10 },
      poster: { type: 'string', format: 'uri' },
      trailer: { type: 'string', format: 'uri' },
      releaseDate: { type: 'string', format: 'date' },
    },
  },
  UpdateMovieRequest: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      duration: { type: 'number' },
      genre: { type: 'array', items: { type: 'string' } },
      rating: { type: 'number' },
      poster: { type: 'string' },
      trailer: { type: 'string' },
      releaseDate: { type: 'string', format: 'date' },
    },
  },
};
