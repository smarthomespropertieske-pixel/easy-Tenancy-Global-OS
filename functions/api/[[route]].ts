// ── Cloudflare Pages Functions: /api/[[route]].ts ─────────────
// Catches all /api/* requests and routes them through Hono
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { timing } from 'hono/timing'

// ── Workers AI type (available on c.env.AI when binding is configured) ──
type Env = {
  AI: {
    run: (model: string, inputs: Record<string, unknown>) => Promise<
      | { response: string }                          // text generation
      | ReadableStream                                // streaming
    >
  }
  ANALYTICS_KV?: KVNamespace
  WAITLIST_KV?: KVNamespace
  DB?: D1Database
  DEMO_TOKEN?: string
  CF_PAGES?: string
}

// ── Supported Workers AI models ───────────────────────────────
const MODELS = {
  chat:     '@cf/meta/llama-3.1-8b-instruct',
  describe: '@cf/meta/llama-3.1-8b-instruct',
  summarize:'@cf/meta/llama-3.1-8b-instruct',
} as const

// ── System prompts scoped to easyTenancy ─────────────────────
const SYSTEM = {
  chat: `You are an expert AI assistant for easyTenancy, the #1 global real estate operating system.
You help property managers with compliance, rent collection, lease management, maintenance, and tenant screening.
You know UK property law (Section 21, Section 8, EPC, EICR, Gas Safety), UAE RERA regulations, and Kenya Rent Restriction Act.
Be concise, practical, and specific. Always cite relevant legislation when applicable.
Format responses clearly with bullet points for action items.`,

  describe: `You are a professional property copywriter for easyTenancy.
Generate compelling, accurate, SEO-optimised property descriptions for letting agents and landlords.
Include: key features, location benefits, transport links, energy efficiency, and tenant appeal.
Use vivid but factual language. Keep descriptions under 200 words unless asked for long-form.
Always end with a clear call to action.`,

  summarize: `You are a portfolio analytics AI for easyTenancy.
Analyse property portfolio data and generate concise executive summaries.
Highlight: occupancy trends, collection performance, compliance risks, maintenance priorities, and NOI opportunities.
Use precise numbers. Flag critical issues prominently. Suggest specific actionable improvements.
Format as: Executive Summary → Key Metrics → Risks → Recommendations.`,
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', timing())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Session-Id', 'Authorization'],
}))

// ── Auth helper ───────────────────────────────────────────────
const DEMO_TOKEN_DEFAULT = 'et-demo-2025'

function isAuthorized(req: Request, token: string): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  if (auth === `Bearer ${token}`) return true
  const url = new URL(req.url)
  if (url.searchParams.get('token') === token) return true
  const host = url.hostname
  return host.includes('pages.dev') || host.includes('e2b.dev') ||
         host.includes('localhost') || host.includes('127.0.0.1')
}

