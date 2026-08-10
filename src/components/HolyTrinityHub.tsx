// ═══════════════════════════════════════════════════════════════════════
//  HolyTrinityHub.tsx — Meta → Salesforce → Google integration data-flow
//  ─────────────────────────────────────────────────────────────────────
//  Three-node unidirectional pipeline with animated SVG paths.
//  Sits directly under the Platform KPI ticker on HomePage.
//
//  PRD modules: M2 (visual component) + M4 (tailwind-friendly styling,
//  300ms ease-in-out hover, premium <100ms feel — pure CSS, zero
//  framer-motion layout thrash, single rAF SVG dash pulse).
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MetaGlyph, SalesforceGlyph, GoogleGlyph, ArrowRight } from '../lib/icons'

interface TrinityNode {
  id:        'meta' | 'salesforce' | 'google'
  brand:     string         // Vendor name shown as eyebrow micro-label
  title:     string         // Step title
  copy:      string         // Body text (verbatim from PRD)
  accent:    string         // Vendor brand color
  glow:      string         // Box-shadow tint
  icon:      React.ReactNode
  badge:     string         // Pipeline-stage descriptor pill
  emphasis?: 'standard' | 'central'  // central → highlighted Salesforce node
  /** Jurisdictional data-processing tooltip (PRD §4c) */
  jurisdictionTip?: string
}

// ─────────────────────────────────────────────────────────────────────
//  Brand glyphs sourced from the central icon library (src/lib/icons.tsx)
//  Refined size: 48px wide — better optical balance inside .icon-tile.is-lg
// ─────────────────────────────────────────────────────────────────────
const MetaIcon       = () => <MetaGlyph       size={48} />
const SalesforceIcon = () => <SalesforceGlyph size={48} />
const GoogleIcon     = () => <GoogleGlyph     size={48} />

// ─────────────────────────────────────────────────────────────────────
//  Pipeline data — verbatim copy from PRD §2
// ─────────────────────────────────────────────────────────────────────
const NODES: TrinityNode[] = [
  {
    id: 'meta',
    brand:  'Meta',
    title:  'Tenant Acquisition Pipeline',
    copy:   'Leasing lead captured via Instagram Ad.',
    accent: '#0082FB',
    glow:   'rgba(0,130,251,0.32)',
    icon:   <MetaIcon />,
    badge:  'Capture',
    emphasis: 'standard',
    jurisdictionTip: 'GDPR-compliant EU ad routing · POPIA for ZA · zero PII leaves the WhatsApp Business API edge.',
  },
  {
    id: 'salesforce',
    brand:  'Salesforce',
    title:  'Enterprise CRM & Lease Engine',
    copy:   'AI auto-screens and drafts contract based on local jurisdiction rules.',
    accent: '#00A1E0',
    glow:   'rgba(0,161,224,0.42)',
    icon:   <SalesforceIcon />,
    badge:  'Process',
    emphasis: 'central',
    jurisdictionTip: '120 jurisdictions · 47 regulatory updates / month auto-applied to lease templates · SOC 2 + ISO 27001 audited.',
  },
  {
    id: 'google',
    brand:  'Google',
    title:  'Asset Discovery & SEO Pipeline',
    copy:   'Unit marked live on Google Maps and localized search indexing the second the lease is signed.',
    accent: '#4285F4',
    glow:   'rgba(66,133,244,0.32)',
    icon:   <GoogleIcon />,
    badge:  'Deliver',
    emphasis: 'standard',
    jurisdictionTip: 'Localized indexing across 120 markets · hreflang + schema.org/Residence · multilingual canonical URLs for EU · UAE · KE.',
  },
]

