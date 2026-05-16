# easyTenancy — Integrated Experience Engine (IEE)

> The #1 Global Real Estate Operating System — AI-powered compliance, collections, and operations for 50,000+ property managers across 120 countries.

## Live URLs
- **Sandbox preview:** https://3000-i1zjirettuwzhpm1ydsky-6532622b.e2b.dev
- **Deep-link demo:** https://3000-i1zjirettuwzhpm1ydsky-6532622b.e2b.dev/app/demo?demoTenantId=demo-001
- **ROI Calculator bridge:** `/app/demo?units=50&monthlyRent=85000&occupancy=96`
- **Property detail:** `/org/demo/properties/LDN-247/compliance`

---

## Project Overview

Phase 2 complete: **Integrated Experience Engine (IEE)** — a production-grade React + TypeScript SPA deployed on Cloudflare Pages with D3 visualisations, live AI feed, deep-linking, Liquid Glass design system, and full analytics instrumentation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, React Router v7 |
| Styling | Liquid Glass CSS (backdrop-filter, custom vars) + Tailwind CDN |
| Visualisation | D3.js v7 (force-directed Canvas, CDN) |
| Animation | Framer Motion v12 |
| Backend API | Hono v4 (Cloudflare Pages Functions) |
| Build | Vite 6 + @vitejs/plugin-react v4 |
| Deployment | Cloudflare Pages |
| Process manager | PM2 (sandbox only) |

---

## Architecture

```
/home/user/webapp/
├── index.html                     SPA entry point (D3 CDN script tag)
├── vite.config.ts                 React build, D3 external, allowedHosts:all
├── wrangler.jsonc                 CF Pages config (nodejs_compat)
├── ecosystem.config.cjs           PM2: vite preview --port 3000
├── functions/
│   └── api/[[route]].ts          CF Pages Functions — all /api/* routes
├── src/
│   ├── main.tsx                   React DOM root + BrowserRouter
│   ├── App.tsx                    Router + analytics page tracking
│   ├── styles/global.css          Liquid Glass design system
│   ├── lib/
│   │   ├── analytics.ts           trackEvent() + sendBeacon + retry flush
│   │   ├── demoData.ts            3 demo tenants + parseDemoParams/buildDemoUrl
│   │   └── wsStream.ts            Mock WebSocket AI feed (12-event pool)
│   ├── hooks/index.ts             All custom hooks (scroll, metrics, feed, etc.)
│   ├── components/
│   │   ├── Nav.tsx                Glass nav + mobile hamburger
│   │   ├── RadialMap.tsx          D3 force-directed Canvas + mobile swipe carousel
│   │   ├── AIFeed.tsx             Live AI feed + deep-link navigation
│   │   ├── MetricsTicker.tsx      6-metric animated grid (IntersectionObserver)
│   │   ├── ROICalculator.tsx      4-slider ROI calc + App Bridge
│   │   ├── CompliancePanel.tsx    Collapsible 3-tab compliance panel
│   │   └── FeatureMicroTours.tsx  3 inline 30-sec tours with step navigation
│   └── routes/
│       ├── HomePage.tsx           Full marketing homepage (all 10 IEE sections)
│       ├── AppDemo.tsx            Pre-populated demo dashboard (deep-link aware)
│       └── PropertyDetail.tsx     Property detail (8 sections, full CRUD UI)
└── dist/                          Built SPA output
```

---

## 10 IEE Directives — Status

