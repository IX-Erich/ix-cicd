/**
 * Configuration API Routes
 * Handles configuration management operations
 */

import { Router } from 'express'
import { logger } from '../utils/logger.js'
import { validateConfigObject } from '../utils/configValidator.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/**
 * POST /api/v1/config/validate
 * Validate configuration object
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const config = req.body

  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Configuration object is required',
      timestamp: new Date().toISOString()
    })
  }

  logger.info('Validating configuration via API')

  const validation = await validateConfigObject(config)

  if (validation.success) {
    res.json({
      success: true,
      message: 'Configuration is valid',
      timestamp: new Date().toISOString()
    })
  } else {
    res.status(400).json({
      success: false,
      error: 'Configuration Validation Failed',
      message: 'The provided configuration contains errors',
      errors: validation.errors,
      timestamp: new Date().toISOString()
    })
  }
}))

/**
 * GET /api/v1/config/schema
 * Get the configuration schema
 */
router.get('/schema', asyncHandler(async (req, res) => {
  // TODO: Return the actual schema file
  res.json({
    success: true,
    message: 'Schema endpoint not yet implemented',
    timestamp: new Date().toISOString()
  })
}))

export default router