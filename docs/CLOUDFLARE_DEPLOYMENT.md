# Cloudflare Workers & Pages Deployment Guide

This guide covers deploying **easyTenancy Global OS v4.5** to Cloudflare Pages and Workers.

## Overview

The deployment architecture uses:

- **Cloudflare Pages**: Static site hosting + serverless functions
- **Wrangler**: CLI tool for deployment and configuration
- **GitHub Actions**: Automated CI/CD pipeline
- **Workers AI**: Fallback for Novita FLUX.1 image generation
- **Multi-environment**: Production, Staging, Development

---

## Prerequisites

### Required

- **Node.js** v20+ ([download](https://nodejs.org/))
- **npm** v10+ (included with Node.js)
- **Cloudflare Account** ([free signup](https://dash.cloudflare.com/sign-up))
- **Cloudflare API Token** (from dashboard)
- **Cloudflare Account ID** (from dashboard)

### Optional

- **Wrangler CLI** (auto-installed by scripts)
- **Git** (for version control)

---

## Setup Instructions

### 1. Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use template: **"Edit Cloudflare Workers"**
5. Grant permissions:
   - `Account.Pages` → Edit
   - `Workers` → Edit
   - `Workers KV` → Edit (if using KV)
6. Copy token and save securely

### 2. Get Account ID

1. In Cloudflare Dashboard, go to **Accounts** or any zone
2. Right sidebar shows **Account ID** (looks like: `a1b2c3d4e5f6g7h8i9j0`)
3. Copy and save

### 3. Configure Environment Variables

**Option A: Export to shell**

```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
```

**Option B: Add to `.env` (local only)**

```bash
# .env (DO NOT commit this file)
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

Load it:

```bash
source .env
```

**Option C: GitHub Actions Secrets** (recommended for CI/CD)

1. Go to GitHub repo settings → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - `CLOUDFLARE_API_TOKEN` = your token
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID

---

## Deployment Methods

### Method 1: Local Deployment (Fastest)

Deploy directly from your machine:

```bash
# Production
./scripts/deploy-cloudflare.sh production

# Staging
./scripts/deploy-cloudflare.sh staging

# Development
./scripts/deploy-cloudflare.sh development

# Dry-run (see what would be deployed)
./scripts/deploy-cloudflare.sh production --dry-run
```

**What this script does:**
1. ✓ Validates prerequisites (Node, npm, wrangler)
2. ✓ Installs dependencies
3. ✓ Runs type checks and tests
4. ✓ Builds the project (`npm run build`)
5. ✓ Verifies build output
6. ✓ Deploys to Cloudflare Pages

**Output:** After successful deployment, you'll get:

```
✅ Environment:  production
✅ Project:      easy-tenancy-global-os-prod
✅ Files:        501
✅ Status:       Ready

🚀 Deployment URL:
   https://easy-tenancy-global-os-prod.pages.dev
```

### Method 2: GitHub Actions (Recommended for Teams)

Push to `main`, `staging`, or `develop` branches to trigger automatic deployment:

```bash
# Trigger production deployment
git push origin main

# Trigger staging deployment
git push origin staging

# Trigger development deployment
git push origin develop
```

**How it works:**
1. Commit triggers `.github/workflows/deploy-cloudflare.yml`
2. Tests run automatically
3. Build is created
4. Deploys to appropriate environment
5. Deployment status appears in GitHub

**Manual trigger:**

1. Go to GitHub repo → **Actions** tab
2. Select **Deploy to Cloudflare Pages**
3. Click **Run workflow**
4. Choose environment: production / staging / development
5. Confirm

### Method 3: Manual Wrangler Command

```bash
# Build first
npm run build

# Deploy
wrangler pages deploy dist \
  --project-name easy-tenancy-global-os-prod \
  --branch production
```

---

## Configuration

### `wrangler.toml`

Main configuration file for Cloudflare deployment:

```toml
name = "easy-tenancy-global-os"
type = "javascript"
compatibility_date = "2026-04-22"
pages_build_output_dir = "./dist"

# Compatibility flags
compatibility_flags = ["nodejs_compat"]

# Workers AI (fallback for Novita)
[ai]
binding = "AI"

# Observability
[observability.logs]
enabled = true
head_sampling_rate = 1

# Environment-specific config
[env.production]
name = "easy-tenancy-global-os-prod"

[env.staging]
name = "easy-tenancy-global-os-staging"

[env.development]
name = "easy-tenancy-global-os-dev"
```

### Optional: Enable D1 (SQLite)

```bash
# Create database
npx wrangler d1 create easy-tenancy-production

# Update wrangler.toml with database_id from output
# [[d1_databases]]
# binding = "DB"
# database_name = "easy-tenancy-production"
# database_id = "YOUR_DATABASE_ID"
```

### Optional: Enable KV (Key-Value Store)

```bash
# Create namespace
npx wrangler kv:namespace create EASY_TENANCY_KV

# Update wrangler.toml with IDs from output
# [[kv_namespaces]]
# binding = "KV"
# id = "YOUR_KV_ID"
# preview_id = "YOUR_KV_PREVIEW_ID"
```

### Optional: Enable R2 (Object Storage)

```bash
# Create bucket
npx wrangler r2 bucket create easy-tenancy-assets

# Update wrangler.toml
# [[r2_buckets]]
# binding = "R2"
# bucket_name = "easy-tenancy-assets"
```

---

## Environment-Specific URLs

After deployment, your app is available at:

| Environment | URL |
|-------------|-----|
| **Production** | `https://easy-tenancy-global-os-prod.pages.dev` |
| **Staging** | `https://easy-tenancy-global-os-staging.pages.dev` |
| **Development** | `https://easy-tenancy-global-os-dev.pages.dev` |

**Custom domain** (production only):

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Go to **Pages** → **easy-tenancy-global-os-prod**
4. Settings → **Custom domain**
5. Add your domain (e.g., `easytenant.global`)

---

## Monitoring & Logs

### View Deployment Logs

```bash
# Real-time logs
wrangler pages deployment list --project-name easy-tenancy-global-os-prod

# Specific deployment
wrangler pages deployment info <deployment-id> \
  --project-name easy-tenancy-global-os-prod
```

### Dashboard Monitoring

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select **Pages**
3. Open project → **Deployments** tab
4. Click deployment to see:
   - Build logs
   - Deployment status
   - Performance metrics
   - Analytics

### GitHub Actions Status

1. Go to GitHub repo → **Actions** tab
2. View workflow runs
3. Click run to see build/deploy logs
4. Check for errors or warnings

---

## Troubleshooting

### "CLOUDFLARE_API_TOKEN not set"

```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"

# Verify
echo $CLOUDFLARE_API_TOKEN
```

### Build fails

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build

# Check for errors
npm run typecheck
npm run test
```

### Deployment fails

```bash
# Check Wrangler version
wrangler --version

# Update if needed
npm install -g wrangler@4

# Try deploying with verbose output
wrangler pages deploy dist \
  --project-name easy-tenancy-global-os-prod \
  --branch production \
  --verbose
```

### Files not updating

```bash
# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear cache
# Settings → Clear browsing data → Cache
```

### Workers AI fallback not working

Ensure `wrangler.toml` has:

```toml
[ai]
binding = "AI"
```

And your Cloudflare account has **Workers AI enabled**.

---

## Performance Tips

### Optimize Build Size

```bash
# Check bundle size
npm run build

# Analyze (if webpack-bundle-analyzer installed)
npm run build:analyze
```

### Edge Caching

Add to `.wrangler` functions or Page rules:

```javascript
// Cache static assets (1 year)
response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')

// Cache HTML (5 minutes)
response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
```

### Use Cloudflare Features

- **Minification**: Automatic
- **Gzip**: Automatic
- **HTTP/2 Push**: Configured in dashboard
- **Smart Caching**: Enabled by default

---

## Security

### Protect API Keys

**Never commit secrets:**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use GitHub Secrets for CI/CD (see Setup section)
```

### Enable WASM

For edge-native features, add to `wrangler.toml`:

```toml
[env.production]
compatibility_flags = ["nodejs_compat", "streams_enable_constructors"]
```

### Rate Limiting

Use Cloudflare managed rate limiting:

```toml
[[rate_limiting_namespaces]]
binding = "RATE_LIMIT"
namespace_id = "YOUR_NAMESPACE_ID"
```

---

## Support

### Documentation

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)

### Community

- [Cloudflare Community](https://community.cloudflare.com/)
- [GitHub Issues](https://github.com/easy-tenancy-global-os/easy-tenancy-global-os-v4.5/issues)

---

## Next Steps

1. ✓ Set up Cloudflare account and API token
2. ✓ Deploy to Cloudflare using one of the methods above
3. ✓ Test the deployment at the generated URL
4. ✓ Monitor performance in Cloudflare Dashboard
5. ✓ (Optional) Add custom domain
6. ✓ (Optional) Enable D1, KV, R2 as needed
