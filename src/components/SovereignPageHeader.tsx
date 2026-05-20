// ═══════════════════════════════════════════════════════════════════════
//  SovereignPageHeader.tsx — Reusable Neural-Glass page hero header
//  Used on every route to ensure consistent branding, live stats,
//  and clear page identification with section progress indicator.
//
//  Props:
//    title      — Main H1 text (supports JSX for gradient spans)
//    subtitle   — Muted description line
//    badge      — Top status pill text (e.g. "Live · Agentforce Running")
//    badgeColor — Dot/text colour for badge
//    stats      — Array of { label, value, icon, color } KPI pills
//    actions    — Array of { label, href, primary } CTA buttons
//    gradient   — Custom gradient string for title highlight
//    sections   — Array of section names for progress scrollspy
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export interface PageStat {
  label: string
  value: string
  icon: string
  color?: string
}

export interface PageAction {
  label: string
  href: string
  primary?: boolean
  onClick?: () => void
}

export interface PageSection {
  id: string
  label: string
}

interface SovereignPageHeaderProps {
  title:        string | React.ReactNode
  subtitle?:    string
  badge?:       string
  badgeColor?:  string
  stats?:       PageStat[]
  actions?:     PageAction[]
  gradient?:    string
  sections?:    PageSection[]
  compact?:     boolean  // Smaller layout for dashboard-style pages
}

// ── Section progress scrollspy ─────────────────────────────────────
function SectionProgress({ sections }: { sections: PageSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])

  return (
    <div style={{
      display: 'flex', gap: 6, alignItems: 'center',
      padding: '8px 0', overflowX: 'auto',
    }}>
      {sections.map((s, i) => (
        <React.Fragment key={s.id}>
          <a
            href={`#${s.id}`}
            style={{
              fontSize: 11, fontWeight: 700,
              color: active === s.id ? 'var(--cyan)' : 'var(--mist)',
              textDecoration: 'none', whiteSpace: 'nowrap',
              padding: '3px 10px', borderRadius: 20,
              background: active === s.id ? 'rgba(57,191,246,0.12)' : 'transparent',
              border: active === s.id ? '1px solid rgba(57,191,246,0.3)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              display: 'inline-block', width: 14, height: 14, lineHeight: '14px',
              borderRadius: '50%', textAlign: 'center',
              background: active === s.id ? 'rgba(57,191,246,0.25)' : 'rgba(255,255,255,0.06)',
              fontSize: 9, marginRight: 6, fontWeight: 900,
              color: active === s.id ? 'var(--cyan)' : 'var(--mist)',
            }}>{i + 1}</span>
            {s.label}
          </a>
          {i < sections.length - 1 && (
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────
export default function SovereignPageHeader({
  title,
  subtitle,
  badge,
  badgeColor = '#2A9DE8',
  stats = [],
  actions = [],
  gradient = 'linear-gradient(135deg, #1A6DB5 0%, #39bff6 50%, #2A9D8F 100%)',
  sections,
  compact = false,
}: SovereignPageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: compact ? '28px 0 20px' : '64px 0 48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Neural-Glass background orbs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          top: -200, left: -100,
          background: 'radial-gradient(circle, rgba(26,109,181,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          bottom: -150, right: -50,
          background: 'radial-gradient(circle, rgba(42,157,143,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Animated grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(57,191,246,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(57,191,246,0.025) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 40% 50%, black 20%, transparent 80%)',
        }} />
      </div>

      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>

        {/* Badge pill */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: compact ? 12 : 20 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 16px',
              background: `${badgeColor}15`,
              border: `1px solid ${badgeColor}40`,
              borderRadius: 999,
              fontSize: 11, fontWeight: 700,
              color: badgeColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: badgeColor,
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }} />
              {badge}
            </span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            fontSize: compact
              ? 'clamp(22px,3vw,34px)'
              : 'clamp(32px,5vw,64px)',
            fontWeight: 900,
            fontFamily: 'var(--font-head)',
            letterSpacing: compact ? '-1px' : '-2px',
            lineHeight: 1.08,
            margin: 0,
            marginBottom: subtitle ? 12 : (stats.length || actions.length ? 24 : 0),
            color: 'var(--white)',
          }}
        >
          {typeof title === 'string' ? (
            <span style={{
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {title}
            </span>
          ) : title}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: compact ? 14 : 'clamp(15px,2vw,19px)',
              color: 'var(--mist)',
              maxWidth: 680,
              lineHeight: 1.65,
              margin: `0 0 ${stats.length || actions.length ? 28 : 0}px`,
            }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Stats row */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'flex', gap: 12, flexWrap: 'wrap',
              marginBottom: actions.length ? 24 : 0,
            }}
          >
            {stats.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 900,
                    fontFamily: 'var(--font-head)',
                    color: s.color ?? 'var(--cyan)',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--mist)', fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          >
            {actions.map((a, i) => (
              <a
                key={i}
                href={a.href}
                onClick={a.onClick}
                className={a.primary ? 'btn-primary' : 'btn-ghost'}
                style={{ fontSize: 13, padding: '10px 22px', textDecoration: 'none' }}
              >
                {a.label}
              </a>
            ))}
          </motion.div>
        )}

        {/* Section scrollspy */}
        {sections && sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}
          >
            <SectionProgress sections={sections} />
          </motion.div>
        )}

      </div>
    </div>
  )
}
