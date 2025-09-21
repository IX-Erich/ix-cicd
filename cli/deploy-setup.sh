#!/usr/bin/env bash

set -e

# ImaginariaX Static Site Deploy Setup CLI
# This script bootstraps the CI/CD system for static site deployment

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_BASE_URL="https://raw.githubusercontent.com/IX-Erich/ix-cicd/main"
TEMPLATE_DIR="templates"
TERRAFORM_DIR="terraform"

print_header() {
    echo -e "${PURPLE}
╔═══════════════════════════════════════════════════════════╗
║                    ImaginariaX                            ║
║              Static Site Deploy Setup                     ║
║                     v${VERSION}                              ║
╚═══════════════════════════════════════════════════════════╝${NC}
"
}

print_step() {
    echo -e "${CYAN}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_help() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
  init                  Initialize CI/CD in current repository
  infrastructure       Generate Terraform configuration
  workflow             Setup GitHub Actions workflow
  secrets              Help configure GitHub secrets
  validate             Validate existing setup
  help                 Show this help message

Options:
  --project-name NAME   Project name (required for init)
  --domain-name NAME    Domain name (required for init)
  --spa-mode           Enable Single Page Application mode
  --skip-terraform     Skip Terraform infrastructure setup
  --skip-workflow      Skip GitHub Actions workflow setup
  --yes                Accept all defaults (non-interactive)

Examples:
  $0 init --project-name "my-app" --domain-name "myapp.imaginariax.com"
  $0 infrastructure --project-name "blog" --domain-name "blog.company.com"
  $0 workflow --spa-mode
  $0 secrets

EOF
}

