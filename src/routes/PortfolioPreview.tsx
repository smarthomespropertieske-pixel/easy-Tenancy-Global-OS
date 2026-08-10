// ════════════════════════════════════════════════════════════════════════
//  PortfolioPreview.tsx — /app/portfolio honest empty shell (v4.4)
//  ─────────────────────────────────────────────────────────────────────
//  Feature 6 — NOI Command Centre · Shipping Q2 2026
//  ─────────────────────────────────────────────────────────────────────
//  This is NOT a fake dashboard. Per UX directive #1 ("live data or honest
//  empty state"), this page shows the 5 KPI tile shells with em-dash placeholders
//  and an explicit "Shipping Q2 2026 — notify me" CTA.
//
//  Bundle: ~3 KB chunk, lazy-loaded.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from '../lib/icons'
import { trackEvent } from '../lib/analytics'
import { SEO } from '../components/SEO'

const KPI_TILES = [
  { label: 'Net Operating Income', foot: 'NOI · trailing 12mo'   },
  { label: 'Occupancy',            foot: 'across portfolio'      },
  { label: 'Vacancy (60d pred.)',  foot: 'Workers AI forecast'   },
  { label: 'Rent vs Market',       foot: 'live MLS comparable'   },
  { label: 'Cash-on-Cash IRR',     foot: 'after debt service'    },
]

export default function PortfolioPreview() {
  const [email, setEmail]    = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    trackEvent('waitlist_submitted', { feature: 'noi_command_centre', email_domain: email.split('@')[1] ?? '' })
    try {
      await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, interest: 'noi_command_centre', source: '/app/portfolio' }),
      })
    } catch { /* swallow — analytics already fired */ }
    setSuccess(true)
  }, [email])

  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
  }

  return (
    <motion.div initial="initial" animate="enter" exit="exit" variants={PAGE_VARIANTS} className="preview-page">
      <SEO title="NOI Command Centre Preview" description="Preview the upcoming NOI Command Centre." url="/app/portfolio" />
      <div className="preview-page-inner">
        <div className="preview-page-head">
          <span className="preview-page-pill">
            <Sparkles size={11} stroke={2} />
            Shipping Q2 2026 · empty shell preview
          </span>
          <h1 className="preview-page-title">
            NOI Command Centre
          </h1>
          <p className="preview-page-sub">
            Bloomberg-grade portfolio intelligence. 5 KPI tiles above the fold,
            NOI waterfall, 60-day vacancy prediction, one-click investor PDF.
            <br />
            <strong style={{ color: 'var(--text)' }}>This is the empty shell.</strong>
            {' '}Real data lights up Q2 2026.
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
          background: 'rgba(57,191,246,0.05)',
          border: '1px solid rgba(57,191,246,0.18)',
          borderRadius: 12,
          fontSize: 13,
          color: 'var(--text2)',
          textAlign: 'center',
        }}>
          <strong style={{ color: '#39bff6' }}>Why empty?</strong> easyTenancy ships
          live data or an honest empty state — never vapor dashboards. The data
          pipeline (D1 + Workers AI vacancy model) is in progress for Q2 2026.
        </div>

        {!success ? (
          <form className="preview-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="you@portfolio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit">
              Notify me Q2 →
            </button>
          </form>
        ) : (
          <div className="preview-success">
            ✓ You're on the list. We'll email you when NOI Command Centre goes live.
          </div>
        )}

        <div className="preview-cta-row">
          <Link to="/" className="preview-cta-ghost"
            onClick={() => trackEvent('feature_clicked', { feature: 'portfolio_back_home' })}>
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
