/**
 * Winston Logger Configuration
 * Centralized logging for the IX Deploy API
 */

import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
}

winston.addColors(colors)

// Custom format for better readability
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...extra } = info
    const extraString = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : ''
    
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}${extraString}`
    }
    
    return `${timestamp} [${level}]: ${message}${extraString}`
  })
)

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs')

// Transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
]

// Add file transports in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  )
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
})

// Stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim())
  }
}

// Helper functions for structured logging
export const logDeployment = (projectId, deploymentId, message, extra = {}) => {
  logger.info(message, {
    projectId,
    deploymentId,
    component: 'deployment',
    ...extra
  })
}

export const logProject = (projectId, message, extra = {}) => {
  logger.info(message, {
    projectId,
    component: 'project',
    ...extra
  })
}

export const logAPI = (method, endpoint, statusCode, responseTime, extra = {}) => {
  logger.http(`${method} ${endpoint} ${statusCode} - ${responseTime}ms`, {
    component: 'api',
    method,
    endpoint,
    statusCode,
    responseTime,
    ...extra
  })
}

export const logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    ...context
  })
}

export default logger