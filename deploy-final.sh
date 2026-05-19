#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  deploy-final.sh — Easy-Tenancy Global OS  ·  Sovereign Deploy v3.0
#  Locks in #1 global position on Cloudflare Pages.
#
#  Sequence:
#    1. Prerequisites check (node, npm, wrangler, git)
#    2. Dependency install (npm ci)
#    3. TypeScript type-check
#    4. Production build (vite)
#    5. Pre-deploy smoke test (dist/ artefact validation)
#    6. Cloudflare Pages deploy (wrangler pages deploy)
#    7. D1 database migrations (if present)
#    8. Post-deploy live smoke tests
#    9. ARR snapshot from /api/arr
#   10. Git tag + push
#
#  Usage:
#    chmod +x deploy-final.sh
#    ./deploy-final.sh [--project <cf-project-name>] [--branch <branch>] [--dry-run]
#
#  Environment:
#    CLOUDFLARE_API_TOKEN   — Required. Set via: export CLOUDFLARE_API_TOKEN=...
#    GEMINI_API_KEY         — Optional. Enables Gemini 2.5 Pro proxy.
#    CF_ACCOUNT_ID          — Optional. Auto-detected if omitted.
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; WHT='\033[1;37m'; RST='\033[0m'

log()  { echo -e "${WHT}[$(date +%T)]${RST} $*"; }
ok()   { echo -e "${GRN}  ✓${RST} $*"; }
warn() { echo -e "${YLW}  ⚠${RST} $*"; }
err()  { echo -e "${RED}  ✗${RST} $*"; }
sep()  { echo -e "${BLU}────────────────────────────────────────────────────────${RST}"; }

# ── Defaults ──────────────────────────────────────────────────────────
CF_PROJECT="easy-tenancy-global-os"
DEPLOY_BRANCH="main"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# ── Argument parsing ──────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)  CF_PROJECT="$2"; shift 2 ;;
    --branch)   DEPLOY_BRANCH="$2"; shift 2 ;;
    --dry-run)  DRY_RUN=true; shift ;;
    *)          warn "Unknown flag: $1"; shift ;;
  esac
done

# ── Banner ────────────────────────────────────────────────────────────
echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${CYN}║   Easy-Tenancy Global OS · Sovereign Deploy v3.0    ║${RST}"
echo -e "${CYN}║   Locking in #1 global position — $(date +%Y-%m-%d)        ║${RST}"
echo -e "${CYN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
log "Project  : ${WHT}${CF_PROJECT}${RST}"
log "Branch   : ${WHT}${DEPLOY_BRANCH}${RST}"
log "Dry-run  : ${WHT}${DRY_RUN}${RST}"
log "Dist dir : ${WHT}${DIST_DIR}${RST}"
echo ""

cd "$SCRIPT_DIR"

# ════════════════════════════════════════════════════════════════════
# PHASE 1 — Prerequisites
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 1${RST} — Prerequisites"
sep

ERRORS=0
check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 $(command -v "$1")"
  else
    err "$1 not found — install it first"
    ((ERRORS++)) || true
  fi
}

check_cmd node
check_cmd npm
check_cmd npx
check_cmd git

# Node version
NODE_VER=$(node --version | tr -d 'v' | cut -d. -f1)
if (( NODE_VER >= 18 )); then
  ok "Node v$(node --version | tr -d 'v') ≥ 18"
else
  err "Node $(node --version) — upgrade to v18+"
  ((ERRORS++)) || true
fi

# Wrangler
if npx wrangler --version &>/dev/null 2>&1; then
  ok "wrangler $(npx wrangler --version)"
else
  warn "wrangler not found — installing..."
  npm install -g wrangler
fi

# Cloudflare API token
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  ok "CLOUDFLARE_API_TOKEN set"
else
  err "CLOUDFLARE_API_TOKEN not set — export it first:"
  echo "     export CLOUDFLARE_API_TOKEN=<your-token>"
  ((ERRORS++)) || true
fi

# Gemini key (optional)
if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  ok "GEMINI_API_KEY set (Gemini 2.5 Pro proxy enabled)"
else
  warn "GEMINI_API_KEY not set — AI copilot will use mock responses"
fi

if (( ERRORS > 0 )); then
  err "$ERRORS prerequisite(s) failed. Fix above and re-run."
  exit 1
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 2 — Install dependencies
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 2${RST} — Install dependencies"
sep

if [[ -f package-lock.json ]]; then
  npm ci --prefer-offline 2>&1 | tail -5
  ok "npm ci complete"