// ─────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function HolyTrinityHub() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="trinity-hub-title"
      style={{
        background: 'linear-gradient(180deg, rgba(10,13,20,0) 0%, rgba(10,13,20,0.55) 50%, rgba(10,13,20,0) 100%)',
        padding: '64px 0',
      }}
    >
      <div className="inner">
        {/* ── Section eyebrow + heading ───────────────────────────────── */}
        <div className="tc rv" style={{ marginBottom: 40 }}>
          <div
            className="badge"
            style={{ display: 'inline-flex', marginBottom: 14, alignItems: 'center', gap: 6 }}
          >
            <span className="badge-dot" />
            Holy Trinity 2026 · Live Integrations
          </div>
          <h2 className="sec-title">
            Meta · Salesforce · Google —{' '}
            <span className="grad-text">one unified pipeline</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 720, margin: '14px auto 0', lineHeight: 1.6 }}>
            easyTenancy doesn't sit beside the world's dominant platforms — it lives
            inside them. Every lead, contract, and listing flows through a single
            unidirectional event spine.
          </p>
        </div>

        {/* ── Pipeline grid ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            position: 'relative',
            alignItems: 'stretch',
          }}
        >
          {NODES.map((node, i) => {
            const isCentral = node.emphasis === 'central'
            const isHovered = hoveredId === node.id
            const isLast    = i === NODES.length - 1

            return (
              <React.Fragment key={node.id}>
                <article
                  className={`card-v2${isCentral ? ' is-ring' : ''}`}
                  data-tier={node.id}
                  data-emphasis={isCentral ? 'central' : undefined}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(node.id)}
                  onBlur={() => setHoveredId(null)}
                  tabIndex={0}
                  role="group"
                  aria-label={`${node.brand} — ${node.title}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    outline: 'none',
                  }}
                >
                  {/* Central-node ribbon */}
                  {isCentral && (
                    <span
                      aria-hidden="true"
                      className="icon-chip"
                      style={{
                        position: 'absolute',
                        top: 14, right: 14,
                        background: `${node.accent}26`,
                        color: node.accent,
                        borderColor: `${node.accent}55`,
                        zIndex: 3,
                      }}
                    >
                      <span style={{ fontSize: 7 }}>◆</span> Core System
                    </span>
                  )}

                  {/* Active data-pulse dot */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 14, left: 14,
                      width: 8, height: 8, borderRadius: 999,
                      background: node.accent,
                      boxShadow: `0 0 12px ${node.accent}`,
                      animation: reduceMotion ? undefined : 'trinityPulse 2.2s ease-in-out infinite',
                    }}
                  />

                  {/* Step badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                    <span
                      className="icon-chip"
                      style={{
                        color: node.accent,
                        background: `${node.accent}1A`,
                        borderColor: `${node.accent}40`,
                      }}
                    >
                      <span className="t-mono" style={{ fontSize: 9, opacity: 0.85 }}>
                        0{i + 1}
                      </span>
                      <span style={{ width: 1, height: 8, background: `${node.accent}55` }} />
                      {node.badge}
                    </span>
                  </div>

                  {/* Brand icon + name lockup */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span
                      className="icon-tile is-lg"
                      data-tier={node.id}
                      style={{ flexShrink: 0 }}
                    >
                      {node.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="t-eyebrow"
                        style={{ color: node.accent, marginBottom: 2 }}
                      >
                        {node.brand}
                      </div>
                      <div
                        className="t-h3"
                        style={{ color: 'var(--text)', fontWeight: 700 }}
                      >
                        {node.title}
                      </div>
                    </div>
                  </div>

                  {/* Active glowing ring overlay — appears on hover/focus */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: -1,
                      borderRadius: 18,
                      pointerEvents: 'none',
                      border: `1.5px solid ${node.accent}`,
                      opacity: isHovered ? 1 : 0,
                      filter: `drop-shadow(0 0 10px ${node.accent})`,
                      transition: 'opacity 280ms ease-in-out',
                      animation: isHovered && !reduceMotion ? 'trinityGlow 1.8s ease-in-out infinite' : 'none',
                    }}
                  />

                  {/* Pipeline copy (verbatim) + jurisdictional hover tooltip */}
                  <div
                    className="trinity-tip-host"
                    style={{ position: 'relative', flexGrow: 1 }}
                  >
                    <p
                      className="t-body"
                      style={{
                        color: 'var(--text2)',
                        margin: 0,
                      }}
                    >
                      {node.copy}
                    </p>
                    {node.jurisdictionTip && (
                      <span
                        role="tooltip"
                        className="trinity-tip-bubble"
                        style={{
                          position: 'absolute',
                          left: 0, right: 0,
                          bottom: 'calc(100% + 10px)',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(8,12,20,0.96)',
                          border: `1px solid ${node.accent}55`,
                          boxShadow: `0 18px 36px rgba(0,0,0,0.45), 0 0 24px ${node.glow}`,
                          color: 'var(--text)',
                          fontSize: 11.5, lineHeight: 1.45,
                          letterSpacing: '0.01em',
                          zIndex: 10,
                          opacity: 0,
                          transform: 'translateY(4px)',
                          pointerEvents: 'none',
                          transition: 'opacity 220ms ease-in-out, transform 220ms ease-in-out',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: node.accent,
                          marginBottom: 4,
                        }}>
                          Jurisdictional Data Layer
                        </span>
                        <br />
                        {node.jurisdictionTip}
                      </span>
                    )}
                  </div>

                  {/* Foot signal — verb pulse strip */}
                  <div
                    className="t-mono"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 10.5, color: 'var(--text3)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: 999,
                        background: node.accent,
                        boxShadow: `0 0 8px ${node.accent}`,
                      }}
                    />
                    <span>
                      {node.id === 'meta'       && 'event.lead.captured'}
                      {node.id === 'salesforce' && 'agent.contract.drafted'}
                      {node.id === 'google'     && 'listing.indexed · loop closed'}
                    </span>
                    {node.id !== 'google' && (
                      <ArrowRight size={11} stroke={1.8} style={{ color: node.accent }} />
                    )}
                  </div>
                </article>

                {/* ── Connector — visible only on desktop wide layouts ── */}
                {!isLast && (
                  <Connector accent={node.accent} accentNext={NODES[i + 1].accent} reduce={!!reduceMotion} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* ── Footer micro-summary — loop hint back to portfolio health ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginTop: 28,
            fontSize: 12, color: 'var(--text3)',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.04em',
          }}
        >
          <motion.span
            initial={{ opacity: 0.55 }}
            animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
            style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: '#10b981', boxShadow: '0 0 10px #10b981' }}
          />
          <span>loop closed · portfolio health Δ +6.2% · 48M predictions/day</span>
        </div>
      </div>

      {/* Pulse keyframes (scoped, single declaration — Tailwind-free) */}
      <style>{`
        @keyframes trinityPulse {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%      { transform: scale(1.6);  opacity: 0.35; }
        }
        @keyframes trinityDash {
          to { stroke-dashoffset: -32; }
        }
        /* Active glowing ring — pulses outward on hover */
        @keyframes trinityGlow {
          0%, 100% { opacity: 1;    filter: brightness(1)    drop-shadow(0 0 10px currentColor); }
          50%      { opacity: 0.65; filter: brightness(1.35) drop-shadow(0 0 22px currentColor); }
        }
        /* Hover-revealed jurisdictional tooltip */
        .trinity-tip-host:hover .trinity-tip-bubble,
        .trinity-tip-host:focus-within .trinity-tip-bubble {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .trinity-tip-bubble { transition: none !important; }
        }
      `}</style>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────
