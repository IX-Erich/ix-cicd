# IX Central Deploy API Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    docker-cli \
    aws-cli \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy package files and installed dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy application source
COPY src/ ./src/

# Create necessary directories
RUN mkdir -p logs tmp/builds tmp/docker-builds && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]

# Development stage (for development with mounted volumes)
FROM node:18-alpine AS development

# Install system dependencies including development tools
RUN apk add --no-cache \
    git \
    curl \
    docker-cli \
    aws-cli \
    bash \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Expose port and nodemon debug port
EXPOSE 3000 9229

# Set environment
ENV NODE_ENV=development

# Start with nodemon for development
CMD ["npm", "run", "dev"]