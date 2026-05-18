// ═══════════════════════════════════════════════════════════════════════
//  TurnstileWidget.tsx
//  easyTenancy Global OS — Cloudflare Turnstile Bot Protection (2026)
//
//  Implements invisible/managed Cloudflare Turnstile CAPTCHA-free widget.
//  Zero friction for real users. Blocks bots silently using browser
//  signals and proof-of-work — no checkbox or challenge ever shown.
//
//  Usage:
//    <TurnstileWidget onVerified={token => submitForm(token)} />
//
//  The widget loads the CF Turnstile script, renders the widget,
//  and calls onVerified(token) when a token is ready.
//  The token must then be verified server-side via POST /api/turnstile/verify.
// ═══════════════════════════════════════════════════════════════════════

import React, {
  useEffect, useRef, useState, useCallback, useId,
  forwardRef, useImperativeHandle,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Turnstile global type ─────────────────────────────────────────────
declare global {
  interface Window {
    turnstile?: {
      render:  (container: string | HTMLElement, options: TurnstileOptions) => string
      remove:  (widgetId: string) => void
      reset:   (widgetId: string) => void
      execute: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
    }
    onloadTurnstileCallback?: () => void
  }
}

interface TurnstileOptions {
  sitekey:         string
  callback?:       (token: string) => void
  'error-callback'?: (code: string) => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  theme?:          'light' | 'dark' | 'auto'
  language?:       string
  size?:           'normal' | 'compact' | 'flexible'
  appearance?:     'always' | 'execute' | 'interaction-only'
  execution?:      'render' | 'execute'
  action?:         string
  cData?:          string
  retry?:          'auto' | 'never'
  'retry-interval'?: number
  'refresh-expired'?: 'auto' | 'manual' | 'never'
  tabindex?:       number
}

// ── Turnstile sitekeys ────────────────────────────────────────────────
// Test key: always passes — use in development
// Real key: must be from Cloudflare Dashboard → Turnstile
const TEST_SITEKEY  = '1x00000000000000000000AA'   // Always passes
const BLOCK_SITEKEY = '2x00000000000000000000AB'   // Always blocks (testing)

// ── Component props ───────────────────────────────────────────────────
export interface TurnstileWidgetProps {
  /** Cloudflare Turnstile sitekey. Defaults to test key in dev. */
  sitekey?:         string
  /** Called when a valid Turnstile token is ready */
  onVerified:       (token: string) => void
  /** Called when verification fails */
  onError?:         (code: string) => void
  /** Called when token expires (should re-submit) */
  onExpired?:       () => void
  /** Turnstile action name (scoped validation on server) */
  action?:          string
  /** 'invisible' mode hides the widget entirely (best for API calls) */
  mode?:            'invisible' | 'managed' | 'visible-badge'
  /** Visual theme */
  theme?:           'dark' | 'light' | 'auto'
  /** Size variant */
  size?:            'normal' | 'compact' | 'flexible'
  /** Show status badge below widget */
  showStatus?:      boolean
  /** Auto-execute on mount (for invisible mode) */
  autoExecute?:     boolean
  /** Custom class */
  className?:       string
}

export interface TurnstileHandle {
  /** Manually trigger the Turnstile challenge */
  execute:  () => void
  /** Reset the widget (clears token) */
  reset:    () => void
  /** Get current token if available */
  getToken: () => string | undefined
}

// ── Script loader (singleton) ─────────────────────────────────────────
let scriptLoaded   = false
let scriptLoading  = false
const loadCallbacks: (() => void)[] = []

function loadTurnstileScript(onLoad: () => void): void {
  if (scriptLoaded) { onLoad(); return }
  loadCallbacks.push(onLoad)
  if (scriptLoading) return

  scriptLoading = true
  window.onloadTurnstileCallback = () => {
    scriptLoaded = true
    scriptLoading = false
    loadCallbacks.forEach(cb => cb())
    loadCallbacks.length = 0
  }

  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit'
  script.async = true
  script.defer = true
  script.onerror = () => {
    scriptLoading = false
    console.error('[Turnstile] Failed to load script')
  }
  document.head.appendChild(script)
}

// ── Status badge component ────────────────────────────────────────────
type TurnstileStatus = 'idle' | 'loading' | 'verifying' | 'verified' | 'error' | 'expired'

function StatusBadge({ status }: { status: TurnstileStatus }) {
  const configs: Record<TurnstileStatus, { color: string; bg: string; border: string; icon: string; text: string }> = {
    idle:      { color: '#8892A4', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)', icon: '🔒', text: 'Protected by Turnstile' },
    loading:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  icon: '⟳', text: 'Loading security check…' },
    verifying: { color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',  icon: '⟳', text: 'Verifying browser…' },
    verified:  { color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  icon: '✓', text: 'Bot protection passed' },
    error:     { color: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',   icon: '✕', text: 'Security check failed' },
    expired:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  icon: '↻', text: 'Check expired — refreshing' },
  }

  const c = configs[status]
  const isSpinning = status === 'loading' || status === 'verifying' || status === 'expired'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '5px 12px', borderRadius: 20,
        background: c.bg, border: `1px solid ${c.border}`,
        fontSize: 11, fontWeight: 600, color: c.color,
        marginTop: 6,
      }}
    >
      <span style={{
        display: 'inline-block',
        animation: isSpinning ? 'spin 1s linear infinite' : undefined,
        fontSize: 12,
      }}>{c.icon}</span>
      {c.text}
      {status === 'verified' && (
        <span style={{
          fontSize: 9, fontWeight: 700, color: '#34d399',
          background: 'rgba(16,185,129,0.12)', padding: '1px 6px', borderRadius: 10,
          border: '1px solid rgba(16,185,129,0.2)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>CF Turnstile</span>
      )}
    </motion.div>
  )
}

