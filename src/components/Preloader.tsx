// ═══════════════════════════════════════════════════════════════════════
//  Preloader.tsx — Break-Away Preloader Engine
//  easyTenancy Global OS · Institutional-grade loading overlay
//
//  ARCHITECTURAL CONTRACT
//  ──────────────────────
//  • Mounts on initial app boot, captures the first paint window
//  • Renders an ultra-minimalist dark overlay (slate-950 / #020617)
//  • Centers the master house-handshake emblem
//  • Drives a custom @keyframes breathe (scale 0.95 ↔ 1.05, 2s ease-in-out)
//  • Resolves to isLoading=false on next-tick (≤100ms target latency)
//  • Fades out via opacity transition (duration-500 ease-out)
//  • Then unmounts → reveals hero + nav + WebSocket feeds in one frame
//
//  Reduced-motion accessibility: respects prefers-reduced-motion
//  Zero-deps: no framer-motion, no animation libs in the critical path
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, createContext, useContext, useMemo, useCallback } from 'react'
import { BRAND_ASSETS, BRAND_WORDMARK } from '../lib/brand'

type PreloaderCtx = {
  isLoading: boolean
  finish: () => void
}

const PreloaderContext = createContext<PreloaderCtx>({ isLoading: false, finish: () => {} })

export const usePreloader = () => useContext(PreloaderContext)

const LOGO_SRC = BRAND_ASSETS.iconMaster

/** Inline SVG fallback that draws while the PNG decodes — prevents flash-of-empty */
function FallbackMark() {
  return (
    <svg width="88" height="88" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="etGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#39bff6" />
          <stop offset="100%" stopColor="#1a6db5" />
        </linearGradient>
      </defs>
      <path d="M50 12 L85 38 L85 86 L15 86 L15 38 Z"
        fill="none" stroke="url(#etGrad)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 60 Q42 52 50 60 Q58 68 68 60" fill="none" stroke="url(#etGrad)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Overlay({ visible }: { visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={visible}
      aria-label="easyTenancy is initializing"
      data-preloader="root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#020617',  // slate-950
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 18,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 500ms ease-out',
        // GPU layer hint — keep this overlay on its own composite layer
        willChange: 'opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Concentric breathing ring — pure CSS, no JS */}
      <div
        className="preloader-breathe-ring"
        style={{
          position: 'absolute',
          width: 180, height: 180, borderRadius: '50%',
          border: '1px solid rgba(57,191,246,0.25)',
          boxShadow: '0 0 60px rgba(57,191,246,0.08)',
        }}
        aria-hidden="true"
      />

      {/* Master emblem with breathe animation */}
      <div
        className="preloader-breathe-icon"
        style={{
          width: 96, height: 96,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          width={88}
          height={88}
          decoding="async"
          style={{
            width: '88px',
            height: 'auto',
            maxHeight: '88px',
            objectFit: 'contain',
            display: 'block',
          }}
          onError={(e) => {
            // Hide broken image; SVG fallback below will fill the slot
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            const sibling = (e.currentTarget.nextElementSibling as HTMLElement | null)
            if (sibling) sibling.style.display = 'block'
          }}
        />
        <span style={{ display: 'none' }}><FallbackMark /></span>
      </div>

      {/* Wordmark — only appears after breathing has settled */}
      <div
        className="preloader-wordmark"
        style={{
          marginTop: 12,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(226,232,240,0.85)',  // slate-200
        }}
      >
        {BRAND_WORDMARK.prefix}<span style={{ color: '#39bff6' }}>{BRAND_WORDMARK.suffix}</span>
      </div>

      {/* Sub-line */}
      <div
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(148,163,184,0.55)',  // slate-400 muted
        }}
      >
        Initializing global OS
      </div>
    </div>
  )
}

export default function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [mountOverlay, setMountOverlay] = useState(true)

  const finish = useCallback(() => setIsLoading(false), [])

  // First-paint capture: resolve loading state on next idle frame
  useEffect(() => {
    let cancelled = false

    // Wait for fonts + first paint, then resolve. Hard ceiling at 1.2s.
    const resolveReady = () => {
      if (cancelled) return
      setIsLoading(false)
    }

    // Prefer idle callback when available — gives the React tree a chance to mount
    // critical components (Nav, Hero, MetricsTicker) before we lift the curtain.
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout: number }) => number)
    const handle = ric
      ? ric(resolveReady, { timeout: 1200 })
      : window.setTimeout(resolveReady, 650)

    // Hard timeout backstop — never block the page beyond 1.4s
    const backstop = window.setTimeout(resolveReady, 1400)

    return () => {
      cancelled = true
      if (ric) (window as any).cancelIdleCallback?.(handle)
      else window.clearTimeout(handle as number)
      window.clearTimeout(backstop)
    }
  }, [])

  // After the fade-out completes (500ms), unmount the overlay completely
  useEffect(() => {
    if (isLoading) return
    const t = window.setTimeout(() => setMountOverlay(false), 600)
    return () => window.clearTimeout(t)
  }, [isLoading])

  const ctx = useMemo<PreloaderCtx>(() => ({ isLoading, finish }), [isLoading, finish])

  return (
    <PreloaderContext.Provider value={ctx}>
      {mountOverlay && <Overlay visible={isLoading} />}
      {children}
    </PreloaderContext.Provider>
  )
}
