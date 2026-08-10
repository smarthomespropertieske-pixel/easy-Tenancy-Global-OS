/* ═══════════════════════════════════════════════════════════════════════
   MonopolyDashboard — the section that signals $100B trajectory math:
   • Growth loops (k-factor cards)
   • Network effects (value-per-user curves)
   • Distribution channels (Holy Trinity reach)
   • TAM / SAM / SOM scoreboard
   All numbers + insights pulled from src/lib/monopoly.ts
═══════════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GROWTH_LOOPS, NETWORK_EFFECTS, DISTRIBUTION, TAM_SAM_SOM,
  projectGrowth, compactUsd, type GrowthLoop,
} from '../lib/monopoly'
import { useSpotlight } from '../hooks/interactivity'
import { trackEvent } from '../lib/analytics'

// ─ Sub: Growth-loop card with hover insight
function LoopCard({ loop }: { loop: GrowthLoop }) {
  const ref = useSpotlight<HTMLDivElement>()
  const projected = projectGrowth(loop, 90)
  return (
    <div
      ref={ref}
      className="glass-card spotlight"
      style={{
        padding: '20px 18px',
        borderRadius: 16,
        position: 'relative',
        borderTop: `2px solid ${loop.color}55`,
        minHeight: 200,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">{loop.icon}</span>
        <span className="t-caps" style={{ color: loop.color, fontSize: 10 }}>{loop.channel}</span>
      </div>
      <div className="t-h3" style={{ fontSize: 17, marginBottom: 8, color: 'var(--text)' }}>
        {loop.name}
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
        <div>
          <div className="t-eyebrow" style={{ fontSize: 9 }}>k-factor</div>
          <div className="t-number" style={{ fontSize: 24, color: loop.k > 1 ? '#6ee7b7' : 'var(--text2)' }}>
            {loop.k.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="t-eyebrow" style={{ fontSize: 9 }}>cycle</div>
          <div className="t-number" style={{ fontSize: 24, color: 'var(--text)' }}>{loop.cycleDays}d</div>
        </div>
        <div>
          <div className="t-eyebrow" style={{ fontSize: 9 }}>90d → ×</div>
          <div className="t-number" style={{ fontSize: 24, color: loop.color }}>
            {(projected / 1000).toFixed(1)}k
          </div>
        </div>
      </div>
      <p className="t-small" style={{ color: 'var(--text3)', lineHeight: 1.55, flex: 1 }}>
        {loop.insight}
      </p>
    </div>
  )
}

export default function MonopolyDashboard() {
  const [tab, setTab] = useState<'loops' | 'effects' | 'distribution' | 'market'>('loops')

  return (
    <section id="growth-engine" aria-labelledby="monopoly-title" style={{
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'linear-gradient(180deg, var(--card) 0%, var(--bg) 100%)',
    }}>
      <div className="inner">
        {/* Header */}
        <div className="tc rv" style={{ marginBottom: 36 }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
            <span className="badge-dot" />Marketing Monopoly
          </div>
          <h2 id="monopoly-title" className="t-display">
            Compounding <span className="t-grad">distribution flywheel</span>
          </h2>
          <p className="t-lead mxa tc" style={{ marginTop: 14 }}>
            Six growth loops · four network effects · three trillion-dollar distribution channels.
            <br />The math behind a 2030 SOM of <span className="t-mono" style={{ color: '#6ee7b7', fontWeight: 700 }}>{compactUsd(TAM_SAM_SOM.som.usd)}</span>.
          </p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Monopoly metrics"
          style={{
            display: 'inline-flex', gap: 4,
            margin: '0 auto 28px', padding: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)', borderRadius: 999,
            width: '100%', maxWidth: 540, justifyContent: 'center', flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'loops',        label: '🔄 Growth loops',  icon: '🔄' },
            { id: 'effects',      label: '🌐 Network',       icon: '🌐' },
            { id: 'distribution', label: '📡 Distribution',  icon: '📡' },
            { id: 'market',       label: '📊 TAM·SAM·SOM',   icon: '📊' },
          ].map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => { setTab(t.id as typeof tab); trackEvent('tab_switched', { tab: t.id, location: 'monopoly' }) }}
                style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  fontFamily: 'var(--font-body)', letterSpacing: '-0.005em', cursor: 'pointer',
                  color: active ? '#fff' : 'var(--text2)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(42,157,232,0.35), rgba(167,139,250,0.28))'
                    : 'transparent',
                  border: 'none',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.10), 0 4px 16px rgba(42,157,232,0.20)' : 'none',
                  transition: 'all 240ms ease',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── Growth loops ── */}
        {tab === 'loops' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
          >
            {GROWTH_LOOPS.map(l => <LoopCard key={l.id} loop={l} />)}
          </motion.div>
        )}

        {/* ── Network effects ── */}
        {tab === 'effects' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
          >
            {NETWORK_EFFECTS.map(n => (
              <div key={n.id} className="glass-card" style={{ padding: '20px 18px', borderRadius: 16, minHeight: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }} aria-hidden="true">{n.icon}</span>
                  <span className="t-caps" style={{ color: '#a78bfa', fontSize: 10 }}>{n.type}</span>
                </div>
                <div className="t-h3" style={{ fontSize: 17, marginBottom: 12 }}>{n.name}</div>
                <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
                  <div>
                    <div className="t-eyebrow" style={{ fontSize: 9 }}>Value / user</div>
                    <div className="t-number" style={{ fontSize: 28, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ${n.vpuUsd.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="t-eyebrow" style={{ fontSize: 9 }}>YoY growth</div>
                    <div className="t-number" style={{ fontSize: 28, color: '#6ee7b7' }}>
                      +{Math.round(n.growth * 100)}%
                    </div>
                  </div>
                </div>
                <p className="t-small" style={{ color: 'var(--text3)', lineHeight: 1.55 }}>{n.insight}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Distribution ── */}
        {tab === 'distribution' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}
          >
            {DISTRIBUTION.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '18px', borderRadius: 14, borderTop: `2px solid ${c.color}66` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="t-caps" style={{ color: c.color, fontSize: 10 }}>{c.parent}</span>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{c.reach}</span>
                </div>
                <div className="t-h3" style={{ fontSize: 16, marginBottom: 10 }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(1, c.ourShareOfVoice * 4) * 100}%`, height: '100%', background: c.color, borderRadius: 3 }} />
                  </div>
                  <span className="t-mono" style={{ fontSize: 11, color: c.color, fontWeight: 700 }}>
                    {(c.ourShareOfVoice * 100).toFixed(1)}% SoV
                  </span>
                </div>
                <p className="t-xs" style={{ color: 'var(--text3)', lineHeight: 1.55 }}>{c.insight}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── TAM/SAM/SOM ── */}
        {tab === 'market' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
          >
            {[
              { label: 'TAM', sub: TAM_SAM_SOM.tam.label,      v: TAM_SAM_SOM.tam.usd,     color: '#a78bfa' },
              { label: 'SAM', sub: TAM_SAM_SOM.sam.label,      v: TAM_SAM_SOM.sam.usd,     color: '#2A9DE8' },
              { label: 'SOM 2030', sub: TAM_SAM_SOM.som.label, v: TAM_SAM_SOM.som.usd,     color: '#6ee7b7' },
              { label: 'ARR 2026', sub: TAM_SAM_SOM.current.label, v: TAM_SAM_SOM.current.usd, color: '#f59e0b' },
            ].map(m => (
              <div key={m.label} className="glass-card" style={{ padding: '24px 20px', borderRadius: 18, textAlign: 'center', borderTop: `2px solid ${m.color}55` }}>
                <div className="t-caps" style={{ color: m.color, fontSize: 11, marginBottom: 6 }}>{m.label}</div>
                <div className="t-number" style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1, background: `linear-gradient(135deg, ${m.color}, #F0EDE8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {compactUsd(m.v)}
                </div>
                <div className="t-small" style={{ color: 'var(--text2)', marginTop: 8 }}>{m.sub}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
