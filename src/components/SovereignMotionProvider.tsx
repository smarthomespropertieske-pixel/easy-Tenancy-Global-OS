// ═══════════════════════════════════════════════════════════════════════
//  SovereignMotionProvider.tsx — Unified Motion Context
//  Zero-gravity spring page transitions, global iridescent angle updater,
//  gaze context provider, Web Audio API haptics, RTL/compact injector.
//
//  Features:
//    • AnimatePresence + Framer Motion zero-gravity variants
//    • Global mousemove → --ng-iri-angle CSS variable for iridescent borders
//    • GazeContext: register/unregister dwell targets (500ms default)
//    • Cultural layout: injects html.rtl + html.compact from locale/TZ
//    • playDealSound(): Web Audio chord burst on deal capture
//    • Orchestrator JURISDICTION_DETECTED event on cultural detection
// ═══════════════════════════════════════════════════════════════════════

import React, {
  createContext, useContext, useCallback, useEffect,
  useRef, useState, useMemo,
} from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Orchestrator } from '../lib/GlobalOrchestrator'

// ── Zero-Gravity Variants ────────────────────────────────────────────
const SOVEREIGN_VARIANTS = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.993,
    filter: 'blur(4px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      opacity: { duration: 0.38, ease: 'easeOut' },
      filter: { duration: 0.30, ease: 'easeOut' },
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.994,
    filter: 'blur(3px)',
    transition: {
      duration: 0.28,
      ease: [0.55, 0, 0.85, 0.05] as [number, number, number, number],
    },
  },
}

// ── RTL / Compact locale detection ───────────────────────────────────
// RTL locales: Arabic, Hebrew, Persian, Urdu, Pashto, Sindhi, Thaana
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv'])
// Compact mode timezones (East Asian UX density preference)
const COMPACT_TZ_PREFIXES = ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Taipei']

function detectCulturalLayout(): { rtl: boolean; compact: boolean; country: string; lang: string } {
  const lang = (navigator.language || 'en').split('-')[0].toLowerCase()
  const langRegion = (navigator.language || 'en-US').split('-')[1]?.toUpperCase() || 'US'
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  const rtl = RTL_LANGS.has(lang)
  const compact = COMPACT_TZ_PREFIXES.some(p => tz.startsWith(p.split('/')[0] + '/' + p.split('/')[1]))
  return { rtl, compact, country: langRegion, lang }
}

// ── Web Audio API — Deal Close Sound ─────────────────────────────────
let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return _audioCtx
}

export function playDealSound(): void {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // Victory chord: major triad + octave shimmer
    const CHORD_FREQS = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    const now = ctx.currentTime

    CHORD_FREQS.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const delay = i * 0.04 // stagger arpeggio

      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, now + delay)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + delay + 0.15) // subtle shimmer

      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.22 - i * 0.03, now + delay + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.75)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.8)
    })

    // Sub-bass thump
    const bass = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bass.type = 'sine'
    bass.frequency.setValueAtTime(65, now)
    bass.frequency.exponentialRampToValueAtTime(40, now + 0.3)
    bassGain.gain.setValueAtTime(0.35, now)
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    bass.connect(bassGain)
    bassGain.connect(ctx.destination)
    bass.start(now)
    bass.stop(now + 0.45)

  } catch {
    // Non-fatal — audio ctx may be blocked by browser policy until user gesture
  }
}

// ── Gaze Context ─────────────────────────────────────────────────────
export interface GazeTarget {
  id: string
  ref: React.RefObject<HTMLElement | null>
  dwell: number  // ms before gaze-active
  onGaze?: () => void
  onGazeLeave?: () => void
}

interface GazeContextValue {
  registerTarget: (target: GazeTarget) => void
  unregisterTarget: (id: string) => void
  activeGazeId: string | null
  playDealSound: () => void
}

const GazeContext = createContext<GazeContextValue>({
  registerTarget: () => {},
  unregisterTarget: () => {},
  activeGazeId: null,
  playDealSound,
})

export function useGazeContext(): GazeContextValue {
  return useContext(GazeContext)
}

// ── Cultural Context ──────────────────────────────────────────────────
interface CulturalContextValue {
  rtl: boolean
  compact: boolean
  country: string
  lang: string
}

const CulturalContext = createContext<CulturalContextValue>({
  rtl: false, compact: false, country: 'US', lang: 'en',
})