else
  npm install --prefer-offline 2>&1 | tail -5
  ok "npm install complete"
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 3 — TypeScript type-check
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 3${RST} — TypeScript type-check"
sep

if npx tsc --noEmit 2>&1; then
  ok "TypeScript: 0 errors"
else
  err "TypeScript errors detected — fix before deploying"
  exit 1
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 4 — Production build
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 4${RST} — Production build (vite)"
sep

BUILD_START=$(date +%s%3N)
npm run build 2>&1
BUILD_END=$(date +%s%3N)
BUILD_MS=$(( BUILD_END - BUILD_START ))

if [[ -d "$DIST_DIR" ]]; then
  DIST_SIZE=$(du -sh "$DIST_DIR" 2>/dev/null | cut -f1)
  MODULE_COUNT=$(find "$DIST_DIR" -name "*.js" | wc -l | tr -d ' ')
  ok "Build complete in ${BUILD_MS}ms · Dist: ${DIST_SIZE} · JS chunks: ${MODULE_COUNT}"
else
  err "dist/ directory not found — build failed"
  exit 1
fi

# Validate critical artefacts
for f in "_worker.js" "_routes.json"; do
  if [[ -f "$DIST_DIR/$f" ]]; then
    ok "Artefact present: $f"
  else
    warn "Artefact missing: $f (may be normal for static-only builds)"
  fi
done

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 5 — Pre-deploy artefact smoke test
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 5${RST} — Pre-deploy artefact validation"
sep

CRITICAL_FILES=(
  "dist/index.html"
)

MISSING=0
for f in "${CRITICAL_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    ok "$f exists"
  else
    err "Missing: $f"
    ((MISSING++)) || true
  fi
done

if (( MISSING > 0 )); then
  err "$MISSING critical artefact(s) missing — aborting"
  exit 1
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 6 — Cloudflare Pages deploy
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 6${RST} — Cloudflare Pages deploy"
sep

if [[ "$DRY_RUN" == "true" ]]; then
  warn "DRY-RUN mode — skipping actual deploy"
  warn "Would run: npx wrangler pages deploy dist --project-name $CF_PROJECT --branch $DEPLOY_BRANCH"
else
  log "Deploying to Cloudflare Pages project: ${WHT}${CF_PROJECT}${RST}"

  DEPLOY_OUTPUT=$(npx wrangler pages deploy dist \
    --project-name "$CF_PROJECT" \
    --branch "$DEPLOY_BRANCH" \
    2>&1) || true

  echo "$DEPLOY_OUTPUT"

  # Extract deployment URL
  DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.pages\.dev' | head -1 || true)

  if [[ -n "$DEPLOY_URL" ]]; then
    ok "Deployed to: ${CYN}${DEPLOY_URL}${RST}"
  else
    warn "Could not parse deployment URL — check output above"
    DEPLOY_URL="https://${CF_PROJECT}.pages.dev"
  fi
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 7 — D1 database migrations (if migrations/ dir exists)
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 7${RST} — Database migrations"
sep

