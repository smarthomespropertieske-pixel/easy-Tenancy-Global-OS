// ════════════════════════════════════════════════════════════════════════
//  LogoCloud.tsx — Partner / Integration marquee
//  ─────────────────────────────────────────────────────────────────────
//  Auto-scrolling logo strip. Pure CSS animation — no JS rAF.
//  Each "logo" is a clean wordmark in monospace (Linear / Vercel pattern).
// ════════════════════════════════════════════════════════════════════════

import React from 'react'

interface PartnerLogo {
  name:   string
  weight: number      // visual weight 500-900
  style?: 'mono' | 'serif' | 'sans'
  scale?: number      // optical sizing 0.8-1.2
}

const PARTNERS: PartnerLogo[] = [
  { name: 'Salesforce', weight: 800, style: 'sans' },
  { name: 'Google Cloud', weight: 600, style: 'sans' },
  { name: 'Meta',       weight: 900, style: 'sans', scale: 1.1 },
  { name: 'Cloudflare', weight: 800, style: 'sans' },
  { name: 'Stripe',     weight: 700, style: 'sans' },
  { name: 'Anthropic',  weight: 600, style: 'serif' },
  { name: 'OpenAI',     weight: 700, style: 'sans' },
  { name: 'Vercel',     weight: 900, style: 'sans' },
  { name: 'Linear',     weight: 800, style: 'sans' },
  { name: 'Notion',     weight: 700, style: 'sans' },
  { name: 'Plaid',      weight: 800, style: 'sans' },
  { name: 'Twilio',     weight: 700, style: 'sans' },
  { name: 'Auth0',      weight: 700, style: 'sans' },
  { name: 'Supabase',   weight: 700, style: 'sans' },
]

// Double the array for seamless infinite marquee
const ROW = [...PARTNERS, ...PARTNERS]

export default function LogoCloud() {
  return (
    <section aria-label="Trusted by leading platforms" className="logo-cloud">
      <div className="inner">
        <div className="logo-cloud-eyebrow">
          <span>Powering property portfolios alongside</span>
        </div>
      </div>
      <div className="logo-cloud-track-wrap" aria-hidden="true">
        <div className="logo-cloud-track">
          {ROW.map((p, i) => (
            <span
              key={`${p.name}-${i}`}
              className={`logo-cloud-item logo-cloud-${p.style ?? 'sans'}`}
              style={{
                fontWeight: p.weight,
                fontSize: `clamp(18px, ${1.4 * (p.scale ?? 1)}vw, ${28 * (p.scale ?? 1)}px)`,
              }}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
      <div className="logo-cloud-hint">
        <span>14 native integrations · 47 SDK partners · 350+ enterprise clients</span>
      </div>
    </section>
  )
}
