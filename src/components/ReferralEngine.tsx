/* ═══════════════════════════════════════════════════════════════════════
   ReferralEngine — interactive demo widget for the Ambassador program
   • input email/handle, generate a personalized link
   • show current/next tier
   • show projected earnings (slider for referrals)
═══════════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react'
import { REFERRAL_TIERS, currentTier, nextTier, makeReferralLink } from '../lib/monopoly'
import { trackEvent } from '../lib/analytics'

export default function ReferralEngine() {
  const [handle, setHandle] = useState('')
  const [link, setLink] = useState('')
  const [count, setCount] = useState(7)
  const [copied, setCopied] = useState(false)

  const tier = currentTier(count)
  const next = nextTier(count)
  const usdPerSignup = 100 * tier.multiplier
  const projected = useMemo(() => count * usdPerSignup, [count, usdPerSignup])

  const generate = () => {
    const l = makeReferralLink(handle || 'guest')
    setLink(l)
    trackEvent('feature_clicked', { feature: 'referral_link_generated', location: 'referral_engine' })
  }
  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      trackEvent('feature_clicked', { feature: 'referral_link_copied', location: 'referral_engine' })
    } catch { /* ignore */ }
  }

  return (
    <div className="glass-card" style={{ padding: 'clamp(20px, 3vw, 32px)', borderRadius: 24, position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }} className="mobile-stack">

        {/* Left: link generator */}
        <div>
          <div className="t-caps" style={{ color: '#f59e0b', marginBottom: 10 }}>Ambassador Program</div>
          <h3 className="t-h2" style={{ marginBottom: 10 }}>
            Earn up to <span className="t-grad">$300</span> per signup
          </h3>
          <p className="t-lead" style={{ marginBottom: 22, fontSize: 15 }}>
            The world's most generous PropTech referral program. 4 tiers, lifetime revenue share at the top.
          </p>

          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Your handle</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              type="text"
              placeholder="your-name"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              style={{
                flex: 1, padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: 14, letterSpacing: '-0.005em',
                outline: 'none',
              }}
            />
            <button className="btn-primary" onClick={generate} style={{ padding: '10px 18px', fontSize: 13 }}>
              Generate
            </button>
          </div>

          {link && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(42,157,232,0.10), rgba(167,139,250,0.06))',
              border: '1px solid rgba(42,157,232,0.30)',
              borderRadius: 12, marginBottom: 18,
            }}>
              <code style={{
                flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5,
                color: '#39bff6', overflowX: 'auto', whiteSpace: 'nowrap',
              }}>{link}</code>
              <button onClick={copy} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tier.unlocks.map(u => (
              <span key={u} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: `${tier.color}1A`,
                border: `1px solid ${tier.color}55`,
                color: tier.color, fontSize: 11, fontWeight: 600,
              }}>✓ {u}</span>
            ))}
          </div>
        </div>

        {/* Right: tier visualizer + projection */}
        <div>
          <div className="t-caps" style={{ color: tier.color, marginBottom: 8 }}>Current tier</div>
          <div className="t-h2" style={{ marginBottom: 4, color: tier.color }}>{tier.name}</div>
          <div className="t-small" style={{ color: 'var(--text2)', marginBottom: 16 }}>
            {tier.multiplier}× commission · ${(100 * tier.multiplier).toFixed(0)} per signup
          </div>

          {/* Tier ladder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {REFERRAL_TIERS.map(t => {
              const reached = count >= t.threshold
              const isCurrent = t.threshold === tier.threshold
              return (
                <div key={t.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  background: isCurrent ? `${t.color}1A` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? `${t.color}55` : 'var(--border)'}`,
                  opacity: reached ? 1 : 0.55,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: reached ? t.color : 'rgba(255,255,255,0.08)',
                    color: reached ? '#fff' : 'var(--text3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {reached ? '✓' : t.threshold}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                  <span className="t-mono" style={{ fontSize: 12, color: t.color, fontWeight: 700 }}>
                    {t.multiplier}×
                  </span>
                </div>
              )
            })}
          </div>

          {/* Projection */}
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>
            Simulate referrals: <span style={{ color: '#fff', fontWeight: 700 }}>{count}</span>
          </label>
          <input
            type="range" min={0} max={150} value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            aria-label="Number of referrals"
            style={{ width: '100%', marginBottom: 12, accentColor: tier.color }}
          />
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(57,191,246,0.06))',
            border: '1px solid rgba(16,185,129,0.30)',
          }}>
            <div className="t-eyebrow" style={{ fontSize: 9.5 }}>Projected earnings</div>
            <div className="t-number" style={{ fontSize: 32, color: '#6ee7b7', lineHeight: 1.1 }}>
              ${projected.toLocaleString()}
            </div>
            {next && (
              <div className="t-small" style={{ color: 'var(--text2)', marginTop: 4 }}>
                {next.threshold - count} more to unlock <strong style={{ color: next.color }}>{next.name}</strong>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
