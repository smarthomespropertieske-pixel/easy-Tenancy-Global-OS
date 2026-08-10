import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// v4.4 — PUBLIC_SITE_URL substitution into index.html
// Fallback to Cloudflare Pages default — do NOT hardcode .co.uk or any specific TLD.
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://easy-tenancy-global-os.pages.dev'

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [
      react(),
      {
        name: 'html-env-vars',
        transformIndexHtml(html) {
          return html.replace(/%PUBLIC_SITE_URL%/g, PUBLIC_SITE_URL)
        },
      },
      {
        name: 'custom-ws-server',
        configureServer(server) {
          server.ws.on('connection', () => {
            server.ws.send('my:greetings', { msg: 'hello' })
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-vendor'
            }
            if (id.includes('node_modules/d3-force') ||
                id.includes('node_modules/d3-selection') ||
                id.includes('node_modules/d3-scale') ||
                id.includes('node_modules/d3-zoom') ||
                id.includes('node_modules/d3-drag') ||
                id.includes('node_modules/d3-')) {
              return 'd3-vendor'
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: false,
      allowedHosts: 'all',
      cors: true,
      hmr: env.VITE_HMR_HOST ? { host: env.VITE_HMR_HOST, protocol: env.VITE_HMR_PROTOCOL } : { overlay: false },
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: false,
      allowedHosts: 'all',
      cors: true,
    }
  })
}
