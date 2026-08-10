import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'

interface TourStep {
  id: number
  title: string
  desc: string
  visual: React.ReactNode
  action?: string
}

interface FeatureConfig {
  id: string
  icon: string
  title: string
  subtitle: string
  color: string
  stat: string
  steps: TourStep[]
}

const FEATURES: FeatureConfig[] = [
  {
    id: 'maintenance',
    icon: '🔧',
    title: 'AI Maintenance',
    subtitle: 'Dispatch & Resolution',
    color: '#f59e0b',
    stat: '–62% resolution time',
    steps: [
      {
        id: 1,
        title: 'Tenant submits request',
        desc: 'Tenant taps "Report Issue" in their app. AI categorises: plumbing, electrical, structural — in <3 seconds.',
        visual: (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 10 }}>📱 Tenant App</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
              <div>Category: 🔧 Plumbing</div>
              <div>Priority:  HIGH</div>
              <div>Unit:      7C – Westlands</div>
              <div style={{ color: '#10b981', marginTop: 6 }}>AI: Dispatching nearest contractor…</div>
            </div>
          </div>
        )
      },
      {
        id: 2,
        title: 'AI dispatches contractor',
        desc: 'System matches nearest certified contractor, checks SLA clock, sends job order — all within 90 seconds.',
        visual: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['🔍 Matching contractor', '#10b981', '100%'], ['📤 Job order sent', '#39bff6', '100%'], ['⏱️ SLA clock started', '#f59e0b', '100%']].map(([l, c, p]) => (
              <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{l as string}</span>
                <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: p as string, background: c as string, borderRadius: 3, transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 3,
        title: 'Resolution & feedback',
        desc: 'Job completed in 31 hours. Tenant rates 4.9★. AI updates portfolio maintenance score automatically.',
        visual: (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>Resolved in 31 hrs</div>
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6 }}>SLA: ✓ Met · Tenant: 4.9★ · Score: +2.1pts</div>
          </div>
        )
      }
    ]
  },
  {
    id: 'leasing',
    icon: '📋',
    title: 'Smart Leasing',
    subtitle: 'AI Screening & Contracts',
    color: '#39bff6',
    stat: '+31% renewal rate',
    steps: [
      {
        id: 1,
        title: 'Applicant screening',
        desc: 'Upload or link application. AI cross-checks credit, references, employment — risk score in 42 seconds.',
        visual: (
          <div style={{ background: 'rgba(57,191,246,0.08)', border: '1px solid rgba(57,191,246,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#39bff6', fontWeight: 700, marginBottom: 10 }}>🤖 AI Screening Engine</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['Credit score', '742 / 850', '#10b981'], ['Employment', 'Verified ✓', '#10b981'], ['References', '2/2 positive', '#10b981'], ['Risk score', '94 / 100', '#a78bfa']].map(([l, v, c]) => (
                <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text3)' }}>{l as string}</span>
                  <span style={{ color: c as string, fontWeight: 700 }}>{v as string}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 2,
        title: 'AI lease generation',
        desc: 'Jurisdiction-specific lease drafted in seconds. Clauses auto-selected per local law. DocuSign ready.',
        visual: (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94a3b8', lineHeight: 1.8 }}>
            <div style={{ color: '#39bff6', fontWeight: 700 }}>TENANCY AGREEMENT</div>
            <div>Jurisdiction: Kenya ✓</div>
            <div>Duration: 12 months</div>
            <div>Rent: KES 45,000/mo</div>
            <div style={{ color: '#10b981' }}>Clauses: 23 applied ✓</div>
            <div style={{ color: '#a78bfa' }}>DocuSign: Ready →</div>
          </div>
        )
      },
      {
        id: 3,
        title: 'Renewal prediction',
        desc: 'AI monitors satisfaction signals. 34 days before expiry, renewal notice drafted with optimised rent uplift.',
        visual: (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔮</div>
            <div style={{ fontWeight: 800, color: '#39bff6', fontSize: 16 }}>Renewal predicted</div>
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>34 days early · +3.2% uplift · Pre-approved</div>
          </div>
        )
      }
    ]
  },
  {
    id: 'collections',
    icon: '💰',
    title: 'Collections Engine',
    subtitle: 'Automated Rent Collection',
    color: '#10b981',
    stat: '98% on-time rate',
    steps: [
      {
        id: 1,
        title: 'Multi-channel collection',
        desc: 'M-Pesa, Stripe, bank transfer, crypto — all channels active simultaneously. Auto-reconciled in real time.',
        visual: (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['M-Pesa', '🇰🇪', '#10b981'], ['Stripe', '🌍', '#39bff6'], ['Bank', '🏦', '#a78bfa'], ['Crypto', '₿', '#f59e0b']].map(([n, i, c]) => (
              <div key={n as string} style={{ padding: '10px', background: `${c as string}11`, border: `1px solid ${c as string}33`, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{i as string}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c as string, marginTop: 4 }}>{n as string}</div>
                <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>Active ✓</div>
              </div>
            ))}
          </div>
        )
      },
      {
        id: 2,
        title: 'Auto-reconciliation',
        desc: 'Every payment matched to tenant, unit, and period automatically. Zero manual bookkeeping.',
        visual: (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.9 }}>
            <div style={{ color: '#10b981' }}>✓ KES 45,000 → Unit 14B</div>
            <div style={{ color: '#10b981' }}>✓ KES 38,500 → Unit 7C</div>
            <div style={{ color: '#10b981' }}>✓ KES 52,000 → Unit 22A</div>
            <div style={{ color: '#f59e0b', marginTop: 4 }}>⚠ Unit 3F — KES 41,000 pending</div>
            <div style={{ color: '#ef4444' }}>✗ Unit 9B — 14-day arrears</div>
          </div>
        )
      },
      {
        id: 3,
        title: 'Arrears escalation',
        desc: 'Missed payment triggers automated reminder → notice → legal escalation ladder. Zero manual intervention.',
        visual: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Day 1', 'SMS + WhatsApp reminder', '#f59e0b'], ['Day 7', 'Formal demand letter', '#f97316'], ['Day 14', 'Legal notice filed', '#ef4444'], ['Day 42', 'Tribunal application', '#dc2626']].map(([d, a, c]) => (
              <div key={d as string} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <span style={{ width: 40, fontWeight: 700, color: c as string, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{d as string}</span>
                <span style={{ color: 'var(--text2)' }}>{a as string}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10b981', fontWeight: 700 }}>AUTO</span>
              </div>
            ))}
          </div>
        )
      }
    ]
  }
]

