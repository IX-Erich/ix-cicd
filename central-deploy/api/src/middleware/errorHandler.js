/**
 * Global Error Handler Middleware
 * Handles all errors thrown in the application
 */

import { logger } from '../utils/logger.js'

export const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  })

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  let statusCode = error.statusCode || error.status || 500
  let message = 'Internal Server Error'
  let details = null

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    details = error.details || error.message
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403
    message = 'Forbidden'
  } else if (error.name === 'NotFoundError') {
    statusCode = 404
    message = 'Not Found'
  } else if (error.code === 'ENOENT') {
    statusCode = 404
    message = 'Resource not found'
  } else if (error.code === 'EACCES') {
    statusCode = 403
    message = 'Permission denied'
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Invalid JSON in request body'
  } else if (error.type === 'entity.too.large') {
    statusCode = 413
    message = 'Request entity too large'
  } else if (isDevelopment && statusCode === 500) {
    // Show detailed error message in development
    message = error.message
    details = error.stack
  }

  // Send error response
  const response = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.id || undefined
  }

  if (details && isDevelopment) {
    response.details = details
  }

  res.status(statusCode).json(response)
}

export default errorHandler