validate_requirements() {
    print_step "Validating requirements..."
    
    local missing_tools=()
    
    # Check for required tools
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if [[ ${#missing_tools[@]} -ne 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "This script must be run from within a Git repository"
        exit 1
    fi
    
    print_success "Requirements validated"
}

download_file() {
    local url="$1"
    local destination="$2"
    local description="$3"
    
    print_step "Downloading ${description}..."
    
    if curl -fsSL "$url" -o "$destination"; then
        print_success "Downloaded ${description}"
    else
        print_error "Failed to download ${description}"
        exit 1
    fi
}

setup_directories() {
    print_step "Creating directory structure..."
    
    mkdir -p .github/workflows
    mkdir -p terraform
    
    print_success "Directory structure created"
}

setup_workflow() {
    local project_name="$1"
    local domain_name="$2"
    local spa_mode="$3"
    
    print_step "Setting up GitHub Actions workflow..."
    
    local workflow_file=".github/workflows/deploy.yml"
    
    # Download template workflow
    download_file \
        "${REPO_BASE_URL}/${TEMPLATE_DIR}/deploy-workflow.yml" \
        "$workflow_file" \
        "GitHub Actions workflow template"
    
    # Customize the workflow
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed
        sed -i '' "s/myproject\.imaginariax\.com/${domain_name}/g" "$workflow_file"
    else
        # Linux sed
        sed -i "s/myproject\.imaginariax\.com/${domain_name}/g" "$workflow_file"
    fi
    
    if [[ "$spa_mode" == "true" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/spa-mode: 'false'/spa-mode: 'true'/g" "$workflow_file"
        else
            sed -i "s/spa-mode: 'false'/spa-mode: 'true'/g" "$workflow_file"
        fi
    fi
    
    print_success "GitHub Actions workflow configured"
    print_info "Workflow file created at: ${workflow_file}"
}

setup_terraform() {
    local project_name="$1"
    local domain_name="$2"
    local spa_mode="$3"
    
    print_step "Setting up Terraform configuration..."
    
    local terraform_main="terraform/main.tf"
    
    # Create main.tf
    cat > "$terraform_main" << EOF
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "static_site" {
  source = "github.com/IX-Erich/ix-cicd//terraform/modules/static-site-hosting?ref=main"

  project_name = "${project_name}"
  domain_name  = "${domain_name}"
  environment  = "prod"
  spa_mode     = ${spa_mode}
  
  tags = {
    Project     = "${project_name}"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for deployment"
  value       = module.static_site.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.static_site.cloudfront_distribution_id
}

output "github_secrets" {
  description = "GitHub secrets to configure"
  value       = module.static_site.github_secrets
  sensitive   = true
}
EOF
    
    # Create variables.tf
    cat > "terraform/variables.tf" << EOF
# Add any additional variables here
# The module provides sensible defaults for most settings
EOF
    
    print_success "Terraform configuration created"
    print_info "Terraform files created in: terraform/"
    print_warning "Run 'terraform init && terraform plan' to review the infrastructure"
}

show_next_steps() {
    local project_name="$1"
    local domain_name="$2"
    
    echo -e "${GREEN}
╔═══════════════════════════════════════════════════════════╗
║                     Setup Complete!                       ║
╚═══════════════════════════════════════════════════════════╝${NC}

${YELLOW}Next Steps:${NC}

${CYAN}1. Infrastructure Setup:${NC}
   cd terraform
   terraform init
   terraform plan
   terraform apply

${CYAN}2. DNS Configuration:${NC}
   After Terraform creates the infrastructure, add these DNS records:
   - CNAME: ${domain_name} → [CloudFront Domain from terraform output]

${CYAN}3. GitHub Secrets:${NC}
   Add these secrets to your GitHub repository:
   • AWS_ACCESS_KEY_ID
   • AWS_SECRET_ACCESS_KEY  
   • CLOUDFRONT_DISTRIBUTION_ID
   
   Get the values with: terraform output -json github_secrets

${CYAN}4. Test Deployment:${NC}
   Push to main branch or create a feature branch to test deployment

${CYAN}5. SSL Certificate:${NC}
   The SSL certificate will auto-validate via DNS once the DNS records are configured

${GREEN}Your static site will be available at:${NC}
• Production: https://${domain_name}
• Feature branches: https://${domain_name}/branch-name/

${PURPLE}Need help? Check the documentation:${NC}
https://github.com/IX-Erich/ix-cicd/blob/main/docs/REUSABLE-CICD-SYSTEM.md
"
}

init_project() {
    local project_name="$1"
    local domain_name="$2"
    local spa_mode="${3:-false}"
    local skip_terraform="${4:-false}"
    local skip_workflow="${5:-false}"
    
    print_header
    echo -e "${CYAN}Initializing CI/CD for: ${YELLOW}${project_name}${NC}"
    echo -e "${CYAN}Domain: ${YELLOW}${domain_name}${NC}"
    echo -e "${CYAN}SPA Mode: ${YELLOW}${spa_mode}${NC}"
    echo ""
    
    validate_requirements
    setup_directories
    
    if [[ "$skip_workflow" != "true" ]]; then
        setup_workflow "$project_name" "$domain_name" "$spa_mode"
    fi
    
    if [[ "$skip_terraform" != "true" ]]; then
        setup_terraform "$project_name" "$domain_name" "$spa_mode"
    fi
    
    show_next_steps "$project_name" "$domain_name"
}

show_secrets_help() {
    echo -e "${YELLOW}GitHub Secrets Configuration${NC}

To configure GitHub secrets for your repository:

${CYAN}1. Go to your GitHub repository${NC}
${CYAN}2. Navigate to Settings → Secrets and variables → Actions${NC}
${CYAN}3. Click 'New repository secret'${NC}
${CYAN}4. Add these secrets:${NC}

${GREEN}Required Secrets:${NC}
• ${YELLOW}AWS_ACCESS_KEY_ID${NC}     - Your AWS access key
• ${YELLOW}AWS_SECRET_ACCESS_KEY${NC} - Your AWS secret key  
• ${YELLOW}CLOUDFRONT_DISTRIBUTION_ID${NC} - CloudFront distribution ID

${BLUE}After running Terraform, get the exact values with:${NC}
terraform output -json github_secrets

${GREEN}Alternative: Use AWS IAM roles (recommended)${NC}
Configure OpenID Connect for GitHub Actions instead of access keys.
See: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
"
}

# Main command processing
case "${1:-help}" in
    init)
        PROJECT_NAME=""
        DOMAIN_NAME=""
        SPA_MODE="false"
        SKIP_TERRAFORM="false"
        SKIP_WORKFLOW="false"
        YES="false"
        
        shift
        while [[ $# -gt 0 ]]; do
            case $1 in
                --project-name)
                    PROJECT_NAME="$2"
                    shift 2
                    ;;
                --domain-name)
                    DOMAIN_NAME="$2"
                    shift 2
                    ;;
                --spa-mode)
                    SPA_MODE="true"
                    shift
                    ;;
                --skip-terraform)
                    SKIP_TERRAFORM="true"
                    shift
                    ;;
                --skip-workflow)
                    SKIP_WORKFLOW="true"
                    shift
                    ;;
                --yes)
                    YES="true"
                    shift
                    ;;
                *)
                    print_error "Unknown option: $1"
                    exit 1
                    ;;
            esac
        done
        
        if [[ -z "$PROJECT_NAME" || -z "$DOMAIN_NAME" ]]; then
            print_error "Both --project-name and --domain-name are required"
            echo "Usage: $0 init --project-name NAME --domain-name DOMAIN"
            exit 1
        fi
        
        init_project "$PROJECT_NAME" "$DOMAIN_NAME" "$SPA_MODE" "$SKIP_TERRAFORM" "$SKIP_WORKFLOW"
        ;;
    secrets)
        show_secrets_help
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac