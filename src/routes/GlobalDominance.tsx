import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../lib/tokens'
import SovereignPageHeader from '../components/SovereignPageHeader'

// ── Types ─────────────────────────────────────────────────────────
interface Metric { label: string; value: string; delta: string; icon: string }
interface Pillar  { id: string; title: string; sub: string; icon: string; color: string; items: string[] }
interface GapRow  { platform: string; weakness: string; ourFix: string; impact: string }
interface Sprint  { q: string; label: string; tasks: string[]; color: string }
interface Revenue { model: string; desc: string; target: string; icon: string; color: string }

// ── Data ─────────────────────────────────────────────────────────
const LIVE_METRICS: Metric[] = [
  { label: 'Countries Covered',    value: '127',    delta: '+7 this quarter',  icon: '🌍' },
  { label: 'Active Units Managed', value: '1.2M+',  delta: '+140K this month', icon: '🏢' },
  { label: 'AI Predictions/day',   value: '48M',    delta: 'Gemini 3 powered', icon: '🧠' },
  { label: 'ROI Multiplier',       value: '400×',   delta: 'Avg. client return',icon: '📈' },
  { label: 'Leases Processed',     value: '2.4M',   delta: 'Smart contracts',  icon: '📄' },
  { label: 'Compliance Rate',      value: '100%',   delta: 'Einstein GPT audit',icon: '✅' },
]

const PILLARS: Pillar[] = [
  {
    id: 'google',
    title: 'Google Antigravity Infrastructure',
    sub: 'Gemini 3 · Vertex AI · TPU Ironwood · Global Fiber',
    icon: '⚡',
    color: BRAND.blueLight,
    items: [
      'Gemini 3 Ultra — 2M token context, multimodal property analysis',
      'Vertex AI Agent Platform — autonomous lease negotiation agents',
      'TPU Ironwood — 42.5 PFLOPS inference for real-time valuation',
      'Google Global Fiber — sub-5ms edge response in 35+ regions',
      'Project Astra — universal AI assistant embedded in every screen',
      'Gemini Live API — proactive audio alerts for rent & compliance',
    ],
  },
  {
    id: 'salesforce',
    title: 'Salesforce Predictive Life Management',
    sub: 'Einstein GPT · Data Cloud · Agentforce · Flow Automation',
    icon: '🎯',
    color: BRAND.blue,
    items: [
      'Einstein Prediction Builder — churn risk, renewal probability scores',
      'Data Cloud — unified tenant + property + market data lake',
      'Agentforce — autonomous AI agents handling 80% of routine ops',
      'Flow Automation — 500+ pre-built triggers (late rent → eviction flow)',
      'Predictive Lead Scoring — converts 3× more property inquiries',
      'Einstein Copilot — natural language query across 10M+ records',
    ],
  },
  {
    id: 'meta',
    title: 'Meta Spatial Social Ecosystem',
    sub: 'Presence Platform · Quest 3 · Llama 4 · Social Graph',
    icon: '🥽',
    color: BRAND.teal,
    items: [
      'WebXR passthrough AR — inspect properties in immersive-ar mode',
      'Llama 4 on-device — local AI inference, zero data leaves device',
      'Social Graph API — community building across 50K+ landlord network',
      'Movement SDK — body/eye/face tracking for virtual property tours',
      'Spatial Social Feed — AR-overlay lease status on physical buildings',
      'Meta Horizon Worlds — virtual property showcase rooms',
    ],
  },
]

const GAPS: GapRow[] = [
  { platform: 'TikTok',     weakness: 'Zero enterprise utility; ephemeral content, no CRM, banned in many markets', ourFix: 'Persistent AI memory + Salesforce CRM + compliant in 127 jurisdictions', impact: '2.1B users underserved on utility' },
  { platform: 'Instagram',  weakness: 'Shallow social graph; no spatial/AR for real transactions; ad-only revenue', ourFix: 'Meta Presence Platform AR tours + value-based micro-transactions', impact: '$47B ad revenue model disrupted' },
  { platform: 'LinkedIn',   weakness: 'Static professional network; no AI agents; no real-world asset management', ourFix: 'Agentforce autonomous agents + live property portfolio management', impact: '1B professionals need asset OS' },
  { platform: 'Zillow/REA', weakness: 'Listing-only; no post-sale management; no AI compliance; US-centric', ourFix: 'Full lifecycle OS: acquisition → management → exit in 127 countries', impact: '$16B proptech gap globally' },
  { platform: 'Salesforce', weakness: 'Enterprise-only; complex UX; no consumer social; no AR interface', ourFix: 'Consumer-grade UX + Spatial Social + WhatsApp-simple onboarding', impact: '350K enterprise clients upgradeable' },
]

