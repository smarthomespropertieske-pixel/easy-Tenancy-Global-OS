# OAuth Bearer Authentication & Token Rotation Policy

**easyTenancy Global OS — Cloudflare Workers Integration**

## Overview

This document defines the OAuth Bearer authentication flow and token rotation policy for the tinyfish MCP plugin deployed on Cloudflare Workers.

---

## OAuth Bearer Flow

### 1. Token Acquisition

**Endpoint:**
```
POST https://api.cloudflare.com/client/v4/auth/generate
```

**Request:**
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials",
  "scope": "pages:write workers:write account:read"
}
```

**Response:**
```json
{
  "access_token": "v1.0eXpqZXdjamVpSkhQST1Mam1iZjhiMGJAQ0xPVURGTEFSRS5DT00=",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "pages:write workers:write account:read"
}
```

### 2. Using the Token

All API requests include the Authorization header:

```bash
curl -H "Authorization: Bearer v1.0eXpqZXdjamVpSkhQST1Mam1iZjhiMGJAQ0xPVURGTEFSRS5DT00=" \
  https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/pages
```

### 3. Token Storage

Tokens are stored securely:

**Linux/macOS:**
- Uses OS Keychain (Secretkeeper/Keyring)
- Location: `~/.tinyfish/secrets/cloudflare.enc`

**Windows:**
- Uses Windows Credential Manager
- Namespace: `tinyfish:cloudflare`

**Fallback:**
- Encrypted local storage at `~/.tinyfish/tokens.enc`
- Encryption key derived from system entropy

### 4. Token Usage in wrangler.toml

```toml
[env.production]
name = "easy-tenancy-global-os-prod"
account_id = "YOUR_ACCOUNT_ID"

# Token automatically injected via CLOUDFLARE_API_TOKEN env var
```

---

## Token Rotation Policy

### Automatic Rotation Schedule

| Aspect | Setting |
|--------|---------|
| **Rotation interval** | Every 30 days (2,592,000 seconds) |
| **Token lifetime** | 1 hour (3,600 seconds) |
| **Grace period** | 5 minutes before expiry |
| **Retry on failure** | 3 attempts with exponential backoff |

### Rotation Trigger Events

Tokens are rotated on:

1. **Schedule** — Every 30 days automatically
2. **Expiry** — When token approaches 5-minute mark before expiry
3. **Manual request** — `tinyfish agent run auth rotate`
4. **Deployment** — Before each `tinyfish agent run deploy`
5. **API error** — If 401/403 received (automatic refresh)

### Rotation Process

```
┌─────────────────────────────────────────┐
│ Check token expiry                      │
└────────────┬────────────────────────────┘
             │
      ┌──────▼──────┐
      │ Expired?    │
      │ (< 5 min)   │
      └──────┬──────┘
             │
        ┌────┴────┐
        │YES  NO  │
        │         │
    ┌───▼───┐     │
    │Request│     │
    │new    │     │
    │token  │     └──► Use existing token
    └───┬───┘
        │
    ┌───▼────────────────────┐
    │ POST /auth/generate    │
    │ with credentials       │
    └───┬────────────────────┘
        │
    ┌───▼──────┐
    │Success?  │
    └───┬──────┘
        │
   ┌────┴────┐
   │YES  NO  │
   │         │
   │      ┌──▼────────────────┐
   │      │ Retry (3x) with   │
   │      │ exponential       │
   │      │ backoff           │
   │      └──┬─────────────────┘
   │         │
   │      ┌──▼──┐
   │      │Max  │
   │      │retry?
   │      └──┬──┘
   │         │
   │      ┌──▼──────────────┐
   │      │ Use cached      │
   │      │ token (fallback)│
   │      └─────────────────┘
   │
   │
   └──────┬─────────────────┐
          │                 │
    ┌─────▼────┐   ┌────────▼──────┐
    │ Store    │   │ Update env    │
    │ securely │   │ CLOUDFLARE_   │
    │          │   │ API_TOKEN     │
    └──────────┘   └───────────────┘
```

### Rotation Backoff Strategy

```
Attempt 1: Wait 1 second, retry
Attempt 2: Wait 2 seconds, retry
Attempt 3: Wait 4 seconds, retry
Attempt 4: Use cached token (fallback)
```

---

## Configuration

### Enable/Disable Auto-Rotation

Edit `~/.tinyfish/cloudflare.json`:

```json
{
  "apiToken": "...",
  "accountId": "...",
  "auth": {
    "autoRotate": true,
    "rotationIntervalDays": 30,
    "graceTimeMinutes": 5,
    "maxRetries": 3,
    "backoffMultiplier": 2
  }
}
```

### Manual Rotation

```bash
# Rotate token immediately
tinyfish agent run auth rotate --provider cloudflare

