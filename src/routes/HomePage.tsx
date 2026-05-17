import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeepLinkParams } from '../hooks'
import { trackEvent } from '../lib/analytics'
import MetricsTicker from '../components/MetricsTicker'
import RadialMap from '../components/RadialMap'
import AIFeed from '../components/AIFeed'
import ROICalculator from '../components/ROICalculator'
import CompliancePanel from '../components/CompliancePanel'
import FeatureMicroTours from '../components/FeatureMicroTours'
import HeroStateWidget from '../components/HeroStateWidget'

// ── Hero Section ──────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  const params = useDeepLinkParams()

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
      }}
    >
      {/* Background orbs */}
      <div className="orb orb-blue" style={{ width: 700, height: 700, top: -200, left: -200, opacity: 0.18 }} />
      <div className="orb orb-purple" style={{ width: 500, height: 500, bottom: -100, right: -100, opacity: 0.15 }} />
      <div className="orb orb-cyan" style={{ width: 300, height: 300, top: '30%', right: '20%', opacity: 0.1 }} />

      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(57,191,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(57,191,246,0.04) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
      }} />

      <div className="inner" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>

          {/* ── Global Dominance 2026 Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20 }}
          >
            <a
              href="/global-dominance"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '8px 20px',
                background: 'linear-gradient(135deg, rgba(26,109,181,0.15), rgba(42,157,110,0.12))',
                border: '1px solid rgba(26,109,181,0.4)',
                borderRadius: 999, fontSize: 12, fontWeight: 700,
                color: '#2A9DE8', textDecoration: 'none',
                backdropFilter: 'blur(8px)',
              }}
              onClick={() => trackEvent('banner_clicked', { label: 'global_dominance_2026' })}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2A9DE8', animation: 'pulse 2s infinite' }} />
              🚀 Global Dominance 2026 — Holy Trinity Blueprint: Google · Salesforce · Meta
              <span style={{ opacity: 0.6 }}>→</span>
            </a>
          </motion.div>

          {/* Deep-link activation badge */}
          <AnimatePresence>
            {params.demoTenantId && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 16px', marginBottom: 16,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#6ee7b7'
                }}
                onClick={() => trackEvent('deep_link_activated', { tenant: params.demoTenantId ?? '' })}
              >
                🔗 Demo pre-loaded: {params.demoTenantId} · Click dashboard to explore
              </motion.div>
            )}
          </AnimatePresence>

          {/* Award badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="badge rv"
            style={{ marginBottom: 24, display: 'inline-flex' }}
          >
            <span className="badge-dot" />
            🏆 #1 PropTech 2025 · 50,000+ managers · 4.9/5 · 2,847 reviews
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="sec-title rv"
            style={{ fontSize: 'clamp(36px, 6vw, 72px)', marginBottom: 20 }}
          >
            The only OS your{' '}
            <span className="grad-text">real estate portfolio</span>{' '}
            will ever need
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="sec-sub mxa tc rv rv1"
            style={{ marginBottom: 36 }}
          >
            Compliance-first. AI-powered. 120 jurisdictions. 2.4M leases trained.
            <strong style={{ color: '#fff' }}> Zero compliance fines.</strong>
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}
            className="rv rv2"
          >
            <button
              className="btn-primary"
              onClick={() => navigate(`/app/demo?demoTenantId=${params.demoTenantId ?? 'demo-001'}`)}
              style={{ fontSize: 16, padding: '15px 32px' }}
            >
              🚀 Start free — 10 min setup
            </button>
            <a href="#demo" className="btn-ghost" style={{ fontSize: 15, padding: '14px 28px' }}
              onClick={() => trackEvent('demo_started', { source: 'hero_secondary' })}>
              ▶ Watch 2-min demo
            </a>
          </motion.div>

          {/* State-injected demo widget — replaces email form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="rv rv3"
          >
            <HeroStateWidget />
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28, fontSize: 12, color: 'var(--text3)' }}
            className="rv rv4"
          >
            {['✅ No credit card', '✅ Free migration', '✅ Cancel any time', '🛡️ SOC2 · ISO27001 · GDPR'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </motion.div>
        </div>

        {/* KPI ticker */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            marginTop: 64,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 1,
            background: 'var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
          className="rv rv5"
        >
          {[
            { v: '50,000+', l: 'Property Managers', i: '👥' },
            { v: '2.4M', l: 'Leases', i: '📄' },
            { v: '120', l: 'Countries', i: '🌍' },
            { v: '99.97%', l: 'Uptime', i: '⚡' },
            { v: '<100ms', l: 'Latency', i: '🚀' },
          ].map(({ v, l, i }) => (
            <div key={l} style={{ background: 'var(--card)', padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{i}</div>
              <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Partner Marquee ───────────────────────────────────────────
function PartnerMarquee() {
  const partners = ['Actis Capital', 'Knight Frank', 'JLL', 'Savills', 'CBRE', 'Cushman & Wakefield', 'Colliers', 'Greystar', 'Brookfield', 'Blackstone', 'Ares Management', 'Nuveen Real Estate']
  return (
    <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', gap: 56, whiteSpace: 'nowrap' }}>
        {[...partners, ...partners].map((p, i) => (
          <span key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p}</span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  )
}

// ── Pricing Section ───────────────────────────────────────────
function Pricing() {
  const [annual, setAnnual] = useState(false)
  const navigate = useNavigate()
  const plans = [
    { name: 'Starter', price: 0, annualPrice: 0, units: '≤5 units', color: '#64748b', features: ['5 units', 'Basic compliance', 'Email support', 'Mobile app'], cta: 'Start free', popular: false },
    { name: 'Professional', price: annual ? 39 : 49, annualPrice: 39, units: '≤100 units', color: '#39bff6', features: ['100 units', 'AI Copilot 50 actions/day', 'Full compliance engine', 'Priority support', 'All payment methods'], cta: 'Start trial', popular: true },
    { name: 'Portfolio', price: annual ? 119 : 149, annualPrice: 119, units: 'Unlimited', color: '#a78bfa', features: ['Unlimited units', 'Unlimited AI Copilot', '120 jurisdiction packs', 'White-glove onboarding', 'IFRS 16 reporting'], cta: 'Start trial', popular: false },
    { name: 'Enterprise', price: -1, annualPrice: -1, units: 'Custom', color: '#f59e0b', features: ['White-label', 'Dedicated infra', 'Custom integrations', 'SLA guarantee', '24/7 dedicated support'], cta: 'Contact sales', popular: false },
  ]

  return (
    <section id="pricing">
      <div className="inner">
        <div className="tc rv" style={{ marginBottom: 48 }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 16 }}><span className="badge-dot" />Pricing</div>
          <h2 className="sec-title">Start free. <span className="grad-text">Scale forever.</span></h2>
          <p className="sec-sub mxa tc" style={{ marginTop: 12 }}>No hidden fees. Free migration. Cancel any time.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '6px 8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 13, color: annual ? 'var(--text3)' : 'var(--text)', fontWeight: 600 }}>Monthly</span>
            <button
              onClick={() => { setAnnual(a => !a); trackEvent('pricing_toggled', { to: annual ? 'monthly' : 'annual' }) }}
              style={{ width: 44, height: 24, borderRadius: 12, background: annual ? 'var(--grad)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}
            >
              <div style={{ position: 'absolute', top: 3, left: annual ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? 'var(--text)' : 'var(--text3)', fontWeight: 600 }}>Annual</span>
            {annual && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, padding: '2px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 6 }}>Save 20%</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="rv"
              style={{ transitionDelay: `${i * 0.08}s` }}
              initial={false}
            >
              <div
                className="glass-card"
                style={{
                  padding: '28px 24px',
                  borderRadius: 20,
                  position: 'relative',
                  borderTop: `2px solid ${plan.color}55`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', background: 'var(--grad)', borderRadius: '0 0 10px 10px', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ marginBottom: 16 }}>
                  {plan.price === -1 ? (
                    <span style={{ fontSize: 32, fontWeight: 900 }}>Custom</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1.5px' }}>${plan.price}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>/mo</span>
                    </>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{plan.units}</div>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  className={plan.popular ? 'btn-primary' : 'btn-ghost'}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                  onClick={() => {
                    trackEvent('cta_clicked', { plan: plan.name, location: 'pricing' })
                    navigate(`/app/demo?demoTenantId=demo-001&plan=${plan.name.toLowerCase()}`)
                  }}
                >
                  {plan.cta} →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ Section ───────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'How long does setup take?', a: 'Under 10 minutes for most users. Import via CSV, spreadsheet, or direct API migration. White-glove migration from legacy platforms is completed in 24–72 hours at zero cost.' },
    { q: 'Which countries are supported?', a: 'easyTenancy is live in 120 countries with 7 regional compliance hubs. Each market has jurisdiction-specific compliance templates, lease builder rules, and payment methods.' },
    { q: 'How does the Compliance Engine work?', a: 'Our engine monitors 47 new regulatory changes per month across 120 jurisdictions. When a law changes, it auto-updates templates, generates notices, and alerts you. We guarantee zero compliance fines.' },
    { q: 'What can the AI Copilot actually do?', a: 'AI Copilot is trained on 6 years of data from 2.4M leases. It surfaces 48 daily actions: predictive vacancy detection (34 days advance), dynamic rent pricing (+6.2% uplift), autonomous notice drafting, tenant risk scoring, and arrears escalation — 24/7.' },
    { q: 'How is my data secured?', a: 'SOC 2 Type II, ISO 27001, GDPR, POPIA, and 256-bit SSL. Data is encrypted at rest and in transit. We never share your data with third parties.' },
    { q: 'What is the ROI model based on?', a: 'The 400× figure is the average Year-1 ROI verified across 50,000+ customers, factoring in compliance savings, occupancy uplift, and time saved. Your specific ROI can be calculated in the ROI Calculator above.' },
  ]
  return (
    <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
      <div className="inner">
        <div className="tc rv" style={{ marginBottom: 48 }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 16 }}><span className="badge-dot" />FAQ</div>
          <h2 className="sec-title">Everything you need to <span className="grad-text">know</span></h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720, margin: '0 auto' }}>
          {items.map((item, i) => (
            <div key={i} className="rv" style={{ transitionDelay: `${i * 0.05}s` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', padding: '16px 20px',
                  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)', borderRadius: 14,
                  color: 'var(--text)', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} style={{ fontSize: 20, color: 'var(--blue)', flexShrink: 0, fontWeight: 300 }}>+</motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '14px 20px 6px', fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 }}>{item.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '64px 0 32px' }}>
      <div className="inner">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 12 }}>easyTenancy</div>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 200 }}>The global real estate operating system. AI-powered. Compliance-first.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {['SOC 2', 'ISO 27001', 'GDPR', 'POPIA'].map(c => (
                <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text3)' }}>{c}</span>
              ))}
            </div>
          </div>
          {[
            { title: 'Platform', links: ['AI Copilot', 'Compliance Engine', 'Collections', 'Smart Leasing', 'Maintenance'] },
            { title: 'Markets', links: ['Africa', 'Middle East', 'Asia-Pacific', 'Europe', 'Americas'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press', 'Status'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR', 'Cookies'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <li key={l}><a href="#" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')} onMouseOut={e => (e.currentTarget.style.color = 'var(--text3)')}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
          <span>© 2025 easyTenancy Inc. All rights reserved.</span>
          <span>⚡ 99.97% uptime · &lt;100ms · 4 edge regions</span>
        </div>
      </div>
    </footer>
  )
}

// ── Main HomePage ─────────────────────────────────────────────
export default function HomePage() {
  const params = useDeepLinkParams()

  return (
    <>
      <Hero />
      <PartnerMarquee />

      {/* Live Metrics */}
      <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 40 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Live Platform Data</div>
            <h2 className="sec-title">Real-time metrics <span className="grad-text">from production</span></h2>
          </div>
          <MetricsTicker />
        </div>
      </section>

      {/* Radial Map — replaces static "Trusted By" */}
      <section style={{ overflow: 'hidden' }}>
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 40 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Platform Architecture</div>
            <h2 className="sec-title">One platform. <span className="grad-text">Every module connected.</span></h2>
            <p className="sec-sub mxa tc" style={{ marginTop: 12 }}>Click any node to explore features and metrics.</p>
          </div>
          <RadialMap />
        </div>
      </section>

      {/* AI Feed */}
      <section id="ai-copilot" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="inner">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <div className="rv">
              <div className="badge" style={{ marginBottom: 16 }}><span className="badge-dot" />AI Copilot</div>
              <h2 className="sec-title" style={{ marginBottom: 16 }}>
                Real-time intelligence.<br /><span className="grad-text">Zero manual work.</span>
              </h2>
              <p className="sec-sub" style={{ marginBottom: 24 }}>
                Every compliance event, payment, maintenance ticket, and lease signal streams live. Click any event to route into the full property dashboard.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '🤖', t: '48 actions/day per portfolio', d: 'AI handles rent, compliance, screening autonomously' },
                  { icon: '📡', t: 'WebSocket live stream', d: 'Real-time events, no page refresh required' },
                  { icon: '🔗', t: 'Deep-link routing', d: 'Every event routes to the exact property section' },
                ].map(item => (
                  <div key={item.t} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              {params.demoTenantId && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(57,191,246,0.08)', border: '1px solid rgba(57,191,246,0.2)', borderRadius: 12, fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                  🔗 Deep-link active — events routing to {params.demoTenantId}
                </div>
              )}
            </div>
            <div className="rv rv1">
              <div className="glass-card" style={{ padding: '24px', borderRadius: 20, position: 'relative' }}>
                <AIFeed />
              </div>
            </div>
          </div>
          <style>{`@media(max-width:768px){#ai-copilot .inner>div{grid-template-columns:1fr!important;gap:32px!important}}`}</style>
        </div>
      </section>

      {/* Feature Micro-Tours */}
      <section id="platform">
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 48 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Feature Tours</div>
            <h2 className="sec-title">See it work in <span className="grad-text">30 seconds</span></h2>
            <p className="sec-sub mxa tc" style={{ marginTop: 12 }}>Interactive inline tours — no navigation required.</p>
          </div>
          <FeatureMicroTours />
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 48 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />ROI Calculator</div>
            <h2 className="sec-title">Calculate your <span className="grad-text">exact return</span></h2>
            <p className="sec-sub mxa tc" style={{ marginTop: 12 }}>Adjust your numbers. Preview in real dashboard.</p>
          </div>
          <div className="glass-card" style={{ padding: '40px', borderRadius: 24, position: 'relative' }}>
            <ROICalculator />
          </div>
        </div>
      </section>

      {/* Compliance Panel */}
      <section>
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 40 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Legal Backing</div>
            <h2 className="sec-title">Compliance <span className="grad-text">guaranteed</span></h2>
            <p className="sec-sub mxa tc" style={{ marginTop: 12 }}>Expand to see indemnity details, live law feed, and notice preview.</p>
          </div>
          <CompliancePanel />
        </div>
      </section>

      <Pricing />
      <FAQ />
      <Footer />
    </>
  )
}
