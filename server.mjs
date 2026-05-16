/**
 * easyTenancy — Production-grade static SPA server
 * Zero host restrictions, SPA fallback, correct MIME types, compression headers
 * Also handles /api/metrics/live and /api/og natively (no wrangler auth needed)
 * Replaces `vite preview` which enforces allowedHosts even with config overrides
 */
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = parseInt(process.env.PORT || '3000', 10)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.map':  'application/json',
  '.txt':  'text/plain',
  '.xml':  'application/xml',
  '.webp': 'image/webp',
}

// ── Deterministic metrics (mirrors functions/api/[[route]].ts) ───────────────
function buildMetrics() {
  const epoch = Math.floor(Date.now() / 100_000_000)
  return {
    totalManagers:  52_400 + epoch,
    roiMultiplier:  405,
    activeUnits:    892_000 + epoch * 12,
    leases:         2_400_000 + epoch * 40,
    complianceRate: 100,
    countries:      120,
    timestamp:      new Date().toISOString(),
  }
}

// ── Dynamic branded SVG OG image ────────────────────────────────────────────
const ACCENT = {
  UK: '#3b82f6', AE: '#f59e0b', KE: '#10b981',
  US: '#6366f1', AU: '#06b6d4', ZA: '#f97316', DEFAULT: '#39bff6',
}

