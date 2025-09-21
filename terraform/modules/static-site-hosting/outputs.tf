output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.site.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.site.arn
}

output "s3_website_endpoint" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.site.website_endpoint
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.site.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.site.arn
}

output "github_actions_user_name" {
  description = "IAM user name for GitHub Actions"
  value       = aws_iam_user.github_actions.name
}

output "github_actions_user_arn" {
  description = "IAM user ARN for GitHub Actions"
  value       = aws_iam_user.github_actions.arn
}

output "github_actions_access_key_id" {
  description = "Access key ID for GitHub Actions (if created)"
  value       = var.create_access_keys ? aws_iam_access_key.github_actions[0].id : null
  sensitive   = true
}

output "github_actions_secret_access_key" {
  description = "Secret access key for GitHub Actions (if created)"
  value       = var.create_access_keys ? aws_iam_access_key.github_actions[0].secret : null
  sensitive   = true
}

# Output for GitHub Secrets setup
output "github_secrets" {
  description = "GitHub secrets to configure"
  value = {
    AWS_ACCESS_KEY_ID             = var.create_access_keys ? aws_iam_access_key.github_actions[0].id : "Create manually"
    AWS_SECRET_ACCESS_KEY         = var.create_access_keys ? aws_iam_access_key.github_actions[0].secret : "Create manually"
    CLOUDFRONT_DISTRIBUTION_ID    = aws_cloudfront_distribution.site.id
  }
  sensitive = true
}