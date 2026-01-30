// Main Swagger/OpenAPI Configuration
import { allSchemas } from './schemas';
import { allPaths } from './paths';
import { securitySchemes } from './components/security';
import { commonResponses } from './components/responses';

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Movie Ticket Booking API',
    version: '1.0.0',
    description: 'Complete API documentation for the Movie Ticket Booking Application',
    contact: {
      name: 'API Support',
      email: 'support@moviebooking.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.moviebooking.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication and user registration endpoints',
    },
    {
      name: 'Movies',
      description: 'Movie management and retrieval',
    },
    {
      name: 'Cinemas',
      description: 'Cinema management and information',
    },
    {
      name: 'Showtimes',
      description: 'Movie showtime schedules',
    },
    {
      name: 'Bookings',
      description: 'Movie ticket booking management',
    },
    {
      name: 'Payments',
      description: 'Payment processing and management',
    },
  ],
  paths: allPaths,
  components: {
    schemas: allSchemas,
    securitySchemes,
    responses: commonResponses,
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
