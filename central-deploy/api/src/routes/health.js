/**
 * Health Check Routes
 * Provides health and readiness endpoints for monitoring
 */

import { Router } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { asyncHandler } from '../utils/asyncHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ix-central-deploy-api',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
}))

// Detailed health check with dependency status
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now()
  
  // Check file system access
  let fsAccess = false
  try {
    const configPath = path.join(__dirname, '../../../config')
    await fs.access(configPath)
    fsAccess = true
  } catch (error) {
    // File system check failed
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage()
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
  }

  const responseTime = Date.now() - startTime
  const overallHealthy = fsAccess

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'unhealthy',
    service: 'ix-central-deploy-api',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      filesystem: fsAccess ? 'healthy' : 'unhealthy'
    },
    performance: {
      responseTime: `${responseTime}ms`,
      memory: memoryUsageMB,
      cpuUsage: process.cpuUsage()
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  })
}))

// Readiness probe
router.get('/ready', asyncHandler(async (req, res) => {
  // Check if the service is ready to serve requests
  // This could include checking database connections, external services, etc.
  
  const ready = true // Add actual readiness checks here
  
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    service: 'ix-central-deploy-api',
    timestamp: new Date().toISOString()
  })
}))

// Liveness probe
router.get('/live', asyncHandler(async (req, res) => {
  // Basic liveness check - if this endpoint responds, the service is alive
  res.json({
    status: 'alive',
    service: 'ix-central-deploy-api',
    timestamp: new Date().toISOString()
  })
}))

export default router