// ═══════════════════════════════════════════════════════════════════
//  useCardTilt — pointer-tracked parallax tilt for .card-v3
//  ─────────────────────────────────────────────────────────────────
//  Attaches mousemove + leave handlers to a ref element, writing
//    --c3-mx · --c3-my   → pixel coords for specular highlight
//    --c3-tilt-x · --c3-tilt-y → rotation degrees (max ±6°)
//
//  Honors prefers-reduced-motion (no-op).
//  Bundle: ~0.6 KB raw — single hook, zero deps.
//
//  Usage:
//    const ref = useCardTilt<HTMLDivElement>()
//    return <div ref={ref} className="card-v3" data-tier="violet">...</div>
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'

const MAX_TILT_DEG = 6

export function useCardTilt<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let raf = 0
    let lastX = 0
    let lastY = 0

    const apply = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const rx = (lastX - rect.left) / rect.width  // 0..1
      const ry = (lastY - rect.top)  / rect.height // 0..1
      // Tilt mapping — invert Y so cursor "lifts" the surface toward it
      const tiltY = (rx - 0.5) * 2 * MAX_TILT_DEG
      const tiltX = (0.5 - ry) * 2 * MAX_TILT_DEG
      el.style.setProperty('--c3-mx', `${rx * 100}%`)
      el.style.setProperty('--c3-my', `${ry * 100}%`)
      el.style.setProperty('--c3-tilt-x', `${tiltX.toFixed(2)}deg`)
      el.style.setProperty('--c3-tilt-y', `${tiltY.toFixed(2)}deg`)
    }

    const onMove = (e: PointerEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      el.style.setProperty('--c3-mx', '50%')
      el.style.setProperty('--c3-my', '50%')
      el.style.setProperty('--c3-tilt-x', '0deg')
      el.style.setProperty('--c3-tilt-y', '0deg')
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return ref
}

// ─── List variant — attach tilt to all elements matching a selector
// Useful when cards are rendered in a list and you don't want
// to call useCardTilt() per item. Pass `key` (any primitive) to
// force re-bind when the rendered DOM nodes change (e.g. tab swap).
export function useCardTiltList(
  selector: string = '[data-tilt="true"]',
  key: string | number = 0,
) {
  useEffect(() => {
    if (typeof window === 'undefined' ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector))
    const cleanups: Array<() => void> = []

    nodes.forEach((el) => {
      let raf = 0
      let lx = 0, ly = 0

      const apply = () => {
        raf = 0
        const r = el.getBoundingClientRect()
        const rx = (lx - r.left) / r.width
        const ry = (ly - r.top) / r.height
        const tiltY = (rx - 0.5) * 2 * MAX_TILT_DEG
        const tiltX = (0.5 - ry) * 2 * MAX_TILT_DEG
        el.style.setProperty('--c3-mx', `${rx * 100}%`)
        el.style.setProperty('--c3-my', `${ry * 100}%`)
        el.style.setProperty('--c3-tilt-x', `${tiltX.toFixed(2)}deg`)
        el.style.setProperty('--c3-tilt-y', `${tiltY.toFixed(2)}deg`)
      }
      const onMove = (e: PointerEvent) => {
        lx = e.clientX; ly = e.clientY
        if (!raf) raf = requestAnimationFrame(apply)
      }
      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        el.style.setProperty('--c3-mx', '50%')
        el.style.setProperty('--c3-my', '50%')
        el.style.setProperty('--c3-tilt-x', '0deg')
        el.style.setProperty('--c3-tilt-y', '0deg')
      }

      el.addEventListener('pointermove', onMove, { passive: true })
      el.addEventListener('pointerleave', onLeave, { passive: true })
      cleanups.push(() => {
        if (raf) cancelAnimationFrame(raf)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      })
    })

    return () => cleanups.forEach((c) => c())
  }, [selector, key])
}
