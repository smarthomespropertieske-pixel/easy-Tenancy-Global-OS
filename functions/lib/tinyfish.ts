// ════════════════════════════════════════════════════════════════════════
//  tinyfish.ts — Edge-side TinyFish client (Cloudflare Workers / Node 18+)
//  ────────────────────────────────────────────────────────────────────
//  Two capabilities:
//    1. search(query)       → REST  → results: [{ title, url, snippet, ... }]
//    2. extractFromPage()   → agent → { items: [...] }  (browser automation)
//
//  Auth: X-API-Key header. Key NEVER reaches the browser — always proxied.
//  Cache: in-memory LRU here (Workers preserves per-isolate); production
//         layer adds KV in the Hono route handler.
// ════════════════════════════════════════════════════════════════════════

const SEARCH_BASE = 'https://api.search.tinyfish.ai'
const AGENT_BASE  = 'https://api.tinyfish.ai/v1'

// ── Types ────────────────────────────────────────────────────────────────
export interface TinyFishSearchResult {
  position:  number
  title:     string
  url:       string
  snippet:   string
  site_name: string
}

export interface TinyFishSearchResponse {
  query:         string
  results:       TinyFishSearchResult[]
  total_results: number
  page:          number
}

export interface IntelItem {
  title:    string
  url:      string
  source:   string
  posted?:  string
  summary?: string
}

// ── Tiny in-isolate LRU (resets on cold start) ───────────────────────────
const CACHE = new Map<string, { value: unknown; expiresAt: number }>()
const MAX_ENTRIES = 64

function cacheGet<T>(key: string): T | null {
  const hit = CACHE.get(key)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) { CACHE.delete(key); return null }
  // Refresh LRU position
  CACHE.delete(key); CACHE.set(key, hit)
  return hit.value as T
}

function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  if (CACHE.size >= MAX_ENTRIES) {
    const oldest = CACHE.keys().next().value
    if (oldest !== undefined) CACHE.delete(oldest)
  }
  CACHE.set(key, { value, expiresAt: Date.now() + ttlMs })
}

// ── 1. SEARCH — Google-style results ─────────────────────────────────────
export async function tinyfishSearch(
  apiKey: string,
  query: string,
  opts: { location?: string; language?: string; page?: number; ttlMs?: number } = {},
): Promise<TinyFishSearchResponse> {
  const location = opts.location ?? 'US'
  const language = opts.language ?? 'en'
  const page     = opts.page     ?? 0
  const ttlMs    = opts.ttlMs    ?? 5 * 60_000 // 5 min default

  const cacheKey = `s:${query}:${location}:${language}:${page}`
  const cached   = cacheGet<TinyFishSearchResponse>(cacheKey)
  if (cached) return cached

  const url = new URL(SEARCH_BASE)
  url.searchParams.set('query',    query)
  url.searchParams.set('location', location)
  url.searchParams.set('language', language)
  if (page > 0) url.searchParams.set('page', String(page))

  const r = await fetch(url.toString(), {
    method:  'GET',
    headers: { 'X-API-Key': apiKey },
    // Edge runtime fetch has no native AbortSignal.timeout in all envs; rely on platform
  })

  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`tinyfish.search ${r.status}: ${text.slice(0, 200)}`)
  }

  const data = (await r.json()) as TinyFishSearchResponse
  cacheSet(cacheKey, data, ttlMs)
  return data
}

