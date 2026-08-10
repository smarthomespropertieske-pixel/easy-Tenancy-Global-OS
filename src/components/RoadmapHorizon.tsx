// ════════════════════════════════════════════════════════════════════════
//  RoadmapHorizon.tsx — v4.4 honest "what's coming" canvas
//  ─────────────────────────────────────────────────────────────────────
//  Surfaces Tier-2 features (5, 6, F7-F10) as honest "Building / Shipping /
//  Roadmap" cards. NO faked dashboards. Every card → waitlist or preview shell.
//
//  Reuses LAYER 40 CSS — pure HTML/CSS card pattern, zero new icon registry.
//  All CTAs trigger 'roadmap_card_clicked' analytics event.
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from '../lib/icons'
import { trackEvent } from '../lib/analytics'
import { useCardTiltList } from '../hooks/useCardTilt'

type Horizon = 'building' | 'shipping' | 'roadmap'

interface RoadmapItem {
  id:       string
  horizon:  Horizon
  title:    string
  subtitle: string
  summary:  string
  cta:      string
  href:     string
  signals:  string[]               // S1-S6 market signals
  lifecycle?: string[]             // optional lifecycle dots (for Works card)
  badges?:  string[]               // optional partner pills (for IoT card)
}

const ITEMS: RoadmapItem[] = [
  // ── BUILDING Q1 2026 ────────────────────────────────────────────
  {
    id:       'works',
    horizon:  'building',
    title:    'easyWorks · Contractor Marketplace',
    subtitle: '£49/mo · M-Pesa · PayStack · Stripe · STC Pay · Tap',
    summary:  'AI 90-second job matching · background-checked contractors · escrow · auto-suspend below 3.5★. Avg landlord saves £340/qtr in call-out fees.',
    cta:      'Join contractor waitlist',
    href:     '/?waitlist=works',
    signals:  ['S3', 'S5'],
    lifecycle: ['Dispatched', 'En Route', 'On Site', 'Approved'],
  },
  {
    id:       'multilingual',
    horizon:  'building',
    title:    'Multilingual Tenant Portal',
    subtitle: '30 languages · RTL native · WCAG 2.2 AA',
    summary:  'Arabic · Farsi · Hebrew · Urdu · Mandarin · Hindi · Swahili and 23 more. Native right-to-left layouts. Lease docs, notices, support — all localized.',
    cta:      'Preview translations',
    href:     '/?waitlist=multilingual',
    signals:  ['S2', 'S6'],
  },

  // ── SHIPPING Q2 2026 ────────────────────────────────────────────
  {
    id:       'noi',
    horizon:  'shipping',
    title:    'NOI Command Centre',
    subtitle: 'Bloomberg-grade portfolio dashboard · Workers AI',
    summary:  '5 KPI tiles above the fold · NOI waterfall · 60-day vacancy prediction · rent-vs-market · stress test · one-click investor PDF.',
    cta:      'Preview the empty shell',
    href:     '/app/portfolio',
    signals:  ['S1', 'S4'],
  },
  {
    id:       'insurance',
    horizon:  'shipping',
    title:    'easyProtect · Embedded Insurance',
    subtitle: 'Rent guarantee · Buildings · Contents · Boiler · Legal',
    summary:  'Multi-underwriter quote engine routes each policy to the best rate. Lloyd\'s syndicates · UK · EU · MENA underwriters live.',
    cta:      'Join insurance waitlist',
    href:     '/?waitlist=insurance',
    signals:  ['S3', 'S5'],
  },

  // ── ROADMAP Q3 2026 ─────────────────────────────────────────────
  {
    id:       'iot',
    horizon:  'roadmap',
    title:    'easyMonitor · IoT Hub',
    subtitle: 'Smart meters · void-period heating · auto-EPC',
    summary:  'Live integrations with the UK\'s biggest device + utility ecosystems. Auto-track EPC ratings, void heating costs, and tenant-side meter reads.',
    cta:      'Join IoT pilot',
    href:     '/?waitlist=iot',
    signals:  ['S2', 'S6'],
    badges:   ['Switchee', 'Nest', 'Hive', 'Octopus'],
  },
  {
    id:       'investor',
    horizon:  'roadmap',
    title:    'Investor Pitch Dashboard',
    subtitle: 'Live traction · MRR · NRR · cohort retention',
    summary:  'Password-protected live data room for the easyTenancy Series Seed. Real-time KPI tape · burn · runway · investor-grade exhibits.',
    cta:      'Request access',
    href:     '/investor',
    signals:  ['S1', 'S4'],
  },
]

