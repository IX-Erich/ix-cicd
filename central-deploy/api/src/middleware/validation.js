/**
 * Validation Middleware
 * Provides request validation for API endpoints
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { logger } from '../utils/logger.js'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

// Project validation schema
const projectSchema = {
  type: 'object',
  required: ['id', 'name', 'repository', 'deployment'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      minLength: 1,
      maxLength: 50
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    description: {
      type: 'string',
      maxLength: 500
    },
    repository: {
      type: 'object',
      required: ['url'],
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          pattern: '^https://github\\.com/[^/]+/[^/]+(\\.git)?$'
        },
        branch: {
          type: 'string',
          default: 'main'
        },
        private: {
          type: 'boolean',
          default: false
        },
        github_token_ref: {
          type: 'string'
        }
      }
    },
    deployment: {
      type: 'object',
      required: ['domain_name'],
      properties: {
        domain_name: {
          type: 'string',
          format: 'hostname'
        },
        aws_profile_ref: {
          type: 'string'
        },
        environment: {
          type: 'string',
          enum: ['development', 'staging', 'production']
        },
        spa_mode: {
          type: 'boolean'
        },
        custom_index: {
          type: 'string'
        },
        include_robots_txt: {
          type: 'boolean'
        },
        auto_deploy: {
          type: 'boolean'
        }
      }
    },
    build: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: ['react', 'vue', 'angular', 'jekyll', 'gatsby', 'nextjs', 'static', 'custom']
        },
        node_version: {
          type: 'string'
        },
        package_manager: {
          type: 'string',
          enum: ['npm', 'yarn', 'pnpm']
        },
        build_command: {
          type: 'string'
        },
        build_dir: {
          type: 'string'
        },
        install_command: {
          type: 'string'
        },
        exclude_patterns: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        environment_variables: {
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        },
        timeout: {
          type: 'integer',
          minimum: 60,
          maximum: 3600
        }
      }
    },
    notifications: {
      type: 'object',
      properties: {
        slack: {
          type: 'object',
          properties: {
            webhook_url: {
              type: 'string',
              format: 'uri'
            },
            channel: {
              type: 'string'
            }
          }
        },
        email: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          }
        }
      }
    },
    monitoring: {
      type: 'object',
      properties: {
        health_check_path: {
          type: 'string'
        },
        uptime_monitoring: {
          type: 'boolean'
        }
      }
    },
    tags: {
      type: 'object',
      additionalProperties: {
        type: 'string'
      }
    },
    status: {
      type: 'string',
      enum: ['active', 'paused', 'archived']
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  }
}

const validateProject = ajv.compile(projectSchema)

/**
 * Middleware to validate project data
 */
export const validateProjectData = (req, res, next) => {
  const valid = validateProject(req.body)
  
  if (!valid) {
    const errors = validateProject.errors.map(error => ({
      path: error.instancePath || error.dataPath,
      message: error.message,
      value: error.data,
      allowedValues: error.params?.allowedValues
    }))
    
    logger.warn('Project validation failed', { errors, body: req.body })
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'The provided project data is invalid',
      errors,
      timestamp: new Date().toISOString()
    })
  }
  
  next()
}

/**
 * Generic validation middleware factory
 */
export const createValidationMiddleware = (schema) => {
  const validate = ajv.compile(schema)
  
  return (req, res, next) => {
    const valid = validate(req.body)
    
    if (!valid) {
      const errors = validate.errors.map(error => ({
        path: error.instancePath || error.dataPath,
        message: error.message,
        value: error.data
      }))
      
      logger.warn('Validation failed', { errors, body: req.body })
      
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'The provided data is invalid',
        errors,
        timestamp: new Date().toISOString()
      })
    }
    
    next()
  }
}

export { projectSchema }
export default { validateProjectData, createValidationMiddleware }