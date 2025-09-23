# IX Central Deploy System

A powerful centralized deployment system for static sites that transforms the original per-project IX Static Site CI/CD System into a scalable, multi-project deployment platform with API and UI integration.

## 🚀 Overview

The IX Central Deploy System allows you to manage and deploy multiple static site projects from a single centralized location, featuring:

- **Centralized Configuration**: Manage all projects from a single configuration file
- **REST API**: Full-featured API for integration with external systems and UIs
- **Real-time Updates**: WebSocket support for live deployment monitoring
- **Multi-Framework Support**: React, Vue, Jekyll, static HTML, and more
- **Branch-based Deployments**: Feature branch previews and production deployments
- **Containerized Builds**: Docker-based build isolation and consistency
- **AWS Integration**: S3, CloudFront, and ACM for global CDN deployment

## 📁 Architecture

```
central-deploy/
├── api/                    # REST API Server (Node.js/Express)
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utility functions
│   ├── Dockerfile         # Production container
│   └── package.json       # Dependencies
├── cli/                   # Command Line Interface
│   └── deploy-central.sh  # Main CLI script
├── config/                # Configuration Management
│   ├── deploy-config.schema.json  # JSON Schema
│   └── deploy-config.example.json # Example config
└── README.md
```

## 🏗️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for containerized builds)
- AWS CLI configured
- Git
- `jq` (recommended for JSON parsing)

### 1. Installation

Clone the repository and navigate to the central deploy system:

```bash
git clone https://github.com/IX-Erich/ix-cicd.git
cd ix-cicd/central-deploy
```

### 2. API Server Setup

Install dependencies and configure the API server:

```bash
cd api
npm ci
cp .env.example .env
```

Edit the `.env` file with your configuration:

```bash
# Basic configuration
NODE_ENV=development
PORT=3000

# AWS credentials (can be overridden per project)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# GitHub token (can be overridden per project)
GITHUB_TOKEN=your_github_token
```

### 3. Create Project Configuration

Create your deployment configuration:

```bash
cd ../config
cp deploy-config.example.json deploy-config.json
```

Edit `deploy-config.json` with your projects:

```json
{
  "version": "1.0",
  "defaults": {
    "aws_region": "us-east-1",
    "environment": "production",
    "spa_mode": false,
    "auto_deploy": true
  },
  "credentials": {
    "aws_profiles": [
      {
        "name": "default",
        "access_key_id": "${AWS_ACCESS_KEY_ID}",
        "secret_access_key": "${AWS_SECRET_ACCESS_KEY}",
        "region": "us-east-1"
      }
    ],
    "github_tokens": [
      {
        "name": "default",
        "token": "${GITHUB_TOKEN}",
        "scopes": ["repo", "workflow"]
      }
    ]
  },
  "projects": [
    {
      "id": "my-react-app",
      "name": "My React Application",
      "repository": {
        "url": "https://github.com/myorg/my-react-app",
        "branch": "main"
      },
      "deployment": {
        "domain_name": "myapp.imaginariax.com",
        "spa_mode": true
      },
      "build": {
        "framework": "react",
        "build_command": "npm run build",
        "build_dir": "build"
      },
      "status": "active"
    }
  ]
}
```

### 4. Start the System

Using the CLI:

```bash
# Start the API server
./cli/deploy-central.sh server start

# Validate your configuration
./cli/deploy-central.sh config validate

# List configured projects
./cli/deploy-central.sh config list

# Deploy a project
./cli/deploy-central.sh deploy my-react-app
```

## 🖥️ CLI Usage

The `deploy-central.sh` CLI provides comprehensive deployment management:

### Configuration Management

```bash
# List all configured projects
./cli/deploy-central.sh config list

# Show detailed project configuration
./cli/deploy-central.sh config show my-react-app

# Validate configuration file
./cli/deploy-central.sh config validate
```

### Project Management

```bash
# List projects via API
./cli/deploy-central.sh projects list

# Get project status
./cli/deploy-central.sh status my-react-app
```

### Deployments

```bash
# Deploy a specific project
./cli/deploy-central.sh deploy my-react-app

# Deploy specific branch
./cli/deploy-central.sh deploy my-react-app --branch=feature/new-ui

# Deploy with specific environment
./cli/deploy-central.sh deploy my-react-app --environment=staging

# Force deployment (skip checks)
./cli/deploy-central.sh deploy my-react-app --force
```

### Server Management

```bash
# Start API server
./cli/deploy-central.sh server start

# Start in development mode
./cli/deploy-central.sh server start --dev

# Check server status
./cli/deploy-central.sh server status

# View help
./cli/deploy-central.sh help
```

## 🔌 API Endpoints

The REST API provides full programmatic access:

### Projects

- `GET /api/v1/projects` - List all projects
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects` - Create new project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/deploy` - Trigger deployment
- `GET /api/v1/projects/:id/deployments` - Deployment history
- `GET /api/v1/projects/:id/status` - Project status
- `GET /api/v1/projects/:id/logs` - Project logs

### System

