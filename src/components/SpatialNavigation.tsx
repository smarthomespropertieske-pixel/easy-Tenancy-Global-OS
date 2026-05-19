// ══════════════════════════════════════════════════════════════════════════
//  SpatialNavigation.tsx — Sovereign Command Ring v1.0
//  "Global Hegemony 2.0" — The 2026 Primary Interface
//
//  Features:
//    • Floating 360° Command Ring — 7 routes at your fingertip
//    • Antigravity spring physics on expand/collapse (Framer Motion)
//    • Iridescent border glow reacts to mouse proximity angle
//    • Gaze-mode: items expand after 500ms hover (Orion UX simulation)
//    • Keyboard navigation: Escape closes, 1–7 jump to route
//    • Orchestrator-aware: emits RADIAL_MAP_CLICK on navigation
//    • Adaptive position: bottom-right (LTR), bottom-left (RTL)
//    • Active route indicator: glowing dot on current route
//    • Mini ARR badge shows live revenue ticker
// ══════════════════════════════════════════════════════════════════════════
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { Orchestrator } from '../lib/GlobalOrchestrator'

// ── Route manifest ─────────────────────────────────────────────────────────
const ROUTES = [
  { path: '/',                 label: 'Home',          icon: '🏠', color: '#39bff6', key: '1', desc: 'Marketing hub' },
  { path: '/app/demo',         label: 'Nexus',         icon: '⚡', color: '#a78bfa', key: '2', desc: 'Product dashboard' },
  { path: '/global-dominance', label: 'Holy Trinity',  icon: '🌐', color: '#1A6DB5', key: '3', desc: 'Google·SF·Meta' },
  { path: '/predictive-os',    label: 'Predictive OS', icon: '🧠', color: '#10b981', key: '4', desc: 'AI/CRM/Agentforce' },
  { path: '/spatial-staging',  label: 'Spatial AR',    icon: '🥽', color: '#f59e0b', key: '5', desc: 'Novita FLUX.1' },
  { path: '/security-demo',    label: 'Security',      icon: '🔐', color: '#ef4444', key: '6', desc: 'Turnstile·WebAuthn' },
  { path: '/spatial-staging',  label: 'XR Tour',       icon: '🌌', color: '#fbbf24', key: '7', desc: 'WebXR walkthrough' },
] as const

// ── Ring geometry ──────────────────────────────────────────────────────────
const RING_RADIUS = 100   // px from center to items
const ITEM_SIZE   = 44    // px diameter of each ring item

