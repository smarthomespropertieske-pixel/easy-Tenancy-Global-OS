import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeepLinkParams } from '../hooks'
import { useMagnetic } from '../hooks/interactivity'
import { trackEvent } from '../lib/analytics'
import { SEO } from '../components/SEO'
import { safeLazy } from '../lib/safeLazy'

// ─── EAGER (above-the-fold + critical UI) ────────────────────────────
import MetricsTicker from '../components/MetricsTicker'
import HeroStateWidget from '../components/HeroStateWidget'
import GeoBanner from '../components/GeoBanner'
import SectionSpyNav from '../components/SectionSpyNav'
import TrustBar from '../components/TrustBar'
import ROIRibbon from '../components/ROIRibbon'
import LazySection from '../components/LazySection'
import { Icon, ArrowRight, Sparkles, Check } from '../lib/icons'

// ─── LAZY (below-the-fold — Tier 1 bundle-budget refactor v4.6) ──────
// Each section now ships as its own chunk and only loads when its
// IntersectionObserver placeholder enters/approaches the viewport.
const LogoCloud           = safeLazy(() => import('../components/LogoCloud'))
const HolyTrinityHub      = safeLazy(() => import('../components/HolyTrinityHub'))
const RadialMap           = safeLazy(() => import('../components/RadialMap'))
const AIFeed              = safeLazy(() => import('../components/AIFeed'))
const FeatureMicroTours   = safeLazy(() => import('../components/FeatureMicroTours'))
const ROICalculator       = safeLazy(() => import('../components/ROICalculator'))
const CompliancePanel     = safeLazy(() => import('../components/CompliancePanel'))
const MonopolyDashboard   = safeLazy(() => import('../components/MonopolyDashboard'))
const ReferralEngine      = safeLazy(() => import('../components/ReferralEngine'))
const RegionalPricing     = safeLazy(() => import('../components/RegionalPricing'))
const Compare             = safeLazy(() => import('../components/Compare'))
const CompetitorIntel     = safeLazy(() => import('../components/CompetitorIntel'))
const RoadmapHorizon      = safeLazy(() => import('../components/RoadmapHorizon'))
const TestimonialMarquee  = safeLazy(() => import('../components/TestimonialMarquee'))

