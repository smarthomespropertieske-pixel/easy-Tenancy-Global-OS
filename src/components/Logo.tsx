/* ═══════════════════════════════════════════════════════════════
   easyTenancy — Logo Component
   Variants: 'full' (icon + wordmark), 'icon' (icon only)
   Sizes:    'sm' | 'md' | 'lg' | 'xl'
═══════════════════════════════════════════════════════════════ */
import React from 'react'
import { BRAND, FONTS } from '../lib/tokens'

const SIZE_MAP = {
  sm:  { icon: 24,  fontSize: 15, gap: 7,  letterSpacing: '-0.3px' },
  md:  { icon: 32,  fontSize: 19, gap: 9,  letterSpacing: '-0.5px' },
  lg:  { icon: 44,  fontSize: 26, gap: 11, letterSpacing: '-0.7px' },
  xl:  { icon: 60,  fontSize: 36, gap: 14, letterSpacing: '-1px'   },
} as const

type Size    = keyof typeof SIZE_MAP
type Variant = 'full' | 'icon'

interface LogoProps {
  size?:      Size
  variant?:   Variant
  /** Light background — use dark ink text */
  light?:     boolean
  /** href for the anchor; pass false for a non-link div */
  href?:      string | false
  className?: string
  style?:     React.CSSProperties
  onClick?:   () => void
}

export default function Logo({
  size    = 'md',
  variant = 'full',
  light   = false,
  href    = '/',
  className,
  style,
  onClick,
}: LogoProps) {
  const { icon: iconSize, fontSize, gap, letterSpacing } = SIZE_MAP[size]

  const iconEl = (
    <span
      aria-hidden="true"
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          iconSize,
        height:         iconSize,
        borderRadius:   '28%',
        overflow:       'hidden',
        flexShrink:     0,
        background:     BRAND.ink,
        border:         '1px solid rgba(26,109,181,0.35)',
        boxShadow:      '0 2px 12px rgba(26,109,181,0.3)',
      }}
    >
      <img
        src="/logo-icon.png"
        alt=""
        width={iconSize}
        height={iconSize}
        loading="eager"
        decoding="async"
        style={{ width: iconSize, height: iconSize, objectFit: 'cover', display: 'block' }}
      />
    </span>
  )

  const wordmarkEl = variant === 'full' ? (
    <span
      style={{
        fontFamily:   FONTS.head,
        fontSize,
        fontWeight:   800,
        letterSpacing,
        lineHeight:   1,
        color:        light ? BRAND.ink : BRAND.white,
        userSelect:   'none',
      }}
    >
      easy<span style={{ color: BRAND.blue }}>Tenancy</span>
    </span>
  ) : null

  const wrapStyle: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    gap,
    textDecoration: 'none',
    cursor: onClick || href !== false ? 'pointer' : 'default',
    ...style,
  }

  const inner = <>{iconEl}{wordmarkEl}</>

  if (href === false) {
    return (
      <div
        className={className}
        style={wrapStyle}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        aria-label="easyTenancy"
      >
        {inner}
      </div>
    )
  }

  return (
    <a href={href} className={className} style={wrapStyle} onClick={onClick} aria-label="easyTenancy — Home">
      {inner}
    </a>
  )
}

// ── Convenience exports ──────────────────────────────────────────
export const NavLogo   = ({ onClick }: { onClick?: () => void }) =>
  <Logo size="md" variant="full" onClick={onClick} />

export const HeroLogo  = () =>
  <Logo size="xl" variant="full" href={false} />

export const IconMark  = ({ size = 'sm' as Size }) =>
  <Logo size={size} variant="icon" href={false} />

export const LogoLight = ({ size = 'md' as Size }) =>
  <Logo size={size} variant="full" light href={false} />
