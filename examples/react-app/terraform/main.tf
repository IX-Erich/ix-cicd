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

module "react_app_hosting" {
  source = "github.com/IX-Erich/ix-cicd//terraform/modules/static-site-hosting?ref=main"

  # Basic configuration
  project_name = "my-react-app"
  domain_name  = "my-react-app.imaginariax.com"
  environment  = "prod"

  # React SPA specific settings
  spa_mode = true

  # Performance optimizations for React
  default_ttl = 3600    # 1 hour default cache
  max_ttl     = 86400   # 1 day max cache

  # Custom cache behavior for React assets
  custom_cache_behaviors = [
    {
      path_pattern     = "/static/js/*"
      target_origin_id = "S3-Origin"
      ttl_settings = {
        default_ttl = 31536000  # 1 year - JS files have hashes
        max_ttl     = 31536000
        min_ttl     = 31536000
      }
      compress               = true
      viewer_protocol_policy = "redirect-to-https"
    },
    {
      path_pattern     = "/static/css/*"
      target_origin_id = "S3-Origin"
      ttl_settings = {
        default_ttl = 31536000  # 1 year - CSS files have hashes
        max_ttl     = 31536000
        min_ttl     = 31536000
      }
      compress               = true
      viewer_protocol_policy = "redirect-to-https"
    },
    {
      path_pattern     = "/static/media/*"
      target_origin_id = "S3-Origin"
      ttl_settings = {
        default_ttl = 31536000  # 1 year - Media files have hashes
        max_ttl     = 31536000
        min_ttl     = 2592000   # 30 days min
      }
      compress               = true
      viewer_protocol_policy = "redirect-to-https"
    }
  ]

  # Security headers for React app
  security_headers = {
    "Strict-Transport-Security"   = "max-age=63072000; includeSubDomains; preload"
    "X-Content-Type-Options"      = "nosniff"
    "X-Frame-Options"             = "DENY"
    "Referrer-Policy"             = "strict-origin-when-cross-origin"
    "Permissions-Policy"          = "camera=(), microphone=(), geolocation=()"
  }

  # Tags
  tags = {
    Project     = "My React App"
    Environment = "production"
    Framework   = "React"
    ManagedBy   = "Terraform"
  }
}

# Outputs for GitHub Actions secrets
output "s3_bucket_name" {
  description = "S3 bucket name for GitHub secrets"
  value       = module.react_app_hosting.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for GitHub secrets"
  value       = module.react_app_hosting.cloudfront_distribution_id
  sensitive   = true
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.react_app_hosting.cloudfront_domain_name
}

output "ssl_certificate_arn" {
  description = "SSL certificate ARN"
  value       = module.react_app_hosting.ssl_certificate_arn
}

# Formatted output for easy GitHub Secrets setup
output "github_secrets" {
  description = "Formatted secrets for GitHub repository"
  value = {
    AWS_ACCESS_KEY_ID              = "Set this to your AWS access key ID"
    AWS_SECRET_ACCESS_KEY          = "Set this to your AWS secret access key"
    CLOUDFRONT_DISTRIBUTION_ID     = module.react_app_hosting.cloudfront_distribution_id
  }
  sensitive = true
}

# DNS setup instructions
output "dns_setup" {
  description = "DNS setup instructions"
  value = {
    domain                = "my-react-app.imaginariax.com"
    type                  = "CNAME"
    value                 = module.react_app_hosting.cloudfront_domain_name
    instructions          = "Create a CNAME record in your DNS provider pointing ${var.domain_name} to ${module.react_app_hosting.cloudfront_domain_name}"
  }
}