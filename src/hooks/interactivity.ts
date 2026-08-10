/* ═══════════════════════════════════════════════════════════════════════
   Premium interactivity hooks — $100B-feel
   • useMagnetic — attaches mouse-following translate to a ref'd element
   • useSpotlight — radial pointer gradient on a card
   • useScrollSpy — observes section ids and returns the active one
   • useScrollProgress — 0..1 page scroll, throttled
═══════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Magnetic CTA ─────────────────────────────────────────────────────────
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.45) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      el.style.setProperty('--mx', `${Math.max(-1, Math.min(1, dx * strength))}`)
      el.style.setProperty('--my', `${Math.max(-1, Math.min(1, dy * strength))}`)
    }
    const reset = () => {
      el.style.setProperty('--mx', '0')
      el.style.setProperty('--my', '0')
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', reset)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', reset)
    }
  }, [strength])

  return ref
}

// ── Spotlight (pointer-following radial gradient) ────────────────────────
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--px', `${e.clientX - rect.left}px`)
      el.style.setProperty('--py', `${e.clientY - rect.top}px`)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return ref
}

// ── Scroll spy — observe a list of section ids, return active one ────────
export function useScrollSpy(ids: string[], options: { rootMargin?: string; threshold?: number } = {}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || ids.length === 0) return
    const rootMargin = options.rootMargin ?? '-40% 0% -55% 0%'
    const threshold = options.threshold ?? 0

    // Wait for hydration / sections to mount
    const attach = () => {
      const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
      if (els.length === 0) return null

      const obs = new IntersectionObserver(
        entries => {
          // Pick the most-visible intersecting entry
          const visible = entries.filter(e => e.isIntersecting)
          if (visible.length > 0) {
            const top = visible.sort((a, b) =>
              (a.boundingClientRect.top) - (b.boundingClientRect.top)
            )[0]
            setActiveId(top.target.id)
          }
        },
        { rootMargin, threshold }
      )
      els.forEach(el => obs.observe(el))
      return obs
    }

    let obs = attach()
    // Re-attach after a tick in case sections render lazily
    const t = window.setTimeout(() => {
      if (!obs) obs = attach()
    }, 400)

    return () => {
      window.clearTimeout(t)
      obs?.disconnect()
    }
  }, [ids.join('|')])  // join id list to a stable dep

  return activeId
}

// ── Scroll progress (0..1) — throttled to rAF ────────────────────────────
export function useScrollProgress(): number {
  const [p, setP] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = (document.documentElement.scrollHeight - window.innerHeight) || 1
        const v = Math.min(1, Math.max(0, window.scrollY / max))
        setP(v)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return p
}
