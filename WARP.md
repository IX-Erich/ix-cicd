# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the IX Static Site CI/CD System - a comprehensive, production-ready infrastructure solution that provides automated deployments, feature branch routing, SSL certificates, global CDN, and smart cleanup across AWS infrastructure for static sites. It supports multiple frameworks (React, Vue, Jekyll, static HTML) and provides **4 levels of abstraction** to suit different needs.

## System Architecture

The system operates on a **multi-layered abstraction model**:

1. **CLI Tool** (`./cli/deploy-setup.sh`) - One-command project bootstrapping
2. **GitHub Actions** (`./reusable-actions/static-site-deploy/`) - Reusable workflow components
3. **Terraform Module** (`./terraform/modules/static-site-hosting/`) - Infrastructure as code
4. **Manual Setup** - Copy and customize approach

### Core Components

- **Feature Branch Routing**: CloudFront Function (`branch-router.js`) handles intelligent routing where `main` → `https://yoursite.com/` and feature branches → `https://yoursite.com/feature-name/`
- **S3 Static Hosting**: Bucket configuration with public access and website hosting
- **CloudFront CDN**: Global distribution with SSL/TLS termination and custom caching
- **AWS ACM**: Automated SSL certificate provisioning and validation
- **IAM Security**: Least-privilege access for CI/CD operations

## Common Development Tasks

### Testing the CLI Tool
```bash
# Test CLI help and validation
./cli/deploy-setup.sh --help

# Test with local project (dry run)
./cli/deploy-setup.sh init --project-name "test-app" --domain-name "test.example.com"
```

### Testing Terraform Module
```bash
# Validate Terraform configuration
cd terraform/modules/static-site-hosting
terraform init
terraform validate
terraform fmt -check

# Test with example configuration
cd terraform/examples/basic-usage
terraform plan
```

### Testing GitHub Actions
```bash
# Test action locally (requires act or similar)
cd reusable-actions/static-site-deploy
# Validate action.yml syntax
yamllint action.yml
```

### Testing Framework Examples
```bash
# React example
cd examples/react-app
npm install
npm run build
npm test

# Test the complete deployment flow
cd examples/react-app
../../cli/deploy-setup.sh init --project-name "test-react" --domain-name "test.example.com" --spa-mode
```

## Key Architecture Patterns

### Branch-Specific Deployments
The system implements sophisticated routing through:
- **CloudFront Function**: `branch-router.js` handles request routing based on path patterns
- **S3 Path Strategy**: Main branch deploys to root, feature branches to `/{sanitized-branch-name}/`
- **SEO Protection**: Feature branches automatically get `robots.txt` with `Disallow: /`
- **Cleanup Automation**: Branch deletion triggers removal of associated S3 objects

### Multi-Framework Support
Framework detection and configuration via:
- **Build Directory Mapping**: `build/` (React), `dist/` (Vue), `_site/` (Jekyll), `.` (static)
- **SPA Mode Toggle**: Routes 404s to index.html for single-page applications
- **Custom Cache Behaviors**: Framework-specific caching rules in CloudFront

### Security Model
- **IAM Least Privilege**: GitHub Actions user has minimal S3 and CloudFront permissions
- **Public Access Control**: S3 bucket policy allows read-only public access
- **SSL/TLS Enforcement**: HTTPS redirects and modern TLS protocols only
- **Security Headers**: Configurable security headers via CloudFront

## Development Guidelines

### Shell Scripts (CLI)
- Use strict mode: `set -euo pipefail`
- Quote all variables: `"$variable"`
- Provide colored output using defined color constants
- Include comprehensive help text and validation

### Terraform Modules
- All resources must be tagged with `var.tags` merge pattern
- Use `templatefile()` for dynamic file generation (like CloudFront Functions)
- Provide sensible defaults for all variables
- Include comprehensive outputs for downstream usage

### GitHub Actions
- Support both push and pull_request events
- Handle branch name sanitization for S3 paths
- Include deployment summary outputs
- Support custom exclude patterns and build configurations

### Testing Requirements
When modifying components, test across:
- **Multiple Frameworks**: React (SPA), Jekyll (static), plain HTML
- **Branch Types**: main/master, feature/, hotfix/, release/
- **Deployment Scenarios**: Initial deploy, updates, branch deletion
- **AWS Configurations**: Different regions, custom domains, security settings

## Project Structure

```
├── cli/                          # One-command setup tool
│   └── deploy-setup.sh          # Main CLI script with bootstrapping logic
├── reusable-actions/            # GitHub Actions workflows
│   └── static-site-deploy/      # Main deployment action
│       └── action.yml           # Action definition with inputs/outputs
├── terraform/
│   ├── modules/
│   │   └── static-site-hosting/ # Core infrastructure module
│   │       ├── main.tf          # S3, CloudFront, ACM resources
│   │       ├── branch-router.js # CloudFront Function for routing
│   │       └── variables.tf     # Module configuration options
│   └── examples/                # Usage examples
├── examples/                    # Framework-specific implementations
│   ├── react-app/              # React SPA example with routing
│   └── README.md               # Framework setup guides
└── docs/                       # Comprehensive documentation
    └── REUSABLE-CICD-SYSTEM.md # Complete system documentation
```

## Key Files to Understand

1. **`terraform/modules/static-site-hosting/main.tf`**: Core infrastructure definition including S3, CloudFront, ACM, and IAM resources
2. **`terraform/modules/static-site-hosting/branch-router.js`**: CloudFront Function that handles intelligent routing logic for feature branches
3. **`reusable-actions/static-site-deploy/action.yml`**: GitHub Action that orchestrates the deployment process
4. **`cli/deploy-setup.sh`**: Comprehensive CLI tool that bootstraps entire projects with infrastructure and workflows

## Common Pitfalls

- **CloudFront Function Limitations**: Limited JavaScript runtime - avoid complex operations
- **S3 Bucket Naming**: Must be globally unique and match domain names for proper SSL
- **Branch Name Sanitization**: Special characters in branch names must be converted for valid S3 paths
- **SPA Routing**: Requires proper 404 → index.html mapping for client-side routing
- **Certificate Validation**: ACM certificates in us-east-1 region required for CloudFront
- **IAM Permissions**: GitHub Actions requires specific S3 and CloudFront invalidation permissions