// ── Hero Section ──────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  const params = useDeepLinkParams()
  const primaryRef = useMagnetic<HTMLButtonElement>(0.4)

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
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
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>

          {/* ── Geo-aware region pill (top of hero) ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            <GeoBanner usdPrice={49} />
            <a
              href="/global-dominance"
              className="geo-pill"
              style={{ textDecoration: 'none', color: '#2A9DE8' }}
              onClick={() => trackEvent('banner_clicked', { label: 'global_dominance_2026' })}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2A9DE8', animation: 'pulse 2s infinite' }} />
              <span>Holy Trinity 2026</span>
              <span aria-hidden="true" style={{ opacity: 0.6 }}>→</span>
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
                  padding: '6px 16px', marginBottom: 14,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#6ee7b7'
                }}
                onClick={() => trackEvent('deep_link_activated', { tenant: params.demoTenantId ?? '' })}
              >
                🔗 Demo pre-loaded: {params.demoTenantId} · Click dashboard to explore
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status-pill rail — $100B confidence (Linear / Stripe / Vercel pattern) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="hero-status-rail rv"
          >
            <a
              href="https://status.easytenancy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-status-pill"
              onClick={() => trackEvent('status_clicked', { location: 'hero' })}
            >
              <span className="hero-status-dot" />
              <span><strong>All systems operational</strong> · 99.97% uptime</span>
            </a>
            <a
              href="#compare"
              className="hero-status-pill is-version"
              onClick={() => trackEvent('changelog_clicked', { location: 'hero' })}
            >
              <Sparkles size={11} stroke={2} />
              <span><strong>v4.6</strong> · Tier-1 lazy routes · IO-gated chunks · sub-80 KB landing</span>
              <ArrowRight size={10} stroke={2} />
            </a>
          </motion.div>

          {/* Award badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="badge rv"
            style={{ marginBottom: 18, display: 'inline-flex' }}
          >
            <span className="badge-dot" />
            🏆 #1 PropTech 2026 · 50,000+ managers · 4.9/5 · 2,847 reviews
          </motion.div>

          {/* Headline — $100B kinetic display */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="t-display-2026 t-balance rv"
            style={{ marginBottom: 16 }}
          >
            The only OS your{' '}
            <span className="t-kinetic-soft">real estate portfolio</span>
            <br />
            will <span className="t-serif">ever</span> need.
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="t-lead mxa rv rv1"
            style={{ marginBottom: 22, fontSize: 'var(--fs-lg)' }}
          >
            Compliance-first. AI-powered. <span className="t-mono" style={{ color: 'var(--text)' }}>120</span> jurisdictions.
            <span className="t-mono" style={{ color: 'var(--text)' }}> 2.4M</span> leases trained.
            <strong style={{ color: '#fff' }}> Zero compliance fines.</strong>
          </motion.p>

          {/* CTA buttons — magnetic */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}
            className="rv rv2"
          >
            <button
              ref={primaryRef}
              className="btn-primary btn-magnetic ring-iri"
              onClick={() => navigate(`/app/demo?demoTenantId=${params.demoTenantId ?? 'demo-001'}`)}
              style={{ fontSize: 16, padding: '15px 32px' }}
            >
              <span>🚀 Start free — 10 min setup</span>
            </button>
            <a href="#growth-engine" className="btn-ghost" style={{ fontSize: 15, padding: '14px 28px' }}
              onClick={() => trackEvent('demo_started', { source: 'hero_secondary' })}>
              ▶ See the math (2-min)
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

          {/* Trust strip — inline guarantees (above-the-fold) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="hero-trust-strip rv rv4"
          >
            {[
              'No credit card', 'Free migration', 'Cancel any time', '24-72 h white-glove migration',
            ].map(t => (
              <span key={t} className="hero-trust-item">
                <Check size={12} stroke={2.4} />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* KPI ticker */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 1,
            background: 'var(--border)',
            borderRadius: 18,
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
            <div key={l} style={{ background: 'var(--card)', padding: '14px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }} aria-hidden="true">{i}</div>
              <div className="t-number" style={{ fontSize: 24, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{v}</div>
              <div className="t-eyebrow" style={{ fontSize: 10, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Pricing now lives in src/components/RegionalPricing.tsx ──
// ── PartnerMarquee retired — replaced by LogoCloud (v4.2) ──

// ── FAQ Section ───────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'How long does setup take?', a: 'Under 10 minutes for most users. Import via CSV, spreadsheet, or direct API migration. White-glove migration from legacy platforms is completed in 24–72 hours at zero cost.' },
    { q: 'Which countries are supported?', a: 'easyTenancy is live in 120 countries with 7 regional compliance hubs. Each market has jurisdiction-specific compliance templates, lease builder rules, and payment methods.' },
    { q: 'How does the Compliance Engine work?', a: 'Our engine monitors 47 new regulatory changes per month across 120 jurisdictions. When a law changes, it auto-updates templates, generates notices, and alerts you. We guarantee zero compliance fines.' },
    { q: 'What can the AI Copilot actually do?', a: "Our AI doesn't just manage data inside a silo. It communicates via WhatsApp (Meta), builds pipelines like an enterprise CRM (Salesforce), and optimizes global search visibility (Google). By integrating with these dominant platforms, the easyTenancy AI becomes an unassailable institutional-grade Operating System, maximizing your Net Operating Income (NOI) across global markets." },
    { q: 'How is my data secured?', a: 'SOC 2 Type II, ISO 27001, GDPR, POPIA, and 256-bit SSL. Data is encrypted at rest and in transit. We never share your data with third parties.' },
    { q: 'What is the ROI model based on?', a: 'The 400× figure is the average Year-1 ROI verified across 50,000+ customers, factoring in compliance savings, occupancy uplift, and time saved. Your specific ROI can be calculated in the ROI Calculator above.' },
  ]
  return (
    <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
      <div className="inner">
        <div className="tc rv" style={{ marginBottom: 48 }}>
          <div className="badge" style={{ display: 'inline-flex', marginBottom: 16 }}><span className="badge-dot" />FAQ</div>
          <h2 className="t-display">Everything you need to <span className="t-grad">know</span></h2>
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

// ── Footer v2 ─────────────────────────────────────────────────
//  Production-grade footer with real link structure, trust pills,
//  status dot, and the giant brand wordmark watermark (Linear/Vercel pattern).
function Footer() {
  const columns: { title: string; links: { label: string; href: string; isNew?: boolean; external?: boolean }[] }[] = [
    {
      title: 'Platform',
      links: [
        { label: 'AI Copilot', href: '#ai-copilot' },
        { label: 'Compliance Engine', href: '#platform' },
        { label: 'Collections', href: '/app/demo' },
        { label: 'Smart Leasing', href: '/app/demo' },
        { label: 'Predictive OS', href: '/predictive-os', isNew: true },
        { label: 'Spatial Staging', href: '/spatial-staging' },
        { label: 'Roadmap', href: '#roadmap', isNew: true },
      ],
    },
    {
      title: 'Markets',
      links: [
        { label: 'Africa', href: '/?country=KE' },
        { label: 'Middle East', href: '/?country=AE' },
        { label: 'Asia-Pacific', href: '/?country=SG' },
        { label: 'Europe', href: '/?country=GB' },
        { label: 'Americas', href: '/?country=US' },
        { label: 'Global Dominance', href: '/global-dominance' },
      ],
    },
    {
      title: 'Trust',
      links: [
        { label: 'Security', href: '/security-demo' },
        { label: 'Trust Center', href: 'https://trust.easytenancy.com', external: true },
        { label: 'SOC 2 Report', href: 'https://trust.easytenancy.com/soc2', external: true },
        { label: 'security.txt', href: '/.well-known/security.txt', external: true },
        { label: 'Status', href: 'https://status.easytenancy.com', external: true },
        { label: 'Changelog', href: '#hero' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#hero' },
        { label: 'Careers', href: '#hero' },
        { label: 'Customers', href: '#testimonials' },
        { label: 'Compare', href: '#compare' },
        { label: 'Press', href: 'mailto:press@easytenancy.com', external: true },
        { label: 'Contact', href: 'mailto:hello@easytenancy.com', external: true },
      ],
    },
  ]
  const legal = [
    { label: 'Privacy', href: '#hero' },
    { label: 'Terms', href: '#hero' },
    { label: 'DPA', href: '#hero' },
    { label: 'GDPR', href: '#hero' },
    { label: 'Cookies', href: '#hero' },
  ]
  return (
    <footer className="footer-v2">
      <div className="footer-v2-inner">
        <div className="footer-v2-top">
          <div className="footer-v2-brand">
            <div className="footer-v2-mark">easyTenancy</div>
            <p className="footer-v2-tag">
              The global real-estate operating system. AI-powered, compliance-first, deployed at the edge across 120 countries.
            </p>
            <a href="https://status.easytenancy.com" className="footer-v2-status" target="_blank" rel="noreferrer">
              <span className="footer-v2-status-dot" />
              All systems operational · 99.97%
            </a>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <div className="footer-v2-col-title">{col.title}</div>
              <ul className="footer-v2-col-list">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.external ? '_blank' : undefined}
                      rel={l.external ? 'noreferrer' : undefined}
                    >
                      {l.label}
                      {l.isNew && <span className="footer-v2-new">new</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-v2-bottom">
          <span className="footer-v2-copy">
            © 2026 easyTenancy Inc. · 4 edge regions ·{' '}
            {legal.map((l, i) => (
              <React.Fragment key={l.label}>
                <a href={l.href} style={{ color: 'var(--text3)', textDecoration: 'none', borderBottom: '1px dotted var(--border)' }}>{l.label}</a>
                {i < legal.length - 1 && ' · '}
              </React.Fragment>
            ))}
          </span>
          <span className="footer-v2-meta">
            {['SOC 2', 'ISO 27001', 'GDPR', 'POPIA', 'RERA', 'PCI L1'].map(c => (
              <span key={c} className="footer-v2-cert">{c}</span>
            ))}
          </span>
        </div>
        <div className="footer-v2-wordmark" aria-hidden="true">easyTenancy</div>
      </div>
    </footer>
  )
}

// ── Main HomePage ─────────────────────────────────────────────
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
}

export default function HomePage() {
  const params = useDeepLinkParams()

  return (
    <motion.div initial="initial" animate="enter" exit="exit" variants={PAGE_VARIANTS}>
      <SEO title="easyTenancy Global OS" description="The ultimate real estate operating system for global dominance." url="/" />
      {/* v4.4 — Live ROI Ribbon (sticky-on-scroll, above hero, UX directive #3) */}
      <ROIRibbon />

      <Hero />

      {/* TrustBar — 7-chip compliance strip directly under hero (EAGER — above fold) */}
      <TrustBar />

      {/* ─── v4.6 Tier 1: everything below is IO-gated lazy ─── */}

      {/* LogoCloud — partner / integration marquee */}
      <LazySection minHeight={140} rootMargin="320px 0px">
        <LogoCloud />
      </LazySection>

      {/* Live Metrics */}
      <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="inner">
          <div className="tc rv" style={{ marginBottom: 40 }}>
            <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Live Platform Data</div>
            <h2 className="t-display">Real-time metrics <span className="t-grad">from production</span></h2>
          </div>
          <MetricsTicker />
        </div>
      </section>

      {/* Holy Trinity 2026 — Meta → Salesforce → Google integration hub */}
      <LazySection minHeight={620} rootMargin="280px 0px">
        <HolyTrinityHub />
      </LazySection>

      {/* Radial Map — D3-heavy, lazy + deferred network */}
      <LazySection minHeight={520} rootMargin="240px 0px">
        <section style={{ overflow: 'hidden' }}>
          <div className="inner">
            <div className="tc rv" style={{ marginBottom: 40 }}>
              <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Platform Architecture</div>
              <h2 className="t-display">One platform. <span className="t-grad">Every module connected.</span></h2>
              <p className="t-lead mxa tc" style={{ marginTop: 14 }}>Click any node to explore features and metrics.</p>
            </div>
            <RadialMap />
          </div>
        </section>
      </LazySection>

      {/* AI Feed */}
      <LazySection minHeight={620} rootMargin="240px 0px">
        <section id="ai-copilot" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="inner">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
              <div className="rv">
                <div className="badge" style={{ marginBottom: 16 }}><span className="badge-dot" />AI Copilot</div>
                <h2 className="t-display" style={{ marginBottom: 16 }}>
                  Real-time intelligence.<br /><span className="t-grad">Zero manual work.</span>
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
      </LazySection>

      {/* Feature Micro-Tours */}
      <LazySection minHeight={680} rootMargin="240px 0px">
        <section id="platform">
          <div className="inner">
            <div className="tc rv" style={{ marginBottom: 48 }}>
              <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Feature Tours</div>
              <h2 className="t-display">See it work in <span className="t-grad">30 seconds</span></h2>
              <p className="t-lead mxa tc" style={{ marginTop: 14 }}>Interactive inline tours — no navigation required.</p>
            </div>
            <FeatureMicroTours />
          </div>
        </section>
      </LazySection>

      {/* ROI Calculator */}
      <LazySection minHeight={620} rootMargin="240px 0px">
        <section id="roi" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="inner">
            <div className="tc rv" style={{ marginBottom: 48 }}>
              <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />ROI Calculator</div>
              <h2 className="t-display">Calculate your <span className="t-grad">exact return</span></h2>
              <p className="t-lead mxa tc" style={{ marginTop: 14 }}>Adjust your numbers. Preview in real dashboard.</p>
            </div>
            <div className="glass-card" style={{ padding: '40px', borderRadius: 24, position: 'relative' }}>
              <ROICalculator />
            </div>
          </div>
        </section>
      </LazySection>

      {/* Compliance Panel */}
      <LazySection minHeight={520} rootMargin="240px 0px">
        <section>
          <div className="inner">
            <div className="tc rv" style={{ marginBottom: 40 }}>
              <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}><span className="badge-dot" />Legal Backing</div>
              <h2 className="t-display">Compliance <span className="t-grad">guaranteed</span></h2>
              <p className="t-lead mxa tc" style={{ marginTop: 14 }}>Expand to see indemnity details, live law feed, and notice preview.</p>
            </div>
            <CompliancePanel />
          </div>
        </section>
      </LazySection>

      {/* Marketing Monopoly — growth loops, network effects, distribution */}
      <LazySection minHeight={820} rootMargin="240px 0px">
        <MonopolyDashboard />
      </LazySection>

      {/* Ambassador / Referral Engine */}
      <LazySection minHeight={580} rootMargin="240px 0px">
        <section id="referral" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="inner">
            <div className="tc rv" style={{ marginBottom: 32 }}>
              <div className="badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
                <span className="badge-dot" />Ambassador Program
              </div>
              <h2 className="t-display">
                Refer the world. <span className="t-grad">Earn for life.</span>
              </h2>
              <p className="t-lead mxa tc" style={{ marginTop: 14 }}>
                The most generous PropTech referral program ever offered. Four tiers. Lifetime revenue share at the top.
              </p>
            </div>
            <ReferralEngine />
          </div>
        </section>
      </LazySection>

      {/* Regional Pricing — PPP-adjusted, region-aware bundles */}
      <LazySection minHeight={680} rootMargin="240px 0px">
        <RegionalPricing />
      </LazySection>

      {/* Compare — easyTenancy vs Yardi / AppFolio / Buildium */}
      <LazySection minHeight={620} rootMargin="240px 0px">
        <Compare />
      </LazySection>

      {/* Competitor Intelligence — live PropTech news via TinyFish edge proxy */}
      <LazySection minHeight={520} rootMargin="240px 0px">
        <CompetitorIntel />
      </LazySection>

      {/* v4.4 — Roadmap Horizon: honest "what's coming" for Features 5/6/F7-F10 */}
      <LazySection minHeight={680} rootMargin="240px 0px">
        <RoadmapHorizon />
      </LazySection>

      {/* Testimonials — dual-column marquee */}
      <LazySection minHeight={420} rootMargin="240px 0px">
        <TestimonialMarquee />
      </LazySection>

      <FAQ />
      <Footer />

      {/* ── In-page scroll-spy rail (appears after hero) ── */}
      <SectionSpyNav
        showAfter={520}
        items={[
          { id: 'hero',            label: 'Top',      icon: '↑' },
          { id: 'ai-copilot',      label: 'AI',       icon: '◈' },
          { id: 'platform',        label: 'Platform', icon: '◇' },
          { id: 'roi',             label: 'ROI',      icon: '$' },
          { id: 'growth-engine',   label: 'Growth',   icon: '↻' },
          { id: 'referral',        label: 'Referral', icon: '◐' },
          { id: 'pricing',         label: 'Pricing',  icon: '◆' },
          { id: 'compare',         label: 'Compare',  icon: '⇌' },
          { id: 'intel',           label: 'Intel',    icon: '⚡' },
          { id: 'roadmap',         label: 'Roadmap',  icon: '◐' },
          { id: 'testimonials',    label: 'Reviews',  icon: '★' },
        ]}
      />
    </motion.div>
  )
}
