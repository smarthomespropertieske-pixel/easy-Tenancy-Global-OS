#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#  easyTenancy — Cloudflare Workers Deploy Script
#  ─────────────────────────────────────────────────────────────────────────
#  Deploys the application to Cloudflare Pages/Workers
#
#  Usage:
#    ./scripts/deploy-cloudflare.sh [environment] [--dry-run]
#
#  Examples:
#    ./scripts/deploy-cloudflare.sh production
#    ./scripts/deploy-cloudflare.sh staging --dry-run
#    ./scripts/deploy-cloudflare.sh development
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors for output ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Functions ─────────────────────────────────────────────────────────────
log() { echo -e "${BLUE}→${NC} $*"; }
ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*"; }
sep() { echo "════════════════════════════════════════════════════════════════"; }

# ── Configuration ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DIST_DIR="$PROJECT_ROOT/dist"
ENVIRONMENT="${1:-production}"
DRY_RUN="${2:-}"

# Environment mapping
case "$ENVIRONMENT" in
  production|prod|p)
    PROJECT_NAME="easy-tenancy-global-os-prod"
    ENVIRONMENT="production"
    ;;
  staging|stage|s)
    PROJECT_NAME="easy-tenancy-global-os-staging"
    ENVIRONMENT="staging"
    ;;
  development|dev|d)
    PROJECT_NAME="easy-tenancy-global-os-dev"
    ENVIRONMENT="development"
    ;;
  *)
    err "Invalid environment: $ENVIRONMENT"
    echo "Valid options: production, staging, development"
    exit 1
    ;;
esac

# ── Main ──────────────────────────────────────────────────────────────────
sep
log "easyTenancy Cloudflare Deploy"
sep
echo ""
log "Environment: ${BLUE}${ENVIRONMENT}${NC}"
log "Project:     ${BLUE}${PROJECT_NAME}${NC}"
log "Build dir:   ${BLUE}${DIST_DIR}${NC}"
log "Dry-run:     ${BLUE}${DRY_RUN:-false}${NC}"
echo ""

# ── Phase 1: Prerequisites ─────────────────────────────────────────────────
sep
log "PHASE 1: Checking prerequisites"
sep

ERRORS=0

# Check Node
if ! command -v node &>/dev/null; then
  err "node not found — install Node.js v20+"
  ((ERRORS++)) || true
else
  ok "node $(node --version)"
fi

# Check npm
if ! command -v npm &>/dev/null; then
  err "npm not found"
  ((ERRORS++)) || true
else
  ok "npm $(npm --version)"
fi

# Check wrangler
if ! command -v wrangler &>/dev/null; then
  warn "wrangler not found — will install globally"
  npm install -g wrangler@4
fi
ok "wrangler $(wrangler --version)"

# Check Cloudflare API token
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  err "CLOUDFLARE_API_TOKEN not set"
  echo "   Export it: export CLOUDFLARE_API_TOKEN=<your-token>"
  ((ERRORS++)) || true
else
  ok "CLOUDFLARE_API_TOKEN is set"
fi

# Check Cloudflare Account ID
if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  err "CLOUDFLARE_ACCOUNT_ID not set"
  echo "   Export it: export CLOUDFLARE_ACCOUNT_ID=<your-account-id>"
  ((ERRORS++)) || true
else
  ok "CLOUDFLARE_ACCOUNT_ID is set"
fi

if (( ERRORS > 0 )); then
  echo ""
  err "$ERRORS prerequisite(s) failed. Fix above and re-run."
  exit 1
fi

echo ""

# ── Phase 2: Install dependencies ──────────────────────────────────────────
sep
log "PHASE 2: Installing dependencies"
sep

cd "$PROJECT_ROOT"

if [[ -f package-lock.json ]]; then
  npm ci --prefer-offline 2>&1 | tail -3
  ok "npm ci complete"
else
  npm install --prefer-offline 2>&1 | tail -3
  ok "npm install complete"
fi

echo ""

# ── Phase 3: Build ─────────────────────────────────────────────────────────
sep
log "PHASE 3: Building project"
sep

if npm run build 2>&1 | tail -10; then
  ok "Build complete"
else
  err "Build failed"
  exit 1
fi

echo ""

# ── Phase 4: Pre-deployment checks ─────────────────────────────────────────
sep
log "PHASE 4: Pre-deployment checks"
sep

# Check dist directory exists
if [[ ! -d "$DIST_DIR" ]]; then
  err "Build output directory not found: $DIST_DIR"
  exit 1
fi
ok "Build output directory exists"

# Check dist has files
FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l)
if (( FILE_COUNT == 0 )); then
  err "Build output directory is empty"
  exit 1
fi
ok "Found $FILE_COUNT files in build output"

# Check for index.html
if [[ ! -f "$DIST_DIR/index.html" ]]; then
  err "index.html not found in build output"
  exit 1
fi
ok "index.html found"

echo ""

# ── Phase 5: Deploy ────────────────────────────────────────────────────────
sep
log "PHASE 5: Deploying to Cloudflare Pages"
sep

DEPLOY_COMMAND=(
  wrangler pages deploy "$DIST_DIR"
  --project-name "$PROJECT_NAME"
  --branch "$ENVIRONMENT"
)

if [[ -n "$DRY_RUN" ]]; then
  log "DRY-RUN: Would execute:"
  echo "  ${DEPLOY_COMMAND[@]}"
  ok "Dry-run complete (no changes made)"
else
  log "Executing: ${DEPLOY_COMMAND[@]}"
  if "${DEPLOY_COMMAND[@]}"; then
    ok "Deployment successful!"
  else
    err "Deployment failed"
    exit 1
  fi
fi

echo ""

# ── Phase 6: Summary ───────────────────────────────────────────────────────
sep
log "SUMMARY"
sep

echo "✅ Environment:  ${BLUE}${ENVIRONMENT}${NC}"
echo "✅ Project:      ${BLUE}${PROJECT_NAME}${NC}"
echo "✅ Files:        ${BLUE}${FILE_COUNT}${NC}"
echo "✅ Status:       ${GREEN}Ready${NC}"

if [[ -n "$DRY_RUN" ]]; then
  echo ""
  echo "Run without ${BLUE}--dry-run${NC} to deploy:"
  echo "  ./scripts/deploy-cloudflare.sh $ENVIRONMENT"
else
  echo ""
  echo "🚀 Deployment URL:"
  echo "   https://${PROJECT_NAME}.pages.dev"
fi

echo ""
sep
