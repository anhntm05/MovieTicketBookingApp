# Swagger/OpenAPI Documentation Structure

## Overview

This project uses a modular, production-grade Swagger/OpenAPI 3.0 documentation structure. All API documentation is organized into separate schema and path files for better maintainability.

## Directory Structure

```
swagger/
├── schemas/              # Data model definitions
│   ├── user.schema.ts           # User models
│   ├── movie.schema.ts          # Movie models
│   ├── cinema.schema.ts         # Cinema models
│   ├── showtime.schema.ts       # Showtime models
│   ├── booking.schema.ts        # Booking models
│   ├── payment.schema.ts        # Payment models
│   ├── seat.schema.ts           # Seat models
│   ├── common.schema.ts         # Shared/common schemas
│   └── index.ts                 # Export all schemas
├── paths/               # API endpoint definitions
│   ├── auth.paths.ts            # Authentication endpoints
│   ├── movies.paths.ts          # Movie endpoints
│   ├── cinemas.paths.ts         # Cinema endpoints
│   ├── showtimes.paths.ts       # Showtime endpoints
│   ├── bookings.paths.ts        # Booking endpoints
│   ├── payments.paths.ts        # Payment endpoints
│   └── index.ts                 # Export all paths
├── components/          # Shared OpenAPI components
│   ├── security.ts              # Security schemes (JWT, etc.)
│   ├── responses.ts             # Common response definitions
│   └── parameters.ts            # Common parameters
├── swagger.config.ts    # Main Swagger configuration (combines all parts)
├── swagger.ui.ts        # Swagger UI setup and options
├── custom.css           # Custom Swagger UI styling
├── index.html          # Custom Swagger UI HTML
└── README.md           # This file
```

## How to Add New Endpoints

### 1. Create or Update Schema Files

Add your data models to the appropriate schema file:

```typescript
// swagger/schemas/example.schema.ts
export const exampleSchemas = {
  Example: {
    type: 'object',
    required: ['field1', 'field2'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      field1: { type: 'string', example: 'value1' },
      field2: { type: 'number', example: 100 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateExampleRequest: {
    type: 'object',
    required: ['field1', 'field2'],
    properties: {
      field1: { type: 'string' },
      field2: { type: 'number' },
    },
  },
};
```

### 2. Create Path File for New Resource

Create endpoint definitions:

```typescript
// swagger/paths/example.paths.ts
export const examplePaths = {
  '/api/examples': {
    get: {
      tags: ['Examples'],
      summary: 'Get all examples',
      description: 'Retrieve all example records',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number', default: 1 },
        },
      ],
      responses: {
        200: {
          description: 'Examples retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Example' },
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
      tags: ['Examples'],
      summary: 'Create an example',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateExampleRequest' },
          },
        },
      },
      responses: {
        201: { description: 'Example created successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/examples/{id}': {
    get: {
      tags: ['Examples'],
      summary: 'Get example by ID',
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
          description: 'Example retrieved',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Example' },
            },
          },
        },
        404: { description: 'Example not found' },
      },
    },
  },
};
```

### 3. Update Index Files

Update the index files to export new schemas and paths:

```typescript
// swagger/schemas/index.ts
import { exampleSchemas } from './example.schema';

export const allSchemas = {
  // ...existing schemas...
  ...exampleSchemas,
};
```

```typescript
// swagger/paths/index.ts
import { examplePaths } from './example.paths';

export const allPaths = {
  // ...existing paths...
  ...examplePaths,
};
```

## OpenAPI 3.0 Schema Reference

### Basic Schema Structure