| # | Directive | Status | Key file |
|---|---|---|---|
| 1 | Deep-Linking | ✅ | `useDeepLinkParams()` → `AppDemo.tsx` |
| 2 | Live AI Feed | ✅ | `wsStream.ts` → `AIFeed.tsx` |
| 3 | Radial Visualization | ✅ | `RadialMap.tsx` (D3 Canvas + mobile carousel) |
| 4 | Liquid Glass Design | ✅ | `global.css` (`--glass-bg`, `backdrop-filter`) |
| 5 | Real-Time Metrics | ✅ | `useAnimatedCounter` + `useLiveMetrics` |
| 6 | ROI Calculator Bridge | ✅ | `buildDemoUrl()` → `/app/demo?units=X` |
| 7 | Compliance Panel | ✅ | `CompliancePanel.tsx` (3 tabs, notice gen) |
| 8 | Feature Micro-Tours | ✅ | `FeatureMicroTours.tsx` (3 × 3-step tours) |
| 9 | Mobile-First | ✅ | `useIsMobile()`, 48px targets, swipe carousel |
| 10 | Analytics | ✅ | `analytics.ts` (batch/flush/sendBeacon/retry) |

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` | Full marketing site with all IEE sections |
| `/app/demo` | `AppDemo` | Pre-populated dashboard, reads URL params |
| `/app/demo?demoTenantId=demo-001&units=50&monthlyRent=85000&occupancy=96` | `AppDemo` | ROI Calculator bridge entry |
| `/org/:orgId/properties/:propId/overview` | `PropertyDetail` | Property overview |
| `/org/:orgId/properties/:propId/compliance` | `PropertyDetail` | Compliance certificates |
| `/org/:orgId/properties/:propId/collections` | `PropertyDetail` | Rent collections |
| `/org/:orgId/properties/:propId/maintenance` | `PropertyDetail` | Maintenance tickets |
| `/org/:orgId/properties/:propId/leases` | `PropertyDetail` | Lease schedule |
| `/org/:orgId/properties/:propId/arrears` | `PropertyDetail` | Arrears + notice generator |
| `/org/:orgId/properties/:propId/screening` | `PropertyDetail` | Tenant screening |
| `/org/:orgId/properties/:propId/vacancies` | `PropertyDetail` | Vacancy management |

---

## API Endpoints (Cloudflare Pages Functions)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analytics` | None | Event batch ingestion (KV → D1 → console fallback) |
| `GET` | `/api/health` | None | Version + env status |
| `POST` | `/api/waitlist` | None | Email lead capture |
| `GET` | `/api/demo/tenants` | Bearer / `?token=` | Demo tenant list |
| `GET` | `/api/analytics/summary` | Bearer / `?token=` | Event summary |

**Auth token:** `et-demo-2025` (override via `DEMO_TOKEN` CF secret)
**Preview hosts** (`.pages.dev`, `.e2b.dev`, `localhost`) are auto-allowed.

---

## Demo Tenants

| ID | Name | Country | Units |
|---|---|---|---|
| `demo-001` | Actis Capital Portfolio | KE | 450 |
| `demo-002` | Knight Frank Global | UK | 1,200 |
| `demo-003` | Gulf Properties LLC | AE | 320 |

---

## Development

```bash
# Start dev server (hot reload)
npm run dev

# Production build (Vite, D3 via CDN)
npm run build

# Preview production build locally
npm run preview
# or via PM2:
pm2 start ecosystem.config.cjs
```

### Build notes
- **D3 is loaded from CDN** (`cdn.jsdelivr.net/npm/d3@7.9.0`) — this avoids Rollup's circular-dependency hang that occurs when bundling D3's 500+ modules. The `rollupOptions.external: ['d3']` config in `vite.config.ts` pairs with the `<script>` tag in `index.html`.
- `allowedHosts: 'all'` in `vite.config.ts` allows the Vite preview server to respond to any tunnel/proxy hostname (required for sandbox and ngrok previews).

---

## Deployment — Cloudflare Pages

```bash
# 1. Set CF API key (Deploy tab in sidebar)
# 2. Run:
npm run deploy
# Equivalent to:
npm run build && npx wrangler pages deploy dist --project-name webapp
```

### Optional: bind storage for analytics
```bash
# KV for analytics events
npx wrangler kv:namespace create ANALYTICS_KV
# Add to wrangler.jsonc then deploy again

# KV for waitlist emails
npx wrangler kv:namespace create WAITLIST_KV

# Auth token secret
npx wrangler pages secret put DEMO_TOKEN --project-name webapp
```

---

## Deployment — GitHub

```bash
# Authorize in #github tab, then:
git remote add origin https://github.com/YOUR_USERNAME/webapp.git
git push -f origin main
```

---

## Deployment Status

| Platform | Status | URL |
|---|---|---|
| Sandbox (PM2 + Vite preview) | ✅ Running | https://3000-i1zjirettuwzhpm1ydsky-6532622b.e2b.dev |
| Cloudflare Pages | ⏳ Awaiting API key | — |
| GitHub | ⏳ Awaiting auth | — |

---

## Git History

```
4688f30  fix: allowedHosts, real analytics API, auth middleware, CF Pages Functions
d03f7cc  feat: Phase 2 IEE — React SPA with D3, AI feed, deep-linking, Liquid Glass
2d56b1f  feat: Add stats counter grid, referral badge, rebuild all 30 features verified
15ed91d  feat: Complete Easy Tenancy SaaS rebuild with all enhancements
474ef8d  Initial commit
```

---

*Last updated: 2026-05-08 · easyTenancy IEE v2.0.0*
