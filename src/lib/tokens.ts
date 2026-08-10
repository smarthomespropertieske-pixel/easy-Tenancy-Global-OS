/* ═══════════════════════════════════════════════════════════════
   easyTenancy — Brand Design Tokens
   Single source of truth for all brand colors, fonts, radii, etc.
═══════════════════════════════════════════════════════════════ */

// ── Color palette ────────────────────────────────────────────────
export const BRAND = {
  blue:       '#1A6DB5',
  blueDark:   '#0F4A80',
  blueLight:  '#2A9DE8',
  teal:       '#2A9D6E',
  ink:        '#0A0D14',
  inkMid:     '#111520',
  inkSoft:    '#1A1F2E',
  slate:      '#242938',
  mist:       '#8892A4',
  white:      '#F0EDE8',
  cream:      '#D4CEC4',
  green:      '#10b981',
  amber:      '#f59e0b',
  red:        '#ef4444',
  purple:     '#a78bfa',
  cyan:       '#39bff6',
} as const

// ── Gradient shorthands ──────────────────────────────────────────
export const GRADIENTS = {
  primary:  `linear-gradient(135deg, #1A6DB5 0%, #2A9DE8 60%, #2A9D6E 100%)`,
  hero:     `linear-gradient(135deg, #2563eb 0%, #39bff6 50%, #7c3aed 100%)`,
  heroR:    `linear-gradient(135deg, #7c3aed 0%, #39bff6 50%, #2563eb 100%)`,
  dark:     `linear-gradient(180deg, #0A0D14 0%, #111520 100%)`,
  glass:    `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
} as const

// ── Typography ───────────────────────────────────────────────────
export const FONTS = {
  head: "'Syne', ui-sans-serif, system-ui, sans-serif",
  body: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace",
} as const

export const FONT_WEIGHTS = {
  normal:    400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
  black:     900,
} as const

// ── Border radii ─────────────────────────────────────────────────
export const RADIUS = {
  sm:    '8px',
  md:    '14px',
  lg:    '20px',
  xl:    '28px',
  '2xl': '40px',
  full:  '9999px',
} as const

// ── Spacing scale (4-point grid) ─────────────────────────────────
export const SPACE = {
  1: '4px',  2: '8px',   3: '12px',  4: '16px',
  5: '20px', 6: '24px',  8: '32px',  10: '40px',
  12: '48px', 16: '64px', 20: '80px', 24: '96px',
} as const

// ── Shadows ──────────────────────────────────────────────────────
export const SHADOW = {
  glass:  '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  card:   '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
  glow:   '0 4px 24px rgba(26,109,181,0.4)',
  glowLg: '0 8px 32px rgba(26,109,181,0.5)',
} as const

// ── Glass surface helpers ────────────────────────────────────────
export const GLASS = {
  bg:      'rgba(255,255,255,0.06)',
  bgHover: 'rgba(255,255,255,0.10)',
  border:  'rgba(255,255,255,0.12)',
  blur:    'blur(12px)',
} as const

// ── Animation ────────────────────────────────────────────────────
export const EASE = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out:     'cubic-bezier(0, 0, 0.2, 1)',
  in:      'cubic-bezier(0.4, 0, 1, 1)',
} as const

// ── Breakpoints ──────────────────────────────────────────────────
export const BP = {
  sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
} as const

// ── Country accent colors (mirrors server.mjs ACCENT map) ────────
export const COUNTRY_ACCENT: Record<string, string> = {
  UK: '#1A6DB5',
  AE: '#f59e0b',
  KE: '#2A9D6E',
  US: '#2A9DE8',
  AU: '#a78bfa',
  CA: '#ef4444',
  SG: '#39bff6',
  ZA: '#10b981',
}

// ── CSS variable references (for inline style usage) ─────────────
export const CSS_VAR = {
  blue:      'var(--brand-blue)',
  blueDark:  'var(--brand-blue-dark)',
  blueLight: 'var(--brand-blue-light)',
  teal:      'var(--brand-teal)',
  ink:       'var(--ink)',
  inkMid:    'var(--ink-mid)',
  inkSoft:   'var(--ink-soft)',
  slate:     'var(--slate)',
  mist:      'var(--mist)',
  white:     'var(--white)',
  cream:     'var(--cream)',
  fontHead:  'var(--font-head)',
  fontBody:  'var(--font-body)',
  fontMono:  'var(--font-mono)',
} as const