# Force rotation (don't check expiry)
tinyfish agent run auth rotate --provider cloudflare --force

# Rotate and update all environments
tinyfish agent run auth rotate --provider cloudflare --all-envs
```

### View Token Info

```bash
# Show current token (masked)
tinyfish agent run auth show --provider cloudflare

# Show expiry time
tinyfish agent run auth show --provider cloudflare --expiry

# Show full details (DANGEROUS - for debugging only)
tinyfish agent run auth show --provider cloudflare --verbose --unsafe
```

---

## Security Best Practices

### ✓ DO

- ✓ Use long-lived credentials for the initial token acquisition
- ✓ Enable automatic token rotation
- ✓ Store tokens in OS Keychain when possible
- ✓ Use short-lived tokens (1 hour)
- ✓ Rotate credentials quarterly (independent of token rotation)
- ✓ Use separate credentials per environment (prod/staging/dev)
- ✓ Audit token usage in Cloudflare logs

### ✗ DON'T

- ✗ Commit tokens to version control
- ✗ Share tokens via email or chat
- ✗ Store tokens in plain text
- ✗ Disable automatic rotation
- ✗ Use same token for multiple environments
- ✗ Keep tokens longer than necessary
- ✗ Log tokens to stdout/stderr

---

## Troubleshooting

### Token Not Rotating

**Check rotation status:**
```bash
tinyfish agent run auth status --provider cloudflare
```

**Force rotation:**
```bash
tinyfish agent run auth rotate --provider cloudflare --force
```

**Check logs:**
```bash
cat ~/.tinyfish/logs/auth.log
```

### "Token Expired" Error

**Solution 1: Manual rotation**
```bash
tinyfish agent run auth rotate --provider cloudflare --force
```

**Solution 2: Check expiry**
```bash
tinyfish agent run auth show --provider cloudflare --expiry
```

**Solution 3: Re-authenticate**
```bash
# Provide new credentials
export CLOUDFLARE_API_TOKEN="new_token_here"
tinyfish agent run deploy
```

### Credentials Not Found

**Check environment variables:**
```bash
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

**Check keychain (macOS):**
```bash
security find-generic-password -s "tinyfish:cloudflare"
```

**Check credential manager (Windows):**
```powershell
Get-StoredCredential -Target "tinyfish:cloudflare"
```

---

## Monitoring

### Token Rotation Logs

Stored at: `~/.tinyfish/logs/auth.log`

```
[2026-07-20T14:32:15Z] INFO: Token rotation scheduled (interval: 30d)
[2026-07-20T14:32:15Z] INFO: Token expiry: 2026-08-19T14:32:15Z
[2026-08-19T14:30:00Z] WARN: Token expiring in 5 minutes
[2026-08-19T14:30:15Z] INFO: Requesting new token from Cloudflare
[2026-08-19T14:30:16Z] INFO: Token rotated successfully
[2026-08-19T14:30:17Z] INFO: Updated CLOUDFLARE_API_TOKEN in environment
```

### Cloudflare Audit Logs

View in [Cloudflare Dashboard](https://dash.cloudflare.com/):

1. Go to **Account** → **Audit Logs**
2. Filter by **Type**: "API Token"
3. Filter by **Action**: "Created", "Rotated", "Revoked"

---

## Integration with CI/CD

### GitHub Actions

Store secrets:

```bash
# In GitHub repo settings → Secrets

CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

Use in workflow:

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Azure DevOps

Store in variable groups:

```yaml
- group: cloudflare-secrets

variables:
  CLOUDFLARE_API_TOKEN: $(cloudflare_api_token)
  CLOUDFLARE_ACCOUNT_ID: $(cloudflare_account_id)
```

---

## Compliance

| Requirement | Status |
|-------------|--------|
| Token rotation | ✓ Automatic every 30 days |
| Secure storage | ✓ OS Keychain + encryption |
| Audit logging | ✓ Cloudflare audit logs |
| Credential isolation | ✓ Per-environment credentials |
| Expiry handling | ✓ 5-minute grace period |
| Retry logic | ✓ 3 attempts with backoff |

---

## References

- [Cloudflare API Token Management](https://developers.cloudflare.com/api/tokens/)
- [OAuth 2.0 Spec](https://tools.ietf.org/html/rfc6749)
- [Bearer Token RFC 6750](https://tools.ietf.org/html/rfc6750)
