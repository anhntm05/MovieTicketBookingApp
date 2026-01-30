// OpenAPI 3.0 Payment schema
export const paymentSchemas = {
  Payment: {
    type: 'object',
    required: ['booking', 'amount', 'method', 'status', 'transactionId'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      booking: { type: 'string', example: 'BookingId' },
      amount: { type: 'number', example: 20.0 },
      method: {
        type: 'string',
        enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
        example: 'credit_card',
      },
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
        example: 'completed',
      },
      transactionId: { type: 'string', example: 'txn_123456' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreatePaymentRequest: {
    type: 'object',
    required: ['booking', 'amount', 'method'],
    properties: {
      booking: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      method: { type: 'string', enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'] },
      cardNumber: { type: 'string' },
      cardholderName: { type: 'string' },
      expiryDate: { type: 'string', pattern: '^\\d{2}/\\d{2}$' },
      cvv: { type: 'string', pattern: '^\\d{3,4}$' },
    },
  },
  UpdatePaymentRequest: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
    },
  },
};
