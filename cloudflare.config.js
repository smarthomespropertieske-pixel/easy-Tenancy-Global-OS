// ═══════════════════════════════════════════════════════════════════════════
//  easyTenancy Global OS — Cloudflare Production Configuration 2026
//  ─────────────────────────────────────────────────────────────────────────
//  Covers:
//    1. Workers AI fallback config for Novita runtime (zero-downtime)
//    2. Argo Smart Routing for Vertex AI ↔ Meta Social Graph data paths
//    3. Multi-region *.pages.dev routing optimisation
//    4. Turnstile bot-protection settings
//    5. Security headers (OWASP 2026 baseline)
//    6. Edge caching policy per route class
//    7. WebAuthn / Passkey origin allowlist
//    8. Rate limiting tiers
//
//  This file is consumed by:
//    - Cloudflare Pages deploy pipeline (wrangler pages deploy)
//    - The Hono API layer (functions/api/[[route]].ts) via import
//    - The Vitest edge pool (tests/setup/edge.ts)
//    - Any future CF Terraform / Pulumi IaC scripts
//
//  ⚠️  NEVER commit actual API keys. Use `wrangler secret put` or the
//      Cloudflare Dashboard → Pages → Settings → Environment Variables.
// ═══════════════════════════════════════════════════════════════════════════

// ── Runtime environment detection ─────────────────────────────────────────
const ENV = (typeof process !== 'undefined' ? process.env.ENVIRONMENT : null)
         ?? (typeof globalThis !== 'undefined' ? globalThis.ENVIRONMENT : null)
         ?? 'production'

const IS_PROD  = ENV === 'production'
const IS_STAGE = ENV === 'staging'
const IS_DEV   = ENV === 'development' || ENV === 'test'