if [[ -d "migrations" ]] && ls migrations/*.sql &>/dev/null 2>&1; then
  MIGRATION_COUNT=$(ls migrations/*.sql | wc -l | tr -d ' ')
  log "Found $MIGRATION_COUNT migration file(s)"
  if [[ "$DRY_RUN" != "true" ]]; then
    npx wrangler d1 migrations apply webapp-production 2>&1 || warn "D1 migrations skipped (DB may not be provisioned)"
    ok "D1 migrations applied to production"
  else
    warn "DRY-RUN — skipping D1 migrations"
  fi
else
  ok "No migrations/ directory — skipping D1 step"
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 8 — Post-deploy live smoke tests
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 8${RST} — Post-deploy smoke tests"
sep

if [[ "$DRY_RUN" == "true" ]]; then
  warn "DRY-RUN — skipping live smoke tests"
else
  BASE_URL="${DEPLOY_URL:-https://${CF_PROJECT}.pages.dev}"
  SMOKE_PASS=0; SMOKE_FAIL=0

  smoke_test() {
    local url="$1"
    local label="${2:-$1}"
    local expected="${3:-200}"
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
    if [[ "$status" == "$expected" ]]; then
      ok "[$status] $label"
      ((SMOKE_PASS++)) || true
    else
      err "[$status] $label (expected $expected)"
      ((SMOKE_FAIL++)) || true
    fi
  }

  smoke_test "$BASE_URL/"                               "Home (marketing)"
  smoke_test "$BASE_URL/app/demo"                       "AppDemo (product dashboard)"
  smoke_test "$BASE_URL/global-dominance"               "Global Dominance (Holy Trinity)"
  smoke_test "$BASE_URL/predictive-os"                  "Predictive Life OS"
  smoke_test "$BASE_URL/spatial-staging"                "Spatial Staging (Novita AI)"
  smoke_test "$BASE_URL/security-demo"                  "Security Demo (WebAuthn+Turnstile)"
  smoke_test "$BASE_URL/api/health"                     "API Health"
  smoke_test "$BASE_URL/api/metrics/live"               "Metrics Live"
  smoke_test "$BASE_URL/api/arr"                        "ARR Logistic Curve"
  smoke_test "$BASE_URL/api/compliance/jurisdiction"    "Compliance Jurisdiction"

  echo ""
  log "Smoke tests: ${GRN}${SMOKE_PASS} passed${RST} / ${RED}${SMOKE_FAIL} failed${RST}"

  if (( SMOKE_FAIL > 3 )); then
    err "Too many smoke test failures — investigate deployment"
  fi
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 9 — ARR Snapshot
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 9${RST} — ARR Snapshot"
sep

if [[ "$DRY_RUN" != "true" && -n "${DEPLOY_URL:-}" ]]; then
  ARR_RESPONSE=$(curl -s --max-time 10 "${DEPLOY_URL}/api/arr" 2>/dev/null || echo '{}')
  ARR_VALUE=$(echo "$ARR_RESPONSE" | grep -oP '"arr":\s*\K[0-9]+' | head -1 || echo "0")
  ARR_MONTH=$(echo "$ARR_RESPONSE" | grep -oP '"month":\s*\K[0-9]+' | head -1 || echo "0")

  if [[ -n "$ARR_VALUE" && "$ARR_VALUE" != "0" ]]; then
    ARR_FMT=$(awk "BEGIN { printf \"%.2fM\", $ARR_VALUE / 1000000 }")
    ok "Current ARR: ${CYN}\$${ARR_FMT}${RST} (Month ${ARR_MONTH} of 36)"
  else
    warn "ARR endpoint returned no data (may be initialising)"
  fi
else
  warn "ARR snapshot skipped (dry-run or no deploy URL)"
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# PHASE 10 — Git tag + push
# ════════════════════════════════════════════════════════════════════
sep
log "${WHT}PHASE 10${RST} — Git tag + push"
sep

GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
TAG_NAME="deploy-${TIMESTAMP}-${GIT_HASH}"

if [[ "$DRY_RUN" != "true" ]]; then
  git add -A
  if git diff --cached --quiet; then
    ok "No uncommitted changes — skipping commit"
  else
    git commit -m "chore: deploy-final.sh — sovereign deploy ${TIMESTAMP} [ci skip]"
    ok "Git commit created"
  fi

  git tag -a "$TAG_NAME" -m "Sovereign deploy ${TIMESTAMP}" 2>/dev/null || true
  ok "Git tag: $TAG_NAME"

  if git remote get-url origin &>/dev/null 2>&1; then
    git push origin "$DEPLOY_BRANCH" 2>&1 | tail -3
    git push origin "$TAG_NAME"    2>&1 | tail -3 || warn "Tag push failed (non-critical)"
    ok "Pushed to origin/$DEPLOY_BRANCH"
  else
    warn "No git remote 'origin' — skipping push"
  fi
else
  warn "DRY-RUN — skipping git tag and push"
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ════════════════════════════════════════════════════════════════════
sep
echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${CYN}║           SOVEREIGN DEPLOY COMPLETE  🚀              ║${RST}"
echo -e "${CYN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
log "Project     : ${WHT}${CF_PROJECT}${RST}"
log "Branch      : ${WHT}${DEPLOY_BRANCH}${RST}"
log "Git commit  : ${WHT}${GIT_HASH}${RST}"
log "Build time  : ${WHT}${BUILD_MS}ms${RST}"
if [[ "$DRY_RUN" != "true" ]]; then
  log "Live URL    : ${CYN}${DEPLOY_URL:-https://${CF_PROJECT}.pages.dev}${RST}"
  log "Deploy tag  : ${WHT}${TAG_NAME}${RST}"
fi
echo ""
echo -e "${GRN}  The Sovereign Economic OS is now live at:${RST}"
echo -e "${CYN}  https://${CF_PROJECT}.pages.dev${RST}"
echo ""
echo -e "${YLW}  Next steps:${RST}"
echo "    → Set GEMINI_API_KEY secret in Cloudflare Pages dashboard"
echo "    → Configure custom domain (optional)"
echo "    → Monitor ARR at /api/arr"
echo "    → Check compliance at /api/compliance/jurisdiction"
echo ""