//  Connector — animated SVG flow between two nodes
//  Hidden when CSS grid wraps to multi-row mobile (parent gap handles it)
// ─────────────────────────────────────────────────────────────────────
function Connector({ accent, accentNext, reduce }: { accent: string; accentNext: string; reduce: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        // Connector occupies its own grid cell, expressing flow between siblings.
        // Hidden on narrow viewports where the grid stacks vertically.
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
      }}
      className="trinity-connector"
    >
      <svg width="100%" height="56" viewBox="0 0 160 56" preserveAspectRatio="none" style={{ maxWidth: 200 }}>
        <defs>
          <linearGradient id={`grad-${accent}-${accentNext}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={accent}     stopOpacity="0.85" />
            <stop offset="100%" stopColor={accentNext} stopOpacity="0.85" />
          </linearGradient>
          <filter id={`glow-${accent}-${accentNext}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
        {/* Static rail — gentle curved bezier */}
        <path d="M 4 28 C 50 14, 110 42, 156 28"
              stroke={`url(#grad-${accent}-${accentNext})`}
              strokeWidth="1.6" fill="none" opacity="0.38" strokeLinecap="round" />
        {/* Marching ants — curved flow */}
        <path
          d="M 4 28 C 50 14, 110 42, 156 28"
          stroke={`url(#grad-${accent}-${accentNext})`}
          strokeWidth="2.4"
          fill="none"
          strokeDasharray="5 9"
          strokeLinecap="round"
          style={{
            animation: reduce ? undefined : 'trinityDash 1.6s linear infinite',
          }}
        />
        {/* Anchor dots at each end */}
        <circle cx="4"   cy="28" r="2.2" fill={accent}     opacity="0.9" />
        <circle cx="156" cy="28" r="2.6" fill={accentNext} opacity="1" />
        {/* Arrowhead */}
        <path d="M 148 23 L 156 28 L 148 33"
              stroke={accentNext} strokeWidth="2" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
