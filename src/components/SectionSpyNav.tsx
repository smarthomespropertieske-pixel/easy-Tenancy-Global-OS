/* ═══════════════════════════════════════════════════════════════════════
   SectionSpyNav — floating pill rail at bottom of viewport that:
   • lists in-page sections (auto-revealed when user scrolls past hero)
   • highlights the active section with a glow dot + gradient background
   • supports keyboard nav (←/→)
   • hidden on routes that don't pass it sections
═══════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useState, useCallback } from 'react'
import { useScrollSpy } from '../hooks/interactivity'
import { trackEvent } from '../lib/analytics'

export interface SpyItem {
  id: string
  label: string
  icon?: string
}

interface Props {
  items: SpyItem[]
  /** Hide rail until user has scrolled this many px from top (default 600) */
  showAfter?: number
}

export default function SectionSpyNav({ items, showAfter = 600 }: Props) {
  const [visible, setVisible] = useState(false)
  const ids = items.map(i => i.id)
  const activeId = useScrollSpy(ids, { rootMargin: '-30% 0% -55% 0%' })

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > showAfter)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [showAfter])

  const go = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    trackEvent('section_navigated', { section: id, source: 'spy_nav' })
    // Account for fixed nav (~70px)
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  // Keyboard nav (← / →)
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const idx = activeId ? ids.indexOf(activeId) : 0
      const nextIdx = e.key === 'ArrowRight'
        ? Math.min(ids.length - 1, idx + 1)
        : Math.max(0, idx - 1)
      if (nextIdx !== idx) go(ids[nextIdx])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, activeId, ids, go])

  return (
    <nav
      className={`spy-nav${visible ? ' visible' : ''}`}
      role="navigation"
      aria-label="In-page navigation"
    >
      {items.map(it => (
        <button
          key={it.id}
          className="spy-nav-item"
          aria-current={activeId === it.id ? 'true' : undefined}
          onClick={() => go(it.id)}
        >
          <span className="dot" aria-hidden="true" />
          {it.icon && <span aria-hidden="true">{it.icon}</span>}
          {it.label}
        </button>
      ))}
    </nav>
  )
}
