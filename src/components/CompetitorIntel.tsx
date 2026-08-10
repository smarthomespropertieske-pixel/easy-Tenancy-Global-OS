// ════════════════════════════════════════════════════════════════════════
//  CompetitorIntel.tsx — Live PropTech news widget powered by TinyFish
//  ────────────────────────────────────────────────────────────────────
//  Calls /api/intel/proptech (Hono edge proxy → TinyFish search API).
//  The API key NEVER reaches the browser — proxy returns clean items.
//
//  States: loading skeleton → success feed → graceful error fallback.
//  Caching: 10 min server-side, plus stale-while-revalidate of 30 min.
//  Always-renders-something pattern: stub fallback if API fails.
// ════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from '../lib/icons'

// Inline refresh icon (avoids touching the global registry for one-off use)
function RefreshIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}
import { trackEvent } from '../lib/analytics'

interface IntelItem {
  title:    string
  url:      string
  source:   string
  posted?:  string
  summary?: string
}

interface IntelResponse {
  ok:     boolean
  source: 'live' | 'stub'
  items:  IntelItem[]
}

export default function CompetitorIntel() {
  const [items,  setItems]  = useState<IntelItem[]>([])
  const [source, setSource] = useState<'live' | 'stub' | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()
    setStatus('loading')

    fetch('/api/intel/proptech', { signal: ac.signal })
      .then(r => r.json() as Promise<IntelResponse>)
      .then(data => {
        if (cancelled) return
        setItems(data.items ?? [])
        setSource(data.source)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [refreshTick])

  return (
    <section className="intel-section" id="intel" aria-labelledby="intel-title">
      <div className="intel-inner">
        <div className="intel-head rv">
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
            <span className="badge-dot" />
            Competitor Intelligence · Live
          </div>
          <h2 id="intel-title" className="t-display">
            What the <span className="t-grad">competition</span> is doing.
            <br />
            <span style={{ color: 'var(--text2)', fontWeight: 600, fontSize: '0.72em' }}>
              Auto-scanned. Auto-summarized. Auto-refreshed every 10 min.
            </span>
          </h2>
        </div>

        <div className="intel-toolbar rv rv1">
          <div className="intel-meta">
            <span className={`intel-status-dot is-${status}`} />
            <span className="intel-status-label">
              {status === 'loading' && 'Scanning open PropTech sources…'}
              {status === 'ready' && (
                source === 'live'
                  ? `Live · ${items.length} signals · agentic browser sweep`
                  : `Cached snapshot · ${items.length} signals`
              )}
              {status === 'error' && 'Offline — showing cached intelligence'}
            </span>
          </div>
          <button
            type="button"
            className="intel-refresh"
            onClick={() => {
              trackEvent('feature_clicked', { feature: 'intel_refresh' })
              setRefreshTick(t => t + 1)
            }}
            aria-label="Refresh intelligence feed"
          >
            <RefreshIcon size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="intel-grid rv rv2">
          {status === 'loading' && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="intel-card is-skeleton" aria-hidden="true">
              <div className="intel-skel-line" style={{ width: '40%' }} />
              <div className="intel-skel-line" style={{ width: '92%', height: 14 }} />
              <div className="intel-skel-line" style={{ width: '78%', height: 14 }} />
              <div className="intel-skel-line" style={{ width: '60%' }} />
            </div>
          ))}

          {status !== 'loading' && items.map((item, i) => (
            <motion.a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="intel-card card-v2"
              data-tier="trinity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.32 }}
              onClick={() => trackEvent('feature_clicked', { feature: 'intel_card_click', source: item.source })}
            >
              <div className="intel-card-meta">
                <span className="intel-source">{item.source}</span>
                {source === 'live' && (
                  <span className="intel-live-tag">
                    <Sparkles size={9} stroke={2} />
                    live
                  </span>
                )}
              </div>
              <div className="intel-card-title">{item.title}</div>
              {item.summary && (
                <div className="intel-card-summary">{item.summary}</div>
              )}
              <div className="intel-card-foot">
                <span>Read source</span>
                <ArrowRight size={12} stroke={2} />
              </div>
            </motion.a>
          ))}
        </div>

        <div className="intel-footer rv rv3">
          <Sparkles size={12} stroke={2} />
          <span>
            Powered by an autonomous browser agent. Sources sampled across <strong>open PropTech</strong> news,
            press releases, and regulatory feeds. No tenant data leaves your perimeter.
          </span>
        </div>

        {/* v4.4 — Agent Activity Feed teaser (UX directive #4, honest preview) */}
        <div className="agent-feed-teaser rv rv3" aria-label="Agent activity feed preview">
          <div className="agent-feed-teaser-head">
            <span className="agent-feed-teaser-title">Agent activity feed</span>
            <span className="agent-feed-teaser-pill">◐ Preview Q1 2026</span>
          </div>
          <ul className="agent-feed-teaser-list">
            <li className="agent-feed-teaser-item">
              <span className="agent-feed-teaser-item-icon" aria-hidden="true">◈</span>
              <span>Lease Renewal Agent would draft 4 renewal letters · awaiting approval</span>
              <span className="agent-feed-teaser-item-meta">conf · III</span>
            </li>
            <li className="agent-feed-teaser-item">
              <span className="agent-feed-teaser-item-icon" aria-hidden="true">◉</span>
              <span>Compliance Agent flagged 2 EPC renewals due in 14 days</span>
              <span className="agent-feed-teaser-item-meta">conf · IV</span>
            </li>
            <li className="agent-feed-teaser-item">
              <span className="agent-feed-teaser-item-icon" aria-hidden="true">$</span>
              <span>Arrears Escalation Agent ready to send 7 WhatsApp soft-touch nudges</span>
              <span className="agent-feed-teaser-item-meta">conf · III</span>
            </li>
          </ul>
          <div className="agent-feed-teaser-foot">
            This is a preview of Tier 1 Feature 1. Real agents go live at{' '}
            <a href="/app/dashboard" onClick={(e) => { e.preventDefault(); trackEvent('feature_clicked', { feature: 'agent_feed_teaser_cta' }) }}>
              /app/dashboard
            </a>
            {' '}— shipping with Tier 1.
          </div>
        </div>
      </div>
    </section>
  )
}
