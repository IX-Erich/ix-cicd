/**
 * Projects API Routes
 * Handles CRUD operations for deployment projects
 */

import { Router } from 'express'
import { logger } from '../utils/logger.js'
import { ProjectService } from '../services/ProjectService.js'
import { validateProjectData } from '../middleware/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const projectService = new ProjectService()

/**
 * GET /api/v1/projects
 * Get all projects with optional filtering
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    status,
    environment,
    framework,
    page = 1,
    limit = 20,
    sort = 'name',
    order = 'asc',
    search
  } = req.query

  const filters = {
    ...(status && { status }),
    ...(environment && { environment }),
    ...(framework && { framework }),
    ...(search && { search })
  }

  const options = {
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 100), // Max 100 per page
    sort,
    order: order.toLowerCase() === 'desc' ? 'desc' : 'asc'
  }

  const result = await projectService.getProjects(filters, options)

  res.json({
    success: true,
    data: result.projects,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages
    },
    timestamp: new Date().toISOString()
  })
}))

/**
 * GET /api/v1/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const project = await projectService.getProject(id)
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID '${id}' does not exist`,
      timestamp: new Date().toISOString()
    })
  }

  res.json({
    success: true,
    data: project,
    timestamp: new Date().toISOString()
  })
}))

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', validateProjectData, asyncHandler(async (req, res) => {
  const projectData = req.body

  // Add timestamps
  projectData.created_at = new Date().toISOString()
  projectData.updated_at = new Date().toISOString()

  const project = await projectService.createProject(projectData)

  logger.info(`Project created: ${project.id}`, { project: project.name })

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully',
    timestamp: new Date().toISOString()
  })
}))

/**
 * PUT /api/v1/projects/:id
 * Update an existing project
 */
router.put('/:id', validateProjectData, asyncHandler(async (req, res) => {
  const { id } = req.params
  const projectData = req.body

  // Update timestamp
  projectData.updated_at = new Date().toISOString()

  const project = await projectService.updateProject(id, projectData)

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID '${id}' does not exist`,
      timestamp: new Date().toISOString()
    })
  }

  logger.info(`Project updated: ${id}`, { project: project.name })

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully',
    timestamp: new Date().toISOString()
  })
}))

/**
 * PATCH /api/v1/projects/:id
 * Partially update a project
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = req.body

  // Update timestamp
  updates.updated_at = new Date().toISOString()

  const project = await projectService.patchProject(id, updates)

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      message: `Project with ID '${id}' does not exist`,
      timestamp: new Date().toISOString()
    })
  }

  logger.info(`Project patched: ${id}`, { updates: Object.keys(updates) })

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully',
    timestamp: new Date().toISOString()
  })
}))

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { force = false } = req.query

  const result = await projectService.deleteProject(id, force)

  if (!result.success) {
    return res.status(result.statusCode || 404).json({
      success: false,
      error: result.error,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  }

  logger.info(`Project deleted: ${id}`, { force })

  res.json({
    success: true,
    message: result.message,
    timestamp: new Date().toISOString()
  })
}))

/**
 * POST /api/v1/projects/:id/deploy
 * Trigger a deployment for a specific project
 */
router.post('/:id/deploy', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { branch, environment, force = false } = req.body

  const deployment = await projectService.triggerDeployment(id, {
    branch,
    environment,
    force,
    triggeredBy: req.user?.id || 'api',
    triggeredAt: new Date().toISOString()
  })

  if (!deployment.success) {
    return res.status(deployment.statusCode || 400).json({
      success: false,
      error: deployment.error,
      message: deployment.message,
      timestamp: new Date().toISOString()
    })
  }

  logger.info(`Deployment triggered for project: ${id}`, {
    deploymentId: deployment.data.id,
    branch,
    environment
  })

  res.status(202).json({
    success: true,
    data: deployment.data,
    message: 'Deployment triggered successfully',
    timestamp: new Date().toISOString()
  })
}))

/**
 * GET /api/v1/projects/:id/deployments
 * Get deployment history for a project
 */
router.get('/:id/deployments', asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    status,
    environment,
    branch,
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc'
  } = req.query

  const filters = {
    projectId: id,
    ...(status && { status }),
    ...(environment && { environment }),
    ...(branch && { branch })
  }

  const options = {
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 50),
    sort,
    order: order.toLowerCase() === 'desc' ? 'desc' : 'asc'
  }

  const result = await projectService.getProjectDeployments(id, filters, options)

  if (!result.success) {
    return res.status(result.statusCode || 404).json({
      success: false,
      error: result.error,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  }

  res.json({
    success: true,
    data: result.deployments,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages
    },
    timestamp: new Date().toISOString()
  })
}))

/**
 * GET /api/v1/projects/:id/status
 * Get current status and health of a project
 */
router.get('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params

  const status = await projectService.getProjectStatus(id)

  if (!status.success) {
    return res.status(status.statusCode || 404).json({
      success: false,
      error: status.error,
      message: status.message,
      timestamp: new Date().toISOString()
    })
  }

  res.json({
    success: true,
    data: status.data,
    timestamp: new Date().toISOString()
  })
}))

/**
 * POST /api/v1/projects/:id/validate
 * Validate project configuration and repository access
 */
router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { id } = req.params

  const validation = await projectService.validateProject(id)

  if (!validation.success) {
    return res.status(validation.statusCode || 404).json({
      success: false,
      error: validation.error,
      message: validation.message,
      timestamp: new Date().toISOString()
    })
  }

  res.json({
    success: true,
    data: validation.data,
    message: 'Project validation completed',
    timestamp: new Date().toISOString()
  })
}))

/**
 * GET /api/v1/projects/:id/logs
 * Get recent logs for a project
 */
router.get('/:id/logs', asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    level = 'info',
    limit = 100,
    since,
    until
  } = req.query

  const options = {
    level,
    limit: Math.min(parseInt(limit, 10), 1000),
    since: since ? new Date(since) : undefined,
    until: until ? new Date(until) : undefined
  }

  const logs = await projectService.getProjectLogs(id, options)

  if (!logs.success) {
    return res.status(logs.statusCode || 404).json({
      success: false,
      error: logs.error,
      message: logs.message,
      timestamp: new Date().toISOString()
    })
  }

  res.json({
    success: true,
    data: logs.data,
    count: logs.data.length,
    timestamp: new Date().toISOString()
  })
}))

export default router