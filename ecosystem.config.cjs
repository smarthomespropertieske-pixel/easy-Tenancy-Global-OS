// ── Load .dev.vars into env so server.mjs sees TINYFISH_API_KEY, GEMINI_API_KEY, etc.
//    (Cloudflare uses this filename for local secrets; we mirror its behavior.)
const fs = require('fs')
const path = require('path')
const devVars = {}
try {
  const txt = fs.readFileSync(path.join(__dirname, '.dev.vars'), 'utf8')
  for (const line of txt.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    devVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
} catch { /* file missing — fine, env still works */ }

module.exports = {
  apps: [
    {
      name: 'webapp',
      // Custom Node.js static server — zero host restrictions, full SPA fallback
      // Also handles /api/metrics/live, /api/og, /api/ai/*, /api/search, /api/intel/* natively
      script: 'server.mjs',
      cwd: '/home/user/webapp',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        ...devVars,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 2000,
    }
  ]
}
