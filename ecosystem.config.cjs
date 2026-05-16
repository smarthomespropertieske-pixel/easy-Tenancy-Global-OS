module.exports = {
  apps: [
    {
      name: 'webapp',
      // Custom Node.js static server — zero host restrictions, full SPA fallback
      // Also handles /api/metrics/live, /api/og, /api/ai/* natively (no wrangler auth needed)
      script: 'server.mjs',
      cwd: '/home/user/webapp',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
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