function MicroTour({ feature, onClose }: { feature: FeatureConfig; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = feature.steps[step]

  const handleNext = () => {
    if (step < feature.steps.length - 1) {
      setStep(s => s + 1)
    } else {
      trackEvent('micro_tour_completed', { feature: feature.id })
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      style={{
        background: 'var(--card2)',
        border: `1px solid ${feature.color}33`,
        borderRadius: 18,
        padding: '24px',
        marginTop: 16,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          animate={{ width: `${((step + 1) / feature.steps.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: feature.color, borderRadius: 2 }}
        />
      </div>

      <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>✕</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Step {step + 1} / {feature.steps.length}
        </span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)', display: 'inline-block' }} />
        <span style={{ fontSize: 12, color: feature.color, fontWeight: 700 }}>30-sec tour</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h4 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: feature.color }}>{current.title}</h4>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 18 }}>{current.desc}</p>
          <div style={{ marginBottom: 20 }}>{current.visual}</div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ padding: '9px 18px', border: '1px solid var(--border)', borderRadius: 10, background: 'none', color: step === 0 ? 'var(--text3)' : 'var(--text)', cursor: step === 0 ? 'default' : 'pointer', fontSize: 13 }}
        >
          ← Back
        </button>
        <button
          className="btn-primary"
          onClick={handleNext}
          style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13 }}
        >
          {step < feature.steps.length - 1 ? `Next: ${feature.steps[step + 1].title} →` : '✅ Complete tour'}
        </button>
      </div>
    </motion.div>
  )
}

export default function FeatureMicroTours() {
  const [activeTour, setActiveTour] = useState<string | null>(null)

  const handleStartTour = (id: string) => {
    setActiveTour(activeTour === id ? null : id)
    trackEvent('micro_tour_started', { feature: id })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
      {FEATURES.map(feature => (
        <div key={feature.id}>
          <div
            className="glass-card"
            style={{
              padding: '28px 24px',
              borderRadius: 20,
              position: 'relative',
              cursor: 'default',
              borderTop: `2px solid ${feature.color}55`,
            }}
          >
            {/* Icon + title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${feature.color}15`, border: `1px solid ${feature.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {feature.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{feature.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{feature.subtitle}</div>
                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: `${feature.color}12`, border: `1px solid ${feature.color}28`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: feature.color }}>
                  {feature.stat}
                </div>
              </div>
            </div>

            {/* Steps preview */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {feature.steps.map((s, i) => (
                <div key={s.id} style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 11 }}>
                  <div style={{ color: feature.color, fontWeight: 700, marginBottom: 2 }}>Step {i + 1}</div>
                  <div style={{ color: 'var(--text3)', lineHeight: 1.4 }}>{s.title}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleStartTour(feature.id)}
              style={{
                width: '100%', padding: '11px', border: `1px solid ${feature.color}40`,
                borderRadius: 12, background: `${feature.color}10`, color: feature.color,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {activeTour === feature.id ? '✕ Close tour' : '▶ Start 30-sec tour'}
            </button>
          </div>

          <AnimatePresence>
            {activeTour === feature.id && (
              <MicroTour
                key={feature.id}
                feature={feature}
                onClose={() => setActiveTour(null)}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
