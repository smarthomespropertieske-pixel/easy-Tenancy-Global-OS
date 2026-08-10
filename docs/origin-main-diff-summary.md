# Diff & Impact Summary: `origin/main` Incoming Commits

This document provides a detailed structural analysis of the **8 incoming commits** on `origin/main` that are missing from our local branch. It evaluates potential conflict vectors specifically against our local `src/api` routes (`src/api/index.ts`, `src/api/oauth.ts` using Hono) and `wrangler.jsonc` Cloudflare Workers/Pages configuration.

---

## 1. Breakdown of the 8 Incoming Commits on `origin/main`

| Commit # | Hash / ID | Scope | Commit Title & Description | Potential Conflict Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Commit 1** | `c8f102a` | **OAuth / Auth** | Upgrade Google OAuth redirect handler & token exchange routines | **High** (`src/api/oauth.ts`) |
| **Commit 2** | `f4a918b` | **API Routes** | Standardize JSON payload response envelope across `/api/v1/*` | **High** (`src/api/index.ts`) |
| **Commit 3** | `a1093cd` | **CI Workflows** | Add parallel build & TypeScript check steps to GitHub Actions | **Medium** (`.github/workflows/`) |
| **Commit 4** | `e772b1e` | **Database / Config** | Update Firebase security rules and `firebase-applet-config.json` | **Low** (`firebase.ts` / bindings) |
| **Commit 5** | `b3d4051` | **API Routes** | Integrate rate-limiting middleware for auth and property valuation endpoints | **High** (`src/api/index.ts` Hono middleware) |
| **Commit 6** | `d921e42` | **CI Workflows** | Configure automated deployment triggers for staging environments | **Medium** (`wrangler.jsonc` vs Cloud Run) |
| **Commit 7** | `5a821f0` | **OAuth / Frontend** | Refactor `OAuthLoginButton.tsx` and popup fallback routines for sandboxed iframes | **Low-Medium** (`src/api/oauth.ts`) |
| **Commit 8** | `7e14c33` | **CI Workflows** | Update Node.js version matrix to `20.x` and optimize npm dependency caching | **Low** (`package.json`) |

---

## 2. Structural Conflict Analysis: `src/api` Routes

### A. Local Architecture Overview (`src/api`)
* **Framework:** Local backend routes are built on **Hono** (`src/api/index.ts`), optimized for Cloudflare Pages Functions / Workers.
* **Key Routes:**
  * `POST /api/analytics` & `GET /api/analytics/summary` (KV/D1 storage logic)
  * `USE /api/demo/*` (Auth gate with `isDemoAuthenticated`)
  * `GET /api/demo/tenants`
  * `GET /api/health`
  * `POST /api/waitlist`
  * `POST /api/oauth/token` & `GET /api/oauth/user` in `src/api/oauth.ts`

### B. Incoming Commits Impact (`origin/main`)
* **Commits 2 & 5 (`f4a918b`, `b3d4051`):** Remote branch introduces Express-style standard JSON envelopes (`{ success: boolean, data: any, timestamp: string }`) and Express middleware (`express-rate-limit`).
* **Conflict Points:**
  * **Middleware Layer:** `src/api/index.ts` uses Hono `api.use('*', timing())`, `cors()`, and custom demo token validation. Express middleware on `origin/main` will fail if blindly pasted into Hono.
  * **Response Format:** Hono `c.json({ ok: true, received: ... })` vs remote `{ success: true, data: ... }`.
* **Resolution Strategy:**
  1. Retain Hono framework in `src/api/index.ts`.
  2. Implement Hono-compatible response envelope helper:
     ```ts
     const jsonEnvelope = (c: Context, data: any, status = 200) => 
       c.json({ success: status < 400, data, timestamp: new Date().toISOString() }, status)
     ```
  3. Adapt remote rate-limiting logic using Hono's lightweight memory/KV rate limiter instead of Express middleware.

---

## 3. Structural Conflict Analysis: `wrangler.jsonc` Configuration

### A. Local Configuration Overview (`wrangler.jsonc`)
* **Target Runtime:** Cloudflare Pages / Workers (`"pages_build_output_dir": "./dist"`).
* **Bindings:**
  * `"compatibility_flags": ["nodejs_compat"]`
  * `"ai": { "binding": "AI" }` (Workers AI fallback)
  * Commented KV/D1/R2 storage bindings (`ANALYTICS_KV`, `WAITLIST_KV`, `DB`).

### B. Incoming Commits Impact (`origin/main`)
* **Commits 4 & 6 (`e772b1e`, `d921e42`):** Remote commits target Firebase / GCP Cloud Run deployment parameters and Express server bundles (`server.ts`).
* **Conflict Points:**
  * Remote CI workflows assume `server.ts` standalone execution, whereas local deployment targets Cloudflare Pages via `wrangler.jsonc`.
  * Remote environment secrets rely on `process.env.*`, while `wrangler.jsonc` exposes environment bindings via `c.env` in Hono.
* **Resolution Strategy:**
  1. Maintain `wrangler.jsonc` as the primary configuration for Cloudflare Pages deployment.
  2. Ensure `compatibility_flags: ["nodejs_compat"]` remains enabled so `c.env` bindings and Node APIs resolve cleanly during rebase.
  3. Keep dual deployment compatibility: allow Vite to serve `_worker.js` / Pages functions via `wrangler.jsonc` while supporting `server.ts` fallback.

---

## 4. Rebase Execution & Verification Protocol

1. **Pre-Rebase Backup Verification:**
   ```bash
   ls -lh /tmp/git-backup-pre-rewrite-1785715188.tar.gz
   git branch backup-local-main-HEAD
   ```

2. **Rebase Command:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Conflict Resolution Focus:**
   * In `src/api/index.ts`: Keep Hono router; standardise envelopes; reject Express middleware imports.
   * In `src/api/oauth.ts`: Merge enhanced OAuth validation from `c8f102a` into Hono handler.
   * In `wrangler.jsonc`: Retain `nodejs_compat` and AI bindings.

4. **Post-Rebase Verification:**
   ```bash
   npm run lint
   npm run build
   ```
