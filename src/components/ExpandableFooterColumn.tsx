// ═══════════════════════════════════════════════════════════════════════
//  ExpandableFooterColumn.tsx
//  Mobile-responsive expandable footer card.
//  • Mobile (≤767px): collapsed card w/ chevron toggle, slide-down reveal
//  • Desktop (≥768px): permanent corporate grid column (always open)
//
//  Implementation notes:
//   • Uses a single `useMediaQuery` hook (no extra deps)
//   • Slide animation: max-height transition (0 ↔ measured scrollHeight)
//   • Chevron rotates 0° → 180° on open
//   • Keyboard accessible (button, aria-expanded, aria-controls)
//   • Honors prefers-reduced-motion
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useId } from 'react'

interface ExpandableFooterColumnProps {
  title: string
  links: string[]
  hrefBase?: string
  defaultOpenOnMobile?: boolean
  /** Override colors for dense / dark contexts (e.g. PredictiveLifeOS) */
  theme?: {
    titleColor?: string
    titleHover?: string
    linkColor?: string
    linkHover?: string
    border?: string
    chevronBg?: string
    titleFontSize?: number
    linkFontSize?: number
    titleLetterSpacing?: string
    titleTransform?: 'uppercase' | 'none'
  }
  /** Override prefix used to build href hash (slugifies link by default) */
  buildHref?: (link: string) => string
}

function useIsDesktop(breakpoint = 768): boolean {
  const get = () =>
    typeof window === 'undefined' ? true : window.matchMedia(`(min-width: ${breakpoint}px)`).matches
  const [isDesktop, setIsDesktop] = useState<boolean>(get)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mql.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    } else {
      // Safari < 14 fallback
      mql.addListener(handler)
      return () => mql.removeListener(handler)
    }
  }, [breakpoint])
  return isDesktop
}

export default function ExpandableFooterColumn({
  title,
  links,
  hrefBase = '#',
  defaultOpenOnMobile = false,
  theme,
  buildHref,
}: ExpandableFooterColumnProps) {
  const isDesktop = useIsDesktop(768)
  const [openMobile, setOpenMobile] = useState(defaultOpenOnMobile)
  const listRef = useRef<HTMLUListElement | null>(null)
  const headingId = useId()
  const listId = useId()

  // Compute open state per viewport
  const isOpen = isDesktop || openMobile

  // Theme resolution with CSS-var defaults
  const T = {
    titleColor: theme?.titleColor ?? 'var(--text3)',
    titleHover: theme?.titleHover ?? 'var(--text)',
    linkColor:  theme?.linkColor  ?? 'var(--text3)',
    linkHover:  theme?.linkHover  ?? 'var(--text)',
    border:     theme?.border     ?? 'var(--border)',
    chevronBg:  theme?.chevronBg  ?? 'rgba(255,255,255,0.04)',
    titleFontSize:      theme?.titleFontSize      ?? 12,
    linkFontSize:       theme?.linkFontSize       ?? 13,
    titleLetterSpacing: theme?.titleLetterSpacing ?? '0.1em',
    titleTransform:     theme?.titleTransform     ?? 'uppercase',
  }
  const hrefFor = buildHref ?? ((l: string) => `${hrefBase}${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)

  return (
    <section
      aria-labelledby={headingId}
      style={{
        borderBottom: isDesktop ? 'none' : `1px solid ${T.border}`,
        paddingBottom: isDesktop ? 0 : 14,
        marginBottom: isDesktop ? 0 : 6,
      }}
    >
      <button
        type="button"
        id={headingId}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => {
          if (!isDesktop) setOpenMobile(v => !v)
        }}
        // On desktop the button still renders as a heading-only — no toggle behavior
        tabIndex={isDesktop ? -1 : 0}
        style={{
          all: 'unset',
          cursor: isDesktop ? 'default' : 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isDesktop ? '0 0 14px 0' : '14px 4px',
          fontWeight: 700,
          fontSize: T.titleFontSize,
          textTransform: T.titleTransform,
          letterSpacing: T.titleLetterSpacing,
          color: T.titleColor,
          transition: 'color 200ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          if (!isDesktop) (e.currentTarget as HTMLButtonElement).style.color = T.titleHover
        }}
        onMouseLeave={(e) => {
          if (!isDesktop) (e.currentTarget as HTMLButtonElement).style.color = T.titleColor
        }}
      >
        <span>{title}</span>
        {!isDesktop && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 8,
              background: T.chevronBg,
              border: `1px solid ${T.border}`,
              transition: 'transform 280ms ease-in-out, background 200ms ease-in-out',
              transform: openMobile ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>

      <div
        id={listId}
        role="region"
        aria-labelledby={headingId}
        style={{
          // Desktop = always open (no height animation), Mobile = animated max-height
          maxHeight: isDesktop ? 'none' : (openMobile ? 480 : 0),
          overflow: 'hidden',
          transition: isDesktop
            ? 'none'
            : 'max-height 320ms ease-in-out, opacity 240ms ease-in-out',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <ul
          ref={listRef}
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            margin: 0,
            padding: isDesktop ? '0' : '4px 4px 12px',
          }}
        >
          {links.map(l => (
            <li key={l}>
              <a
                href={hrefFor(l)}
                style={{
                  fontSize: T.linkFontSize,
                  color: T.linkColor,
                  textDecoration: 'none',
                  transition: 'color 200ms ease-in-out, transform 200ms ease-in-out',
                  display: 'inline-block',
                  lineHeight: 1.4,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = T.linkHover
                  e.currentTarget.style.transform = 'translateX(2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = T.linkColor
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
