/**
 * Async Handler Utility
 * Wraps async functions to catch errors and pass them to Express error handler
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler