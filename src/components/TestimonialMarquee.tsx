// ════════════════════════════════════════════════════════════════════════
//  TestimonialMarquee.tsx — Social-proof quote cards
//  ─────────────────────────────────────────────────────────────────────
//  Two infinite columns scrolling in opposite directions.
//  Each card is a .card-v2 with role, region, and a metric.
//  This is the #1-converting B2B section in 2026.
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { Icon, Star } from '../lib/icons'

interface Testimonial {
  id:     string
  quote:  string
  name:   string
  role:   string
  region: string         // e.g. "🇰🇪 Nairobi" — uses unicode flag, no image deps
  metric: string         // measurable outcome
  tier:   'meta' | 'salesforce' | 'google' | 'trinity' | 'emerald' | 'amber' | 'violet'
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: 'We replaced Yardi and three spreadsheets in a single weekend. AI compliance auto-applied 47 jurisdiction updates in 30 days.',
    name: 'Amara Okonkwo',
    role: 'Director of Operations',
    region: '🇳🇬 Lagos · 2,400 units',
    metric: '−68% admin time',
    tier: 'google',
  },
  {
    id: 't2',
    quote: 'The Holy Trinity integration with Salesforce + WhatsApp Business + Google Maps closed the loop we\'ve been hand-stitching for 4 years.',
    name: 'Daniel Kimani',
    role: 'CEO · Acacia Properties',
    region: '🇰🇪 Nairobi · 1,150 units',
    metric: '3.4× lead conversion',
    tier: 'salesforce',
  },
  {
    id: 't3',
    quote: 'We onboarded our 600-unit GCC portfolio with the RERA compliance engine in 11 days. The previous attempt took 14 months.',
    name: 'Layla Al-Mansouri',
    role: 'Portfolio Strategy Lead',
    region: '🇦🇪 Dubai · 600 units',
    metric: '38× faster onboarding',
    tier: 'amber',
  },
  {
    id: 't4',
    quote: 'POPIA + GDPR dual-jurisdiction handling is automatic. Our auditor said it\'s the cleanest data trail they\'ve seen.',
    name: 'Zanele Mokoena',
    role: 'Head of Compliance',
    region: '🇿🇦 Johannesburg · 870 units',
    metric: 'Zero audit findings',
    tier: 'emerald',
  },
  {
    id: 't5',
    quote: 'Agentforce drafts our lease renewals 19 hours before the renewal window opens. We just review and approve. It feels like 2030.',
    name: 'James Patterson',
    role: 'COO · Patterson REIT',
    region: '🇺🇸 Atlanta · 4,800 units',
    metric: '+22% retention',
    tier: 'trinity',
  },
  {
    id: 't6',
    quote: 'The spatial AR property view sold our board on the platform in 90 seconds. Investor relations now demo properties from a phone.',
    name: 'Sophie Laurent',
    role: 'IR Director',
    region: '🇫🇷 Paris · 320 units',
    metric: '+$14M raise enabled',
    tier: 'meta',
  },
  {
    id: 't7',
    quote: 'Migrated from AppFolio in 6 days. The CSV importer mapped our 11 custom fields automatically with Gemini schema inference.',
    name: 'Carlos Reyes',
    role: 'Operations Director',
    region: '🇲🇽 CDMX · 950 units',
    metric: '6-day migration',
    tier: 'violet',
  },
  {
    id: 't8',
    quote: 'The Predictive OS surfaces churn risk 67 days before a tenant gives notice. We saved 23 leases in Q1 alone.',
    name: 'Aisha Rahman',
    role: 'Tenant Success Lead',
    region: '🇬🇧 London · 540 units',
    metric: '−41% churn',
    tier: 'salesforce',
  },
]

const COL_A = TESTIMONIALS.filter((_, i) => i % 2 === 0)
const COL_B = TESTIMONIALS.filter((_, i) => i % 2 === 1)

function Card({ t }: { t: Testimonial }) {
  return (
    <article className="testimonial-card card-v2" data-tier={t.tier}>
      <div className="testimonial-stars" aria-label="5 stars">
        {[0, 1, 2, 3, 4].map(i => (
          <Star key={i} size={12} stroke={0} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
        ))}
      </div>
      <p className="testimonial-quote t-body">
        <span className="testimonial-quote-open" aria-hidden="true">"</span>
        {t.quote}
        <span className="testimonial-quote-close" aria-hidden="true">"</span>
      </p>
      <div className="testimonial-meta">
        <div>
          <div className="testimonial-name t-h4">{t.name}</div>
          <div className="testimonial-role t-eyebrow">{t.role}</div>
          <div className="testimonial-region t-mono">{t.region}</div>
        </div>
        <div className="testimonial-metric">
          <Icon name="trending-up" size={12} stroke={2} />
          <span>{t.metric}</span>
        </div>
      </div>
    </article>
  )
}

export default function TestimonialMarquee() {
  return (
    <section aria-labelledby="testimonials-title" className="testimonials" id="testimonials">
      <div className="inner">
        <div className="tc rv" style={{ marginBottom: 40 }}>
          <span className="badge" style={{ display: 'inline-flex' }}>
            <span className="badge-dot" />
            Trusted by 50,000+ landlords
          </span>
          <h2 id="testimonials-title" className="t-h1 t-grad" style={{ marginTop: 12 }}>
            Operators in 127 markets ship faster
          </h2>
          <p className="t-body" style={{ maxWidth: 620, margin: '12px auto 0', color: 'var(--text2)' }}>
            From Lagos to London, Nairobi to New York — single-source-of-truth property operations,
            powered by the Holy Trinity.
          </p>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial-column testimonial-column-up">
            <div className="testimonial-track">
              {[...COL_A, ...COL_A].map((t, i) => (
                <Card key={`a-${t.id}-${i}`} t={t} />
              ))}
            </div>
          </div>
          <div className="testimonial-column testimonial-column-down">
            <div className="testimonial-track">
              {[...COL_B, ...COL_B].map((t, i) => (
                <Card key={`b-${t.id}-${i}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
