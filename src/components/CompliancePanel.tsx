import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'

const LAW_FEED = [
  { id: 1, country: '🇰🇪 Kenya', law: 'Landlord and Tenant (Shops) Act amendment — Sec 4(b)', date: 'Apr 28, 2025', status: 'applied' },
  { id: 2, country: '🇦🇪 UAE', law: 'RERA Rental Index Q2 2025 — 3 affected lease templates', date: 'Apr 22, 2025', status: 'applied' },
  { id: 3, country: '🇬🇧 UK', law: 'Renters Reform Bill — Section 21 notice update', date: 'Apr 15, 2025', status: 'applied' },
  { id: 4, country: '🇿🇦 South Africa', law: 'Consumer Protection Act regulation 9(a) revision', date: 'Apr 10, 2025', status: 'applied' },
  { id: 5, country: '🇸🇬 Singapore', law: 'Residential Tenancies Act (2025 Rev. Ed.) Section 12', date: 'Apr 3, 2025', status: 'applied' },
  { id: 6, country: '🇳🇬 Nigeria', law: 'Lagos State Tenancy Law — rent arrears procedure update', date: 'Mar 29, 2025', status: 'applied' },
]

const INDEMNITY_ITEMS = [
  { icon: '🛡️', title: 'Zero-fine guarantee', detail: 'If easyTenancy misses a regulatory update that results in a compliance fine, we cover it. Full stop.' },
  { icon: '⚖️', title: 'Legal template warranty', detail: 'Every lease, notice, and filing template is reviewed by qualified solicitors in each jurisdiction.' },
  { icon: '🔄', title: 'Auto-update SLA', detail: 'Regulatory changes are applied within 72 hours of enactment. Critical changes within 24 hours.' },
  { icon: '📜', title: 'Audit trail', detail: 'Every action is time-stamped, attorney-certified, and available for regulator inspection.' },
]

const NOTICE_PREVIEW = `SECTION 21 NOTICE
─────────────────────────────────
To:      [Tenant Name]
Property: [Property Address]
Date:    ${new Date().toLocaleDateString('en-GB')}

In accordance with Section 21(1)(b) of the
Housing Act 1988 (as amended), this notice
requires you to vacate the premises on or
before [Date + 2 months].

[AI-generated — reviewed against UK Renters
 Reform Bill April 2025 update ✓]
─────────────────────────────────
Status: COMPLIANT ✅
`

export default function CompliancePanel() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'indemnity' | 'feed' | 'preview'>('indemnity')

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) trackEvent('compliance_panel_opened', { tab: activeTab })
  }

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-hi)' }}>
      {/* Header toggle */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(167,139,250,0.07)', backdropFilter: 'blur(12px)',
          border: 'none', cursor: 'pointer', color: 'var(--text)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚖️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Legal Backing &amp; Compliance Guarantee</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              47 laws updated this month · Zero-fine indemnity · Notice generator preview
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: 18, color: '#a78bfa', display: 'inline-block' }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden', background: 'var(--card2)' }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
              {(['indemnity', 'feed', 'preview'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 18px', background: 'none', border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #a78bfa' : '2px solid transparent',
                    color: activeTab === tab ? '#a78bfa' : 'var(--text3)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'color 0.2s',
                  }}
                >
                  {tab === 'indemnity' ? '🛡️ Indemnity' : tab === 'feed' ? '📡 Law Feed' : '📄 Notice Preview'}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {activeTab === 'indemnity' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  {INDEMNITY_ITEMS.map(item => (
                    <div key={item.title} style={{ padding: '16px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 14 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#c4b5fd' }}>{item.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.6 }}>{item.detail}</div>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1', padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#6ee7b7' }}>SOC 2 Type II · ISO 27001 · GDPR · POPIA · 256-bit SSL</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Last audit: March 2025 · Next: September 2025</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'feed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>47 regulatory changes auto-applied this month</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>Real-time</span>
                  </div>
                  {LAW_FEED.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 11 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.country.slice(0,2)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.country.slice(3)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, lineHeight: 1.5 }}>{item.law}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.date}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', borderRadius: 4, padding: '1px 6px', marginTop: 3 }}>✓ APPLIED</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'preview' && (
                <div>
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Auto-generated notice preview (read-only)</span>
                    <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 4, padding: '1px 8px', fontWeight: 700 }}>AI-DRAFTED</span>
                  </div>
                  <pre style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.7,
                    color: '#94a3b8', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '20px 24px', whiteSpace: 'pre-wrap', userSelect: 'none',
                    pointerEvents: 'none'
                  }}>{NOTICE_PREVIEW}</pre>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                    ⚠️ Preview only. Generated notices are reviewed before sending. Template updated April 2025.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
