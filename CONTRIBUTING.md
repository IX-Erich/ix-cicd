# Contributing to IX Static Site CI/CD System

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- **Bug Reports**: Include steps to reproduce, expected behavior, actual behavior, and environment details
- **Feature Requests**: Describe the use case, proposed solution, and any alternatives considered
- **Questions**: Check existing documentation and examples before creating an issue

### Code Contributions

1. **Fork the repository** and create a feature branch
2. **Follow the existing code style** and patterns
3. **Test your changes** thoroughly on real projects
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description

## 🛠️ Development Setup

### Prerequisites
- **AWS Account**: For testing infrastructure components
- **Terraform**: v1.0+ for infrastructure testing
- **Node.js**: v18+ for any JavaScript components
- **Bash**: For CLI tool testing

### Local Testing

```bash
# Clone your fork
git clone https://github.com/yourusername/ix-cicd.git
cd ix-cicd

# Test CLI tool
./cli/deploy-setup.sh --help

# Test Terraform module
cd terraform/modules/static-site-hosting
terraform init
terraform validate

# Test on a real project (recommended)
cd /path/to/test/project
/path/to/ix-cicd/cli/deploy-setup.sh init --project-name test --domain-name test.example.com
```

### Testing Guidelines

1. **Test all abstraction levels** (CLI, GitHub Actions, Terraform)
2. **Test multiple frameworks** (React, Vue, static HTML)
3. **Test feature branch routing** end-to-end
4. **Test cleanup functionality** when branches are deleted
5. **Verify documentation accuracy** with real examples

## 📝 Code Style

### Shell Scripts (CLI)
- Use `#!/bin/bash` shebang
- Enable strict mode: `set -euo pipefail`
- Quote variables: `"$variable"` 
- Use long options: `--flag` not `-f`
- Add comments for complex logic

### Terraform
- Use consistent formatting: `terraform fmt`
- Add variable descriptions
- Include sensible defaults
- Tag all resources appropriately
- Use data sources where possible

### GitHub Actions
- Use semantic action names
- Provide clear input descriptions  
- Include usage examples in README
- Follow security best practices
- Test with different input combinations

### Documentation
- Use clear, concise language
- Include code examples that work
- Add troubleshooting sections
- Update table of contents as needed
- Test all commands and examples

## 🎯 Areas for Contribution

### High Priority
- [ ] Additional framework examples (Vue, Jekyll, Next.js)
- [ ] Improved error handling and validation
- [ ] Cost estimation and optimization tools
- [ ] Multi-environment deployment patterns

### Documentation
- [ ] Video tutorials for common setups
- [ ] Migration guides from other platforms
- [ ] Best practices documentation
- [ ] Troubleshooting FAQ expansion

### Features
- [ ] GitHub CLI integration
- [ ] Monitoring and alerting integration
- [ ] Custom domain automation
- [ ] Blue/green deployment support
- [ ] Multi-region deployment

### Testing & Quality
- [ ] Automated testing framework
- [ ] Integration test suite
- [ ] Performance benchmarking
- [ ] Security scanning integration

## 🔍 Pull Request Process

1. **Create a descriptive PR title**
   - Good: "Add Vue.js framework example with routing support"
   - Bad: "Add Vue example"

2. **Provide detailed description**
   - What changes were made and why
   - How to test the changes
   - Any breaking changes or migration notes
   - Screenshots for UI changes

3. **Update documentation**
   - Update README if adding new features
   - Add or update examples as needed
   - Update component-specific documentation

4. **Test thoroughly**
   - Test on multiple frameworks
   - Test feature branch routing
   - Verify cleanup functionality
   - Test with different AWS configurations

5. **Keep PRs focused**
   - One feature or fix per PR
   - Avoid combining unrelated changes
   - Split large changes into smaller PRs

## 🧪 Testing Your Changes

### Manual Testing Checklist

- [ ] CLI tool creates correct files
- [ ] Terraform module deploys successfully  
- [ ] GitHub Actions workflow triggers correctly
- [ ] Feature branches deploy to correct URLs
- [ ] Main branch deploys to root domain
- [ ] SSL certificates are created and applied
- [ ] CloudFront caching works correctly
- [ ] Branch deletion triggers cleanup
- [ ] SEO robots.txt blocks preview branches

### Framework Testing
Test with at least one framework from each category:

- [ ] **SPA Framework** (React, Vue, Angular)
- [ ] **Static Site Generator** (Jekyll, Hugo, Eleventy)  
- [ ] **Plain HTML/CSS/JS** site
- [ ] **Build-less** site (no npm/build process)

## 💡 Contribution Ideas

### For Beginners
- Fix typos in documentation
- Add missing error messages
- Improve CLI help text
- Add validation for user inputs
- Create framework-specific troubleshooting guides

### For Intermediate Contributors  
- Add new framework examples
- Improve Terraform module flexibility
- Add GitHub Actions workflow templates
- Create migration scripts from other platforms
- Add monitoring and alerting features

### For Advanced Contributors
- Multi-region deployment support
- Blue/green deployment strategies
- Custom CloudFront behaviors
- Advanced security configurations
- Performance optimization tools

## 📚 Resources

### Documentation
- [Complete System Documentation](docs/REUSABLE-CICD-SYSTEM.md)
- [Framework Examples](examples/README.md)
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### AWS Services Used
- **S3**: Static website hosting
- **CloudFront**: Content delivery network
- **ACM**: SSL certificate management
- **Route53**: DNS management
- **IAM**: Access management

### Tools & Technologies
- **Terraform**: Infrastructure as code
- **GitHub Actions**: CI/CD workflows
- **Bash**: CLI scripting
- **JavaScript**: CloudFront Functions

## 🎉 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- GitHub contributor graphs
- Optional mention in project documentation

## 📞 Getting Help

- **General Questions**: Create a GitHub Discussion
- **Technical Issues**: Open a GitHub Issue
- **Security Concerns**: Email security@imaginariax.com
- **Real-time Help**: Join our Discord community (link in README)

Thank you for helping make static site deployment easier for everyone! 🚀