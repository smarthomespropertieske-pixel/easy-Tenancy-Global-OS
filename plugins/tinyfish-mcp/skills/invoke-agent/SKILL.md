# tinyfish Agent Invoke Skill

**Deployment skill for easyTenancy Global OS on Cloudflare Workers**

## Overview

This skill enables programmatic deployment and management of the easyTenancy application on Cloudflare Pages and Workers through the tinyfish MCP protocol.

## Usage

### Basic Deployment

```bash
tinyfish agent run deploy
```

Deploys to the default environment (production).

### Deploy to Specific Environment

```bash
tinyfish agent run deploy --env staging
tinyfish agent run deploy --env development
```

Options:
- `production` — Deploy to production environment
- `staging` — Deploy to staging environment
- `development` — Deploy to development environment

### Dry-run (Preview)

```bash
tinyfish agent run deploy --dry-run
```

Shows what would be deployed without making changes.

### With Custom Configuration

```bash
tinyfish agent run deploy \
  --env production \
  --project easy-tenancy-global-os-prod \
  --branch main
```

## Commands

### `deploy`

Deploy application to Cloudflare Pages.

**Syntax:**
```
tinyfish agent run deploy [options]
```

**Options:**
- `--env <environment>` — Target environment (production|staging|development)
- `--project <name>` — Cloudflare project name
- `--branch <branch>` — Git branch name (auto-detected by default)
- `--dry-run` — Preview deployment without applying changes
- `--verbose` — Show detailed output
- `--skip-tests` — Skip tests before deployment
- `--skip-build` — Skip build step (use existing dist/)

**Examples:**

```bash
# Deploy to production
tinyfish agent run deploy --env production

# Preview staging deployment
tinyfish agent run deploy --env staging --dry-run

# Deploy without tests
tinyfish agent run deploy --env development --skip-tests
```

### `logs`

View deployment logs and status.

**Syntax:**
```
tinyfish agent run logs [options]
```

**Options:**
- `--env <environment>` — Environment to query
- `--project <name>` — Cloudflare project name
- `--limit <n>` — Number of recent deployments to show (default: 10)
- `--follow` — Stream logs in real-time

**Examples:**

```bash
# Show recent production deployments
tinyfish agent run logs --env production

# Follow staging logs
tinyfish agent run logs --env staging --follow

# Show 20 recent development deployments
tinyfish agent run logs --env development --limit 20
```

### `config`

Manage Cloudflare configuration.

**Syntax:**
```
tinyfish agent run config <subcommand> [options]
```

**Subcommands:**

#### `config get`

Retrieve current configuration.

```bash
tinyfish agent run config get
tinyfish agent run config get --env production
```

#### `config set`

Update configuration.

```bash
tinyfish agent run config set --ai-enabled true
tinyfish agent run config set --cache-ttl 300
```

#### `config validate`

Validate configuration files.

```bash
tinyfish agent run config validate
```

## Authentication

The skill uses **OAuth Bearer token** authentication with automatic rotation.

### Token Setup

**Option 1: Environment Variable**

```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

# Then run
tinyfish agent run deploy
```

**Option 2: Configuration File**

Create `~/.tinyfish/cloudflare.json`:

```json
{
  "apiToken": "your_token_here",
  "accountId": "your_account_id",
  "autoRotate": true,
  "rotationInterval": 2592000
}
```

### Token Rotation

Tokens are automatically rotated every 30 days. To manually rotate:

```bash
tinyfish agent run auth rotate --provider cloudflare
```

## Workflow Examples

### Complete CI/CD Pipeline

```bash
# 1. Run tests
npm run test

# 2. Build
npm run build

# 3. Preview deployment
tinyfish agent run deploy --env staging --dry-run

# 4. Deploy to staging
tinyfish agent run deploy --env staging

# 5. View logs
tinyfish agent run logs --env staging --follow

# 6. Monitor (after validation)
tinyfish agent run logs --env staging --limit 5

# 7. Deploy to production
tinyfish agent run deploy --env production
```

### Automated Deployment with Status Check

```bash
#!/bin/bash

# Deploy
if tinyfish agent run deploy --env production; then
  echo "✓ Deployment successful"
  
  # Get latest logs
  tinyfish agent run logs --env production --limit 1
  
  # Get deployment URL
  DEPLOY_URL=$(tinyfish agent run config get --env production | jq -r '.url')
  echo "🚀 Live at: $DEPLOY_URL"
else
  echo "✗ Deployment failed"
  exit 1
fi
```

## Error Handling

### Common Errors

**Token Expired**
```
Error: Token expired
Solution: Re-export or rotate token
```

**Invalid Environment**
```
Error: Environment 'staging' not found
Solution: Use 'production', 'staging', or 'development'
```

**Build Failed**
```
Error: npm run build failed
Solution: Check build output or use --skip-build to debug
```

**Deployment Failed**
```
Error: Cloudflare API error
Solution: Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
```

## Performance

- **Deployment time**: ~30-60 seconds
- **Build time**: ~2-5 minutes
- **Token validation**: <100ms

## Security

✓ Tokens stored securely (OS keychain if available)  
✓ Automatic token rotation every 30 days  
✓ All communications over HTTPS  
✓ Audit logs recorded in Cloudflare dashboard  

## Related Skills

- `config` — Manage application configuration
- `auth` — Authentication and token management
- `monitor` — Monitor deployment status

## Support

For issues or questions:

1. Check logs: `tinyfish agent run logs --follow`
2. Validate config: `tinyfish agent run config validate`
3. View documentation: `tinyfish help agent invoke-agent`
4. Open issue: [GitHub Issues](https://github.com/easy-tenancy-global-os/easy-tenancy-global-os-v4.5/issues)
