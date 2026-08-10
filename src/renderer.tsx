// renderer.tsx — Hono JSX renderer (used for server-side rendering if needed)
// Note: The main SPA uses c.html() directly in src/index.tsx; this file
// is kept for compatibility. Type suppressed due to hono/jsx-renderer
// ComponentWithChildren variance in strict TS mode.
// @ts-nocheck
import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