```typescript
{
  type: 'object',                          // Data type
  required: ['field1', 'field2'],          // Required fields
  properties: {
    _id: { 
      type: 'string',                      // Type (string, number, boolean, array, object)
      example: '507f1f77bcf86cd799439011' // Example value
    },
    email: {
      type: 'string',
      format: 'email',                     // Format validation
      description: 'User email'            // Description
    },
    age: {
      type: 'number',
      minimum: 0,                          // Constraints
      maximum: 120
    },
    tags: {
      type: 'array',
      items: { type: 'string' }           // Array item type
    },
    createdAt: {
      type: 'string',
      format: 'date-time'                 // ISO 8601 format
    }
  }
}
```

### Path Definition Structure

```typescript
{
  '/api/resource': {
    get: {
      tags: ['Resource'],                     // Endpoint grouping
      summary: 'Short description',           // Summary title
      description: 'Long description',        // Detailed description
      security: [{ bearerAuth: [] }],        // Auth required
      parameters: [                           // Query/path params
        {
          in: 'query',                        // Parameter location
          name: 'page',
          schema: { type: 'number' },
          description: 'Page number',
        },
      ],
      responses: {
        200: {
          description: 'Success response',
          content: {
            'application/json': {
              schema: { ... },               // Response schema
              example: { ... }               // Example response
            },
          },
        },
        400: { description: 'Bad request' },  // Error responses
        401: { description: 'Unauthorized' },
        500: { description: 'Server error' },
      },
    },
    post: {
      // POST endpoint
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { ... },                 // Request schema
            example: { ... }                 // Example request
          },
        },
      },
      responses: { ... },
    },
    put: { ... },        // PUT endpoint
    delete: { ... },     // DELETE endpoint
  },
}
```

## Schema Reference Examples

### Using $ref for Schema References

```typescript
{
  $ref: '#/components/schemas/Movie'  // Reference to Movie schema
}
```

### Array of Schemas

```typescript
{
  type: 'array',
  items: { $ref: '#/components/schemas/Movie' }
}
```

## Best Practices

1. **Keep Schemas DRY**: Use `$ref` to reference common schemas instead of duplicating definitions
2. **Add Descriptions**: Every field should have a clear description
3. **Provide Examples**: Include realistic example values for every endpoint
4. **Document Error Codes**: Always document possible error responses (400, 401, 403, 404, 500)
5. **Consistent Naming**: Use consistent naming conventions for schemas and paths
6. **Organize by Resource**: Group related endpoints together with tags
7. **Security Annotations**: Always specify which endpoints require authentication

## Testing Endpoints in Swagger UI

1. **Without Authentication**: GET/POST endpoints without `security` property work without a token
2. **With Authentication**:
   - Click "Authorize" button at the top right
   - Enter token in format: `Bearer <your-jwt-token>`
   - All authenticated endpoints will automatically include the token

## Common HTTP Status Codes

- **200**: Success (GET, PUT)
- **201**: Created (POST)
- **204**: No Content (successful DELETE)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

## Swagger UI Configuration

The custom Swagger UI is configured in `swagger/swagger.ui.ts`:

- **Persistent Authorization**: Token is remembered across page reloads
- **Request Duration**: Shows API response time
- **Try It Out**: Enabled for all endpoints
- **Syntax Highlighting**: Monokai theme for code blocks
- **Custom CSS**: Stripe-inspired professional theme

## Generating Types from OpenAPI

If you implement type generation from OpenAPI schemas:

```bash
npm run swagger:generate-types
```

This will generate TypeScript types from the OpenAPI spec.

## Production Considerations

1. **Disable Swagger in Production**: Add environment check in `app.ts`
2. **API Versioning**: Use different servers for v1, v2 endpoints
3. **Rate Limiting**: Consider adding rate limiting to `/api-docs` endpoint
4. **Authentication**: May require admin role to view documentation
5. **CORS**: Ensure proper CORS headers for Swagger UI

## Accessing Documentation

Development:
```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Interactive API exploration
- "Try it out" functionality
- Request/response examples
- Authentication management
- Schema validation

---

For more information on OpenAPI 3.0 specification, visit: https://spec.openapis.org/oas/v3.0.3