- `GET /health` - Health check
- `GET /health/detailed` - Detailed health information
- `POST /api/v1/config/validate` - Validate configuration

### WebSocket

Connect to `ws://localhost:3000` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000')

// Subscribe to project updates
ws.send(JSON.stringify({
  type: 'subscribe',
  projectId: 'my-react-app'
}))

// Receive deployment updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'deployment_update') {
    console.log('Deployment update:', message.data)
  }
}
```

## 🐳 Docker Deployment

### Development

```bash
# Build and run in development mode
cd api
docker build --target development -t ix-central-deploy-dev .
docker run -p 3000:3000 -v $(pwd):/app ix-central-deploy-dev
```

### Production

```bash
# Build production image
docker build --target production -t ix-central-deploy .

# Run with environment variables
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e GITHUB_TOKEN=your_token \
  ix-central-deploy
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build:
      context: ./api
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    volumes:
      - ./config:/app/config:ro
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

## 🎯 Key Features

### Multi-Project Management

- **Centralized Configuration**: Single JSON file defines all projects
- **Environment Isolation**: Separate staging and production deployments
- **Credential Management**: Per-project AWS and GitHub credentials
- **Framework Detection**: Automatic build configuration for popular frameworks

### Advanced Deployments

- **Branch Routing**: Feature branches deploy to subdirectories
- **SPA Support**: Client-side routing for single-page applications
- **CDN Integration**: CloudFront global distribution
- **SSL Certificates**: Automatic HTTPS with AWS ACM
- **Cache Invalidation**: Intelligent CloudFront cache management

### Developer Experience

- **Real-time Monitoring**: WebSocket updates for deployment progress
- **Structured Logging**: Comprehensive logging with multiple levels
- **Health Checks**: Built-in monitoring and diagnostics
- **CLI Integration**: Powerful command-line interface
- **API-First**: RESTful API for external integrations

### Security & Operations

- **Rate Limiting**: API request throttling
- **Input Validation**: Schema-based configuration validation
- **Container Security**: Non-root container execution
- **Secret Management**: Environment variable-based secrets
- **CORS Protection**: Configurable cross-origin policies

## 🔧 Configuration Reference

### Project Configuration Schema

```json
{
  "id": "unique-project-id",
  "name": "Human Readable Name",
  "description": "Optional description",
  "repository": {
    "url": "https://github.com/owner/repo",
    "branch": "main",
    "private": false,
    "github_token_ref": "default"
  },
  "deployment": {
    "domain_name": "myapp.example.com",
    "aws_profile_ref": "default",
    "environment": "production",
    "spa_mode": true,
    "auto_deploy": true
  },
  "build": {
    "framework": "react",
    "node_version": "18",
    "package_manager": "npm",
    "build_command": "npm run build",
    "build_dir": "build",
    "environment_variables": {
      "REACT_APP_API_URL": "https://api.example.com"
    },
    "timeout": 600
  },
  "notifications": {
    "slack": {
      "webhook_url": "https://hooks.slack.com/...",
      "channel": "#deployments"
    },
    "email": ["dev@example.com"]
  },
  "status": "active"
}
```

### Supported Frameworks

- **React**: `npm run build` → `build/`
- **Vue**: `npm run build` → `dist/`
- **Angular**: `ng build` → `dist/`
- **Jekyll**: `bundle exec jekyll build` → `_site/`
- **Gatsby**: `gatsby build` → `public/`
- **Next.js**: `npm run build && npm run export` → `out/`
- **Static**: No build step → `./`
- **Custom**: User-defined build commands

## 🔗 Integration with IX Dev Portal

The centralized deployment system is designed to integrate seamlessly with the ix-dev-portal application:

### API Integration

```javascript
// Fetch projects
const projects = await fetch('/api/v1/projects').then(r => r.json())

// Trigger deployment
const deployment = await fetch(`/api/v1/projects/${projectId}/deploy`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ branch: 'main', force: false })
})

// Real-time updates
const ws = new WebSocket('ws://localhost:3000')
ws.send(JSON.stringify({ type: 'subscribe', projectId }))
```

### UI Components

The API supports building rich UI components for:

- Project dashboard with deployment status
- Real-time deployment logs and progress
- Configuration management interface
- Deployment history and analytics
- Multi-project overview and monitoring

## 🆕 Migration from Per-Project System

To migrate existing per-project deployments:

1. **Export Existing Configuration**: Extract project settings from existing `terraform/main.tf` files
2. **Create Central Config**: Add projects to `deploy-config.json`
3. **Update DNS**: No changes needed - existing domains continue working
4. **Remove Per-Project Files**: Clean up individual `.github/workflows/` and `terraform/` directories
5. **Test Deployments**: Verify deployments work through central system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Documentation**: [IX CI/CD System Docs](../docs/REUSABLE-CICD-SYSTEM.md)
- **Issues**: [GitHub Issues](https://github.com/IX-Erich/ix-cicd/issues)
- **Discussions**: [GitHub Discussions](https://github.com/IX-Erich/ix-cicd/discussions)

---

**ImaginariaX Central Deploy System** - Scalable static site deployments made simple.