const ROADMAP: Sprint[] = [
  { q: 'Q1 2025', label: 'Foundation Sprint', color: BRAND.blue, tasks: ['Vertex AI / Gemini 3 API integration', 'Einstein GPT Data Cloud connector', 'WebXR AR prototype (passthrough)', 'Llama 4 on-device inference module', 'Core property OS backend (D1 + KV)', 'Global CDN edge deployment (35 regions)'] },
  { q: 'Q2 2025', label: 'Intelligence Sprint', color: BRAND.blueLight, tasks: ['Predictive churn + renewal scoring live', 'Agentforce autonomous lease agents', 'Spatial Social AR feed (beta)', 'Gemini Live proactive audio alerts', 'Social Graph community module', '50K beta users onboarded'] },
  { q: 'Q3 2025', label: 'Scale Sprint', color: BRAND.teal, tasks: ['Meta Quest 3 native app shipped', 'Einstein Copilot natural language queries', 'Value micro-transaction payment rails', 'AI-as-a-Service API tier launched', '10M+ records in Data Cloud', 'Series B raise ($120M target)'] },
  { q: 'Q4 2025', label: 'Launch Sprint', color: '#f59e0b', tasks: ['Global launch: 50 countries Day 1', 'App Store #1 in Business category', 'TPU Ironwood real-time valuation live', 'Spatial Social full public release', 'Enterprise tier: Fortune 500 pilots', '1M active users milestone'] },
  { q: 'Q1-Q2 2026', label: 'Dominance Sprint', color: '#10b981', tasks: ['#1 Global Property OS by user count', '127 country compliance engine live', 'Project Astra universal assistant mode', 'IPO preparation / strategic partnerships', 'Google + Salesforce co-sell agreements', '400× average client ROI documented'] },
]

const REVENUE: Revenue[] = [
  { model: 'AI-as-a-Service',         desc: 'API access to our property AI models — valuations, risk scoring, compliance checks — sold per-call to banks, insurers, developers', target: '$340M ARR by 2026', icon: '🤖', color: BRAND.blue },
  { model: 'Value Micro-Transactions', desc: 'Every lease signed, rent collected, maintenance ticket resolved triggers a 0.1–0.5% micro-fee. 2.4M leases = massive volume at near-zero friction', target: '$180M ARR by 2026', icon: '⚡', color: BRAND.blueLight },
  { model: 'Spatial Commerce',         desc: 'Virtual property showcases in Meta Horizon + AR tours monetized via premium listing slots and immersive ad placements', target: '$95M ARR by 2026', icon: '🥽', color: BRAND.teal },
  { model: 'Predictive Data Licensing',desc: 'Anonymized market intelligence sold to institutional investors, hedge funds, REITs — powered by Einstein Data Cloud aggregation', target: '$210M ARR by 2026', icon: '📊', color: '#f59e0b' },
  { model: 'Enterprise SaaS Tiers',    desc: 'Pro ($299/mo), Business ($999/mo), Enterprise (custom) with Agentforce agents, unlimited properties, white-label, SLA guarantees', target: '$520M ARR by 2026', icon: '🏢', color: '#10b981' },
]

