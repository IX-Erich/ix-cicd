# Example Implementations

This directory contains real-world examples of how to use the reusable CI/CD system with different project types.

## 📁 Directory Structure

```
examples/
├── README.md                    # This file
├── react-app/                  # React SPA example
│   ├── .github/workflows/
│   ├── terraform/
│   ├── package.json
│   └── README.md
├── vue-app/                    # Vue.js SPA example
│   ├── .github/workflows/
│   ├── terraform/
│   ├── package.json
│   └── README.md
├── static-html/                # Plain HTML/CSS/JS example
│   ├── .github/workflows/
│   ├── terraform/
│   ├── index.html
│   └── README.md
├── jekyll-blog/                # Jekyll static site example
│   ├── .github/workflows/
│   ├── terraform/
│   ├── _config.yml
│   └── README.md
└── nextjs-export/              # Next.js static export example
    ├── .github/workflows/
    ├── terraform/
    ├── next.config.js
    └── README.md
```

## 🚀 Quick Start Examples

### React App
```bash
cd examples/react-app
cp -r . /path/to/your/react/project
# Edit terraform/main.tf with your domain
# Add GitHub secrets
git commit -am "Add deployment pipeline"
git push
```

### Vue App  
```bash
cd examples/vue-app
cp -r . /path/to/your/vue/project
# Edit terraform/main.tf with your domain
# Add GitHub secrets
git commit -am "Add deployment pipeline"  
git push
```

### Static HTML
```bash
cd examples/static-html
cp -r . /path/to/your/html/project
# Edit terraform/main.tf with your domain
# Add GitHub secrets
git commit -am "Add deployment pipeline"
git push
```

## 📋 What Each Example Includes

Each example directory contains:

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow
2. **`terraform/main.tf`** - Infrastructure configuration  
3. **`README.md`** - Project-specific setup instructions
4. **Sample project files** - Minimal working example

## 🔧 Customization Guide

### 1. Update Domain Names

Edit `terraform/main.tf` in each example:
```hcl
module "my_static_site" {
  # Change this to your domain
  domain_name = "your-project.your-domain.com"
  
  # Change this to your project name
  project_name = "your-project-name"
}
```

### 2. Configure GitHub Secrets

All examples require these secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`  
- `CLOUDFRONT_DISTRIBUTION_ID` (from Terraform output)

### 3. Adjust Build Commands

Modify `.github/workflows/deploy.yml` for your build process:

**React/Vue:**
```yaml
- name: Install and build
  run: |
    npm ci
    npm run build
```

**Jekyll:**
```yaml
- name: Build Jekyll site
  run: |
    bundle install
    bundle exec jekyll build
```

**Custom:**
```yaml
- name: Custom build
  run: |
    # Your build commands here
    make build
    ./custom-script.sh
```

## 🎯 Feature Branch Testing

Test feature branch routing:

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-design
   git push origin feature/new-design
   ```

2. **Check deployment:**
   ```
   https://your-domain.com/feature-new-design/
   ```

3. **Verify SEO protection:**
   ```bash
   curl https://your-domain.com/feature-new-design/robots.txt
   ```

4. **Clean up:**
   ```bash
   git push origin --delete feature/new-design
   # Deployment automatically cleaned up
   ```

## 🔍 Troubleshooting Examples

### React SPA 404s

If React routes return 404s, ensure SPA mode is enabled:

```yaml
- name: Deploy Static Site
  uses: IX-Erich/ix-cicd/reusable-actions/static-site-deploy@main
  with:
    spa-mode: 'true'  # This is required!
```

### Build Directory Mismatch

Common build directories by framework:

| Framework | Build Directory |
|-----------|----------------|
| React | `build` |
| Vue | `dist` |
| Angular | `dist/project-name` |
| Jekyll | `_site` |
| Next.js | `out` |

Update your workflow:
```yaml
with:
  build-dir: 'dist'  # Change to match your framework
```

### Asset Path Issues

For SPA applications with routing, ensure assets use relative paths:

**React (`package.json`):**
```json
{
  "homepage": "."
}
```

**Vue (`vue.config.js`):**
```javascript
module.exports = {
  publicPath: './'
}
```

## 💡 Advanced Examples

### Multi-Environment Setup

Deploy to staging and production:

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Staging
        uses: IX-Erich/ix-cicd/reusable-actions/static-site-deploy@main
        with:
          s3-bucket: 'staging.myapp.com'
          cloudfront-distribution-id: ${{ secrets.STAGING_CLOUDFRONT_ID }}

  deploy-production:  
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        uses: IX-Erich/ix-cicd/reusable-actions/static-site-deploy@main
        with:
          s3-bucket: 'myapp.com'
          cloudfront-distribution-id: ${{ secrets.PROD_CLOUDFRONT_ID }}
```

### Custom Cache Headers

Add cache optimization:

```hcl
module "my_static_site" {
  source = "github.com/IX-Erich/ix-cicd//terraform/modules/static-site-hosting"
  
  # Custom cache settings
  default_ttl = 86400  # 1 day
  max_ttl     = 31536000  # 1 year for assets
  
  # Cache different file types differently  
  custom_origins = {
    "/api/*" = {
      ttl = 0  # Don't cache API calls
    }
    "*.js" = {
      ttl = 31536000  # Cache JS for 1 year
    }
    "*.css" = {
      ttl = 31536000  # Cache CSS for 1 year  
    }
  }
}
```

### Security Headers

Add security headers via CloudFront:

```hcl
module "my_static_site" {
  # ... other config ...
  
  security_headers = {
    "Strict-Transport-Security" = "max-age=63072000"
    "X-Content-Type-Options" = "nosniff"
    "X-Frame-Options" = "DENY"
    "Referrer-Policy" = "strict-origin-when-cross-origin"
  }
}
```

## 🎨 Framework-Specific Tips

### React
- Use `"homepage": "."` in `package.json` for correct asset paths
- Enable SPA mode for React Router
- Consider code splitting for better performance

### Vue  
- Set `publicPath: './'` in `vue.config.js`
- Use Vue Router history mode with SPA mode enabled
- Optimize chunks with Webpack configuration

### Next.js
- Use `next export` for static generation
- Configure `trailingSlash: true` for better S3 compatibility
- Set `assetPrefix` for CDN optimization

### Jekyll
- Use relative URLs: `url: ""` in `_config.yml`
- Optimize images with Jekyll plugins
- Configure exclude list to avoid deploying source files

---

**Need help with your specific framework?** Check the individual example directories for detailed setup instructions! 🚀