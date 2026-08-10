# Git Rebase & Reconciliation Strategy Guide

## Overview
This document outlines the step-by-step procedure for reconciling the local `main` branch with `origin/main`. It addresses incoming commits—including OAuth configuration, CI workflow updates, Express middleware changes, and Cloudflare Workers (`wrangler.jsonc`) integrations—while safeguarding local work and providing a fail-safe rollback plan using the pre-rewrite backup tarball.

---

## 1. Pre-Flight Checklist

Before initiating any fetch or rebase operations, execute these preliminary safety checks:

- [ ] **Verify Backup Archive:** Confirm that the pre-rewrite archive exists and is valid:
  ```bash
  ls -lh /tmp/git-backup-pre-rewrite-1785715188.tar.gz
  ```
- [ ] **Check Working Tree Cleanliness:** Ensure there are no unstaged changes or untracked files that could interfere with the rebase:
  ```bash
  git status
  ```
- [ ] **Create a Safety Ref/Branch:** Create an explicit branch pointing to your current HEAD before starting:
  ```bash
  git branch backup-local-main-HEAD
  ```
- [ ] **Verify Remote Configuration:** Ensure `origin` is mapped to the intended repository URL:
  ```bash
  git remote -v
  ```

---

## 2. Fetch and Rebase Process

### Step 2.1: Fetch Latest Remote Changes
Fetch remote references without modifying your working tree:
```bash
git fetch origin
```

### Step 2.2: Inspect Incoming Commits
Examine the 8 incoming commits from `origin/main` to anticipate conflicts in OAuth config, CI workflows, and API layers:
```bash
git log --oneline HEAD..origin/main
```

### Step 2.3: Initiate Interactive Rebase
Rebase local `main` onto `origin/main` to maintain a clean linear commit history:
```bash
git rebase origin/main
```

---

## 3. Resolving Conflicts (API Routes, OAuth, CI & wrangler.jsonc)

During the rebase, Git may pause on conflicts—particularly around `.github/workflows/`, API routes (`src/api/*`), OAuth endpoints (`src/api/oauth.ts`), and Cloudflare config (`wrangler.jsonc`).

### Specific File Conflict Resolution Strategies:

1. **`src/api/index.ts` (Hono API Router vs Express Middleware):**
   - **Conflict:** `origin/main` introduces Express-specific middleware (`express-rate-limit`) and standard `{ success, data, timestamp }` envelopes, whereas local uses Hono (`api.use('*', cors())`).
   - **Resolution:** Retain Hono in `src/api/index.ts`. Implement Hono-native response envelope helpers and memory/KV rate limiters rather than importing Express middleware.

2. **`src/api/oauth.ts` & Auth Configuration:**
   - **Conflict:** Incoming changes from `c8f102a` and `5a821f0` refactor OAuth token exchange and popup fallback routines for sandboxed iframes.
   - **Resolution:** Adopt remote OAuth popup handling improvements into Hono endpoints, while keeping local demo authentication token gates intact.

3. **`wrangler.jsonc` (Cloudflare Pages vs Cloud Run):**
   - **Conflict:** Remote CI/CD workflows target Docker / Cloud Run deployments (`server.ts`), while local targets Cloudflare Pages Functions.
   - **Resolution:** Maintain `wrangler.jsonc` with `"compatibility_flags": ["nodejs_compat"]` and AI/KV bindings. Ensure dual support so both Vite/Cloudflare Pages and Express fallback build scripts execute cleanly.

4. **CI Workflows (`.github/workflows/*.yml` & `azure-devops-pipeline.yml`):**
   - **Conflict:** Incoming Node 20.x version matrix and parallel lint/build steps.
   - **Resolution:** Accept remote Node 20.x workflow updates and ensure local verification steps (`npm run lint` and `npm run build`) are included in the pipeline matrix.

### Manual Resolution Loop:
1. Identify conflicting files: `git status`
2. Edit files to resolve conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Stage resolved files: `git add <resolved-file-path>`
4. Continue rebase: `git rebase --continue`

---

## 4. Rollback & Recovery Procedures

If unresolvable conflicts arise or the rebase state becomes corrupted, use one of the following recovery strategies:

### Option A: Abort In-Progress Rebase
If rebase is currently paused with active conflicts:
```bash
git rebase --abort
```

### Option B: Reset to Pre-Flight Safety Branch
If the rebase completed with errors:
```bash
git reset --hard backup-local-main-HEAD
```

### Option C: Complete Restoration from Pre-Rewrite Tarball Backup
If the workspace or `.git` directory requires full restoration from `/tmp/git-backup-pre-rewrite-1785715188.tar.gz`:

1. **Navigate to Parent Directory:**
   ```bash
   cd $(git rev-parse --show-toplevel)/..
   ```
2. **Extract Backup Archive:**
   ```bash
   tar -xzf /tmp/git-backup-pre-rewrite-1785715188.tar.gz
   ```
3. **Verify Integrity:**
   ```bash
   git status
   git log -n 5
   ```

---

## 5. Post-Rebase Verification

Once rebase succeeds, verify the codebase integrity:
1. Run static linting and type checking:
   ```bash
   npm run lint
   ```
2. Run full application build:
   ```bash
   npm run build
   ```
3. Verify dev server boot:
   ```bash
   npm run dev
   ```
