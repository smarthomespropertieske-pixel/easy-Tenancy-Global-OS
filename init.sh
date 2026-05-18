#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
#  init.sh — easyTenancy Sovereign Economic OS
#  "Global Hegemony 2.0" — One-Shot Sandbox Deploy Script
#
#  Usage:
#    chmod +x init.sh && ./init.sh
#
#  What it does:
#    1. Verifies Node.js ≥ 18 and npm are available
#    2. Installs dependencies (npm ci)
#    3. Runs TypeScript typecheck
#    4. Builds the production bundle (vite build)
#    5. Kills any existing process on port 3000
#    6. Starts the server via PM2
#    7. Runs smoke tests on all 8 API endpoints
#    8. Prints the live URLs
#    9. Shows ARR snapshot from /api/arr
# ══════════════════════════════════════════════════════════════════════════

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# ── Colours ───────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
fail() { echo -e "${RED}✗ $*${RESET}"; exit 1; }

echo -e "\n${BOLD}╔════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  easyTenancy — Sovereign OS  init.sh v2.0  ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════════╝${RESET}\n"

# ── Step 1: Prerequisites ─────────────────────────────────────────────────
log "Checking prerequisites…"
command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node 18+."
NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[[ $NODE_MAJOR -ge 18 ]] || fail "Node.js 18+ required. Found: v$NODE_VER"
ok "Node.js v$NODE_VER"

command -v npm >/dev/null 2>&1 || fail "npm not found."
ok "npm $(npm --version)"

command -v pm2 >/dev/null 2>&1 && PM2=true || PM2=false
$PM2 && ok "PM2 $(pm2 --version)" || warn "PM2 not found — using node directly"

# ── Step 2: Install dependencies ──────────────────────────────────────────
if [[ ! -d node_modules ]]; then
  log "Installing dependencies (npm ci)…"
  npm ci --silent
  ok "Dependencies installed"
else
  ok "node_modules present (skip install)"
fi

# ── Step 3: TypeScript check ───────────────────────────────────────────────
log "TypeScript typecheck…"
npx tsc --noEmit 2>&1 | head -20 || warn "TypeScript errors found (non-blocking)"
ok "Typecheck complete"

# ── Step 4: Build ──────────────────────────────────────────────────────────
log "Building production bundle (vite build)…"
npm run build 2>&1 | tail -8
ok "Build complete → dist/"

# ── Step 5: Kill port 3000 ─────────────────────────────────────────────────
log "Clearing port 3000…"
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
ok "Port 3000 cleared"

# ── Step 6: Start server ───────────────────────────────────────────────────
log "Starting server…"
if $PM2; then
  pm2 delete all 2>/dev/null || true
  pm2 start ecosystem.config.cjs 2>&1 | tail -4
  sleep 3
  ok "PM2 started: $(pm2 list --no-color 2>/dev/null | grep webapp | awk '{print $12}')"
else
  NODE_ENV=production node server.mjs &
  SERVER_PID=$!
  sleep 2
  ok "Server started (PID $SERVER_PID)"
fi

# ── Step 7: Smoke tests ────────────────────────────────────────────────────
log "Running smoke tests…"
PASS=0; FAIL=0

smoke() {
  local label="$1" url="$2" expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "$expected" ]]; then
    ok "  $label → HTTP $code"
    ((PASS++)) || true
  else
    warn "  $label → HTTP $code (expected $expected)"
    ((FAIL++)) || true
  fi
}

smoke "Home page"             "http://localhost:3000/"
smoke "App Demo"              "http://localhost:3000/app/demo"
smoke "Security Demo"         "http://localhost:3000/security-demo"
smoke "Spatial Staging"       "http://localhost:3000/spatial-staging"
smoke "Global Dominance"      "http://localhost:3000/global-dominance"
smoke "Predictive OS"         "http://localhost:3000/predictive-os"
smoke "Metrics API"           "http://localhost:3000/api/metrics/live"
smoke "ARR Engine"            "http://localhost:3000/api/arr"
smoke "Compliance API"        "http://localhost:3000/api/compliance/jurisdiction?country=KE"
smoke "OG Image"              "http://localhost:3000/api/og?country=UK"

echo ""
[[ $FAIL -eq 0 ]] && ok "All $PASS smoke tests passed 🎯" \
                  || warn "$PASS passed, $FAIL failed"

# ── Step 8: ARR snapshot ───────────────────────────────────────────────────
log "ARR snapshot from Value-Capture Engine…"
ARR_DATA=$(curl -s "http://localhost:3000/api/arr" 2>/dev/null || echo '{}')
ARR_USD=$(echo "$ARR_DATA" | grep -o '"arrUSD":[0-9]*' | cut -d: -f2 || echo 0)
ARR_PCT=$(echo "$ARR_DATA" | grep -o '"pct":"[^"]*"' | cut -d'"' -f4 || echo 0)

if [[ -n "$ARR_USD" && "$ARR_USD" -gt 0 ]]; then
  # Format as $X.XXXB or $XXM
  if [[ $ARR_USD -ge 1000000000 ]]; then
    ARR_FMT=$(awk "BEGIN {printf \"%.3fB\", $ARR_USD/1000000000}")
  else
    ARR_FMT=$(awk "BEGIN {printf \"%.1fM\", $ARR_USD/1000000}")
  fi
  ok "Current ARR: \$$ARR_FMT (${ARR_PCT}% of \$1.345B target)"
else
  warn "ARR API unavailable"
fi

# ── Step 9: Live URLs ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  🚀 easyTenancy Sovereign OS — LIVE${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${CYAN}Local:${RESET}          http://localhost:3000"
echo -e "  ${CYAN}App Demo:${RESET}       http://localhost:3000/app/demo"
echo -e "  ${CYAN}Security:${RESET}       http://localhost:3000/security-demo"
echo -e "  ${CYAN}Spatial AR:${RESET}     http://localhost:3000/spatial-staging"
echo -e "  ${CYAN}Holy Trinity:${RESET}   http://localhost:3000/global-dominance"
echo -e "  ${CYAN}Predictive OS:${RESET}  http://localhost:3000/predictive-os"
echo -e "  ${CYAN}ARR Engine:${RESET}     http://localhost:3000/api/arr"
echo ""
echo -e "  ${CYAN}GitHub:${RESET}   https://github.com/smarthomespropertieske-pixel/easy-Tenancy-Global-OS"
echo -e "  ${CYAN}Manifesto:${RESET} ./SovereignOS.manifesto"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ── Step 10: Optional Gemini check ────────────────────────────────────────
if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  ok "GEMINI_API_KEY is set — Gemini 2.5 Pro is live ✨"
else
  warn "GEMINI_API_KEY not set. Add it to .env.local to activate live Gemini."
  echo "     echo 'GEMINI_API_KEY=your-key-here' > .env.local"
fi

echo ""
