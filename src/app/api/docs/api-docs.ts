/**
 * API Documentation
 * 
 * Base URL: /api
 */

export const apiDocs = {
  requests: {
    get: {
      endpoint: '/api/requests',
      description: 'Get paginated requests with optional filtering',
      params: {
        status: 'Filter by status (pending, approved, rejected, fulfilled)',
        customerId: 'Filter by customer ID',
        startDate: 'Filter by start date (ISO format)',
        endDate: 'Filter by end date (ISO format)',
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 10)'
      },
      response: {
        data: 'Array of request objects with relations',
        total: 'Total count of requests',
        page: 'Current page number',
        pageCount: 'Total number of pages'
      }
    },
    post: {
      endpoint: '/api/requests',
      description: 'Create a new request',
      body: {
        customer_id: 'UUID of the customer',
        product_id: 'UUID of the product',
        quantity: 'Number of items (min: 1)',
        budget: 'Budget amount (min: 0)',
        status: 'Request status (default: pending)'
      }
    },
    put: {
      endpoint: '/api/requests',
      description: 'Update an existing request',
      body: {
        id: 'UUID of the request',
        status: 'New status (optional)',
        quantity: 'New quantity (optional)',
        budget: 'New budget (optional)',
        notes: 'Update notes (optional)',
        updated_by: 'UUID of user making the update'
      }
    },
    delete: {
      endpoint: '/api/requests',
      description: 'Delete a request and related records',
      params: {
        id: 'UUID of the request to delete'
      }
    }
  },
  users: {
    get: {
      endpoint: '/api/users',
      description: 'Get paginated users with optional filtering',
      params: {
        role: 'Filter by role (admin, customer, supplier)',
        status: 'Filter by status (active, inactive)',
        search: 'Search by name or email',
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 10)'
      },
      response: {
        data: 'Array of user objects',
        total: 'Total count of users',
        page: 'Current page number',
        pageCount: 'Total number of pages'
      }
    },
    post: {
      endpoint: '/api/users',
      description: 'Create a new user',
      body: {
        email: 'User email (unique)',
        name: 'User full name',
        role: 'User role (admin, customer, supplier)',
        status: 'User status (default: active)'
      }
    },
    put: {
      endpoint: '/api/users',
      description: 'Update an existing user',
      body: {
        id: 'UUID of the user',
        email: 'New email (optional)',
        name: 'New name (optional)',
        role: 'New role (optional)',
        status: 'New status (optional)'
      }
    },
    delete: {
      endpoint: '/api/users',
      description: 'Delete a user if no related records exist',
      params: {
        id: 'UUID of the user to delete'
      }
    }
  },
  categories: {
    get: {
      endpoint: '/api/categories',
      description: 'Get paginated categories with optional search',
      params: {
        search: 'Search by category name',
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 10)'
      },
      response: {
        data: 'Array of category objects',
        total: 'Total count of categories',
        page: 'Current page number',
        pageCount: 'Total number of pages'
      }
    },
    post: {
      endpoint: '/api/categories',
      description: 'Create a new category',
      body: {
        name: 'Category name (unique)',
        description: 'Category description (optional)'
      }
    },
    put: {
      endpoint: '/api/categories',
      description: 'Update an existing category',
      body: {
        id: 'UUID of the category',
        name: 'New name (optional)',
        description: 'New description (optional)'
      }
    },
    delete: {
      endpoint: '/api/categories',
      description: 'Delete a category if no related products exist',
      params: {
        id: 'UUID of the category to delete'
      }
    }
  },
  errorCodes: {
    400: 'Bad Request - Invalid input data',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Insufficient permissions',
    404: 'Not Found - Resource does not exist',
    409: 'Conflict - Resource already exists',
    500: 'Internal Server Error'
  },
  authentication: {
    description: 'All endpoints require authentication via Bearer token',
    header: 'Authorization: Bearer <token>',
    errors: {
      invalidToken: 'Invalid or expired token',
      missingToken: 'Authentication token is required'
    }
  },
  rateLimiting: {
    description: 'API rate limiting per IP address',
    limits: {
      get: '100 requests per minute',
      post: '30 requests per minute',
      put: '30 requests per minute',
      delete: '10 requests per minute'
    }
  }
} 