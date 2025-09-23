#!/usr/bin/env node

/**
 * IX Central Deploy API Server
 * Centralized deployment system for static sites
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'

import { logger } from './utils/logger.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { validateConfig } from './utils/configValidator.js'

// Route imports
import projectRoutes from './routes/projects.js'
import deploymentRoutes from './routes/deployments.js'
import configRoutes from './routes/config.js'
import webhookRoutes from './routes/webhooks.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Configuration
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'
const API_VERSION = process.env.API_VERSION || 'v1'

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}))

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://dev.imaginariax.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}

app.use(cors(corsOptions))
app.use(compression())

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }))
}

// Rate limiting
app.use(rateLimiter)

// Health check endpoint (before auth)
app.use('/health', healthRoutes)

// API routes
const apiRouter = express.Router()

// Authentication routes
apiRouter.use('/auth', authRoutes)

// Protected routes (require authentication in production)
if (NODE_ENV === 'production') {
  // Add authentication middleware here
  // apiRouter.use(authMiddleware)
}

// Main API routes
apiRouter.use('/projects', projectRoutes)
apiRouter.use('/deployments', deploymentRoutes)
apiRouter.use('/config', configRoutes)
apiRouter.use('/webhooks', webhookRoutes)

// Mount API router
app.use(`/api/${API_VERSION}`, apiRouter)

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  logger.info('WebSocket connection established')
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      logger.info('WebSocket message received:', message)
      
      // Handle different message types
      switch (message.type) {
        case 'subscribe':
          // Subscribe to deployment updates
          ws.projectId = message.projectId
          ws.send(JSON.stringify({
            type: 'subscribed',
            projectId: message.projectId,
            timestamp: new Date().toISOString()
          }))
          break
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }))
          break
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          }))
      }
    } catch (error) {
      logger.error('WebSocket message error:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }))
    }
  })
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed')
  })
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error)
  })
})

// Broadcast function for deployment updates
export const broadcastDeploymentUpdate = (projectId, data) => {
  const message = JSON.stringify({
    type: 'deployment_update',
    projectId,
    data,
    timestamp: new Date().toISOString()
  })
  
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.projectId === projectId) { // OPEN
      client.send(message)
    }
  })
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
app.use(errorHandler)

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  
  server.close(() => {
    logger.info('HTTP server closed')
    
    // Close WebSocket connections
    wss.clients.forEach(client => {
      client.terminate()
    })
    
    wss.close(() => {
      logger.info('WebSocket server closed')
      process.exit(0)
    })
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 IX Central Deploy API Server started`)
  logger.info(`📍 Environment: ${NODE_ENV}`)
  logger.info(`🌐 Server running on port ${PORT}`)
  logger.info(`📋 API Version: ${API_VERSION}`)
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`)
  logger.info(`💻 Health Check: http://localhost:${PORT}/health`)
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}`)
  
  // Validate configuration on startup
  try {
    validateConfig()
    logger.info('✅ Configuration validation passed')
  } catch (error) {
    logger.warn('⚠️  Configuration validation failed:', error.message)
  }
})

export default app