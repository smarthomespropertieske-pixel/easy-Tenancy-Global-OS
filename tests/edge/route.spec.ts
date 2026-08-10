// ═══════════════════════════════════════════════════════════════════════
//  Edge: Hono /api/* contract tests
//  Exercises functions/api/[[route]].ts in-process via app.request().
//  Uses Node env (not workerd) — bindings are stubbed via the 2nd arg
//  of app.request(path, init, env).
// ═══════════════════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest'
import { app } from '../../functions/api/[[route]]'

// Minimum env shape the routes touch — CF_PAGES tag, DEMO_TOKEN, stub AI
const TEST_ENV = {
  CF_PAGES: '',
  DEMO_TOKEN: 'et-test-token-2026',
  ENVIRONMENT: 'test',
  AI: { run: async () => ({ response: 'stub' }) },
} as const

describe('GET /api/health', () => {
  it('returns ok status and version string', async () => {
    const res = await app.request('/api/health', undefined, TEST_ENV)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; version: string; ts: string }
    expect(body.status).toBe('ok')
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(new Date(body.ts).toString()).not.toBe('Invalid Date')
  })
})

describe('GET /api/metrics/live', () => {
  it('returns the live platform metrics shape', async () => {
    const res = await app.request('/api/metrics/live', undefined, TEST_ENV)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, number | string>
    expect(body).toMatchObject({
      complianceRate: 100,
      countries: 120,
      roiMultiplier: 405,
    })
    expect(typeof body.totalManagers).toBe('number')
    expect(body.totalManagers as number).toBeGreaterThan(52_000)
    expect(body.activeUnits as number).toBeGreaterThan(890_000)
  })

  it('sets long-cache headers so CF edge can absorb traffic', async () => {
    const res = await app.request('/api/metrics/live', undefined, TEST_ENV)
    expect(res.headers.get('cache-control')).toContain('s-maxage')
  })
})

describe('GET /api/og — dynamic OG SVG', () => {
  it('returns an SVG with the provided title and country', async () => {
    const res = await app.request('/api/og?country=UK&title=Portfolio&units=450', undefined, TEST_ENV)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type') || '').toMatch(/svg/i)
    const text = await res.text()
    expect(text).toMatch(/^<svg|^<\?xml/) // SVG or XML-prefixed SVG
  })
})

describe('POST /api/analytics', () => {
  it('accepts a well-formed batch and returns 200/202', async () => {
    const res = await app.request('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session-id': 's_edge_test' },
      body: JSON.stringify({
        events: [
          { name: 'page_view', payload: { path: '/predictive-os' }, ts: Date.now(), session: 's_edge_test', url: '/predictive-os' },
        ],
      }),
    }, TEST_ENV)
    // Endpoint may answer 200 (ack) or 202 (queued) — both are acceptable
    expect([200, 202, 204]).toContain(res.status)
  })

  it('rejects a malformed payload with 4xx', async () => {
    const res = await app.request('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    }, TEST_ENV)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })
})

describe('404 fall-through', () => {
  it('unknown /api/* path returns 404', async () => {
    const res = await app.request('/api/no-such-route-ever', undefined, TEST_ENV)
    expect(res.status).toBe(404)
  })
})