// ── Animated Counter ─────────────────────────────────────────────
function AnimCounter({ target, duration = 1800 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<boolean>(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const num = parseFloat(target.replace(/[^0-9.]/g, ''))
    const suffix = target.replace(/[0-9.]/g, '')
    if (isNaN(num)) { setDisplay(target); return }
    const steps = 60
    let step = 0
    const inc = num / steps
    const t = setInterval(() => {
      step++
      const v = Math.min(inc * step, num)
      setDisplay((v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + suffix)
      if (step >= steps) clearInterval(t)
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, duration])
  return <>{display}</>
}

// ── Pillar Card ───────────────────────────────────────────────────
function PillarCard({ pillar, active, onClick }: { pillar: Pillar; active: boolean; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      style={{
        background: active ? `rgba(${pillar.color === BRAND.blue ? '26,109,181' : pillar.color === BRAND.blueLight ? '42,157,232' : '42,157,110'},0.15)` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? pillar.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20, padding: '28px 24px', cursor: 'pointer',
        transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
      }}
    >
      {active && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 0%, ${pillar.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      )}
      <div style={{ fontSize: 36, marginBottom: 12 }}>{pillar.icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: active ? pillar.color : 'var(--white)', fontFamily: 'var(--font-head)' }}>{pillar.title}</h3>
      <p style={{ fontSize: 12, color: 'var(--mist)', marginBottom: active ? 20 : 0, lineHeight: 1.5 }}>{pillar.sub}</p>
      <AnimatePresence>
        {active && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pillar.items.map((item, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={{ fontSize: 13, color: 'var(--mist)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                <span style={{ color: pillar.color, flexShrink: 0 }}>▸</span>{item}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const GD_SECTIONS = [
  { id: 'gd-trinity',      label: 'Holy Trinity' },
  { id: 'gd-strategy',     label: 'Strategy Intel' },
  { id: 'gd-architecture', label: 'Architecture' },
  { id: 'gd-security',     label: 'Security' },
  { id: 'gd-cta',          label: 'Get Started' },
]

export default function GlobalDominance() {
  const [activePillar, setActivePillar] = useState('google')
  const [activeTab, setActiveTab] = useState<'gap' | 'revenue' | 'roadmap'>('gap')

  return (
    <main style={{ paddingTop: 64, background: 'var(--ink)', minHeight: '100vh', color: 'var(--white)' }}>

      {/* ── Sovereign Page Header ── */}
      <SovereignPageHeader
        badge="Global Dominance Blueprint 2026"
        badgeColor={BRAND.blueLight}
        title={
          <>
            The Holy Trinity
            <br />
            <span style={{ background: `linear-gradient(135deg,${BRAND.blue} 0%,${BRAND.blueLight} 50%,${BRAND.teal} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Google · Salesforce · Meta
            </span>
          </>
        }
        subtitle="easyTenancy becomes the world's #1 Super-App by fusing Gemini 3 Ultra, Salesforce Einstein, and Meta's Spatial Social ecosystem into a single sovereign property OS."
        stats={LIVE_METRICS.map(m => ({ label: m.label, value: m.value, icon: m.icon, color: BRAND.blueLight }))}
        actions={[
          { label: '📊 App Demo', href: '/app/demo' },
          { label: '⚡ Predictive OS', href: '/predictive-os' },
          { label: '🚀 Start Free', href: '/?demoTenantId=demo-001', primary: true },
        ]}
        sections={GD_SECTIONS}
      />

      {/* ── Holy Trinity Pillars ── */}
      <section id="gd-trinity" style={{ padding: '80px 0' }}>
        <div className="inner">
          <div className="tc" style={{ marginBottom: 48 }}>
            <h2 className="sec-title">The Holy Trinity Architecture</h2>
            <p className="sec-sub mxa">Three technology giants unified into a single unstoppable platform. Click each pillar to explore the tech stack.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {PILLARS.map(p => (
              <PillarCard key={p.id} pillar={p} active={activePillar === p.id} onClick={() => setActivePillar(activePillar === p.id ? '' : p.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Tabbed Analysis ── */}
      <section id="gd-strategy" style={{ padding: '80px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div className="inner">
          <div className="tc" style={{ marginBottom: 40 }}>
            <h2 className="sec-title">Strategy Intelligence</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {(['gap', 'revenue', 'roadmap'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 24px', borderRadius: 999, border: `1px solid ${activeTab === t ? BRAND.blue : 'rgba(255,255,255,0.1)'}`, background: activeTab === t ? BRAND.blue : 'transparent', color: 'var(--white)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>
                  {t === 'gap' ? '🔍 Competitive Gap' : t === 'revenue' ? '💰 Monetization 2026' : '🗓 Roadmap'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* GAP ANALYSIS */}
            {activeTab === 'gap' && (
              <motion.div key="gap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: 700 }}>
                    <thead>
                      <tr>
                        {['Platform', 'Critical Weakness', 'Our Fix (Holy Trinity)', 'Market Impact'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GAPS.map((g, i) => (
                        <motion.tr key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <td style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px 0 0 12px', fontWeight: 800, fontSize: 14, color: BRAND.blueLight, whiteSpace: 'nowrap' }}>{g.platform}</td>
                          <td style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'var(--mist)', maxWidth: 220 }}>{g.weakness}</td>
                          <td style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'var(--white)' }}>{g.ourFix}</td>
                          <td style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '0 12px 12px 0', fontSize: 12, color: BRAND.teal, fontWeight: 700, whiteSpace: 'nowrap' }}>{g.impact}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* REVENUE */}
            {activeTab === 'revenue' && (
              <motion.div key="revenue" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
                  {REVENUE.map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${r.color}33`, borderRadius: 20, padding: 24 }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: r.color, marginBottom: 8, fontFamily: 'var(--font-head)' }}>{r.model}</h3>
                      <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.6, marginBottom: 16 }}>{r.desc}</p>
                      <div style={{ background: `${r.color}15`, border: `1px solid ${r.color}33`, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: r.color }}>
                        🎯 {r.target}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 32, background: `linear-gradient(135deg, ${BRAND.blue}22, ${BRAND.teal}22)`, border: `1px solid ${BRAND.blue}44`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--mist)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Combined 2026 ARR Target</div>
                  <div style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, fontFamily: 'var(--font-head)', background: `linear-gradient(135deg,${BRAND.blue},${BRAND.blueLight},${BRAND.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-2px' }}>$1.345B ARR</div>
                  <div style={{ fontSize: 14, color: 'var(--mist)', marginTop: 8 }}>Across 5 revenue streams · No single-point ad dependency · 127 countries</div>
                </motion.div>
              </motion.div>
            )}

            {/* ROADMAP */}
            {activeTab === 'roadmap' && (
              <motion.div key="roadmap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div style={{ position: 'relative' }}>
                  {/* Timeline line */}
                  <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,${BRAND.blue},${BRAND.blueLight},${BRAND.teal},#f59e0b,#10b981)`, borderRadius: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 64 }}>
                    {ROADMAP.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ position: 'relative' }}>
                        {/* dot */}
                        <div style={{ position: 'absolute', left: -48, top: 20, width: 16, height: 16, borderRadius: '50%', background: s.color, boxShadow: `0 0 16px ${s.color}88` }} />
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}33`, borderRadius: 20, padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 800, color: s.color }}>{s.q}</span>
                            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)', fontFamily: 'var(--font-head)' }}>{s.label}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
                            {s.tasks.map((task, j) => (
                              <div key={j} style={{ fontSize: 13, color: 'var(--mist)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ color: s.color, flexShrink: 0, marginTop: 2 }}>◆</span>{task}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── System Architecture ── */}
      <section id="gd-architecture" style={{ padding: '80px 0' }}>
        <div className="inner">
          <div className="tc" style={{ marginBottom: 48 }}>
            <h2 className="sec-title">System Architecture</h2>
            <p className="sec-sub mxa">Six-layer stack engineered for sub-5ms global response, 99.999% uptime, and infinite horizontal scale.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {[
              { layer: 'L1 — Edge Compute',      color: BRAND.blue,      icon: '⚡', desc: 'Cloudflare Workers on 300+ PoPs · Google fiber peering · sub-5ms P99 globally · TPU Ironwood inference at edge' },
              { layer: 'L2 — AI Inference',       color: BRAND.blueLight, icon: '🧠', desc: 'Gemini 3 Ultra (cloud) + Llama 4 Scout (on-device) · Vertex AI Agent Platform · 2M token context window' },
              { layer: 'L3 — CRM Intelligence',   color: BRAND.teal,      icon: '🎯', desc: 'Salesforce Data Cloud · Einstein Prediction Builder · Agentforce autonomous agents · real-time Flow triggers' },
              { layer: 'L4 — Spatial Interface',  color: '#f59e0b',       icon: '🥽', desc: 'WebXR passthrough AR · Meta Quest 3 native · Movement SDK body tracking · Horizon Worlds integration' },
              { layer: 'L5 — Data Fabric',        color: '#10b981',       icon: '🗄', desc: 'Cloudflare D1 (SQLite globally distributed) · KV for hot cache · R2 for media · real-time WebSocket sync' },
              { layer: 'L6 — Compliance Engine',  color: '#a78bfa',       icon: '⚖️', desc: '127-jurisdiction rule engine · Einstein GPT legal audit · automated GDPR/POPIA/RERA compliance · zero manual review' },
            ].map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a.color}33`, borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{a.icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: a.color, marginBottom: 8, fontFamily: 'var(--font-head)' }}>{a.layer}</h4>
                <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.6 }}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UX Flow ── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div className="inner">
          <div className="tc" style={{ marginBottom: 48 }}>
            <h2 className="sec-title">User Experience Flow</h2>
            <p className="sec-sub mxa">From first tap to spatial AR — a 7-step journey that makes competitors feel like spreadsheets.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 800, margin: '0 auto' }}>
            {[
              { step: '01', title: 'Frictionless Onboarding',     desc: 'WhatsApp-level 30-second signup. Google Sign-In + biometric auth. AI immediately scans your existing portfolio via photo recognition.', icon: '📱', color: BRAND.blue },
              { step: '02', title: 'AI Portfolio Instant Audit',  desc: 'Gemini 3 analyzes all documents, leases, and photos. Einstein GPT generates immediate risk score, ROI projection, and compliance gaps.', icon: '🔍', color: BRAND.blueLight },
              { step: '03', title: 'Predictive Command Center',   desc: 'Live dashboard surfaces your top 3 actions today. Agentforce handles the other 97. You see outcomes, not tasks.', icon: '🎯', color: BRAND.teal },
              { step: '04', title: 'Spatial AR Property View',    desc: 'Point phone at any building — AR overlay shows live rent yield, vacancy rate, market comp, and tenant satisfaction score via Meta SDK.', icon: '🥽', color: '#f59e0b' },
              { step: '05', title: 'One-Tap AI Actions',          desc: 'Renew lease, send rent reminder, file maintenance, run compliance audit — all triggered by natural language. Gemini Live confirms by voice.', icon: '⚡', color: '#10b981' },
              { step: '06', title: 'Social Graph Intelligence',   desc: 'See how your portfolio compares to 50K+ landlords globally. Meta Social Graph surfaces best-in-class peers for benchmarking and collaboration.', icon: '🌐', color: '#a78bfa' },
              { step: '07', title: 'Value Capture & Exit',        desc: 'AI models optimal exit timing. Micro-transaction engine handles everything from listing to closing in 127 jurisdictions automatically.', icon: '📈', color: BRAND.blue },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ display: 'flex', gap: 24, padding: '24px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 16, background: `${step.color}20`, border: `1px solid ${step.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{step.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: step.color, letterSpacing: '0.1em' }}>STEP {step.step}</span>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--white)', fontFamily: 'var(--font-head)', margin: 0 }}>{step.title}</h4>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--mist)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 0 120px', textAlign: 'center' }}>
        <div className="inner">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ background: `linear-gradient(135deg, ${BRAND.blue}22, ${BRAND.teal}22)`, border: `1px solid ${BRAND.blue}44`, borderRadius: 32, padding: 'clamp(40px,6vw,80px)' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-1.5px', marginBottom: 16 }}>
              Ready for Global Dominance?
            </h2>
            <p style={{ fontSize: 18, color: 'var(--mist)', marginBottom: 40, maxWidth: 540, margin: '0 auto 40px' }}>
              Join 50,000+ property managers already riding the Holy Trinity wave. First mover advantage closes Q4 2025.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/app/demo?tour=auto&tab=ai" className="btn-primary" style={{ fontSize: 16, padding: '15px 36px' }}>
                Launch AI Copilot →
              </a>
              <a href="/predictive-os" className="btn-ghost" style={{ fontSize: 16, padding: '15px 32px' }}>
                Predictive Life OS
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  )
}