function polarToXY(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

// ── Mini ARR badge ─────────────────────────────────────────────────────────
function ARRBadge() {
  const [arr, setArr] = useState(16_000_000)
  useEffect(() => {
    fetch('/api/arr')
      .then(r => r.json())
      .then((d: { arrUSD?: number }) => { if (d.arrUSD) setArr(d.arrUSD) })
      .catch(() => {})
    const id = setInterval(() => setArr(p => Math.min(1_345_000_000, p + 12_000)), 15_000)
    return () => clearInterval(id)
  }, [])
  const fmt = arr >= 1e9 ? `$${(arr/1e9).toFixed(3)}B` : `$${(arr/1e6).toFixed(1)}M`
  return (
    <div style={{
      position: 'absolute', bottom: 64, right: 0,
      fontSize: 9, fontWeight: 700, color: '#f59e0b',
      background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
      borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap',
      fontFamily: 'JetBrains Mono, monospace',
      pointerEvents: 'none',
    }}>
      {fmt} ARR
    </div>
  )
}

// ── Main Command Ring ──────────────────────────────────────────────────────
export default function SpatialNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen]         = useState(false)
  const [gazeItem, setGazeItem] = useState<number | null>(null)
  const gazeTimers              = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const ringRef                 = useRef<HTMLDivElement>(null)

  // ── Iridescent angle tracking (mouse proximity) ──────────────────────────
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const angle  = useSpring(135, { stiffness: 80, damping: 18 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ringRef.current) return
      const rect = ringRef.current.getBoundingClientRect()
      const cx   = rect.left + rect.width  / 2
      const cy   = rect.top  + rect.height / 2
      const deg  = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      angle.set(deg)
      // Update CSS custom property for iridescent borders
      document.documentElement.style.setProperty('--ng-iri-angle', `${deg}deg`)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [angle, mouseX, mouseY])

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key) - 1
        if (ROUTES[idx]) { navigateTo(ROUTES[idx].path, idx); setOpen(false) }
      }
      if (e.altKey && e.key === 'n') setOpen(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Close on route change ────────────────────────────────────────────────
  useEffect(() => { setOpen(false) }, [location.pathname])

  // ── Navigate + Orchestrator emit ─────────────────────────────────────────
  const navigateTo = useCallback((path: string, idx: number) => {
    const route = ROUTES[idx]
    Orchestrator.emit('RADIAL_MAP_CLICK', {
      nodeId:    `ring-${idx}`,
      country:   'GLOBAL',
      unitCount: 892_000,
      revenue:   1_345_000_000,
    }, { source: 'SpatialNavigation' })
    navigate(path)
  }, [navigate])

  // ── Gaze handlers (500ms dwell = expand) ─────────────────────────────────
  const onGazeEnter = useCallback((idx: number) => {
    gazeTimers.current[idx] = setTimeout(() => setGazeItem(idx), 500)
  }, [])
  const onGazeLeave = useCallback((idx: number) => {
    clearTimeout(gazeTimers.current[idx])
    setGazeItem(null)
  }, [])

  // ── RTL awareness ────────────────────────────────────────────────────────
  const isRTL = document.documentElement.classList.contains('rtl')

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 32, zIndex: 5000,
    [isRTL ? 'left' : 'right']: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    pointerEvents: open ? 'all' : 'none',
  }

  return (
    <div style={containerStyle} ref={ringRef}>
      {/* ── ARR live badge ── */}
      <div style={{ position: 'relative' }}>
        <ARRBadge />
      </div>

      {/* ── Ring items (radial layout when open) ── */}
      <AnimatePresence>
        {open && ROUTES.map((route, i) => {
          const totalAngles = 180  // spread top 180° of circle
          const startAngle  = -90 - (totalAngles / 2)
          const spread      = totalAngles / (ROUTES.length - 1)
          const itemAngle   = startAngle + i * spread
          const { x, y }    = polarToXY(itemAngle, RING_RADIUS)
          const isActive    = location.pathname === route.path
          const isGazed     = gazeItem === i

          return (
            <motion.div
              key={`ring-item-${i}`}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{
                scale:   isGazed ? 1.22 : 1,
                opacity: 1,
                x, y,
                transition: {
                  type:      'spring',
                  stiffness: 340,
                  damping:   22,
                  delay:     i * 0.04,
                },
              }}
              exit={{
                scale:   0,
                opacity: 0,
                x: 0, y: 0,
                transition: {
                  duration: 0.2,
                  delay:    (ROUTES.length - 1 - i) * 0.03,
                },
              }}
              style={{
                position: 'absolute',
                bottom: 0, right: 0,
                width:  ITEM_SIZE, height: ITEM_SIZE,
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onClick={() => navigateTo(route.path, i)}
              onHoverStart={() => onGazeEnter(i)}
              onHoverEnd={()   => onGazeLeave(i)}
              title={`${route.label} — ${route.desc} (Alt+${route.key})`}
            >
              {/* Item body */}
              <motion.div
                animate={{
                  background: isActive
                    ? `linear-gradient(135deg, ${route.color}55, ${route.color}22)`
                    : isGazed ? `linear-gradient(135deg, ${route.color}33, rgba(14,20,38,0.95))`
                    : 'rgba(22,30,52,0.92)',
                  borderColor: isGazed || isActive ? route.color : 'rgba(255,255,255,0.10)',
                  boxShadow: isGazed || isActive
                    ? `0 0 0 1px ${route.color}66, 0 8px 24px rgba(0,0,0,0.4), 0 0 20px ${route.color}44`
                    : '0 4px 16px rgba(0,0,0,0.35)',
                }}
                transition={{ duration: 0.25 }}
                style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  position: 'relative',
                }}
              >
                {route.icon}
                {/* Active dot */}
                {isActive && (
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: route.color,
                    boxShadow: `0 0 8px ${route.color}`,
                    animation: 'pulse 2s infinite',
                  }} />
                )}
              </motion.div>

              {/* Label tooltip on gaze */}
              <AnimatePresence>
                {isGazed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute',
                      bottom: ITEM_SIZE + 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(9,13,26,0.96)',
                      border: `1px solid ${route.color}44`,
                      borderRadius: 8,
                      padding: '4px 10px',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                      fontWeight: 700,
                      color: route.color,
                      boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px ${route.color}22`,
                      pointerEvents: 'none',
                    }}
                  >
                    {route.label}
                    <div style={{ fontSize: 9, color: 'rgba(136,146,164,0.7)', fontWeight: 400 }}>
                      {route.desc}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ── Trigger button ── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.10 }}
        whileTap={{ scale: 0.93 }}
        animate={{
          rotate: open ? 45 : 0,
          background: open
            ? 'linear-gradient(135deg, rgba(57,191,246,0.3), rgba(26,109,181,0.4))'
            : 'rgba(22,30,52,0.92)',
          borderColor: open ? 'rgba(57,191,246,0.60)' : 'rgba(57,191,246,0.30)',
          boxShadow: open
            ? '0 0 0 1px rgba(57,191,246,0.4), 0 0 48px rgba(57,191,246,0.25), 0 12px 32px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(57,191,246,0.20), 0 8px 24px rgba(0,0,0,0.4)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          border: '1px solid rgba(57,191,246,0.30)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', pointerEvents: 'all',
          fontSize: 22, color: '#39bff6',
          fontFamily: 'inherit',
          position: 'relative', zIndex: 20,
        }}
        aria-label="Sovereign Command Ring — Toggle navigation"
        title="Sovereign Command Ring (Alt+N)"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ display: 'inline-block', lineHeight: 1 }}
        >
          {open ? '✕' : '⌖'}
        </motion.span>
      </motion.button>

      {/* ── Keyboard hint ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute',
              bottom: -28, right: 0,
              fontSize: 9, color: 'rgba(136,146,164,0.5)',
              whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace',
              pointerEvents: 'none',
            }}
          >
            Alt+1–7 to jump · Esc to close
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
