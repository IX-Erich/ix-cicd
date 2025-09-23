#!/usr/bin/env bash

set -euo pipefail

# IX Central Deploy CLI
# Centralized deployment CLI for managing multiple static site projects

VERSION="2.0.0"
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
CONFIG_DIR="${SCRIPT_DIR}/../config"
DEFAULT_CONFIG_FILE="${CONFIG_DIR}/deploy-config.json"
API_BASE_URL="http://localhost:3001/api/v1"
BUILD_WORKSPACE="/tmp/ix-deploy-builds"

print_header() {
    echo -e "${PURPLE}
╔═══════════════════════════════════════════════════════════╗
║                    ImaginariaX                            ║
║              Central Deploy CLI v${VERSION}                  ║
║           Centralized Static Site Deployments            ║
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

CENTRALIZED DEPLOYMENT COMMANDS:
  config                List and manage deployment configurations
  projects              Manage deployment projects
  deploy                Deploy projects
  status                Check deployment status
  logs                  View deployment logs
  server                Manage the API server

Configuration Commands:
  config list           List all configured projects
  config show PROJECT   Show detailed project configuration
  config add            Add a new project to configuration
  config edit PROJECT   Edit an existing project
  config remove PROJECT Remove a project from configuration
  config validate       Validate configuration file

Project Commands:
  projects list         List all projects
  projects status       Show status of all projects
  projects add          Add a new project via API
  projects update ID    Update project configuration
  projects delete ID    Delete a project

Deployment Commands:
  deploy PROJECT        Deploy a specific project
  deploy all            Deploy all active projects
  deploy --project=ID   Deploy project by ID
  deploy --branch=NAME  Deploy specific branch
  deploy --force        Force deployment (skip checks)

Status Commands:
  status                Show overall system status
  status PROJECT        Show status of specific project
  status deployments    Show recent deployment history

Log Commands:
  logs                  Show recent system logs
  logs PROJECT          Show logs for specific project
  logs follow PROJECT   Follow logs in real-time

Server Commands:
  server start          Start the API server
  server stop           Stop the API server
  server restart        Restart the API server
  server status         Check API server status
  server logs           Show API server logs

LEGACY SUPPORT (Per-Project Setup):
  init                  Initialize CI/CD in current repository
  infrastructure        Generate Terraform configuration
  workflow              Setup GitHub Actions workflow

Options:
  --config FILE         Use specific configuration file
  --api-url URL         API server URL (default: ${API_BASE_URL})
  --workspace PATH      Build workspace directory (default: ${BUILD_WORKSPACE})
  --verbose             Verbose output
  --yes                 Accept all defaults (non-interactive)
  --help                Show this help message

Examples:
  # Configuration Management
  $0 config add
  $0 config list
  $0 config show my-react-app

  # Project Management
  $0 projects list
  $0 projects add --name="My App" --repo="https://github.com/user/app"

  # Deployments
  $0 deploy my-react-app
  $0 deploy --project=react-app --branch=feature/new-ui
  $0 deploy all

  # Monitoring
  $0 status
  $0 logs follow my-react-app
  $0 server status

Environment Variables:
  IX_DEPLOY_CONFIG      Path to configuration file
  IX_DEPLOY_API_URL     API server URL
  IX_DEPLOY_API_KEY     API authentication key
  IX_DEPLOY_WORKSPACE   Build workspace directory

EOF
}

# API Helper Functions
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local api_url="${IX_DEPLOY_API_URL:-$API_BASE_URL}"
    
    local curl_args=("-X" "$method" "-H" "Content-Type: application/json")
    
    if [[ -n "${IX_DEPLOY_API_KEY:-}" ]]; then
        curl_args+=("-H" "X-API-Key: ${IX_DEPLOY_API_KEY}")
    fi
    
    if [[ -n "$data" ]]; then
        curl_args+=("-d" "$data")
    fi
    
    curl_args+=("${api_url}${endpoint}")
    
    curl "${curl_args[@]}" 2>/dev/null
}

check_api_server() {
    local api_url="${IX_DEPLOY_API_URL:-$API_BASE_URL}"
    if ! curl -f -s "${api_url%/api/v1}/health" > /dev/null 2>&1; then
        print_error "API server is not running at ${api_url}"
        print_info "Start the server with: $0 server start"
        exit 1
    fi
}