// ── Main TurnstileWidget component ────────────────────────────────────
const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({
    sitekey      = TEST_SITEKEY,
    onVerified,
    onError,
    onExpired,
    action       = 'et-default',
    mode         = 'invisible',
    theme        = 'dark',
    size         = 'normal',
    showStatus   = true,
    autoExecute  = true,
    className,
  }, ref) {
    const containerId = useId().replace(/:/g, '')
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef  = useRef<string | null>(null)
    const tokenRef     = useRef<string | undefined>(undefined)
    const [status, setStatus] = useState<TurnstileStatus>('idle')

    // Render the widget
    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile) return
      // Clean up existing widget
      if (widgetIdRef.current) {
        try { window.turnstile?.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = null
      }

      const appearance = mode === 'invisible'     ? 'execute'
                       : mode === 'visible-badge' ? 'always'
                       : 'interaction-only'

      setStatus('verifying')

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        action,
        theme,
        size,
        appearance,
        execution:  mode === 'invisible' ? 'execute' : 'render',
        retry:      'auto',
        'retry-interval': 8_000,
        'refresh-expired': 'auto',
        callback: (token: string) => {
          tokenRef.current = token
          setStatus('verified')
          onVerified(token)
        },
        'error-callback': (code: string) => {
          tokenRef.current = undefined
          setStatus('error')
          onError?.(code)
        },
        'expired-callback': () => {
          tokenRef.current = undefined
          setStatus('expired')
          onExpired?.()
        },
        'timeout-callback': () => {
          setStatus('error')
          onError?.('timeout')
        },
      })

      // Auto-execute invisible widget
      if (autoExecute && mode === 'invisible' && widgetIdRef.current && window.turnstile) {
        setTimeout(() => {
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.execute(widgetIdRef.current)
          }
        }, 100)
      }
    }, [sitekey, action, theme, size, mode, autoExecute, onVerified, onError, onExpired])

    // Load script + render
    useEffect(() => {
      setStatus('loading')
      loadTurnstileScript(() => {
        renderWidget()
      })

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.remove(widgetIdRef.current) } catch {}
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sitekey])

    // Imperative handle
    useImperativeHandle(ref, () => ({
      execute: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.execute(widgetIdRef.current)
        }
      },
      reset: () => {
        tokenRef.current = undefined
        setStatus('idle')
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
      getToken: () => tokenRef.current,
    }), [])

    return (
      <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {/* Turnstile widget mount point */}
        <div
          ref={containerRef}
          id={`ts-${containerId}`}
          style={{ minHeight: mode === 'invisible' ? 0 : 65 }}
        />
        {/* Status badge */}
        <AnimatePresence mode="wait">
          {showStatus && (
            <StatusBadge key={status} status={status} />
          )}
        </AnimatePresence>
      </div>
    )
  }
)

// ── Convenience variants ──────────────────────────────────────────────

/**
 * InvisibleTurnstile — fires silently on mount, no UI shown.
 * Best for AI generation forms, waitlist, API submissions.
 */
export function InvisibleTurnstile({
  onVerified, onError, action = 'et-default',
}: Pick<TurnstileWidgetProps, 'onVerified' | 'onError' | 'action'>) {
  return (
    <TurnstileWidget
      mode="invisible"
      showStatus={false}
      autoExecute={true}
      onVerified={onVerified}
      onError={onError}
      action={action}
    />
  )
}

/**
 * TurnstileLoginGuard — wraps a form and verifies Turnstile before submit.
 * Shows status badge. Used on the login / waitlist forms.
 */
export function TurnstileLoginGuard({
  children,
  onTokenReady,
  action = 'et-login',
}: {
  children:     React.ReactNode
  onTokenReady: (token: string) => void
  action?:      string
}) {
  const [token, setToken] = useState<string | null>(null)

  return (
    <div>
      <TurnstileWidget
        mode="invisible"
        showStatus={true}
        autoExecute={true}
        action={action}
        onVerified={t => {
          setToken(t)
          onTokenReady(t)
        }}
        onExpired={() => setToken(null)}
        onError={() => setToken(null)}
      />
      <div style={{ opacity: token ? 1 : 0.6, transition: 'opacity 0.3s', pointerEvents: token ? 'auto' : 'none' }}>
        {children}
      </div>
      {!token && (
        <p style={{ fontSize: 11, color: '#8892A4', marginTop: 6 }}>
          Waiting for bot-protection check…
        </p>
      )}
    </div>
  )
}

/**
 * useTurnstileToken — hook for headless Turnstile usage.
 * Returns { token, status, reset } for custom form integrations.
 */
export function useTurnstileToken(action = 'et-default') {
  const [token,  setToken]  = useState<string | null>(null)
  const [status, setStatus] = useState<TurnstileStatus>('idle')
  const widgetRef = useRef<TurnstileHandle>(null)

  const reset = useCallback(() => {
    setToken(null)
    setStatus('idle')
    widgetRef.current?.reset()
  }, [])

  const WidgetElement = (
    <TurnstileWidget
      ref={widgetRef}
      mode="invisible"
      showStatus={false}
      autoExecute={true}
      action={action}
      onVerified={t => { setToken(t); setStatus('verified') }}
      onError={() => setStatus('error')}
      onExpired={() => { setToken(null); setStatus('expired') }}
    />
  )

  return { token, status, reset, WidgetElement }
}

export default TurnstileWidget