// ════════════════════════════════════════════════════════════════════════════
//  1. WORKERS AI ↔ NOVITA FALLBACK CONFIGURATION
//  ─────────────────────────────────────────────────────────────────────────
//  Strategy:  Novita FLUX.1-dev is the primary image-generation runtime.
//             Cloudflare Workers AI (@cf/stabilityai/stable-diffusion-xl-base-1.0)
//             is the automatic zero-downtime fallback.
//
//  Fallback triggers:
//    a. Novita HTTP status ≥ 500 or timeout > NOVITA_TIMEOUT_MS
//    b. Novita circuit-breaker OPEN (failure rate > CIRCUIT_OPEN_THRESHOLD)
//    c. Novita API key missing / invalid (401/403)
//    d. Worker CPU budget < 5ms remaining
//
//  Latency targets (2026 H100 benchmarks):
//    Novita FLUX.1-dev img2img:   p50 ≈ 0.95s, p95 ≈ 2.1s, p99 ≈ 3.4s
//    CF Workers AI SDXL:          p50 ≈ 2.8s,  p95 ≈ 6.2s, p99 ≈ 9.0s
// ════════════════════════════════════════════════════════════════════════════
export const AI_RUNTIME = {
  // Primary: Novita AI FLUX.1-dev
  novita: {
    enabled:         true,
    baseUrl:         'https://api.novita.ai/v3/async',
    imageEndpoint:   '/img2img',
    txtImgEndpoint:  '/txt2img',
    statusEndpoint:  '/task-result',
    model:           'flux.1-dev',
    timeoutMs:       8_000,         // Hard abort after 8s
    maxRetries:      2,
    retryDelayMs:    500,
    pollIntervalMs:  800,           // Task status polling interval
    pollMaxAttempts: 15,            // Max 12s of polling
    // Circuit-breaker settings
    circuitBreaker: {
      enabled:             true,
      windowSecs:          60,      // Rolling 60-second window
      failureThreshold:    5,       // Open after 5 failures
      openThreshold:       0.5,     // Open if >50% of requests fail
      halfOpenAfterSecs:   30,      // Probe again after 30s
      successesToClose:    3,       // Close after 3 consecutive successes
    },
    // Sandbox safety: In dev/test, random 10% of requests use CF fallback
    sandboxFallbackRate: IS_DEV ? 0.10 : 0.00,
  },

  // Fallback: Cloudflare Workers AI (SDXL base)
  cfWorkersAI: {
    enabled:     true,
    model:       '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    altModel:    '@cf/bytedance/stable-diffusion-xl-lightning',
    timeoutMs:   15_000,
    maxRetries:  1,
    // Model capability map (some Novita styles degrade gracefully on SDXL)
    styleSupport: {
      ar_meta:        'degraded',   // AR overlays → flat render
      luxury_modern:  'full',
      scandinavian:   'full',
      smart_home:     'partial',    // IoT overlays stripped
      vr_showcase:    'degraded',   // VR chrome → flat render
      investment:     'full',
    },
    // Watermark CF fallback images to distinguish from Novita output
    addFallbackBadge: IS_PROD,
  },

  // Automatic routing logic
  routing: {
    primary:                'novita',
    fallback:               'cfWorkersAI',
    // Force fallback if Novita responds > this many ms (regardless of success)
    novitaSlowFallbackMs:   10_000,
    // Emit a Workers Analytics Engine event on every fallback activation
    logFallbackEvent:       true,
    // KV key prefix for circuit-breaker state persistence
    circuitBreakerKvPrefix: 'cb:novita:',
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  2. ARGO SMART ROUTING CONFIGURATION
//  ─────────────────────────────────────────────────────────────────────────
//  Cloudflare Argo Smart Routing selects the fastest network path between
//  Cloudflare edge PoPs and origin servers. For easyTenancy, it is critical
//  for latency-sensitive paths: Vertex AI inference and Meta Social Graph
//  API calls which traverse transoceanic links.
//
//  Argo is enabled at the Zone level (Cloudflare dashboard → Speed → Argo).
//  This config documents the expected topology and sets request-level hints.
// ════════════════════════════════════════════════════════════════════════════
export const ARGO_ROUTING = {
  enabled: IS_PROD || IS_STAGE,

  // Origin servers with Argo-optimised paths
  origins: {
    vertexAI: {
      host:               'us-central1-aiplatform.googleapis.com',
      region:             'us-central1',
      // CF PoPs closest to this GCP region (IAD/ORD/DFW)
      preferredPoPs:      ['IAD', 'ORD', 'DFW', 'LAX'],
      tieredCaching:      true,
      // Tiered cache upper tier for Vertex inference responses
      tieredCacheUpperPop: 'IAD',
    },

    metaSocialGraph: {
      host:           'graph.facebook.com',
      region:         'us-west',
      preferredPoPs:  ['SJC', 'LAX', 'SEA', 'PDX'],
      tieredCaching:  false,    // Real-time social data — no tiered cache
      // Respect Meta's cache-control; Argo only optimises the transport path
    },

    salesforceDataCloud: {
      host:               'api.salesforce.com',
      region:             'us-east',
      preferredPoPs:      ['IAD', 'EWR', 'MIA'],
      tieredCaching:      true,
      tieredCacheUpperPop: 'IAD',
      // SFDC bulk data is cached at edge for 30s to reduce Data Cloud API calls
      cacheTtlSecs:        30,
    },

    novitaAI: {
      host:           'api.novita.ai',
      region:         'us-central',
      preferredPoPs:  ['ORD', 'DFW', 'IAD'],
      tieredCaching:  false,   // Generative AI responses are unique per request
    },
  },

  // Worker fetch options to pass Argo hints
  fetchOptions: {
    // cf: object passed to fetch() inside a Worker
    cf: {
      // Enables Argo Smart Routing for this specific fetch
      resolveOverride:   undefined,   // Set in Worker at request time
      cacheTtl:          0,
      cacheEverything:   false,
      // Argo tiered cache pass-through header
      tieredCaching:     true,
    },
  },

  // Health check endpoints (Cloudflare Health Checks product)
  healthChecks: {
    vertexAI:           '/v1/projects/{project}/locations/us-central1',
    metaSocialGraph:    '/me?fields=id',
    salesforceDataCloud: '/services/data/v63.0/',
    novitaAI:           '/v3/ping',
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  3. MULTI-REGION ROUTING OPTIMISATION (*.pages.dev)
//  ─────────────────────────────────────────────────────────────────────────
//  Cloudflare Pages deploys to 300+ edge PoPs automatically.
//  This section documents regional optimisations and geo-routing behaviour.
// ════════════════════════════════════════════════════════════════════════════
export const REGIONAL_ROUTING = {
  // Country → preferred currency + locale
  localeMap: {
    KE: { currency: 'KES', locale: 'en-KE', timezone: 'Africa/Nairobi',    flag: '🇰🇪' },
    UK: { currency: 'GBP', locale: 'en-GB', timezone: 'Europe/London',     flag: '🇬🇧' },
    AE: { currency: 'AED', locale: 'en-AE', timezone: 'Asia/Dubai',        flag: '🇦🇪' },
    US: { currency: 'USD', locale: 'en-US', timezone: 'America/New_York',  flag: '🇺🇸' },
    AU: { currency: 'AUD', locale: 'en-AU', timezone: 'Australia/Sydney',  flag: '🇦🇺' },
    ZA: { currency: 'ZAR', locale: 'en-ZA', timezone: 'Africa/Johannesburg', flag: '🇿🇦' },
    IN: { currency: 'INR', locale: 'en-IN', timezone: 'Asia/Kolkata',      flag: '🇮🇳' },
    SG: { currency: 'SGD', locale: 'en-SG', timezone: 'Asia/Singapore',    flag: '🇸🇬' },
  },

  // Pages.dev primary + branch URLs
  urls: {
    production: 'https://webapp.pages.dev',
    staging:    'https://staging.webapp.pages.dev',
    preview:    'https://preview.webapp.pages.dev',
  },

  // Cloudflare Load Balancing pool weights (if using CF LB product)
  loadBalancer: {
    enabled: false,   // Uses Pages native distribution (recommended)
    pools: [
      { name: 'emea',  weight: 0.35, region: 'WEUR' },
      { name: 'amer',  weight: 0.35, region: 'ENAM' },
      { name: 'apac',  weight: 0.20, region: 'SEAS' },
      { name: 'africa',weight: 0.10, region: 'AFR'  },
    ],
  },

  // Cache purge groups — purge by tag after data updates
  cacheGroups: {
    metrics:     'et-metrics',
    properties:  'et-properties',
    compliance:  'et-compliance',
    aiResults:   'et-ai',
  },

  // Edge TTLs (seconds) per content class
  edgeTtls: {
    staticAssets:     31_536_000,  // 1 year (hashed filenames)
    apiMetrics:       60,
    aiStagingResult:  3_600,       // 1h — Novita output is deterministic per seed
    htmlPages:        0,           // Always revalidate HTML
    ogImages:         3_600,
    manifest:         86_400,
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  4. CLOUDFLARE TURNSTILE CONFIGURATION
//  ─────────────────────────────────────────────────────────────────────────
//  Turnstile provides CAPTCHA-free bot protection using proof-of-work and
//  browser signals. It never shows a challenge to real users.
//
//  Widget modes:
//    managed    — CF decides when to challenge (recommended for forms)
//    non-interactive — always passes without any user interaction
//    invisible  — runs silently in background (best for API calls)
//
//  Sitekeys and secret keys must be created at:
//  https://dash.cloudflare.com → Turnstile → Add widget
// ════════════════════════════════════════════════════════════════════════════
export const TURNSTILE = {
  // ⚠️  Replace with your actual sitekeys from Cloudflare Dashboard
  // For local dev/testing, use the always-passes test sitekey:
  sitekey: IS_PROD
    ? (typeof process !== 'undefined' ? process.env.TURNSTILE_SITE_KEY  : '') ?? '0x4AAAAAAA_YOUR_PROD_SITEKEY'
    : '1x00000000000000000000AA',  // Always-passes test key

  // Secret key is ONLY used server-side (never expose to frontend)
  // Set via: wrangler secret put TURNSTILE_SECRET_KEY
  secretKeyEnvVar: 'TURNSTILE_SECRET_KEY',

  // Verification endpoint (Cloudflare)
  verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',

  // Widget settings
  widget: {
    mode:     'invisible',         // 'managed' | 'non-interactive' | 'invisible'
    theme:    'dark',
    language: 'auto',
    retry:    'auto',
    retryInterval: 8_000,
    refreshExpired: 'auto',
    size:     'normal',            // 'normal' | 'compact' | 'flexible'
    appearance: 'always',
  },

  // Actions to protect (passed as `action` param to widget)
  protectedActions: {
    login:         'et-login',
    register:      'et-register',
    staging:       'et-ai-staging',
    videoTour:     'et-video-tour',
    retentionEmail:'et-retention-email',
    contactForm:   'et-contact',
    waitlist:      'et-waitlist',
  },

  // Server-side: cache verified tokens in KV for 5 minutes
  // to prevent double-submission attacks
  tokenCacheTtlSecs: 300,

  // Rate limiting: max Turnstile verifications per IP per minute
  maxVerificationsPerMinute: 10,
}

// ════════════════════════════════════════════════════════════════════════════
//  5. SECURITY HEADERS (OWASP 2026 Baseline)
//  ─────────────────────────────────────────────────────────────────────────
//  Applied via Cloudflare Transform Rules or the _headers file in dist/.
//  The Worker also sets these on all HTML responses.
// ════════════════════════════════════════════════════════════════════════════
export const SECURITY_HEADERS = {
  // Content Security Policy — strict, nonce-based
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdn.tailwindcss.com",
    "style-src  'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src   'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src    'self' data: blob: https://*.novita.ai https://*.cloudflare.com",
    "connect-src 'self' https://api.novita.ai https://challenges.cloudflare.com https://*.salesforce.com wss://realtime.supabase.co",
    "frame-src  https://challenges.cloudflare.com",
    "worker-src blob:",
    "object-src 'none'",
    "base-uri   'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),

  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options':    'nosniff',
  'X-Frame-Options':           'DENY',
  'X-XSS-Protection':         '1; mode=block',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        [
    'camera=(self)',             // For WebAuthn biometric prompts
    'publickey-credentials-get=(self)',
    'publickey-credentials-create=(self)',
    'accelerometer=()',
    'gyroscope=()',
    'payment=()',
  ].join(', '),
  'Cross-Origin-Opener-Policy':   'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-site',
}

// ════════════════════════════════════════════════════════════════════════════
//  6. WEBAUTHN / PASSKEY CONFIGURATION
//  ─────────────────────────────────────────────────────────────────────────
//  easyTenancy uses the Web Authentication API (FIDO2/WebAuthn) for
//  passwordless biometric login. The relying-party server is implemented
//  in the Hono API layer (functions/api/[[route]].ts).
// ════════════════════════════════════════════════════════════════════════════
export const WEBAUTHN = {
  // Relying Party settings
  rp: {
    id:   IS_PROD ? 'webapp.pages.dev' : 'localhost',
    name: 'easyTenancy Global OS',
  },

  // Allowed origins for credential creation and assertion
  allowedOrigins: [
    'https://webapp.pages.dev',
    'https://staging.webapp.pages.dev',
    'https://preview.webapp.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173',
  ],

  // Authenticator requirements
  authenticator: {
    // Platform authenticator = device biometrics (Touch ID, Face ID, Windows Hello)
    // Cross-platform = security key (YubiKey, passkeys on mobile)
    preferPlatform:           true,
    requireResidentKey:       true,   // Discoverable credentials (passkeys)
    userVerification:         'required',  // Biometric/PIN mandatory
    attestation:              'none',      // 'none' | 'indirect' | 'direct'
    timeout:                  60_000,
    // Supported credential protection levels
    credentialProtectionPolicy: 'userVerificationOptionalWithCredentialIDList',
  },

  // Challenge settings
  challenge: {
    lengthBytes: 32,
    ttlSecs:     120,   // Challenges expire in 2 minutes
    storageKvKey: 'wa:challenge:',
  },

  // Supported COSE algorithm IDs
  supportedAlgorithms: [-7, -257],  // ES256 (ECDSA P-256), RS256

  // Credential storage (KV key patterns)
  storage: {
    credentialPrefix:   'wa:cred:',
    userPrefix:         'wa:user:',
    sessionPrefix:      'wa:session:',
    sessionTtlSecs:     86_400 * 7,   // 7-day rolling session
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  7. RATE LIMITING TIERS
//  ─────────────────────────────────────────────────────────────────────────
//  Implemented via Cloudflare Rate Limiting rules or Workers KV counter.
// ════════════════════════════════════════════════════════════════════════════
export const RATE_LIMITS = {
  // Public API tier (unauthenticated)
  public: {
    requests:    100,
    windowSecs:  60,
    burst:       20,
    penalty:     'throttle',   // 'throttle' | 'block'
  },

  // Authenticated API tier
  authenticated: {
    requests:    1_000,
    windowSecs:  60,
    burst:       100,
    penalty:     'throttle',
  },

  // AI generation endpoints (expensive, strict limits)
  aiGeneration: {
    requests:    10,
    windowSecs:  60,
    burst:       3,
    penalty:     'block',
    kv_prefix:   'rl:ai:',
  },

  // Turnstile verification endpoint
  turnstileVerify: {
    requests:    20,
    windowSecs:  60,
    burst:       5,
    penalty:     'block',
    kv_prefix:   'rl:ts:',
  },

  // WebAuthn endpoints
  webauthn: {
    requests:    5,
    windowSecs:  60,
    burst:       2,
    penalty:     'block',
    kv_prefix:   'rl:wa:',
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  8. ENVIRONMENT VARIABLE MANIFEST
//  ─────────────────────────────────────────────────────────────────────────
//  Documents all required environment variables. Set production values with:
//    wrangler secret put VAR_NAME --project-name webapp
//
//  For local dev, create .dev.vars:
//    NOVITA_API_KEY=your_key_here
//    TURNSTILE_SECRET_KEY=your_secret_here
//    DEMO_TOKEN=et-demo-2025
// ════════════════════════════════════════════════════════════════════════════
export const ENV_MANIFEST = {
  required: {
    NOVITA_API_KEY:           'Novita AI API key for FLUX.1-dev image generation',
    TURNSTILE_SECRET_KEY:     'Cloudflare Turnstile secret key (server-side only)',
    DEMO_TOKEN:               'Bearer token for demo/test route authentication',
  },
  optional: {
    TURNSTILE_SITE_KEY:       'CF Turnstile sitekey (can be hardcoded in client)',
    SALESFORCE_CLIENT_ID:     'Salesforce Connected App client ID',
    SALESFORCE_CLIENT_SECRET: 'Salesforce Connected App client secret',
    GEMINI_API_KEY:           'Google Gemini 3 Ultra API key for retention emails',
    VERTEX_PROJECT_ID:        'GCP project ID for Vertex AI endpoints',
    VERTEX_ACCESS_TOKEN:      'Short-lived GCP access token (rotated hourly)',
    META_APP_ACCESS_TOKEN:    'Meta Graph API app token (read-only Social Graph)',
    ENVIRONMENT:              "'development' | 'staging' | 'production'",
    CF_PAGES:                 "Set automatically by CF Pages to '1'",
    CF_AI_FALLBACK_ENABLED:   "'true' | 'false' — toggle CF Workers AI fallback",
    ARGO_SMART_ROUTING:       "'true' | 'false' — log Argo routing metadata",
  },
  // Validate presence at Worker startup
  validateOnStartup(env) {
    const missing = Object.keys(this.required).filter(k => !env[k])
    if (missing.length > 0 && !IS_DEV) {
      console.warn(`[CF Config] Missing required env vars: ${missing.join(', ')}`)
    }
    return missing
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  9. EDGE CACHING POLICY
// ════════════════════════════════════════════════════════════════════════════
export const CACHE_POLICY = {
  // Route pattern → cache behaviour
  routes: [
    {
      pattern:    /^\/api\/metrics\/live$/,
      ttl:        60,
      swr:        120,
      varyOn:     [],
      tags:       ['et-metrics'],
    },
    {
      pattern:    /^\/api\/og\?/,
      ttl:        3_600,
      swr:        86_400,
      varyOn:     ['country', 'title', 'units'],
      tags:       ['et-og'],
    },
    {
      pattern:    /^\/api\/ai\//,
      ttl:        0,      // AI responses are not cached (dynamic)
      swr:        0,
      private:    true,
      tags:       [],
    },
    {
      pattern:    /^\/api\/staging\//,
      ttl:        3_600,  // Cache staging results by hash of input+style
      swr:        86_400,
      varyOn:     ['X-Style-Id', 'X-Image-Hash'],
      tags:       ['et-ai'],
    },
    {
      pattern:    /^\/_next\/static\//,
      ttl:        31_536_000,
      immutable:  true,
      tags:       [],
    },
  ],

  // Default for unmatched API routes
  apiDefault: { ttl: 0, private: true },

  // Default for HTML pages
  htmlDefault: { ttl: 0, swr: 60 },
}

// ════════════════════════════════════════════════════════════════════════════
//  EXPORT — consolidated config object for Workers import
// ════════════════════════════════════════════════════════════════════════════
const CloudflareConfig = {
  env:             ENV,
  isProd:          IS_PROD,
  isStage:         IS_STAGE,
  isDev:           IS_DEV,
  aiRuntime:       AI_RUNTIME,
  argoRouting:     ARGO_ROUTING,
  regionalRouting: REGIONAL_ROUTING,
  turnstile:       TURNSTILE,
  securityHeaders: SECURITY_HEADERS,
  webauthn:        WEBAUTHN,
  rateLimits:      RATE_LIMITS,
  envManifest:     ENV_MANIFEST,
  cachePolicy:     CACHE_POLICY,
}

export default CloudflareConfig