export function useCulturalContext(): CulturalContextValue {
  return useContext(CulturalContext)
}

// ── Sovereign Motion Provider ──────────────────────────────────────────
interface SovereignMotionProviderProps {
  children: React.ReactNode
}

export default function SovereignMotionProvider({ children }: SovereignMotionProviderProps) {
  const location = useLocation()

  // ── Gaze registry ───────────────────────────────────────────────
  const gazeTargets = useRef<Map<string, GazeTarget>>(new Map())
  const gazeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [activeGazeId, setActiveGazeId] = useState<string | null>(null)

  const registerTarget = useCallback((target: GazeTarget) => {
    gazeTargets.current.set(target.id, target)
  }, [])

  const unregisterTarget = useCallback((id: string) => {
    gazeTargets.current.delete(id)
    const t = gazeTimers.current.get(id)
    if (t) { clearTimeout(t); gazeTimers.current.delete(id) }
  }, [])

  // ── Global gaze pointer events (pointer-based, not mouse only) ───
  useEffect(() => {
    const handlePointerOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      gazeTargets.current.forEach((target, id) => {
        if (target.ref.current && target.ref.current.contains(el)) {
          if (!gazeTimers.current.has(id)) {
            const t = setTimeout(() => {
              setActiveGazeId(id)
              target.ref.current?.classList.add('gaze-active')
              target.onGaze?.()
              gazeTimers.current.delete(id)
            }, target.dwell)
            gazeTimers.current.set(id, t)
          }
        }
      })
    }

    const handlePointerOut = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      gazeTargets.current.forEach((target, id) => {
        if (target.ref.current && target.ref.current.contains(el)) {
          const t = gazeTimers.current.get(id)
          if (t) { clearTimeout(t); gazeTimers.current.delete(id) }
          setActiveGazeId(prev => prev === id ? null : prev)
          target.ref.current?.classList.remove('gaze-active')
          target.onGazeLeave?.()
        }
      })
    }

    window.addEventListener('pointerover', handlePointerOver, { passive: true })
    window.addEventListener('pointerout', handlePointerOut, { passive: true })
    return () => {
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerout', handlePointerOut)
    }
  }, [])

  // ── Global mousemove → --ng-iri-angle CSS variable ───────────────
  const iriAngle = useMotionValue(135)
  const springAngle = useSpring(iriAngle, { stiffness: 60, damping: 18, mass: 0.5 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const deg = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90
      iriAngle.set(deg)
    }
    window.addEventListener('mousemove', move, { passive: true })

    // Subscribe to spring and update CSS variable
    const unsub = springAngle.on('change', (v: number) => {
      document.documentElement.style.setProperty('--ng-iri-angle', `${v.toFixed(1)}deg`)
    })

    return () => {
      window.removeEventListener('mousemove', move)
      unsub()
    }
  }, [iriAngle, springAngle])

  // ── Cultural layout injection ─────────────────────────────────────
  const [cultural, setCultural] = useState<CulturalContextValue>({
    rtl: false, compact: false, country: 'US', lang: 'en',
  })

  useEffect(() => {
    const detected = detectCulturalLayout()
    setCultural(detected)

    const html = document.documentElement
    if (detected.rtl) {
      html.classList.add('rtl')
      html.setAttribute('dir', 'rtl')
      html.setAttribute('lang', detected.lang)
    } else {
      html.classList.remove('rtl')
      html.setAttribute('dir', 'ltr')
    }
    if (detected.compact) {
      html.classList.add('compact')
    } else {
      html.classList.remove('compact')
    }

    // Emit jurisdiction event to Orchestrator
    Orchestrator.emit('JURISDICTION_DETECTED', {
      country: detected.country,
      region: detected.lang,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
    })
  }, [])

  // ── Gaze context value (memoized) ─────────────────────────────────
  const gazeContextValue = useMemo<GazeContextValue>(() => ({
    registerTarget,
    unregisterTarget,
    activeGazeId,
    playDealSound,
  }), [registerTarget, unregisterTarget, activeGazeId])

  return (
    <CulturalContext.Provider value={cultural}>
      <GazeContext.Provider value={gazeContextValue}>
        {/* Sovereign page transition wrapper */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={SOVEREIGN_VARIANTS}
            style={{ minHeight: '100vh', position: 'relative' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </GazeContext.Provider>
    </CulturalContext.Provider>
  )
}
