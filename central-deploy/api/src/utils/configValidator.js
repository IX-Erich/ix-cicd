/**
 * Configuration Validator
 * Validates deployment configuration using JSON Schema
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

let deployConfigSchema = null

// Load the JSON schema
async function loadSchema() {
  if (!deployConfigSchema) {
    try {
      const schemaPath = path.join(__dirname, '../../../config/deploy-config.schema.json')
      const schemaContent = await fs.readFile(schemaPath, 'utf8')
      deployConfigSchema = JSON.parse(schemaContent)
      logger.debug('Loaded deployment configuration schema')
    } catch (error) {
      logger.warn('Could not load deployment configuration schema:', error.message)
      // Provide basic schema as fallback
      deployConfigSchema = {
        type: 'object',
        required: ['version', 'projects'],
        properties: {
          version: { type: 'string' },
          projects: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
  return deployConfigSchema
}

/**
 * Validate configuration object against schema
 * @param {Object} config - Configuration object to validate
 * @returns {Object} - Validation result with success flag and errors
 */
export async function validateConfigObject(config) {
  try {
    const schema = await loadSchema()
    const validate = ajv.compile(schema)
    const valid = validate(config)
    
    if (valid) {
      return {
        success: true,
        errors: []
      }
    } else {
      return {
        success: false,
        errors: validate.errors.map(error => ({
          path: error.instancePath || error.dataPath,
          message: error.message,
          value: error.data,
          schema: error.schemaPath
        }))
      }
    }
  } catch (error) {
    logger.error('Configuration validation error:', error)
    return {
      success: false,
      errors: [{
        path: '',
        message: 'Schema validation failed: ' + error.message,
        value: null,
        schema: null
      }]
    }
  }
}

/**
 * Validate configuration file
 * @param {string} configPath - Path to configuration file
 * @returns {Object} - Validation result
 */
export async function validateConfigFile(configPath) {
  try {
    // Check if file exists
    await fs.access(configPath)
    
    // Read and parse configuration
    const configContent = await fs.readFile(configPath, 'utf8')
    const config = JSON.parse(configContent)
    
    // Validate against schema
    const validation = await validateConfigObject(config)
    
    if (validation.success) {
      // Additional custom validations
      const customValidation = performCustomValidations(config)
      if (!customValidation.success) {
        return customValidation
      }
    }
    
    return validation
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        errors: [{
          path: '',
          message: 'Configuration file not found',
          value: configPath,
          schema: null
        }]
      }
    } else if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: [{
          path: '',
          message: 'Invalid JSON in configuration file: ' + error.message,
          value: null,
          schema: null
        }]
      }
    } else {
      logger.error('Configuration file validation error:', error)
      return {
        success: false,
        errors: [{
          path: '',
          message: 'Configuration validation failed: ' + error.message,
          value: null,
          schema: null
        }]
      }
    }
  }
}

/**
 * Perform custom validations beyond schema validation
 * @param {Object} config - Configuration object
 * @returns {Object} - Validation result
 */
export function performCustomValidations(config) {
  const errors = []
  
  // Check for duplicate project IDs
  if (config.projects) {
    const projectIds = config.projects.map(p => p.id)
    const duplicateIds = projectIds.filter((id, index) => projectIds.indexOf(id) !== index)
    
    if (duplicateIds.length > 0) {
      errors.push({
        path: '/projects',
        message: `Duplicate project IDs found: ${duplicateIds.join(', ')}`,
        value: duplicateIds,
        schema: null
      })
    }
    
    // Validate domain names are unique
    const domains = config.projects
      .filter(p => p.deployment && p.deployment.domain_name)
      .map(p => p.deployment.domain_name)
    
    const duplicateDomains = domains.filter((domain, index) => domains.indexOf(domain) !== index)
    
    if (duplicateDomains.length > 0) {
      errors.push({
        path: '/projects/*/deployment/domain_name',
        message: `Duplicate domain names found: ${duplicateDomains.join(', ')}`,
        value: duplicateDomains,
        schema: null
      })
    }
    
    // Validate credential references exist
    for (const project of config.projects) {
      if (project.deployment && project.deployment.aws_profile_ref) {
        const profileExists = config.credentials?.aws_profiles?.some(
          p => p.name === project.deployment.aws_profile_ref
        )
        if (!profileExists) {
          errors.push({
            path: `/projects/${project.id}/deployment/aws_profile_ref`,
            message: `Referenced AWS profile '${project.deployment.aws_profile_ref}' not found in credentials`,
            value: project.deployment.aws_profile_ref,
            schema: null
          })
        }
      }
      
      if (project.repository && project.repository.github_token_ref) {
        const tokenExists = config.credentials?.github_tokens?.some(
          t => t.name === project.repository.github_token_ref
        )
        if (!tokenExists) {
          errors.push({
            path: `/projects/${project.id}/repository/github_token_ref`,
            message: `Referenced GitHub token '${project.repository.github_token_ref}' not found in credentials`,
            value: project.repository.github_token_ref,
            schema: null
          })
        }
      }
    }
  }
  
  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Quick validation check - used by server startup
 * @returns {boolean} - Whether basic configuration is valid
 */
export async function validateConfig() {
  const configPath = process.env.CONFIG_PATH || path.join(__dirname, '../../../config/deploy-config.json')
  
  try {
    const result = await validateConfigFile(configPath)
    
    if (!result.success) {
      if (process.env.CONFIG_VALIDATION_STRICT === 'true') {
        throw new Error('Configuration validation failed: ' + result.errors.map(e => e.message).join(', '))
      } else {
        logger.warn('Configuration validation warnings:', result.errors)
      }
    }
    
    return result.success
  } catch (error) {
    logger.error('Configuration validation error:', error)
    if (process.env.CONFIG_VALIDATION_STRICT === 'true') {
      throw error
    }
    return false
  }
}

