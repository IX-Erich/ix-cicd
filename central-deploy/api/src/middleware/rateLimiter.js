/**
 * Rate Limiter Middleware
 * Provides API rate limiting to prevent abuse
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'
import { logger } from '../utils/logger.js'

// Rate limiter configuration
const rateLimiterConfig = {
  keyPrefix: 'ix-deploy-api',
  points: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60, // Per 15 minutes (in seconds)
  blockDuration: 60 * 5, // Block for 5 minutes if rate limit exceeded
  execEvenly: true // Execute requests evenly across the duration window
}

const rateLimiterInstance = new RateLimiterMemory(rateLimiterConfig)

export const rateLimiter = async (req, res, next) => {
  try {
    // Use IP address as the key, but allow override with API key
    const key = req.get('X-API-Key') || req.ip
    
    await rateLimiterInstance.consume(key)
    next()
  } catch (rejRes) {
    // Rate limit exceeded
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    
    logger.warn(`Rate limit exceeded for ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: `${req.method} ${req.path}`,
      retryAfter: secs
    })
    
    res.set('Retry-After', String(secs))
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: secs,
      timestamp: new Date().toISOString()
    })
  }
}

export default rateLimiter
