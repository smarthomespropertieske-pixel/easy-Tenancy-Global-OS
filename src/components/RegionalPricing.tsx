/* ═══════════════════════════════════════════════════════════════════════
   RegionalPricing — PPP-adjusted tiers + region-specific offer bundle
   • Pulls from src/lib/geoMarket.ts (PPP factors, FX, locale)
   • Annual toggle (saves 20% on top of PPP)
   • Bonus regional discount (e.g. Africa/SEA get extra −10%)
   • Shows native payment rails per region
═══════════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  detectRegion, formatPrice, getRegionalOffer, setRegion, listRegions,
  type RegionInfo,
} from '../lib/geoMarket'
import { trackEvent } from '../lib/analytics'
import { useMagnetic } from '../hooks/interactivity'

interface TierBlueprint {
  key: 'starter' | 'pro' | 'portfolio' | 'enterprise'
  name: string
  usd: number          // monthly USD list
  units: string
  color: string
  emoji: string
  cta: string
  features: string[]
  popular?: boolean
  custom?: boolean
}

const BLUEPRINT: TierBlueprint[] = [
  { key: 'starter',    name: 'Starter',      usd: 0,    units: '≤5 units',     color: '#64748b', emoji: '🌱',
    cta: 'Start free',
    features: ['5 units', 'Basic compliance', 'Email support', 'Mobile app', '1 user seat'] },
  { key: 'pro',        name: 'Professional', usd: 49,   units: '≤100 units',   color: '#39bff6', emoji: '⚡', popular: true,
    cta: 'Start trial',
    features: ['100 units', 'AI Copilot 50 actions/day', 'Full compliance engine', 'Priority support', 'All payment methods', '5 user seats'] },
  { key: 'portfolio',  name: 'Portfolio',    usd: 149,  units: 'Unlimited',    color: '#a78bfa', emoji: '💎',
    cta: 'Start trial',
    features: ['Unlimited units', 'Unlimited AI Copilot', '120 jurisdiction packs', 'White-glove onboarding', 'IFRS 16 reporting', 'Unlimited seats'] },
  { key: 'enterprise', name: 'Enterprise',   usd: -1,   units: 'Custom',       color: '#f59e0b', emoji: '🏛️', custom: true,
    cta: 'Contact sales',
    features: ['White-label', 'Dedicated infra', 'Custom integrations', 'SLA guarantee', '24/7 dedicated', 'Equity + revshare options'] },
]

export default function RegionalPricing() {
  const navigate = useNavigate()
  const [region, setReg] = useState<RegionInfo>(() => detectRegion())
  const [annual, setAnnual] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const offer = useMemo(() => getRegionalOffer(region), [region])

  // Final price per tier (annual = −20%, regional bonus discount applied to all)
  const priced = useMemo(() => {
    return BLUEPRINT.map(t => {
      if (t.custom || t.usd <= 0) return { ...t, finalDisplay: t.custom ? 'Custom' : 'Free', savings: null }
      const base = t.usd
      const afterAnnual = annual ? base * 0.80 : base
      const afterRegion = afterAnnual * (1 - offer.bonusDiscount / 100)
      const fmt = formatPrice(afterRegion, region)
      return { ...t, finalDisplay: fmt.display, savings: fmt.savings, fmt }
    })
  }, [annual, region, offer])

  const switchRegion = (country: string) => {
    const next = setRegion(country)
    setReg(next)
    setPickerOpen(false)
    trackEvent('feature_clicked', { feature: `pricing_region_${next.country}`, location: 'pricing' })
  }

  return (
    <section id="pricing" aria-labelledby="pricing-title">
      <div className="inner">

        {/* Header */}
        <div className="tc rv" style={{ marginBottom: 28 }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
            <span className="badge-dot" />Pricing
          </div>
          <h2 id="pricing-title" className="t-display">
            Start free. <span className="t-grad">Pay like a local.</span>
          </h2>
          <p className="t-lead mxa tc" style={{ marginTop: 14 }}>
            PPP-adjusted pricing in <span className="t-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>{region.currency}</span>.
            No hidden fees. Free migration. Cancel any time.
          </p>
        </div>

        {/* Region + cycle toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, flexWrap: 'wrap', marginBottom: 28,
        }}>
          {/* Region picker */}
          <div style={{ position: 'relative' }}>
            <button
              className="geo-pill ring-iri"
              onClick={() => setPickerOpen(v => !v)}
              aria-expanded={pickerOpen}
              style={{ padding: '8px 14px 8px 10px' }}
            >
              <span className="flag" aria-hidden="true">{region.flag}</span>
              <span style={{ fontWeight: 600 }}>{region.countryName}</span>
              <span className="sep" aria-hidden="true" />
              <span className="price">{region.currency}</span>
              <span aria-hidden="true" style={{ opacity: 0.5, fontSize: 10 }}>{pickerOpen ? '▲' : '▼'}</span>
            </button>
            {pickerOpen && (
              <div role="listbox" style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: 'rgba(9,13,26,0.96)', backdropFilter: 'blur(24px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14,
                padding: 6, minWidth: 280, maxHeight: 320, overflowY: 'auto',
                boxShadow: '0 24px 60px rgba(0,0,0,0.55)', zIndex: 50, textAlign: 'left',
              }}>
                {listRegions().map(r => {
                  const active = r.country === region.country
                  return (
                    <button key={r.country} onClick={() => switchRegion(r.country)} role="option" aria-selected={active}
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8,
                        background: active ? 'rgba(42,157,232,0.16)' : 'transparent',
                        border: '1px solid transparent', color: active ? '#fff' : 'var(--text2)',
                        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{r.flag}</span>
                      <span style={{ flex: 1 }}>{r.countryName}</span>
                      <span className="t-mono" style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 600 }}>{r.currency}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Monthly / Annual */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 8px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <span className="t-small" style={{ color: annual ? 'var(--text3)' : 'var(--text)', fontWeight: 600 }}>Monthly</span>
            <button
              onClick={() => { setAnnual(a => !a); trackEvent('pricing_toggled', { to: annual ? 'monthly' : 'annual' }) }}
              aria-label="Toggle annual pricing"
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: annual ? 'var(--grad)' : 'rgba(255,255,255,0.10)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: annual ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }} />
            </button>
            <span className="t-small" style={{ color: annual ? 'var(--text)' : 'var(--text3)', fontWeight: 600 }}>Annual</span>
            {annual && <span style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700, padding: '2px 8px', background: 'rgba(16,185,129,0.10)', borderRadius: 6 }}>−20%</span>}
          </div>
        </div>

        {/* Regional offer banner */}
        <div className="rv" style={{
          marginBottom: 24, padding: '14px 18px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(42,157,232,0.08), rgba(167,139,250,0.06))',
          border: '1px solid rgba(42,157,232,0.20)', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 28 }} aria-hidden="true">{region.flag}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="t-caps" style={{ color: '#39bff6', fontSize: 10, marginBottom: 4 }}>{offer.bundleName}</div>
            <div className="t-body" style={{ fontWeight: 600 }}>{offer.headline}</div>
            <div className="t-small" style={{ color: 'var(--text2)', marginTop: 2 }}>{offer.sub}</div>
          </div>
          {offer.bonusDiscount > 0 && (
            <div style={{
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)',
              color: '#6ee7b7', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5,
            }}>
              Regional bonus: −{offer.bonusDiscount}%
            </div>
          )}
        </div>

        {/* Tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {priced.map((plan, i) => (
            <PricingCard key={plan.key} plan={plan} index={i} onPick={() => {
              trackEvent('cta_clicked', { plan: plan.key, location: 'pricing', region: region.country })
              navigate(`/app/demo?demoTenantId=demo-001&plan=${plan.key}&region=${region.country}`)
            }} />
          ))}
        </div>

        {/* v4.4 — easyWorks Contractor preview strip (Feature 5 · Building Q1 2026) */}
        <div className="works-preview-strip rv">
          <div className="works-preview-strip-left">
            <span className="works-preview-strip-pill">◐ Building Q1 2026</span>
            <span className="works-preview-strip-title">easyWorks · Contractor Marketplace</span>
            <span className="works-preview-strip-price">
              <strong>£49/mo</strong> per contractor · AI 90-second job matching · escrow · auto-suspend &lt; 3.5★
            </span>
            <div className="works-preview-strip-rails">
              <span className="works-preview-strip-rail">M-Pesa</span>
              <span className="works-preview-strip-rail">PayStack</span>
              <span className="works-preview-strip-rail">Stripe</span>
              <span className="works-preview-strip-rail">STC Pay</span>
              <span className="works-preview-strip-rail">Tap</span>
            </div>
          </div>
          <a
            href="/?waitlist=works"
            className="works-preview-strip-cta"
            onClick={() => trackEvent('roadmap_card_clicked', { feature: 'works', horizon: 'building', location: 'pricing_strip' })}
          >
            Join contractor waitlist →
          </a>
        </div>

        {/* Localized payment methods + compliance highlights */}
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="mobile-stack">
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Native payment rails · {region.countryName}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offer.payments.map(p => (
                <span key={p} style={{
                  padding: '5px 11px', borderRadius: 999,
                  background: 'rgba(57,191,246,0.10)', border: '1px solid rgba(57,191,246,0.25)',
                  color: '#39bff6', fontSize: 12, fontWeight: 600,
                }}>{p}</span>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Compliance · {region.countryName}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offer.compliance.map(c => (
                <span key={c} style={{
                  padding: '5px 11px', borderRadius: 999,
                  background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)',
                  color: '#a78bfa', fontSize: 12, fontWeight: 600,
                }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing card with magnetic CTA + spotlight ─────────────────
function PricingCard({ plan, index, onPick }: { plan: any; index: number; onPick: () => void }) {
  const ctaRef = useMagnetic<HTMLButtonElement>(0.35)
  return (
    <div
      className="rv glass-card spotlight"
      style={{
        padding: '28px 24px', borderRadius: 20, position: 'relative',
        borderTop: `2px solid ${plan.color}55`,
        height: '100%', display: 'flex', flexDirection: 'column',
        transitionDelay: `${index * 0.06}s`,
      }}
    >
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          padding: '3px 14px',
          background: 'linear-gradient(135deg, #2A9DE8, #a78bfa)',
          borderRadius: '0 0 10px 10px',
          fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.08em',
        }}>
          MOST POPULAR
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }} aria-hidden="true">{plan.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: plan.color, letterSpacing: '-0.005em' }}>{plan.name}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <span className="t-number" style={{ fontSize: 40, lineHeight: 1, color: 'var(--text)' }}>
          {plan.finalDisplay}
        </span>
        <div className="t-small" style={{ color: 'var(--text3)', marginTop: 4 }}>{plan.units}</div>
        {plan.savings != null && plan.savings > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#6ee7b7' }}>
            Saving {plan.savings}% via PPP
          </div>
        )}
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22, flex: 1 }}>
        {plan.features.map((f: string) => (
          <li key={f} style={{ fontSize: 13.5, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: plan.color, flexShrink: 0, fontWeight: 700 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <button
        ref={ctaRef}
        className={`${plan.popular ? 'btn-primary' : 'btn-ghost'} btn-magnetic`}
        style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
        onClick={onPick}
      >
        <span>{plan.cta} →</span>
      </button>
    </div>
  )
}