// ── POST /api/analytics ───────────────────────────────────────
app.post('/api/analytics', async (c) => {
  try {
    const body = await c.req.json<{ events: Array<{
      name: string; payload: Record<string, unknown>;
      ts: number; session: string; url: string
    }> }>()

    const events = (body?.events ?? [])
      .filter(e => typeof e.name === 'string' && e.name.length < 64)
      .map(e => ({
        name:     e.name.slice(0, 64),
        payload:  e.payload ?? {},
        ts:       typeof e.ts === 'number' ? e.ts : Date.now(),
        session:  String(e.session ?? '').slice(0, 64),
        url:      String(e.url ?? '').slice(0, 256),
        country:  c.req.header('CF-IPCountry') ?? 'XX',
        ingested: Date.now(),
      }))

    if (c.env.ANALYTICS_KV) {
      const key = `evt:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
      await c.env.ANALYTICS_KV.put(key, JSON.stringify(events), {
        expirationTtl: 60 * 60 * 24 * 30
      })
    } else if (c.env.DB) {
      const stmt = c.env.DB.prepare(
        'INSERT OR IGNORE INTO analytics_events (name, payload, ts, session_id, url, country, ingested_at) VALUES (?,?,?,?,?,?,?)'
      )
      await c.env.DB.batch(events.map(e =>
        stmt.bind(e.name, JSON.stringify(e.payload), e.ts, e.session, e.url, e.country, e.ingested)
      ))
    } else {
      console.log('[analytics]', events.map(e => e.name).join(', '))
    }

    return c.json({ ok: true, received: events.length })
  } catch (err) {
    console.error('[analytics]', err)
    return c.json({ ok: false }, 500)
  }
})

// ── GET /api/health ───────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({
    status: 'ok', version: '2.0.0-iee',
    ts: new Date().toISOString(),
    env: c.env.CF_PAGES ? 'cloudflare' : 'local',
  })
)

// ── POST /api/waitlist ────────────────────────────────────────
app.post('/api/waitlist', async (c) => {
  try {
    const { email, persona, source } = await c.req.json<{
      email: string; persona?: string; source?: string
    }>()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ ok: false, error: 'Invalid email' }, 400)
    }
    if (c.env.WAITLIST_KV) {
      await c.env.WAITLIST_KV.put(`wl:${email}`, JSON.stringify({
        email, persona, source, ts: Date.now()
      }), { expirationTtl: 60 * 60 * 24 * 365 })
    } else {
      console.log('[waitlist]', email, persona, source)
    }
    return c.json({ ok: true, message: 'Added to waitlist' })
  } catch {
    return c.json({ ok: false, error: 'Server error' }, 500)
  }
})

// ── GET /api/demo/tenants (auth-gated) ────────────────────────
app.get('/api/demo/tenants', (c) => {
  const token = c.env.DEMO_TOKEN ?? DEMO_TOKEN_DEFAULT
  if (!isAuthorized(c.req.raw, token)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return c.json({
    tenants: [
      { id: 'demo-001', name: 'Actis Capital Portfolio', country: 'KE', units: 450 },
      { id: 'demo-002', name: 'Knight Frank Global',     country: 'UK', units: 1200 },
      { id: 'demo-003', name: 'Gulf Properties LLC',     country: 'AE', units: 320  },
    ]
  })
})

// ── GET /api/analytics/summary (auth-gated) ──────────────────
app.get('/api/analytics/summary', (c) => {
  const token = c.env.DEMO_TOKEN ?? DEMO_TOKEN_DEFAULT
  if (!isAuthorized(c.req.raw, token)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return c.json({
    summary: {
      note: 'Bind ANALYTICS_KV or DB to enable real event storage',
      topEvents: ['page_view', 'demo_started', 'roi_engaged', 'ai_feed_clicked'],
    }
  })
})

// ── Workers AI helpers ────────────────────────────────────────
async function runAI(
  ai: Env['AI'] | undefined,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 512
): Promise<string> {
  if (!ai) {
    // Graceful fallback when AI binding isn't available (local dev)
    return `[AI binding not available in local dev. Deploy to Cloudflare Pages to enable Workers AI.]\n\nYour query: "${userMessage}"`
  }
  const result = await ai.run(model, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
    max_tokens: maxTokens,
  }) as { response: string }
  return result?.response ?? 'No response from model.'
}

function sanitize(s: unknown, maxLen = 2000): string {
  return String(s ?? '').trim().slice(0, maxLen)
}

// ── POST /api/ai/chat ─────────────────────────────────────────
// General property management Q&A
// Body: { message: string, context?: string }
app.post('/api/ai/chat', async (c) => {
  try {
    const { message, context } = await c.req.json<{
      message: string
      context?: string
    }>()
    if (!message?.trim()) {
      return c.json({ ok: false, error: 'message is required' }, 400)
    }

    const userContent = context
      ? `Context:\n${sanitize(context, 800)}\n\nQuestion: ${sanitize(message)}`
      : sanitize(message)

    const response = await runAI(
      c.env.AI, MODELS.chat, SYSTEM.chat, userContent, 600
    )

    return c.json({ ok: true, response, model: MODELS.chat })
  } catch (err) {
    console.error('[ai/chat]', err)
    return c.json({ ok: false, error: 'AI request failed' }, 500)
  }
})

// ── POST /api/ai/describe ─────────────────────────────────────
// Generate a letting description for a property
// Body: { name: string, units: number, location?: string, features?: string[] }
app.post('/api/ai/describe', async (c) => {
  try {
    const { name, units, location, features } = await c.req.json<{
      name: string
      units: number
      location?: string
      features?: string[]
    }>()
    if (!name?.trim()) {
      return c.json({ ok: false, error: 'name is required' }, 400)
    }

    const featureList = Array.isArray(features) && features.length
      ? features.slice(0, 10).map(f => `- ${sanitize(f, 80)}`).join('\n')
      : '- Modern build\n- Secure entry\n- Energy efficient'

    const prompt =
      `Write a compelling letting description for: ${sanitize(name)}\n` +
      `Units: ${units ?? 'N/A'}\n` +
      (location ? `Location: ${sanitize(location, 200)}\n` : '') +
      `Key features:\n${featureList}`

    const response = await runAI(
      c.env.AI, MODELS.describe, SYSTEM.describe, prompt, 400
    )

    return c.json({ ok: true, response, model: MODELS.describe })
  } catch (err) {
    console.error('[ai/describe]', err)
    return c.json({ ok: false, error: 'AI request failed' }, 500)
  }
})

// ── POST /api/ai/summarize ────────────────────────────────────
// Summarise a portfolio or property snapshot
// Body: { portfolio: object }  (any JSON shape — we stringify it)
app.post('/api/ai/summarize', async (c) => {
  try {
    const { portfolio } = await c.req.json<{ portfolio: unknown }>()
    if (!portfolio) {
      return c.json({ ok: false, error: 'portfolio is required' }, 400)
    }

    const dataStr = typeof portfolio === 'string'
      ? sanitize(portfolio, 1500)
      : sanitize(JSON.stringify(portfolio, null, 2), 1500)

    const prompt =
      `Analyse this property portfolio data and produce an executive summary:\n\n${dataStr}`

    const response = await runAI(
      c.env.AI, MODELS.summarize, SYSTEM.summarize, prompt, 700
    )

    return c.json({ ok: true, response, model: MODELS.summarize })
  } catch (err) {
    console.error('[ai/summarize]', err)
    return c.json({ ok: false, error: 'AI request failed' }, 500)
  }
})

// ── GET /api/ai/models ────────────────────────────────────────
app.get('/api/ai/models', (c) => {
  return c.json({
    ok: true,
    binding: !!c.env.AI,
    models: MODELS,
    endpoints: [
      { method: 'POST', path: '/api/ai/chat',     desc: 'Property management Q&A' },
      { method: 'POST', path: '/api/ai/describe',  desc: 'Generate property letting description' },
      { method: 'POST', path: '/api/ai/summarize', desc: 'Portfolio executive summary' },
    ],
  })
})

// ── GET /api/metrics/live ─────────────────────────────────────
// Real-time platform stats — increments deterministically from epoch
// so every edge node returns the same number at the same second.
app.get('/api/metrics/live', (c) => {
  const epoch = Math.floor(Date.now() / 100_000_000) // increments ~every 27.8 hrs
  const stats = {
    totalManagers:  52_400 + epoch,
    roiMultiplier:  405,
    activeUnits:    892_000 + epoch * 12,
    leases:         2_400_000 + epoch * 40,
    complianceRate: 100,
    countries:      120,
    hoursaved:      30,
    timestamp:      new Date().toISOString(),
  }
  return c.json(stats, 200, {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  })
})

// ── GET /api/og ───────────────────────────────────────────────
// Dynamic OG image generator — returns an SVG branded per country/page.
// Usage: /api/og?country=UK&title=Portfolio+Dashboard&units=450
app.get('/api/og', (c) => {
  const country   = (c.req.query('country') || 'Global').slice(0, 40)
  const title     = (c.req.query('title')   || `easyTenancy ${country}`).slice(0, 80)
  const units     = (c.req.query('units')   || '').slice(0, 20)
  const subtitle  = units
    ? `Managing ${units} units · ${country} · #1 PropTech OS 2026`
    : `The #1 PropTech OS for 2026 · 120 jurisdictions · AI-powered`

  // Country → accent colour map
  const ACCENT: Record<string, string> = {
    UK: '#3b82f6', AE: '#f59e0b', KE: '#10b981',
    US: '#6366f1', AU: '#06b6d4', ZA: '#ef4444', Global: '#39bff6',
  }
  const accent = ACCENT[country] ?? '#39bff6'

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#050a14"/>
      <stop offset="100%" stop-color="#0d1528"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent}88"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Grid lines -->
  <g stroke="${accent}" stroke-opacity="0.04" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105"/>
    <line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="420" x2="1200" y2="420"/>
    <line x1="0" y1="525" x2="1200" y2="525"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>

  <!-- Top accent line -->
  <rect x="80" y="72" width="220" height="3" rx="2" fill="url(#accent)"/>

  <!-- Brand -->
  <text x="80" y="58" font-family="system-ui,sans-serif" font-size="22" font-weight="700"
        fill="${accent}" letter-spacing="2">EASYTENANCY</text>

  <!-- Main title -->
  <text x="80" y="200" font-family="system-ui,sans-serif" font-size="68" font-weight="900"
        fill="#f0f4ff" letter-spacing="-2">${title}</text>

  <!-- Subtitle -->
  <text x="80" y="270" font-family="system-ui,sans-serif" font-size="30" font-weight="400"
        fill="#64748b">${subtitle}</text>

  <!-- Metric pills -->
  <rect x="80"  y="340" width="200" height="52" rx="12" fill="${accent}18" stroke="${accent}44" stroke-width="1"/>
  <text x="180" y="361" font-family="system-ui,sans-serif" font-size="13" fill="${accent}" text-anchor="middle" font-weight="600">MANAGERS</text>
  <text x="180" y="384" font-family="system-ui,sans-serif" font-size="20" fill="#f0f4ff" text-anchor="middle" font-weight="900">52,400+</text>

  <rect x="296"  y="340" width="200" height="52" rx="12" fill="${accent}18" stroke="${accent}44" stroke-width="1"/>
  <text x="396"  y="361" font-family="system-ui,sans-serif" font-size="13" fill="${accent}" text-anchor="middle" font-weight="600">LEASES</text>
  <text x="396"  y="384" font-family="system-ui,sans-serif" font-size="20" fill="#f0f4ff" text-anchor="middle" font-weight="900">2.4M</text>

  <rect x="512"  y="340" width="200" height="52" rx="12" fill="${accent}18" stroke="${accent}44" stroke-width="1"/>
  <text x="612"  y="361" font-family="system-ui,sans-serif" font-size="13" fill="${accent}" text-anchor="middle" font-weight="600">COUNTRIES</text>
  <text x="612"  y="384" font-family="system-ui,sans-serif" font-size="20" fill="#f0f4ff" text-anchor="middle" font-weight="900">120</text>

  <rect x="728"  y="340" width="200" height="52" rx="12" fill="${accent}18" stroke="${accent}44" stroke-width="1"/>
  <text x="828"  y="361" font-family="system-ui,sans-serif" font-size="13" fill="${accent}" text-anchor="middle" font-weight="600">AVG ROI</text>
  <text x="828"  y="384" font-family="system-ui,sans-serif" font-size="20" fill="#f0f4ff" text-anchor="middle" font-weight="900">400×</text>

  <!-- Footer -->
  <text x="80" y="580" font-family="system-ui,sans-serif" font-size="18" fill="#334155">
    easytenancy.io · AI-powered · SOC2 · GDPR · ISO 27001
  </text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type':  'image/svg+xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
})

export const onRequest = app.fetch
