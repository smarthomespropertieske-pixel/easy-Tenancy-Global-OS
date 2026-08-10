// ═══════════════════════════════════════════════════════════════════════
//  brand.ts — Centralized Brand Asset Path Wrapper
//  Single source of truth for every logo / favicon / wordmark path
//  used across the React tree + Cloudflare Pages static asset router.
//
//  Why this exists:
//   • Eliminates string drift between components (Logo, Preloader, Nav)
//   • Avoids broken paths during build-time route mapping
//   • Provides typed helpers for favicon size matrix injection
// ═══════════════════════════════════════════════════════════════════════

/** Base path under /public served by Cloudflare Pages */
const BRAND_BASE = '/assets/brand'
const FAVICON_BASE = '/assets/favicons'

export const BRAND_ASSETS = {
  /** Master house-handshake emblem (PNG32 RGBA, transparent BG) */
  iconMaster: `${BRAND_BASE}/optimized_house_handshake.png`,
  /** Full wordmark lockup (500×500 PNG) */
  wordmarkPng: `${BRAND_BASE}/easytenancy_wordmark.png`,
  /** Apple touch icon — used by iOS home-screen pin */
  appleTouchIcon: '/icons/icon-180.png',
} as const

/** Cross-browser favicon matrix — exact 5-size pack */
export const FAVICON_SIZES = [16, 32, 48, 64, 128] as const
export type FaviconSize = (typeof FAVICON_SIZES)[number]

export const faviconPath = (size: FaviconSize): string =>
  `${FAVICON_BASE}/favicon-${size}x${size}.png`

/** Typography lockup — always rendered as React (never hard-coded text) */
export const BRAND_WORDMARK = {
  prefix: 'easy',
  suffix: 'Tenancy',
  /** Full text for SSR / aria-label / document.title */
  full: 'easyTenancy',
} as const