# Configuration Management
config_list() {
    local config_file="${IX_DEPLOY_CONFIG:-$DEFAULT_CONFIG_FILE}"
    
    if [[ ! -f "$config_file" ]]; then
        print_error "Configuration file not found: $config_file"
        print_info "Create a configuration with: $0 config add"
        exit 1
    fi
    
    print_step "Listing projects from configuration..."
    
    # Use jq if available, otherwise parse manually
    if command -v jq &> /dev/null; then
        jq -r '.projects[] | "\(.id) - \(.name) (\(.deployment.environment))"' "$config_file"
    else
        print_info "Install 'jq' for better JSON formatting"
        cat "$config_file"
    fi
}

config_show() {
    local project_id="$1"
    local config_file="${IX_DEPLOY_CONFIG:-$DEFAULT_CONFIG_FILE}"
    
    if [[ ! -f "$config_file" ]]; then
        print_error "Configuration file not found: $config_file"
        exit 1
    fi
    
    print_step "Showing configuration for project: $project_id"
    
    if command -v jq &> /dev/null; then
        jq ".projects[] | select(.id == \"$project_id\")" "$config_file" || {
            print_error "Project '$project_id' not found in configuration"
            exit 1
        }
    else
        grep -A 20 "\"id\": \"$project_id\"" "$config_file" || {
            print_error "Project '$project_id' not found in configuration"
            exit 1
        }
    fi
}

config_validate() {
    local config_file="${IX_DEPLOY_CONFIG:-$DEFAULT_CONFIG_FILE}"
    
    if [[ ! -f "$config_file" ]]; then
        print_error "Configuration file not found: $config_file"
        exit 1
    fi
    
    print_step "Validating configuration file..."
    
    # Basic JSON validation
    if command -v jq &> /dev/null; then
        if jq empty "$config_file" 2>/dev/null; then
            print_success "Configuration file is valid JSON"
        else
            print_error "Configuration file contains invalid JSON"
            exit 1
        fi
    else
        print_warning "Install 'jq' for JSON validation"
    fi
    
    # API validation if server is running
    if curl -f -s "${API_BASE_URL%/api/v1}/health" > /dev/null 2>&1; then
        print_step "Validating configuration via API..."
        local response
        response=$(api_call POST "/config/validate" "@$config_file")
        
        if echo "$response" | grep -q '"success": true'; then
            print_success "Configuration validation passed"
        else
            print_error "Configuration validation failed"
            echo "$response" | jq '.message // .error' 2>/dev/null || echo "$response"
            exit 1
        fi
    else
        print_info "API server not running - skipping advanced validation"
    fi
}

# Project Management
projects_list() {
    check_api_server
    print_step "Fetching projects from API..."
    
    local response
    response=$(api_call GET "/projects")
    
    if echo "$response" | grep -q '"success": true'; then
        if command -v jq &> /dev/null; then
            echo "$response" | jq -r '.data[] | "\(.id) - \(.name) (\(.status))"'
        else
            echo "$response"
        fi
    else
        print_error "Failed to fetch projects"
        echo "$response" | jq '.message // .error' 2>/dev/null || echo "$response"
        exit 1
    fi
}

# Deployment Functions
deploy_project() {
    local project_id="$1"
    local branch="${2:-}"
    local environment="${3:-}"
    local force="${4:-false}"
    
    check_api_server
    
    print_step "Triggering deployment for project: $project_id"
    
    local deploy_data="{"
    deploy_data+="\"force\": $force"
    [[ -n "$branch" ]] && deploy_data+=", \"branch\": \"$branch\""
    [[ -n "$environment" ]] && deploy_data+=", \"environment\": \"$environment\""
    deploy_data+="}"
    
    local response
    response=$(api_call POST "/projects/$project_id/deploy" "$deploy_data")
    
    if echo "$response" | grep -q '"success": true'; then
        print_success "Deployment triggered successfully"
        if command -v jq &> /dev/null; then
            local deployment_id
            deployment_id=$(echo "$response" | jq -r '.data.id // "unknown"')
            print_info "Deployment ID: $deployment_id"
            print_info "Monitor progress with: $0 logs follow $project_id"
        fi
    else
        print_error "Deployment failed"
        echo "$response" | jq '.message // .error' 2>/dev/null || echo "$response"
        exit 1
    fi
}

