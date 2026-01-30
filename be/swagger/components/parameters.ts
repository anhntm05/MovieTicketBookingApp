// Common OpenAPI parameters
export const commonParameters = {
  id: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: 'Resource ID',
  },
};
