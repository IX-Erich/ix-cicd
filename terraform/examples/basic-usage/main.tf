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

# Example usage of the static-site-hosting module
module "my_static_site" {
  source = "../../modules/static-site-hosting"

  project_name = "my-awesome-project"
  domain_name  = "myproject.imaginariax.com"
  environment  = "prod"
  
  # Optional: Enable SPA mode for React/Vue apps
  spa_mode = false
  
  # Optional: Custom cache settings
  default_ttl = 3600  # 1 hour
  max_ttl     = 86400 # 1 day
  
  # Optional: Create access keys (not recommended for production)
  create_access_keys = false
  
  # Optional: Additional tags
  tags = {
    Owner       = "DevOps Team"
    Project     = "My Awesome Project"
    CostCenter  = "Engineering"
    Environment = "production"
  }
}

# Output the important values
output "s3_bucket_name" {
  description = "S3 bucket name for deployment"
  value       = module.my_static_site.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for GitHub secrets"
  value       = module.my_static_site.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.my_static_site.cloudfront_domain_name
}

output "github_actions_user" {
  description = "IAM user for GitHub Actions"
  value       = module.my_static_site.github_actions_user_name
}

# Sensitive outputs (use terraform output -json to view)
output "github_secrets" {
  description = "GitHub secrets configuration"
  value       = module.my_static_site.github_secrets
  sensitive   = true
}