# Server Management
server_start() {
    print_step "Starting API server..."
    
    local api_dir="${SCRIPT_DIR}/../api"
    
    if [[ ! -d "$api_dir" ]]; then
        print_error "API directory not found: $api_dir"
        exit 1
    fi
    
    cd "$api_dir"
    
    if [[ ! -f ".env" ]]; then
        print_warning "No .env file found. Creating from example..."
        cp ".env.example" ".env"
        print_info "Please edit .env file with your configuration"
    fi
    
    if [[ ! -d "node_modules" ]]; then
        print_step "Installing dependencies..."
        npm ci
    fi
    
    if [[ "${1:-}" == "--dev" ]]; then
        print_info "Starting in development mode..."
        npm run dev &
    else
        print_info "Starting in production mode..."
        npm start &
    fi
    
    local server_pid=$!
    print_success "API server started with PID: $server_pid"
    print_info "Health check: curl http://localhost:3001/health"
    
    # Wait for server to start
    sleep 3
    if curl -f -s "http://localhost:3001/health" > /dev/null; then
        print_success "API server is healthy"
    else
        print_warning "API server may still be starting..."
    fi
}

server_status() {
    local api_url="${IX_DEPLOY_API_URL:-http://localhost:3001}"
    
    print_step "Checking API server status..."
    
    if curl -f -s "${api_url}/health" > /dev/null; then
        print_success "API server is running"
        local health_response
        health_response=$(curl -s "${api_url}/health/detailed")
        
        if command -v jq &> /dev/null; then
            echo "$health_response" | jq '.status, .uptime, .environment'
        else
            echo "$health_response"
        fi
    else
        print_error "API server is not responding"
        exit 1
    fi
}

# Main command processing
main() {
    local command="${1:-help}"
    shift || true
    
    case "$command" in
        config)
            local subcommand="${1:-list}"
            shift || true
            
            case "$subcommand" in
                list)
                    config_list
                    ;;
                show)
                    local project_id="${1:-}"
                    if [[ -z "$project_id" ]]; then
                        print_error "Project ID is required"
                        echo "Usage: $0 config show PROJECT_ID"
                        exit 1
                    fi
                    config_show "$project_id"
                    ;;
                validate)
                    config_validate
                    ;;
                add|edit|remove)
                    print_error "Command '$subcommand' not yet implemented"
                    print_info "Please edit the configuration file manually: $DEFAULT_CONFIG_FILE"
                    ;;
                *)
                    print_error "Unknown config command: $subcommand"
                    exit 1
                    ;;
            esac
            ;;
        projects)
            local subcommand="${1:-list}"
            shift || true
            
            case "$subcommand" in
                list)
                    projects_list
                    ;;
                *)
                    print_error "Command '$subcommand' not yet implemented"
                    ;;
            esac
            ;;
        deploy)
            local project_or_flag="${1:-}"
            
            if [[ -z "$project_or_flag" ]]; then
                print_error "Project ID is required"
                echo "Usage: $0 deploy PROJECT_ID [OPTIONS]"
                exit 1
            fi
            
            if [[ "$project_or_flag" == "all" ]]; then
                print_error "Deploy all not yet implemented"
                exit 1
            fi
            
            # Parse additional options
            local branch=""
            local environment=""
            local force="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --branch=*)
                        branch="${1#*=}"
                        shift
                        ;;
                    --environment=*)
                        environment="${1#*=}"
                        shift
                        ;;
                    --force)
                        force="true"
                        shift
                        ;;
                    *)
                        print_error "Unknown option: $1"
                        exit 1
                        ;;
                esac
            done
            
            deploy_project "$project_or_flag" "$branch" "$environment" "$force"
            ;;
        status)
            server_status
            ;;
        logs)
            print_error "Logs command not yet implemented"
            ;;
        server)
            local subcommand="${1:-status}"
            shift || true
            
            case "$subcommand" in
                start)
                    server_start "$@"
                    ;;
                status)
                    server_status
                    ;;
                stop|restart|logs)
                    print_error "Command '$subcommand' not yet implemented"
                    ;;
                *)
                    print_error "Unknown server command: $subcommand"
                    exit 1
                    ;;
            esac
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_header
            print_error "Unknown command: $command"
            echo ""
            print_info "Use '$0 help' to see available commands"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"