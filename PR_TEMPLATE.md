# Pull Request: Deploy to Cloudflare Workers Setup

## 🎯 Overview

This PR introduces complete Cloudflare Workers and Pages deployment infrastructure for **easyTenancy Global OS v4.5**, including:

- ✅ Cloudflare Pages configuration (`wrangler.toml`)
- ✅ GitHub Actions CI/CD pipeline
- ✅ Local deployment script
- ✅ tinyfish MCP plugin for programmatic deployment
- ✅ OAuth token rotation policy
- ✅ Comprehensive deployment documentation

---

## 📋 Files Added

### Configuration
- `wrangler.toml` — Cloudflare Pages/Workers configuration
- `.github/workflows/deploy-cloudflare.yml` — GitHub Actions deployment workflow
- `scripts/deploy-cloudflare.sh` — Local deployment script

### Documentation
- `docs/CLOUDFLARE_DEPLOYMENT.md` — Complete setup and deployment guide

### MCP Plugin (tinyfish)
- `plugins/tinyfish-mcp/plugin.json` — Plugin marker and capabilities
- `plugins/tinyfish-mcp/mcp_config.json` — MCP resource definitions
- `plugins/tinyfish-mcp/skills/invoke-agent/SKILL.md` — Agent invoke skill
- `plugins/tinyfish-mcp/rules/auth.md` — OAuth Bearer auth policy

---

## 🚀 Deployment Environments

| Environment | URL | Branch Trigger |
|---|---|---|
| **Production** | `easy-tenancy-global-os-prod.pages.dev` | `main` |
| **Staging** | `easy-tenancy-global-os-staging.pages.dev` | `staging` |
| **Development** | `easy-tenancy-global-os-dev.pages.dev` | `develop` |

---

## 💡 How to Deploy

### After Merging This PR:

#### Option 1: Local Deployment (Fastest)
```bash
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

# Deploy to production
./scripts/deploy-cloudflare.sh production
```

#### Option 2: Automatic CI/CD (Recommended)
```bash
# Just push to main — GitHub Actions handles the rest
git push origin main
```

#### Option 3: Manual Wrangler
```bash
npm run build
wrangler pages deploy dist \
  --project-name easy-tenancy-global-os-prod \
  --branch production
```

---

## ✅ Pre-deployment Checklist

- [ ] Cloudflare account created
- [ ] API token generated
- [ ] Account ID obtained
- [ ] Environment variables set (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [ ] GitHub secrets configured (for CI/CD)
- [ ] This PR merged to `main`
- [ ] Run first deployment: `./scripts/deploy-cloudflare.sh production`

---

## 🔐 Security Features

✓ OAuth Bearer token authentication  
✓ Automatic token rotation every 30 days  
✓ Secure token storage (OS Keychain)  
✓ Audit logging in Cloudflare Dashboard  
✓ Per-environment credentials support  

---

## 📊 Architecture

```
Main Branch (main)
       ↓
GitHub Actions Workflow
       ↓
   npm ci
   npm run typecheck
   npm run test
   npm run build
       ↓
wrangler pages deploy
       ↓
Cloudflare Pages (Production)
   https://easy-tenancy-global-os-prod.pages.dev
```

---

## 🐛 Troubleshooting

**See full troubleshooting guide in `docs/CLOUDFLARE_DEPLOYMENT.md`**

Common issues:
- Token not set → Export `CLOUDFLARE_API_TOKEN`
- Build fails → Run `npm run typecheck && npm run test`
- Deployment fails → Check `wrangler pages deployment list`

---

## 📚 Documentation

Complete setup instructions available in:
- **`docs/CLOUDFLARE_DEPLOYMENT.md`** — Full guide with examples
- **`plugins/tinyfish-mcp/skills/invoke-agent/SKILL.md`** — Agent skill docs
- **`plugins/tinyfish-mcp/rules/auth.md`** — Auth policy details

---

## 🔄 Next Steps After Merge

1. ✅ Merge this PR to `main`
2. 🚀 GitHub Actions automatically deploys to production
3. 🔗 Access deployment at `https://easy-tenancy-global-os-prod.pages.dev`
4. ✨ (Optional) Add custom domain in Cloudflare Dashboard

---

**Ready to merge! 🎯**
