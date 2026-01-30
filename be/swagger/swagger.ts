import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import { swaggerDefinition } from './swagger.config';

const options: Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './swagger/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);