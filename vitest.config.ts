// ═══════════════════════════════════════════════════════════════════════
//  easyTenancy Global OS — Vitest Edge-Testing Configuration (v3.2.4)
//  Runs tests against the Cloudflare Workers runtime (via workerd)
//  so Hono routes, Zod validation and D1/KV bindings are tested in-situ.
//
//  Test layers:
//    unit/      — pure logic tests (schemas, utilities, token helpers)
//    edge/      — Worker + Hono handler tests (real CF runtime via pool)
//    integration/ — end-to-end flow tests (staging pipeline, CRM sync)
// ═══════════════════════════════════════════════════════════════════════

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // ── Path aliases (mirror vite.config.ts) ─────────────────────────
  resolve: {
    alias: {
      '@':    path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },

  test: {
    // ── Global test settings ────────────────────────────────────────
    globals:     true,
    environment: 'node',   // override per pool below

    // ── Test file patterns ─────────────────────────────────────────
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'functions/**/*.{test,spec}.ts',
      'tests/**/*.{test,spec}.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.wrangler/**',
    ],

    // ── Coverage (v8, Cloudflare-compatible) ──────────────────────
    coverage: {
      provider:        'v8',
      reporter:        ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include:         ['src/**/*.{ts,tsx}', 'functions/**/*.ts'],
      exclude:         [
        'src/**/*.d.ts',
        'src/routes/**',          // route tests are in /edge pool
        '**/*.config.{ts,js}',
        '**/index.tsx',
        'src/components/**',      // UI components excluded from edge coverage
      ],
      thresholds: {
        lines:     80,
        functions: 80,
        branches:  75,
        statements: 80,
      },
      all:             true,
    },

    // ── Projects = separate test pools ───────────────────────────
    // Each project can use a different environment / pool-options.
    projects: [
      // ── 1. Unit tests — pure Node.js (fast, no runtime overhead) ──
      {
        test: {
          name:         'unit',
          environment:  'node',
          include:      ['src/lib/**/*.{test,spec}.ts', 'tests/unit/**/*.{test,spec}.ts'],
          globals:      true,
          setupFiles:   ['./tests/setup/unit.ts'],
        },
        resolve: {
          alias: {
            '@':    path.resolve(__dirname, './src'),
            '@lib': path.resolve(__dirname, './src/lib'),
          },
        },
      },

      // ── 2. Edge tests — Cloudflare Workers runtime (workerd) ─────
      // Requires @cloudflare/vitest-pool-workers to be installed.
      // Install: npm install --save-dev @cloudflare/vitest-pool-workers
      {
        test: {
          name:         'edge',
          include:      ['tests/edge/**/*.{test,spec}.ts', 'functions/**/*.{test,spec}.ts'],
          globals:      true,
          setupFiles:   ['./tests/setup/edge.ts'],
          poolOptions: {
            workers: {
              wrangler: { configPath: './wrangler.jsonc' },
              miniflare: {
                // D1 local databases for edge tests
                d1Databases:  ['DB'],
                // KV namespaces
                kvNamespaces: ['ANALYTICS_KV', 'WAITLIST_KV'],
                // R2 buckets
                r2Buckets:    ['MEDIA_BUCKET'],
                // Vars — override with test values
                vars: {
                  DEMO_TOKEN:              'et-test-token-2026',
                  NOVITA_API_KEY:          'test-novita-key',
                  TURNSTILE_SECRET_KEY:    'test-turnstile-secret',
                  CF_AI_FALLBACK_ENABLED:  'true',
                  ARGO_SMART_ROUTING:      'true',
                  ENVIRONMENT:             'test',
                },
              },
            },
          },
        },
      },

      // ── 3. Integration tests — full pipeline tests ────────────────
      {
        test: {
          name:        'integration',
          environment: 'node',
          include:     ['tests/integration/**/*.{test,spec}.ts'],
          globals:     true,
          setupFiles:  ['./tests/setup/integration.ts'],
          timeout:     30_000,  // 30s for network-involving tests
          retry:       2,
        },
        resolve: {
          alias: {
            '@':    path.resolve(__dirname, './src'),
            '@lib': path.resolve(__dirname, './src/lib'),
          },
        },
      },
    ],

    // ── Reporter config ──────────────────────────────────────────
    reporters: process.env.CI
      ? ['verbose', 'json', 'junit']
      : ['verbose', 'html'],
    outputFile: {
      json:  './test-results/results.json',
      junit: './test-results/junit.xml',
      html:  './test-results/index.html',
    },

    // ── Performance ──────────────────────────────────────────────
    pool:           'forks',      // isolate each test file
    isolate:        true,
    maxConcurrency: 4,
    testTimeout:    15_000,
    hookTimeout:    10_000,

    // ── Type checking ────────────────────────────────────────────
    typecheck: {
      tsconfig: './tsconfig.json',
      include:  ['src/**/*.ts', 'tests/**/*.ts', 'functions/**/*.ts'],
    },

    // ── Snapshot settings ────────────────────────────────────────
    snapshotOptions: {
      snapshotFormat: {
        printBasicPrototype: false,
      },
    },
  },
})
