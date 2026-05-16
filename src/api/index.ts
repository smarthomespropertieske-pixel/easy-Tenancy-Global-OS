// ── Hono API server — analytics + auth middleware ─────────────
// This runs as a Cloudflare Pages Function at /api/*
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timing } from 'hono/timing'

const api = new Hono()

// ── Middleware ─────────────────────────────────────────────────
api.use('*', timing())
api.use('*', logger())
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Session-Id', 'Authorization'],
}))

// ── Auth middleware for /app/demo ──────────────────────────────
// Lightweight demo-mode gate: checks for a demo token in the
// Authorization header or ?token= query param.
// Production upgrade: swap DEMO_SECRET for Cloudflare Access JWT validation.
const DEMO_TOKEN = 'et-demo-2025'   // override via CF secret: DEMO_TOKEN

function isDemoAuthenticated(req: Request, token: string): boolean {
  // 1. Bearer token in Authorization header
  const authHeader = req.headers.get('Authorization') ?? ''
  if (authHeader === `Bearer ${token}`) return true

  // 2. ?token= query param (for deep-link URLs)
  const url = new URL(req.url)
  if (url.searchParams.get('token') === token) return true

  // 3. Demo mode is open by default in preview environments
  // (CF Pages preview URLs and sandbox — no gate needed)
  const host = url.hostname
  const isPreview = host.includes('pages.dev') || host.includes('e2b.dev') ||
                    host.includes('localhost') || host.includes('127.0.0.1')
  return isPreview
}

// Auth gate middleware — applies to /api/demo/* routes
api.use('/api/demo/*', async (c, next) => {
  const token = (c.env as any)?.DEMO_TOKEN ?? DEMO_TOKEN
  if (!isDemoAuthenticated(c.req.raw, token)) {
    return c.json({ error: 'Unauthorized. Pass ?token=et-demo-2025 or Bearer token.' }, 401)
  }
  return next()
})

// ── Analytics endpoint ─────────────────────────────────────────
api.post('/api/analytics', async (c) => {
  try {
    const body = await c.req.json<{ events: Array<{
      name: string
      payload: Record<string, unknown>
      ts: number
      session: string
      url: string
    }> }>()

    const events = body?.events ?? []
    if (!Array.isArray(events) || events.length === 0) {
      return c.json({ ok: true, received: 0 })
    }

    // Validate + sanitize
    const sanitized = events
      .filter(e => typeof e.name === 'string' && e.name.length < 64)
      .map(e => ({
        name:    e.name.slice(0, 64),
        payload: e.payload ?? {},
        ts:      typeof e.ts === 'number' ? e.ts : Date.now(),
        session: String(e.session ?? '').slice(0, 64),
        url:     String(e.url ?? '').slice(0, 256),
        ip:      c.req.header('CF-Connecting-IP') ?? 'unknown',
        country: c.req.header('CF-IPCountry') ?? 'XX',
        ua:      (c.req.header('User-Agent') ?? '').slice(0, 120),
        ingested: Date.now(),
      }))

    // ── Storage strategy (in order of availability) ────────────
    // 1. Cloudflare KV (if bound as ANALYTICS_KV)
    // 2. Cloudflare D1  (if bound as DB)
    // 3. Console log    (dev / preview fallback)
    const env = c.env as any

    if (env?.ANALYTICS_KV) {
      // Store batches in KV with TTL (30 days)
      const key = `evt:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
      await env.ANALYTICS_KV.put(key, JSON.stringify(sanitized), { expirationTtl: 60 * 60 * 24 * 30 })
    } else if (env?.DB) {
      // Persist to D1 (table must be created via migration)
      const stmt = env.DB.prepare(
        'INSERT INTO analytics_events (name, payload, ts, session_id, url, country, ingested_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      await env.DB.batch(sanitized.map(e =>
        stmt.bind(e.name, JSON.stringify(e.payload), e.ts, e.session, e.url, e.country, e.ingested)
      ))
    } else {
      // Fallback: structured console (visible in CF Pages logs)
      console.log('[analytics]', JSON.stringify({ batch: sanitized.length, events: sanitized.map(e => e.name) }))
    }

    return c.json({ ok: true, received: sanitized.length })
  } catch (err) {
    console.error('[analytics error]', err)
    return c.json({ ok: false, error: 'Internal error' }, 500)
  }
})

// ── Analytics read (for internal dashboard) ───────────────────
api.get('/api/analytics/summary', async (c) => {
  const env = c.env as any
  const token = env?.DEMO_TOKEN ?? DEMO_TOKEN
  if (!isDemoAuthenticated(c.req.raw, token)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Return mock summary if no storage bound
  return c.json({
    summary: {
      totalEvents: 0,
      topEvents: ['page_view', 'demo_started', 'roi_engaged'],
      activeSessions: 0,
      note: 'Bind ANALYTICS_KV or DB for real data',
    }
  })
})

// ── Demo tenant API (protected) ───────────────────────────────
api.get('/api/demo/tenants', (c) => {
  return c.json({
    tenants: [
      { id: 'demo-001', name: 'Actis Capital Portfolio', country: 'KE' },
      { id: 'demo-002', name: 'Knight Frank Global',     country: 'UK' },
      { id: 'demo-003', name: 'Gulf Properties LLC',     country: 'AE' },
    ]
  })
})

// ── Health check ───────────────────────────────────────────────
api.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    version: '2.0.0-iee',
    ts: new Date().toISOString(),
    features: [
      'analytics', 'demo-auth', 'deep-linking', 'ai-feed',
      'radial-map', 'liquid-glass', 'roi-calculator',
      'compliance-panel', 'micro-tours', 'property-detail',
    ],
  })
})

// ── Waitlist / lead capture ───────────────────────────────────
api.post('/api/waitlist', async (c) => {
  try {
    const { email, persona, source } = await c.req.json<{
      email: string; persona?: string; source?: string
    }>()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ ok: false, error: 'Invalid email' }, 400)
    }

    const env = c.env as any
    if (env?.WAITLIST_KV) {
      await env.WAITLIST_KV.put(`wl:${email}`, JSON.stringify({
        email, persona, source, ts: Date.now()
      }), { expirationTtl: 60 * 60 * 24 * 365 })
    } else {
      console.log('[waitlist]', { email, persona, source })
    }

    return c.json({ ok: true, message: 'Added to waitlist' })
  } catch {
    return c.json({ ok: false, error: 'Server error' }, 500)
  }
})

export default api
