# React App Deployment Example

This example shows how to deploy a React SPA with routing support and feature branch previews.

## 📋 Features Demonstrated

- ✅ React SPA with client-side routing
- ✅ Feature branch deployments (`/feature-name/`)  
- ✅ SEO protection for preview branches
- ✅ Automatic cache busting
- ✅ Production optimizations

## 🚀 Quick Setup

1. **Copy files to your React project:**
   ```bash
   cp -r . /path/to/your/react/project
   ```

2. **Update configuration:**
   ```bash
   # Edit terraform/main.tf with your domain
   sed -i '' 's/my-react-app.imaginariax.com/your-domain.com/' terraform/main.tf
   ```

3. **Deploy infrastructure:**
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

4. **Add GitHub secrets:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`  
   - `CLOUDFRONT_DISTRIBUTION_ID` (from Terraform output)

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add deployment pipeline"
   git push origin main
   ```

## 🔧 React-Specific Configuration

### Package.json Changes

Add this to enable relative asset paths:

```json
{
  "homepage": ".",
  "scripts": {
    "build": "react-scripts build"
  }
}
```

### SPA Routing Support  

The configuration automatically handles React Router by:

1. **CloudFront Function** - Routes `/feature-*` to correct S3 paths
2. **S3 Error Pages** - Redirect 404s to `index.html` for client routing
3. **SPA Mode** - Enabled in the deployment action

### Build Optimization

The workflow includes React optimizations:

```yaml
- name: Build React app
  run: |
    npm ci --prefer-offline --no-audit
    CI=false npm run build  # Treat warnings as warnings, not errors
    
    # Remove source maps in production (optional)
    find build -name "*.map" -delete
```

## 🎯 Testing Feature Branches

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-component
   
   # Make changes to your React app
   echo "console.log('Feature branch change')" >> src/App.js
   
   git commit -am "Add feature changes"
   git push origin feature/new-component
   ```

2. **Test deployment:**
   ```bash
   # Wait for GitHub Actions to complete, then:
   curl -I https://your-domain.com/feature-new-component/
   
   # Should return 200 with your React app
   ```

3. **Verify React routing works:**
   ```bash
   # Test that React Router routes work on feature branch
   curl https://your-domain.com/feature-new-component/about
   
   # Should serve the React app (not 404)
   ```

## 🔍 Common Issues & Solutions

### Issue: React Router Routes Return 404

**Problem:** Direct navigation to routes like `/about` returns 404.

**Solution:** Ensure SPA mode is enabled:
```yaml
with:
  spa-mode: 'true'
```

### Issue: Assets Not Loading

**Problem:** CSS/JS assets return 404 on feature branches.

**Solution:** Use relative paths in `package.json`:
```json
{
  "homepage": "."
}
```

### Issue: Build Failing on Warnings

**Problem:** Create React App treats warnings as errors in CI.

**Solution:** Set `CI=false` in build command:
```yaml
run: CI=false npm run build
```

### Issue: Large Bundle Size

**Solution:** Enable code splitting and analyze bundle:
```bash
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

## 📦 Bundle Optimization

### Code Splitting

Use React's lazy loading:

```jsx
import { lazy, Suspense } from 'react';

const About = lazy(() => import('./About'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <About />
    </Suspense>
  );
}
```

### Environment Variables

Use `.env.production` for production builds:

```env
# .env.production
GENERATE_SOURCEMAP=false
REACT_APP_VERSION=$npm_package_version
```

Reference in workflow:
```yaml
- name: Build with environment
  run: |
    echo "REACT_APP_VERSION=$(node -p require('./package.json').version)" >> .env.production
    npm run build
```

## 🎨 Custom React Configurations

### TypeScript Support

For TypeScript React apps, no changes needed! The build process automatically detects `tsconfig.json`.

### Custom Webpack Config (CRACO)

If using CRACO for custom webpack config:

```javascript
// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Custom optimizations for production
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all'
            }
          }
        };
      }
      return webpackConfig;
    }
  }
};
```

### PWA Support

For Create React App PWA template:

```yaml
- name: Build PWA
  run: |
    npm ci
    npm run build
    
    # Verify service worker was generated
    test -f build/service-worker.js || exit 1
```

## 🚀 Advanced Features

### Cache Invalidation

The system automatically handles cache invalidation through:

1. **Hashed filenames** - React builds with content hashes
2. **CloudFront invalidation** - Automated after each deploy
3. **Cache headers** - Appropriate caching for different file types

### Performance Monitoring

Add performance monitoring:

```jsx
// src/reportWebVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);  
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Error Boundaries

Add error boundary for feature branches:

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error only in production
    if (process.env.NODE_ENV === 'production') {
      console.error('React Error Boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          {window.location.pathname.includes('feature-') && (
            <p>This is a preview branch. Check the main site.</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔒 Security Considerations

### Content Security Policy

Add CSP headers via CloudFront (configured in Terraform module):

```hcl
security_headers = {
  "Content-Security-Policy" = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
}
```

### Environment Secrets

Never commit secrets to React code:

```yaml
# In GitHub workflow
- name: Build with secrets
  env:
    REACT_APP_API_URL: ${{ secrets.API_URL }}
  run: npm run build
```

## 📊 Monitoring Setup

### Basic Analytics

```jsx
// src/analytics.js
export const trackPageView = (path) => {
  // Only track main branch, not feature branches
  if (!path.match(/^\/feature-/)) {
    // Your analytics code
  }
};
```

### Error Tracking

```jsx
window.addEventListener('error', (error) => {
  // Only report errors from main branch
  if (!window.location.pathname.match(/^\/feature-/)) {
    // Send to error tracking service
  }
});
```

## 🎉 Success Checklist

- [ ] React app builds without errors
- [ ] Feature branches deploy to `/feature-name/` paths  
- [ ] React routing works on all deployments
- [ ] Assets load correctly with relative paths
- [ ] SEO robots.txt blocks feature branches
- [ ] Main branch deploys to root domain
- [ ] CloudFront invalidation clears cache
- [ ] Build optimizations are applied

---

**Your React app is now ready for continuous deployment with feature branch previews!** 🚀

For more advanced configurations, check the other examples in the `examples/` directory.