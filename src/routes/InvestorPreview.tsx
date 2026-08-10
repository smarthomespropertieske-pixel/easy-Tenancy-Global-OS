// ════════════════════════════════════════════════════════════════════════
//  InvestorPreview.tsx — /investor honest waitlist page (v4.4)
//  ─────────────────────────────────────────────────────────────────────
//  Feature F10 — Investor Pitch Dashboard · Roadmap Q3 2026
//  ─────────────────────────────────────────────────────────────────────
//  Decorative password input + email submit. The password gate is NOT
//  implemented yet (per "don't build outside Tier 1") — submit always
//  goes to waitlist with interest:'investor'.
//
//  Bundle: ~2 KB chunk, lazy-loaded.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Lock } from '../lib/icons'
import { trackEvent } from '../lib/analytics'
import { SEO } from '../components/SEO'

const KPI_TILES = [
  { label: 'MRR',               foot: 'monthly recurring' },
  { label: 'Net Retention',     foot: 'NRR · last cohort' },
  { label: 'Logos',             foot: 'enterprise + SMB'  },
  { label: 'Runway',            foot: 'at current burn'   },
  { label: 'Series Seed',       foot: 'committed / target' },
]

export default function InvestorPreview() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    trackEvent('waitlist_submitted', {
      feature:        'investor_pitch',
      email_domain:   email.split('@')[1] ?? '',
      has_password:   password.length > 0,
    })
    try {
      await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          interest: 'investor',
          source:   '/investor',
        }),
      })
    } catch { /* swallow */ }
    setSuccess(true)
  }, [email, password])

  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
  }

  return (
    <motion.div initial="initial" animate="enter" exit="exit" variants={PAGE_VARIANTS} className="preview-page">
      <SEO title="Investor Pitch Dashboard" description="Preview the upcoming Investor Pitch Dashboard." url="/investor" />
      <div className="preview-page-inner">
        <div className="preview-page-head">
          <span className="preview-page-pill" style={{
            background: 'rgba(167,139,250,0.10)',
            color: '#a78bfa',
            borderColor: 'rgba(167,139,250,0.25)',
          }}>
            <Lock size={11} stroke={2} />
            Roadmap Q3 2026 · password-protected
          </span>
          <h1 className="preview-page-title">
            easyTenancy · Series&nbsp;Seed
          </h1>
          <p className="preview-page-sub">
            Live MRR · NRR · cohort retention · burn · runway · investor-grade exhibits.
            <br />
            <strong style={{ color: 'var(--text)' }}>Access opens Q3 2026.</strong>
            {' '}Request your read-only credentials below.
          </p>
        </div>

        <div className="preview-kpi-grid">
          {KPI_TILES.map(tile => (
            <div key={tile.label} className="preview-kpi-tile">
              <div className="preview-kpi-label">{tile.label}</div>
              <div className="preview-kpi-value">
                <span className="preview-kpi-empty" aria-label="No data yet" />
              </div>
              <div className="preview-kpi-foot">{tile.foot}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px 20px',
          background: 'rgba(167,139,250,0.05)',
          border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: 12,
          fontSize: 13,
          color: 'var(--text2)',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          <Sparkles size={11} stroke={2} style={{ color: '#a78bfa', verticalAlign: 'middle', marginRight: 4 }} />
          We share live numbers with credentialed investors only. Tickets from
          £50k. No-shop · 30-day exclusivity windows on request.
        </div>

        {!success ? (
          <form className="preview-form" onSubmit={handleSubmit} style={{ flexDirection: 'column', maxWidth: 460 }}>
            <input
              type="email"
              placeholder="partner@yourfund.vc"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Access code (optional — request if you don't have one)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button type="submit" style={{ width: '100%' }}>
              Request access →
            </button>
          </form>
        ) : (
          <div className="preview-success">
            ✓ Request received. We'll send credentials within 48h to qualified investors.
          </div>
        )}

        <div className="preview-cta-row">
          <Link to="/" className="preview-cta-ghost"
            onClick={() => trackEvent('feature_clicked', { feature: 'investor_back_home' })}>
            ← Back to home
          </Link>
          <a href="/#roadmap" className="preview-cta-primary">
            See full roadmap <ArrowRight size={14} stroke={2} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}
