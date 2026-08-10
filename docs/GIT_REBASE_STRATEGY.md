# Git Rebase & Synchronization Strategy (origin/main → Local Feature Branch)

## Overview
This document outlines the formal, step-by-step Git rebase strategy for integrating **8 incoming commits from `origin/main`** (focusing on upgraded OAuth endpoints and CI GitHub Actions workflows) while preserving all **v4.12 features** (Observability stack, Azure Foundry integrations, and interactive Playground components).

---

## 🔍 Incoming Commits & Diff Analysis (`origin/main` vs. Local Branch)

The 8 incoming commits on `origin/main` introduce structural changes primarily concentrated across **OAuth endpoints**, **API handlers**, and **CI Workflows**:

### 1. OAuth Endpoints & Session Management (`src/api/auth/*` & `functions/api/auth/*`)
- **OAuth Callback (`/api/auth/callback`)**: Introduces PKCE token exchange, state parameter validation, and secure cookie creation (`httpOnly`, `SameSite=Lax`).
- **Session Endpoints (`/api/auth/session`, `/api/auth/logout`)**: Adds session validation route handlers and session termination logic.
- **Potential Conflict**: Local v4.12 wraps API handlers with telemetry/tracing middleware (`src/lib/observability`).
- **Resolution**: Use 3-way hybrid merge — retain incoming OAuth endpoints while wrapping their route exports with local telemetry middleware.

### 2. CI Workflows & GitHub Actions (`.github/workflows/*`)
- **Automated CI Pipeline (`.github/workflows/ci.yml`)**: Adds automated lint, type check, and unit test jobs on push/PR to `main`.
- **Deployment Action (`.github/workflows/deploy.yml`)**: Adds Cloudflare / Cloud Run build and deploy action using encrypted secret parameters.
- **Potential Conflict**: Replaces older legacy shell scripts.
- **Resolution**: Fully accept incoming (`--theirs`) workflow files from `origin/main`.

### 3. API Router & Base Configuration (`server.ts`, `vite.config.ts`, `wrangler.jsonc`)
- **API Middleware Registration**: Registers the `/api/auth/*` endpoints on Express and Cloudflare Pages/Workers routing table.
- **Wrangler Bindings**: Configures KV namespace and environment variables for OAuth Client IDs and Secrets.
- **Potential Conflict**: Local `server.ts` includes custom routes for Azure Foundry LLM proxy (`/api/azure/*`) and Observability metric endpoints (`/api/metrics`).
- **Resolution**: Perform union merge — retain incoming OAuth route registration alongside local Azure Foundry and Observability routes.

---

## 📋 Phase 1: Pre-Flight Checklist

Before initiating the rebase operation, perform the following verification steps:

- [ ] **Clean Working Directory**: Ensure there are no uncommitted changes or unstaged working tree modifications.
  ```bash
  git status
  ```
- [ ] **Create Recovery Ref / Safety Snapshot**: Create a temporary backup branch from your current HEAD.
  ```bash
  git branch backup/pre-rebase-v4.12
  ```
- [ ] **Verify Dependencies & Build Gate**: Ensure local unit tests, linting, and build pass cleanly prior to sync.
  ```bash
  npm run lint
  npm run build
  ```
- [ ] **Set Remote Environment Variable (if remote URL exists)**:
  ```bash
  export GIT_REMOTE_URL="<your-repository-url>"
  ```

---

## 🔄 Phase 2: Automated Step-by-Step Rebase Execution

### Step 1: Fetch All Branches & Remote References
Fetch the latest state from the `origin` remote:
```bash
git fetch --all --prune
```

### Step 2: Automated Rebase Script
Run the project's automated reconciliation engine:
```bash
chmod +x ./scripts/reconcile-and-rebase.sh
./scripts/reconcile-and-rebase.sh
```

---

## ⚔️ Phase 3: Conflict Resolution Matrix & Domain Rules

When Git pauses on conflicts during `git rebase origin/main`, resolve files strictly according to the following resolution matrix:

| Artifact / Path Pattern | Incoming `origin/main` (Theirs) | Local `HEAD` (Ours - v4.12) | Resolution Strategy |
| :--- | :--- | :--- | :--- |
| **`.github/workflows/*`** | CI Pipeline Improvements, OAuth Secrets, Deployment Jobs | Legacy CI scripts | **Accept Incoming (`--theirs`)**<br>Use origin's updated GitHub Actions workflow definitions. |
| **`src/api/auth/*` & `functions/api/*`** | OAuth callback handlers & PKCE flow updates | Custom API handlers & route proxies | **3-Way Merge / Hybrid Resolution**<br>Retain new OAuth route handlers while keeping v4.12 observability middleware. |
| **`src/components/playground/*`** | N/A or minimal base stubs | Full v4.12 interactive playground suite | **Keep Local (`--ours`)**<br>Preserve local playground components. |
| **`src/services/azure/`** | N/A | Azure Foundry SDK & LLM client wrapper | **Keep Local (`--ours`)**<br>Preserve Azure Foundry orchestration. |
| **`src/lib/observability/`** | N/A | Telemetry tracers, logs & metrics dashboard | **Keep Local (`--ours`)**<br>Preserve v4.12 observability stack. |
| **`package.json` & `wrangler.jsonc`** | Updated CI dependencies & wrangler bindings | Local v4.12 packages | **Union Merge**<br>Combine dependencies and environment bindings. |

---

## 🛡️ Phase 4: Fallback Plan for Manual Conflict Resolution

If automated rebase encounters complex non-trivial conflicts, execute this manual fallback procedure:

### 1. Identify Conflicted Files
```bash
git diff --name-only --diff-filter=U
```

### 2. Apply Conflict Policies
* For **GitHub Workflows**:
  ```bash
  git checkout --theirs .github/workflows/
  git add .github/workflows/
  ```
* For **Observability & Azure Foundry**:
  ```bash
  git checkout --ours src/lib/observability/ src/services/azure/
  git add src/lib/observability/ src/services/azure/
  ```
* For **OAuth APIs** (`src/api/*` or `functions/api/*`):
  Inspect manually to ensure both the OAuth callback logic (`/api/auth/callback`) and telemetry wrappers remain active.

### 3. Continue Rebase
```bash
git rebase --continue
```

### 4. Emergency Abort & Rollback (Tarball & Ref Backup)
If the rebase reaches an unresolvable state, abort the rebase immediately:
```bash
git rebase --abort
```

To restore the working directory directly from the snapshot archive `/tmp/git-backup-pre-rewrite-1785715188.tar.gz`:
```bash
# Extract the safety snapshot tarball to restore full pre-rewrite state
tar -xzf /tmp/git-backup-pre-rewrite-1785715188.tar.gz -C /
```
Alternatively, reset to the safety snapshot ref:
```bash
git reset --hard backup/pre-rebase-v4.12
```

---

## ✅ Phase 5: Post-Rebase Verification & Quality Gates

Run the verification pipeline to validate feature integrity:

1. **Linting & Type-Checking**:
   ```bash
   npm run lint
   ```
2. **Production Build Validation**:
   ```bash
   npm run build
   ```
3. **Verify Applet Compilation**:
   Ensure `dist/server.cjs` and Vite static assets compile cleanly with zero type errors.

---
*Created and verified by easyTenancy Rebase Engine v4.12.*
