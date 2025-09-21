terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 Bucket for static hosting
resource "aws_s3_bucket" "site" {
  bucket = var.domain_name

  tags = merge(var.tags, {
    Name        = "${var.project_name} Static Site"
    Environment = var.environment
  })
}

# S3 Bucket public access configuration
resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket website configuration
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = var.index_document
  }

  dynamic "error_document" {
    for_each = var.spa_mode ? [1] : []
    content {
      key = var.index_document
    }
  }

  dynamic "error_document" {
    for_each = var.spa_mode ? [] : [1]
    content {
      key = var.error_document
    }
  }
}

# S3 Bucket policy for public read
resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  depends_on = [aws_s3_bucket_public_access_block.site]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site.arn}/*"
      }
    ]
  })
}

# SSL Certificate
resource "aws_acm_certificate" "site" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project_name} SSL Certificate"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront Function for branch routing
resource "aws_cloudfront_function" "branch_router" {
  name    = "${var.project_name}-branch-router"
  runtime = "cloudfront-js-1.0"
  comment = "Route feature branch requests to appropriate S3 prefixes"
  publish = true
  code    = templatefile("${path.module}/branch-router.js", {
    index_document = var.index_document
    spa_mode      = var.spa_mode
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "site" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.site.website_endpoint
    origin_id   = "S3-${var.domain_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CloudFront Distribution"
  default_root_object = var.index_document

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.domain_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = var.default_ttl
    max_ttl     = var.max_ttl

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.branch_router.arn
    }
  }

  price_class = var.price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.site.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name} CloudFront Distribution"
  })
}

# IAM User for GitHub Actions
resource "aws_iam_user" "github_actions" {
  name = "${var.project_name}-github-actions"
  path = "/"

  tags = merge(var.tags, {
    Name    = "${var.project_name} GitHub Actions User"
    Purpose = "CI/CD"
  })
}

# IAM Policy for GitHub Actions
resource "aws_iam_policy" "github_actions" {
  name        = "${var.project_name}-github-actions-policy"
  path        = "/"
  description = "Policy for GitHub Actions to deploy ${var.project_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.site.arn,
          "${aws_s3_bucket.site.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = aws_cloudfront_distribution.site.arn
      }
    ]
  })
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "github_actions" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

# Access keys for GitHub Actions (optional - use with caution)
resource "aws_iam_access_key" "github_actions" {
  count = var.create_access_keys ? 1 : 0
  user  = aws_iam_user.github_actions.name
}