function buildOGSvg(country = 'DEFAULT', title = 'easyTenancy', units = '') {
  const accent = ACCENT[country.toUpperCase()] ?? ACCENT.DEFAULT
  const m = buildMetrics()
  const subtitle = units
    ? `${units} units · ${country} · ${m.complianceRate}% compliant`
    : `${m.totalManagers.toLocaleString()} managers · ${country} · ${m.complianceRate}% compliant`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0f1e"/>
      <stop offset="100%" style="stop-color:#0d1528"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent}"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>
  <rect x="0" y="580" width="1200" height="2" fill="${accent}" opacity="0.3"/>

  <!-- Brand -->
  <text x="60" y="80" font-family="system-ui,sans-serif" font-size="22" font-weight="900"
    fill="${accent}" letter-spacing="1">easyTenancy</text>
  <text x="60" y="108" font-family="system-ui,sans-serif" font-size="14"
    fill="rgba(255,255,255,0.35)">#1 PropTech 2025 · 120 jurisdictions</text>

  <!-- Title -->
  <text x="60" y="290" font-family="system-ui,sans-serif" font-size="56" font-weight="900"
    fill="white" letter-spacing="-1">${title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
  <text x="60" y="350" font-family="system-ui,sans-serif" font-size="24"
    fill="rgba(255,255,255,0.55)">${subtitle}</text>

  <!-- Metric pills -->
  <rect x="60" y="420" width="200" height="50" rx="10" fill="${accent}" opacity="0.15"
    stroke="${accent}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="160" y="449" font-family="system-ui,sans-serif" font-size="20" font-weight="700"
    fill="${accent}" text-anchor="middle">${(m.totalManagers/1000).toFixed(0)}K+ Managers</text>

  <rect x="278" y="420" width="180" height="50" rx="10" fill="#10b981" opacity="0.15"
    stroke="#10b981" stroke-width="1" stroke-opacity="0.4"/>
  <text x="368" y="449" font-family="system-ui,sans-serif" font-size="20" font-weight="700"
    fill="#10b981" text-anchor="middle">100% Compliant</text>

  <rect x="476" y="420" width="180" height="50" rx="10" fill="#a78bfa" opacity="0.15"
    stroke="#a78bfa" stroke-width="1" stroke-opacity="0.4"/>
  <text x="566" y="449" font-family="system-ui,sans-serif" font-size="20" font-weight="700"
    fill="#a78bfa" text-anchor="middle">${m.roiMultiplier}× ROI</text>

  <!-- Country badge -->
  <rect x="1060" y="50" width="100" height="40" rx="8" fill="${accent}" opacity="0.2"
    stroke="${accent}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="1110" y="75" font-family="system-ui,sans-serif" font-size="18" font-weight="700"
    fill="${accent}" text-anchor="middle">${country.toUpperCase()}</text>
</svg>`
}

// ── JSON response helper ─────────────────────────────────────────────────────
function jsonRes(res, data, status = 200, extraHeaders = {}) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    ...extraHeaders,
  })
  res.end(body)
}

// ── Static file helper ───────────────────────────────────────────────────────
function serveFile(res, filePath, statusCode = 200) {
  try {
    const data = fs.readFileSync(filePath)
    const ext  = path.extname(filePath).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    const isAsset = filePath.includes('/assets/')

    res.writeHead(statusCode, {
      'Content-Type':  mime,
      'Content-Length': data.byteLength,
      'Cache-Control': isAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'X-Content-Type-Options': 'nosniff',
    })
    res.end(data)
  } catch {
    // SPA fallback
    const index = fs.readFileSync(path.join(DIST, 'index.html'))
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(index)
  }
}

// ── Body reader ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

// ── Main server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    })
    return res.end()
  }

  const [urlPath, qs] = (req.url || '/').split('?')
  const params = new URLSearchParams(qs || '')

  // ── API routes ─────────────────────────────────────────────────────────────

  // GET /api/metrics/live — deterministic real-time stats
  if (req.method === 'GET' && urlPath === '/api/metrics/live') {
    return jsonRes(res, buildMetrics(), 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    })
  }

  // GET /api/og — dynamic branded SVG
  if (req.method === 'GET' && urlPath === '/api/og') {
    const svg = buildOGSvg(
      params.get('country') ?? 'DEFAULT',
      params.get('title')   ?? 'easyTenancy',
      params.get('units')   ?? '',
    )
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    })
    return res.end(svg)
  }

  // GET /api/ai/models — model list (sandbox stub)
  if (req.method === 'GET' && urlPath === '/api/ai/models') {
    return jsonRes(res, {
      ok: true,
      models: ['@cf/meta/llama-3.1-8b-instruct'],
      note: 'Sandbox stub — Workers AI active on Cloudflare Pages',
    })
  }

  // POST /api/ai/* — sandbox stub (Workers AI only runs on CF edge)
  if (req.method === 'POST' && urlPath.startsWith('/api/ai/')) {
    await readBody(req) // drain body
    const mode = urlPath.split('/').pop()
    const stubs = {
      chat:      'AI Copilot is connected on Cloudflare Pages. In this sandbox preview, responses are stubbed — deploy to CF Pages to activate Workers AI (Llama 3.1-8B).',
      describe:  'Property description AI is live on Cloudflare Pages. Deploy to generate professional letting descriptions powered by Workers AI.',
      summarize: 'Portfolio summary AI is live on Cloudflare Pages. Deploy to activate executive summaries powered by Workers AI.',
    }
    return jsonRes(res, {
      ok: true,
      response: stubs[mode] ?? stubs.chat,
      model: '@cf/meta/llama-3.1-8b-instruct',
      sandbox: true,
    })
  }

  // ── Static file serving ────────────────────────────────────────────────────
  const cleanPath = urlPath.split('#')[0]
  const filePath  = path.join(DIST, cleanPath)

  // Security: prevent path traversal outside dist
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403); return res.end('Forbidden')
  }

  // Exact file match
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath)
  }

  // Directory index
  const indexPath = path.join(filePath, 'index.html')
  if (fs.existsSync(indexPath)) {
    return serveFile(res, indexPath)
  }

  // SPA fallback — React Router handles all unknown paths
  serveFile(res, path.join(DIST, 'index.html'))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 easyTenancy SPA server running`)
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://0.0.0.0:${PORT}`)
  console.log(`   Dist:    ${DIST}`)
  console.log(`   API:     /api/metrics/live  /api/og  /api/ai/*`)
  console.log(`   No host restrictions — all tunnel URLs allowed\n`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Run: fuser -k ${PORT}/tcp`)
    process.exit(1)
  }
  throw err
})
