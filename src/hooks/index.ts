// ── Custom hooks ──────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { parseDemoParams } from '../lib/demoData'
import { createMockWebSocket, type AIFeedEvent } from '../lib/wsStream'
import { trackEvent } from '../lib/analytics'

// Scroll reveal hook
export function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('vi')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.rv').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// Scroll progress hook
export function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('scroll-progress')
    if (!bar) return
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      bar.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%'
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
}

// Nav scroll hook
export function useNavScroll() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return scrolled
}

// Deep-link params hook
export function useDeepLinkParams() {
  const location = useLocation()
  return parseDemoParams(location.search)
}

// Live metrics hook — polls /api/metrics/live every 60s with BASE_METRICS fallback
interface Metrics {
  managers: number
  leases: number
  countries: number
  uptime: number
  roi: number
  lawsThisMonth: number
  complianceRate: number
  hoursaved: number
}

const BASE_METRICS: Metrics = {
  managers: 50000, leases: 2400000, countries: 120,
  uptime: 99.97, roi: 400, lawsThisMonth: 47,
  complianceRate: 100, hoursaved: 30
}

interface LiveMetricsAPIResponse {
  totalManagers?: number
  activeUnits?: number
  leases?: number
  countries?: number
  roiMultiplier?: number
  complianceRate?: number
}

async function fetchLiveMetrics(): Promise<Metrics> {
  const res = await fetch('/api/metrics/live', { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as LiveMetricsAPIResponse
  return {
    managers:       data.totalManagers      ?? BASE_METRICS.managers,
    leases:         data.leases             ?? BASE_METRICS.leases,
    countries:      data.countries          ?? BASE_METRICS.countries,
    uptime:         BASE_METRICS.uptime,
    roi:            data.roiMultiplier      ?? BASE_METRICS.roi,
    lawsThisMonth:  BASE_METRICS.lawsThisMonth,
    complianceRate: data.complianceRate     ?? BASE_METRICS.complianceRate,
    hoursaved:      BASE_METRICS.hoursaved,
  }
}

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(BASE_METRICS)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const live = await fetchLiveMetrics()
        if (!cancelled) setMetrics(live)
      } catch {
        // silently keep BASE_METRICS / previous value on any error
      }
    }

    // Fetch immediately on mount, then every 60 s
    poll()
    const t = setInterval(poll, 60_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  return metrics
}

// Animated counter hook
export function useAnimatedCounter(target: number, duration = 1800, deps: unknown[] = []) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * ease))
      if (p < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps])
  return value
}

// AI Feed hook
export function useAIFeed(maxItems = 8) {
  const [events, setEvents] = useState<AIFeedEvent[]>([])
  useEffect(() => {
    const stop = createMockWebSocket(evt => {
      setEvents(prev => [evt, ...prev].slice(0, maxItems))
    })
    return stop
  }, [maxItems])
  return events
}

// Toast hook
export function useToast() {
  const show = useCallback((msg: string) => {
    const c = document.getElementById('toast-container')
    if (!c) return
    const t = document.createElement('div')
    t.className = 'toast'
    t.innerHTML = `✅ ${msg}`
    c.appendChild(t)
    setTimeout(() => t.remove(), 3300)
  }, [])
  return show
}

// Mobile detection
export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// Track feature click wrapper
export function useTrackFeature() {
  return useCallback((name: string, extra = {}) => {
    trackEvent('feature_clicked', { feature: name, ...extra })
  }, [])
}

// ── useGazeInteraction ────────────────────────────────────────────────
// Orion-style 500ms dwell detection on a single element ref.
// Returns { gazeActive } and attaches pointer events to ref.current.
// Usage: const { gazeActive } = useGazeInteraction(myRef, 500)
export function useGazeInteraction(
  ref: React.RefObject<HTMLElement | null>,
  dwell = 500
): { gazeActive: boolean } {
  const [gazeActive, setGazeActive] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onEnter = () => {
      timer.current = setTimeout(() => {
        setGazeActive(true)
        el.classList.add('gaze-active')
      }, dwell)
    }
    const onLeave = () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      setGazeActive(false)
      el.classList.remove('gaze-active')
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [ref, dwell])

  return { gazeActive }
}

// ── useCulturalLayout ─────────────────────────────────────────────────
// Detects RTL/compact layout from browser locale + timezone.
// Injects html.rtl + html.compact classes and dir attribute.
// Usage: const { rtl, compact, country, lang } = useCulturalLayout()
const RTL_LANG_SET = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv'])
const COMPACT_TZ   = ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Taipei']

interface CulturalLayout {
  rtl:     boolean
  compact: boolean
  country: string
  lang:    string
  tz:      string
}

export function useCulturalLayout(): CulturalLayout {
  const [layout, setLayout] = useState<CulturalLayout>({
    rtl: false, compact: false, country: 'US', lang: 'en', tz: 'UTC',
  })

  useEffect(() => {
    const lang    = (navigator.language || 'en').split('-')[0].toLowerCase()
    const region  = (navigator.language || 'en-US').split('-')[1]?.toUpperCase() ?? 'US'
    const tz      = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const rtl     = RTL_LANG_SET.has(lang)
    const compact = COMPACT_TZ.some(p => tz.startsWith(p.split('/')[0] + '/' + p.split('/')[1]))

    const html = document.documentElement
    html.classList.toggle('rtl', rtl)
    html.classList.toggle('compact', compact)
    if (rtl) html.setAttribute('dir', 'rtl')
    else html.setAttribute('dir', 'ltr')
    html.setAttribute('lang', navigator.language || 'en')

    setLayout({ rtl, compact, country: region, lang, tz })
  }, [])

  return layout
}
