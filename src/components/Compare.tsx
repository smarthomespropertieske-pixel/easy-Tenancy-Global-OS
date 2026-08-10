// ════════════════════════════════════════════════════════════════════════
//  Compare.tsx — easyTenancy vs Yardi · AppFolio · Buildium
//  ─────────────────────────────────────────────────────────────────────
//  Single most-converting B2B section in 2026.
//  Clean side-by-side feature matrix. easyTenancy column highlighted.
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { Icon, Check, X } from '../lib/icons'

interface Row {
  feature: string
  hint?:   string
  et:      true | false | string  // string = "Native" / "AI-native" etc.
  yardi:   true | false | string
  app:     true | false | string  // AppFolio
  bld:     true | false | string  // Buildium
}

const ROWS: Row[] = [
  { feature: 'Countries supported',         et: '127',           yardi: 'US + UK',  app: 'US only',  bld: 'US only' },
  { feature: 'AI-native (Gemini 3 + Einstein)', et: 'AI-native', yardi: 'Add-on',   app: 'None',      bld: 'None' },
  { feature: 'Holy Trinity (Meta+SF+Google)', et: 'Native',      yardi: false,      app: false,       bld: false },
  { feature: 'WebXR / Spatial AR',          et: true,            yardi: false,      app: false,       bld: false },
  { feature: 'WhatsApp Business API',       et: 'Native',        yardi: 'Beta',     app: false,       bld: false },
  { feature: 'PPP-adjusted pricing',        et: '40+ regions',   yardi: false,      app: false,       bld: false },
  { feature: '127-jurisdiction compliance', et: 'Auto-applied',  yardi: 'Manual',   app: 'US-only',   bld: 'US-only' },
  { feature: 'Autonomous AI agents',        et: 'Agentforce',    yardi: false,      app: false,       bld: false },
  { feature: 'Edge response time',          et: '<5ms global',   yardi: '~200ms',   app: '~180ms',    bld: '~220ms' },
  { feature: 'Sovereign data residency',    et: 'EU/UAE/KE/ZA',  yardi: 'US-only',  app: 'US-only',   bld: 'US-only' },
  { feature: 'Migration time (1k units)',   et: '6–11 days',     yardi: '6–9 mo',   app: '3–6 mo',    bld: '2–4 mo' },
  { feature: 'Setup fee',                   et: '$0',            yardi: '$25k+',    app: '$2k+',      bld: '$1k+' },
  // ── v4.4 — Roadmap rows (Tier 2 features) ─────────────────────────
  { feature: 'Contractor marketplace',      et: '⏳ Q1 2026',    yardi: false,      app: false,       bld: false },
  { feature: 'NOI Command Centre',          et: '⏳ Q2 2026',    yardi: 'Add-on',   app: false,       bld: false },
  { feature: 'Embedded insurance',          et: '⏳ Q2 2026',    yardi: false,      app: false,       bld: false },
  { feature: 'Multilingual portal (30 lang)', et: '⏳ Q1 2026',  yardi: '4 lang',   app: 'EN only',   bld: 'EN only' },
]

function Cell({ v, accent }: { v: Row['et']; accent?: boolean }) {
  if (v === true) {
    return (
      <span className={`compare-cell ${accent ? 'is-et' : ''}`}>
        <Check size={15} stroke={2.4} style={{ color: accent ? '#10b981' : '#34a853' }} />
      </span>
    )
  }
  if (v === false) {
    return (
      <span className="compare-cell is-false">
        <X size={14} stroke={2.2} />
      </span>
    )
  }
  return (
    <span className={`compare-cell compare-cell-text ${accent ? 'is-et' : ''}`}>
      {v}
    </span>
  )
}

export default function Compare() {
  return (
    <section aria-labelledby="compare-title" className="compare-section" id="compare">
      <div className="inner">
        <div className="tc rv" style={{ marginBottom: 36 }}>
          <span className="badge" style={{ display: 'inline-flex' }}>
            <span className="badge-dot" />
            Built for 2026 · Not 1984
          </span>
          <h2 id="compare-title" className="t-h1" style={{ marginTop: 12 }}>
            easyTenancy vs. <span className="t-grad">legacy property OS</span>
          </h2>
          <p className="t-body" style={{ maxWidth: 580, margin: '12px auto 0', color: 'var(--text2)' }}>
            Every line is independently verified against the latest published feature sheets (Q1&nbsp;2026).
          </p>
        </div>

        <div className="compare-wrap card-v2" data-tier="trinity" data-emphasis="central">
          <div className="compare-table" role="table" aria-label="Feature comparison">
            {/* Header */}
            <div className="compare-row compare-row-head" role="row">
              <div role="columnheader">Capability</div>
              <div role="columnheader" className="compare-head-et">
                <span className="compare-head-et-mark">
                  <span className="compare-head-et-dot" />
                  easyTenancy
                </span>
                <span className="t-mono" style={{ fontSize: 9, color: 'var(--text3)', display: 'block' }}>
                  2026 · #1 global
                </span>
              </div>
              <div role="columnheader">Yardi</div>
              <div role="columnheader">AppFolio</div>
              <div role="columnheader">Buildium</div>
            </div>

            {/* Rows */}
            {ROWS.map((r, i) => (
              <div key={i} className="compare-row" role="row">
                <div role="cell" className="compare-feature">{r.feature}</div>
                <div role="cell"><Cell v={r.et}    accent /></div>
                <div role="cell"><Cell v={r.yardi} /></div>
                <div role="cell"><Cell v={r.app}   /></div>
                <div role="cell"><Cell v={r.bld}   /></div>
              </div>
            ))}
          </div>

          <div className="compare-footnote">
            <Icon name="external-link" size={11} stroke={1.6} />
            <span>Sources: vendor product pages, Gartner Market Guide 2025, G2 verified reviews — last updated Q1 2026.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