function HorizonLabel({ h }: { h: Horizon }) {
  const map: Record<Horizon, string> = {
    building: '◐ Building Q1 2026',
    shipping: '◑ Shipping Q2 2026',
    roadmap:  '◯ Roadmap Q3 2026',
  }
  return <span className="roadmap-card-horizon">{map[h]}</span>
}

export default function RoadmapHorizon() {
  // v4.5 — activate parallax tilt on every .roadmap-card.card-v3
  useCardTiltList('.roadmap-card[data-tilt="true"]')

  return (
    <section
      id="roadmap"
      className="roadmap-section"
      aria-labelledby="roadmap-title"
    >
      <div className="roadmap-inner">
        <div className="roadmap-head rv">
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
            <span className="badge-dot" />
            Roadmap · What's coming
          </div>
          <h2 id="roadmap-title" className="t-display-2026 t-balance">
            Six features. <span className="t-kinetic-soft">Three horizons.</span>
            <br />
            <span style={{ color: 'var(--text2)', fontWeight: 600, fontSize: '0.72em' }}>
              Honest dates. Live data or empty state — never vapor.
            </span>
          </h2>
        </div>

        <div className="roadmap-toolbar rv rv1">
          <div className="roadmap-legend">
            <span className="roadmap-legend-dot is-building">Building Q1</span>
            <span className="roadmap-legend-dot is-shipping">Shipping Q2</span>
            <span className="roadmap-legend-dot is-roadmap">Roadmap Q3</span>
          </div>
          <a
            href="https://github.com/easytenancy/changelog"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            onClick={() => trackEvent('changelog_clicked', { location: 'roadmap' })}
          >
            <Sparkles size={10} stroke={2} />
            full changelog →
          </a>
        </div>

        <div className="roadmap-grid rv rv2">
          {ITEMS.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.href}
              className="roadmap-card card-v3"
              data-horizon={item.horizon}
              data-tilt="true"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.05, duration: 0.32 }}
              onClick={() => trackEvent('roadmap_card_clicked', {
                feature: item.id,
                horizon: item.horizon,
              })}
            >
              <HorizonLabel h={item.horizon} />
              <h3 className="roadmap-card-title">{item.title}</h3>
              <div className="roadmap-card-subtitle">{item.subtitle}</div>

              {/* Lifecycle demo (Works only) */}
              {item.lifecycle && (
                <div className="roadmap-lifecycle">
                  {item.lifecycle.map((step, j) => (
                    <React.Fragment key={step}>
                      <span className={`roadmap-lifecycle-step${j <= 1 ? ' is-active' : ''}`} />
                      {j === item.lifecycle!.length - 1 && (
                        <span className="roadmap-lifecycle-label">{step}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Partner badges (IoT only) */}
              {item.badges && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {item.badges.map(b => (
                    <span
                      key={b}
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        background: 'rgba(167,139,250,0.08)',
                        color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.20)',
                        borderRadius: 4,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <div className="roadmap-card-summary">{item.summary}</div>

              <div className="roadmap-card-foot">
                <span className="roadmap-card-cta">
                  {item.cta} <ArrowRight size={11} stroke={2} />
                </span>
                <span className="roadmap-card-signals">
                  {item.signals.map(s => (
                    <span key={s} className="roadmap-card-signal">{s}</span>
                  ))}
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Tier 1 callout — building NOW, separate gating */}
        <div className="roadmap-tier1-callout rv rv3">
          <Sparkles size={14} stroke={2} style={{ color: '#39bff6', flexShrink: 0 }} />
          <span>
            <strong>Tier 1 · Agentic AI Property Manager</strong> — 5 autonomous agents
            (Compliance, Renewal, Arrears, Maintenance, Voice) building now. Awaiting deploy confirmation.
            Open <kbd className="roadmap-tier1-callout-kbd">⌘K</kbd> and search "agents".
          </span>
        </div>
      </div>
    </section>
  )
}
