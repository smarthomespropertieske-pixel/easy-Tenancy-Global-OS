import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { app as apiApp } from './functions/api/[[route]].js'
import { promises as fs } from 'fs'

const app = new Hono()

// Inject process.env into c.env so the CF Pages app works seamlessly
app.use('*', async (c, next) => {
  if (!c.env) c.env = {}
  Object.assign(c.env as object, process.env)
  await next()
})

// Mount original CF pages app under the root
app.route('/', apiApp)

// Add missing endpoints that were previously in server.mjs
app.get('/api/arr', (c) => {
  const TARGET   = 1_345_000_000
  const MIDPOINT = 24
  const STEEPNESS = 0.22
  const month    = new Date().getMonth()
  const L        = 1 / (1 + Math.exp(-STEEPNESS * (month - MIDPOINT)))
  const arr      = Math.floor(TARGET * L)
  return c.json({
    ok: true,
    arrUSD: arr,
    target: TARGET,
    pct:    ((arr / TARGET) * 100).toFixed(2),
    ts:     new Date().toISOString(),
  }, 200, {
    'Cache-Control': 'public, s-maxage=15'
  })
})

app.get('/api/compliance/jurisdiction', (c) => {
  const country = (c.req.query('country') ?? c.req.header('cf-ipcountry') ?? 'US').toUpperCase()
  const REGIMES: Record<string, string> = {
    GB:'GDPR',DE:'GDPR',FR:'GDPR',IT:'GDPR',NL:'GDPR',SE:'GDPR',
    US:'CCPA', KE:'KES', TH:'PDPA', SG:'PDPA', ZA:'POPIA',
  }
  const regime = REGIMES[country] ?? 'generic'
  return c.json({
    ok: true,
    country,
    regime,
    gdprApplies:  regime === 'GDPR',
    taxReporting: ['KE','ZA','NG'].includes(country),
    ts: new Date().toISOString(),
  })
})

// Static assets from the frontend build
app.use('/*', serveStatic({ root: './dist' }))

// SPA fallback
app.get('*', async (c) => {
  try {
    const html = await fs.readFile('./dist/index.html', 'utf-8')
    return c.html(html)
  } catch (err) {
    return c.text('Not found or dist/index.html missing. Run npm run build.', 404)
  }
})

const port = 3000
serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`Listening on http://${info.address}:${info.port}`)
})