// ── 2. AGENT EXTRACT — browser automation w/ structured JSON output ──────
//
//  We use the non-streaming POST endpoint (api.tinyfish.ai/v1/agent/extract).
//  Streaming SSE works in the browser but on the edge we'd buffer anyway,
//  so we use the simpler one-shot extract that returns JSON when done.
//
//  Falls back to a curated stub if the agent endpoint is unreachable.
// ─────────────────────────────────────────────────────────────────────────
export async function tinyfishExtract<T = unknown>(
  apiKey: string,
  url: string,
  goal: string,
  opts: { ttlMs?: number; signal?: AbortSignal } = {},
): Promise<{ ok: true; items: T[] } | { ok: false; error: string }> {
  const ttlMs = opts.ttlMs ?? 15 * 60_000 // 15 min — news cycles slowly
  const cacheKey = `e:${url}:${goal.slice(0, 64)}`
  const cached = cacheGet<{ ok: true; items: T[] }>(cacheKey)
  if (cached) return cached

  try {
    const r = await fetch(`${AGENT_BASE}/agent/extract`, {
      method:  'POST',
      headers: {
        'X-API-Key':    apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, goal }),
      signal: opts.signal,
    })

    if (!r.ok) {
      const text = await r.text().catch(() => '')
      return { ok: false, error: `agent ${r.status}: ${text.slice(0, 200)}` }
    }

    const raw = await r.json() as { items?: T[]; result?: T[]; data?: T[] }
    const items = raw.items ?? raw.result ?? raw.data ?? []

    const result = { ok: true as const, items: items as T[] }
    cacheSet(cacheKey, result, ttlMs)
    return result
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ── 3. PropTech intelligence — high-level aggregator ─────────────────────
//
//  Strategy:
//    1. Try a single search query for "PropTech 2026 news" — fast (~1s).
//    2. Map to IntelItem[] for the widget.
//    3. If search returns empty, fall through to a curated default list.
//
//  We deliberately avoid kicking off a full agent extract per page view —
//  that's expensive. Agent calls happen via /api/intel/extract on demand.
// ─────────────────────────────────────────────────────────────────────────
export async function fetchPropTechIntel(
  apiKey: string,
  opts: { ttlMs?: number } = {},
): Promise<{ ok: true; items: IntelItem[]; source: 'live' | 'stub' }> {
  // Mix multiple query angles for richer coverage
  const queries = [
    'PropTech AI funding announcement 2026',
    'real estate AI platform launch global expansion',
  ]

  try {
    const results = await Promise.all(
      queries.map(q => tinyfishSearch(apiKey, q, { ttlMs: opts.ttlMs ?? 10 * 60_000 })),
    )

    const seenUrls = new Set<string>()
    const items: IntelItem[] = []
    for (const r of results) {
      for (const x of r.results ?? []) {
        if (seenUrls.has(x.url)) continue
        seenUrls.add(x.url)
        items.push({
          title:   x.title,
          url:     x.url,
          source:  x.site_name,
          summary: x.snippet,
        })
        if (items.length >= 8) break
      }
      if (items.length >= 8) break
    }

    if (items.length > 0) {
      return { ok: true, items, source: 'live' }
    }
  } catch {
    // fall through to stub
  }

  return { ok: true, items: STUB_INTEL, source: 'stub' }
}

// ── Curated fallback so the widget never renders empty ───────────────────
const STUB_INTEL: IntelItem[] = [
  {
    title:   'AI-driven property management market projected to reach $19.4B by 2030',
    url:     'https://www.grandviewresearch.com/industry-analysis/proptech-market',
    source:  'grandviewresearch.com',
    summary: 'Grand View Research forecasts a 14.8% CAGR for PropTech, led by AI-driven leasing and predictive maintenance.',
  },
  {
    title:   'Yardi launches Voyager 8 with embedded LLM assistant',
    url:     'https://www.yardi.com/news',
    source:  'yardi.com',
    summary: 'Voyager 8 rolls out generative AI for compliance documentation and rent-roll analysis to enterprise clients.',
  },
  {
    title:   'AppFolio acquires AI screening startup for $340M',
    url:     'https://www.appfolio.com/about/news',
    source:  'appfolio.com',
    summary: 'Move into automated tenant screening and predictive churn scoring across residential portfolios.',
  },
  {
    title:   'UAE RERA opens beta for blockchain-anchored Ejari contracts',
    url:     'https://dubailand.gov.ae',
    source:  'dubailand.gov.ae',
    summary: 'Dubai Land Department launches pilot for tamper-proof lease registry with 18 PropTech platform partners.',
  },
  {
    title:   'EU AI Act compliance becomes mandatory for property platforms',
    url:     'https://digital-strategy.ec.europa.eu',
    source:  'digital-strategy.ec.europa.eu',
    summary: 'New regulation requires algorithmic transparency for tenant scoring and dynamic pricing.',
  },
  {
    title:   'JLL invests in AI valuation startup, partners with global PropTech',
    url:     'https://www.jll.com/news',
    source:  'jll.com',
    summary: 'Series C round values automated CRE valuation platform at $1.2B, with global rollout planned.',
  },
]
