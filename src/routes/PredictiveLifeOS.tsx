import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { BRAND, COUNTRY_ACCENT } from '../lib/tokens'

// ── Types ──────────────────────────────────────────────────────────
interface AgentAction { id: string; agent: string; action: string; status: 'running' | 'done' | 'queued'; time: string; value: string }
interface PredictiveCard { title: string; score: number; trend: 'up' | 'down' | 'stable'; insight: string; action: string; color: string; icon: string }
interface CRMRecord { name: string; type: 'tenant' | 'landlord' | 'lead'; score: number; nextAction: string; value: string; country: string }
interface SpatialNode { id: string; label: string; x: number; y: number; size: number; color: string; connections: string[] }

// ── Live agent log ────────────────────────────────────────────────
const AGENT_LOG: AgentAction[] = [
  { id: 'a1', agent: 'Agentforce Lease', action: 'Auto-renewed 47 leases in Nairobi portfolio', status: 'done',    time: '2s ago',  value: '+KES 2.3M' },
  { id: 'a2', agent: 'Einstein Audit',   action: 'Running RERA compliance check on Dubai units',  status: 'running', time: 'now',     value: '14 units'  },
  { id: 'a3', agent: 'Gemini Valuation', action: 'Generating market comp report — London W1',     status: 'running', time: 'now',     value: '£4.2M est' },
  { id: 'a4', agent: 'Agentforce Rent',  action: 'Sent 23 rent reminders (7-day pre-due)',        status: 'done',    time: '8s ago',  value: '$18,400'   },
  { id: 'a5', agent: 'Llama 4 Local',   action: 'On-device lease risk scoring — batch 300',       status: 'queued',  time: 'in 12s',  value: '300 leases'},
  { id: 'a6', agent: 'Flow Trigger',     action: 'Maintenance ticket → vendor assigned → ETA set', status: 'done',   time: '34s ago', value: '3 tickets' },
  { id: 'a7', agent: 'CRM Prediction',  action: 'Churn risk flagged: 5 tenants (>75% score)',    status: 'queued',  time: 'in 30s',  value: '$94K ARR'  },
]

const PREDICTIVE_CARDS: PredictiveCard[] = [
  { title: 'Portfolio Health Score',  score: 94, trend: 'up',     icon: '💚', color: '#10b981', insight: 'Einstein GPT: 94/100 — above 89% of comparable portfolios. 3 maintenance items driving the 6% gap.', action: 'Fix 3 items → hit 100' },
  { title: 'Renewal Probability',     score: 88, trend: 'up',     icon: '📄', color: BRAND.blueLight, insight: 'Gemini 3 predicts 88% of leases renewing in next 60 days based on payment history + sentiment.', action: 'Nudge 12 at-risk' },
  { title: 'Churn Risk Index',        score: 12, trend: 'down',   icon: '⚠️', color: '#f59e0b', insight: 'Only 12% churn risk — 5 tenants flagged. Agentforce will auto-send retention offers within 2 minutes.', action: 'Review 5 flagged' },
  { title: 'Yield Optimisation',      score: 76, trend: 'stable', icon: '📈', color: BRAND.blue,  insight: 'Market data from 127 countries suggests 8.3% rent increase opportunity in your KE + UK portfolios.', action: 'Apply AI pricing' },
  { title: 'Compliance Exposure',     score: 2,  trend: 'down',   icon: '⚖️', color: '#a78bfa', insight: 'Only 2 compliance gaps detected across 847 units. Einstein GPT drafts remediation notices automatically.', action: 'Auto-fix 2 gaps' },
  { title: 'Revenue Forecast (30d)',  score: 97, trend: 'up',     icon: '💰', color: BRAND.teal,  insight: 'Data Cloud forecast: $1.24M collected next 30 days — 97% confidence. 3% hedged against forex variance.', action: 'See full forecast' },
]

const CRM_RECORDS: CRMRecord[] = [
  { name: 'Amara Osei',      type: 'tenant',   score: 96, nextAction: 'Send renewal offer in 14 days', value: '$2,400/mo', country: 'KE' },
  { name: 'James Thornton',  type: 'landlord', score: 88, nextAction: 'Quarterly portfolio review call', value: '£4.2M AUM', country: 'UK' },
  { name: 'Fatima Al-Rashid',type: 'lead',     score: 74, nextAction: 'AI pitch deck auto-sent via email', value: 'AED 850K', country: 'AE' },
  { name: 'David Kim',       type: 'tenant',   score: 91, nextAction: 'Maintenance follow-up (open 3d)', value: '$3,100/mo', country: 'US' },
  { name: 'Ngozi Adeyemi',   type: 'landlord', score: 82, nextAction: 'Cross-sell compliance module', value: '₦120M AUM', country: 'ZA' },
  { name: 'Sophie Laurent',  type: 'lead',     score: 65, nextAction: 'Retarget — viewed pricing 4×', value: '€1.1M target', country: 'UK' },
]

// ── Spatial Graph Canvas ─────────────────────────────────────────
function SpatialGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const NODES: SpatialNode[] = [
    { id: 'core',    label: 'easyTenancy OS', x: 0.5,  y: 0.5,  size: 22, color: BRAND.blue,      connections: ['gemini','einstein','meta','d1','kv'] },
    { id: 'gemini',  label: 'Gemini 3 Ultra', x: 0.18, y: 0.22, size: 16, color: BRAND.blueLight,  connections: ['core','vertex'] },
    { id: 'vertex',  label: 'Vertex AI',      x: 0.08, y: 0.55, size: 13, color: '#4285f4',        connections: ['gemini','core'] },
    { id: 'einstein',label: 'Einstein GPT',   x: 0.82, y: 0.22, size: 16, color: '#00a1e0',        connections: ['core','datacloud'] },
    { id: 'datacloud',label:'Data Cloud',     x: 0.92, y: 0.5,  size: 13, color: '#0070d2',        connections: ['einstein','core'] },
    { id: 'meta',    label: 'Meta AR/VR',     x: 0.5,  y: 0.12, size: 15, color: BRAND.teal,       connections: ['core','llama'] },
    { id: 'llama',   label: 'Llama 4',        x: 0.75, y: 0.08, size: 12, color: '#00b5ad',        connections: ['meta','core'] },
    { id: 'd1',      label: 'D1 SQLite',      x: 0.22, y: 0.78, size: 12, color: '#f59e0b',        connections: ['core'] },
    { id: 'kv',      label: 'Workers KV',     x: 0.78, y: 0.78, size: 12, color: '#10b981',        connections: ['core'] },
    { id: 'edge',    label: 'Edge 300+ PoPs', x: 0.5,  y: 0.88, size: 14, color: '#a78bfa',        connections: ['core','d1','kv'] },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    const draw = () => {
      timeRef.current += 0.008
      const t = timeRef.current
      ctx.clearRect(0, 0, W, H)

      // draw connections
      NODES.forEach(node => {
        node.connections.forEach(tid => {
          const target = NODES.find(n => n.id === tid)
          if (!target) return
          const nx = node.x * W, ny = node.y * H
          const tx = target.x * W, ty = target.y * H
          ctx.beginPath()
          ctx.moveTo(nx, ny)
          ctx.lineTo(tx, ty)
          const pulse = 0.3 + 0.15 * Math.sin(t * 2 + node.x * 10)
          ctx.strokeStyle = `rgba(26,109,181,${pulse})`
          ctx.lineWidth = 1
          ctx.stroke()
          // data packet
          const progress = (t * 0.4 + node.x) % 1
          const px = nx + (tx - nx) * progress
          const py = ny + (ty - ny) * progress
          ctx.beginPath()
          ctx.arc(px, py, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(42,157,232,${0.7 + 0.3 * Math.sin(t * 3)})`
          ctx.fill()
        })
      })

      // draw nodes
      NODES.forEach(node => {
        const x = node.x * W, y = node.y * H
        const glow = ctx.createRadialGradient(x, y, 0, x, y, node.size * 2)
        glow.addColorStop(0, node.color + '55')
        glow.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(x, y, node.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = glow; ctx.fill()
        ctx.beginPath(); ctx.arc(x, y, node.size, 0, Math.PI * 2)
        ctx.fillStyle = node.color + '33'
        ctx.strokeStyle = node.color
        ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${node.size < 14 ? 9 : 10}px DM Sans, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(node.label, x, y + node.size + 14)
      })

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return <canvas ref={canvasRef} width={600} height={340} style={{ width: '100%', height: 'auto', maxWidth: 600 }} />
}

// ── Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize={size < 60 ? 11 : 14} fontWeight={800} style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>{score}</text>
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────
export default function PredictiveLifeOS() {
  const [params] = useSearchParams()
  const country = params.get('country') ?? 'KE'
  const [agentLog, setAgentLog] = useState<AgentAction[]>(AGENT_LOG)
  const [activeSection, setActiveSection] = useState<'overview' | 'crm' | 'spatial' | 'agents'>('overview')
  const accent = COUNTRY_ACCENT[country] ?? BRAND.blue

  // Simulate agent activity
  useEffect(() => {
    const t = setInterval(() => {
      setAgentLog(prev => {
        const updated = [...prev]
        const running = updated.filter(a => a.status === 'running')
        const queued  = updated.filter(a => a.status === 'queued')
        if (running.length > 0 && Math.random() > 0.5) {
          const idx = updated.indexOf(running[0])
          updated[idx] = { ...updated[idx], status: 'done', time: 'just now' }
        }
        if (queued.length > 0 && Math.random() > 0.6) {
          const idx = updated.indexOf(queued[0])
          updated[idx] = { ...updated[idx], status: 'running', time: 'now' }
        }
        return updated
      })
    }, 2800)
    return () => clearInterval(t)
  }, [])

  const TABS = [
    { id: 'overview', label: 'Overview',       icon: '⚡' },
    { id: 'crm',      label: 'CRM Intelligence',icon: '🎯' },
    { id: 'spatial',  label: 'Spatial Graph',   icon: '🌐' },
    { id: 'agents',   label: 'Agentforce Live', icon: '🤖' },
  ] as const

  return (
    <main style={{ paddingTop: 64, background: 'var(--ink)', minHeight: '100vh', color: 'var(--white)' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '24px 0' }}>
        <div className="inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live · Agentforce Running</span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-1px', margin: 0 }}>
              Predictive Life OS
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mist)', marginLeft: 12, letterSpacing: 0 }}>Powered by Google · Salesforce · Meta</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/global-dominance" className="btn-ghost" style={{ fontSize: 13, padding: '9px 20px' }}>📊 Blueprint</a>
            <a href="/app/demo?tab=ai" className="btn-primary" style={{ fontSize: 13, padding: '9px 20px' }}>🤖 AI Copilot</a>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="inner">
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id as typeof activeSection)} style={{ padding: '16px 24px', border: 'none', background: 'none', color: activeSection === tab.id ? accent : 'var(--mist)', fontWeight: 700, fontSize: 14, cursor: 'pointer', borderBottom: `2px solid ${activeSection === tab.id ? accent : 'transparent'}`, transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="inner" style={{ padding: '32px clamp(18px,5vw,64px)' }}>
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
                {PREDICTIVE_CARDS.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${card.color}33`, borderRadius: 20, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{card.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{card.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: card.trend === 'up' ? '#10b981' : card.trend === 'down' ? '#ef4444' : 'var(--mist)' }}>
                        {card.trend === 'up' ? '↑' : card.trend === 'down' ? '↓' : '→'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                      <ScoreRing score={card.score} color={card.color} size={56} />
                      <p style={{ fontSize: 12, color: 'var(--mist)', lineHeight: 1.55, margin: 0 }}>{card.insight}</p>
                    </div>
                    <button style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: `1px solid ${card.color}44`, background: `${card.color}15`, color: card.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      {card.action} →
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Quick agent status strip */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Agentforce — Last 7 Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {agentLog.slice(0, 4).map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'done' ? '#10b981' : a.status === 'running' ? '#f59e0b' : 'var(--mist)', flexShrink: 0, animation: a.status === 'running' ? 'pulse 1.5s infinite' : 'none' }} />
                      <span style={{ color: accent, fontWeight: 700, minWidth: 110, flexShrink: 0 }}>{a.agent}</span>
                      <span style={{ color: 'var(--mist)', flex: 1 }}>{a.action}</span>
                      <span style={{ color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CRM INTELLIGENCE ── */}
          {activeSection === 'crm' && (
            <motion.div key="crm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                {[['52,400', 'Managed Contacts', BRAND.blue], ['94.2%', 'Einstein Score Avg', BRAND.blueLight], ['3.2×', 'Lead Conversion Lift', BRAND.teal]].map(([v,l,c], i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c}33`, borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c as string, fontFamily: 'var(--font-head)', letterSpacing: '-0.5px' }}>{v}</div>
                    <div style={{ fontSize: 12, color: 'var(--mist)', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CRM_RECORDS.map((rec, i) => {
                  const ac = COUNTRY_ACCENT[rec.country] ?? BRAND.blue
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${ac}22`, border: `1px solid ${ac}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {rec.type === 'tenant' ? '🏠' : rec.type === 'landlord' ? '🏢' : '💼'}
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{rec.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--mist)', textTransform: 'capitalize' }}>{rec.type} · {rec.country}</div>
                      </div>
                      <ScoreRing score={rec.score} color={ac} size={44} />
                      <div style={{ flex: 2, minWidth: 180 }}>
                        <div style={{ fontSize: 12, color: 'var(--mist)', marginBottom: 2 }}>Next Action</div>
                        <div style={{ fontSize: 13, color: 'var(--white)' }}>{rec.nextAction}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: ac }}>{rec.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--mist)' }}>value</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── SPATIAL GRAPH ── */}
          {activeSection === 'spatial' && (
            <motion.div key="spatial" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 8 }}>Live Architecture Graph</h3>
                  <p style={{ fontSize: 13, color: 'var(--mist)', marginBottom: 20, lineHeight: 1.6 }}>Real-time data flow across the Holy Trinity — Google, Salesforce, and Meta services all communicating through the easyTenancy OS core. Each pulse represents an active API call.</p>
                  <SpatialGraph />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 4 }}>AR Spatial Features</h3>
                  {[
                    { icon: '🥽', title: 'AR Property Scan',        desc: 'Point phone at building → instant overlay: yield, vacancy, compliance, tenant satisfaction',              status: 'Live' },
                    { icon: '🌐', title: 'Social Graph Overlay',    desc: 'See how your portfolio ranks vs. 50K+ peers in Meta Social Graph. Benchmark + connect in-app.',         status: 'Live' },
                    { icon: '📊', title: 'Spatial Market Intel',    desc: 'Walk a street and see AI valuations projected on every property via WebXR passthrough AR.',              status: 'Beta' },
                    { icon: '🤝', title: 'Virtual Deal Room',       desc: 'Meta Horizon Worlds-powered virtual property showcases. Conduct tours with global buyers in VR.',        status: 'Q3 2025' },
                    { icon: '🧠', title: 'On-Device Llama 4',       desc: 'All AI inference runs on-device via Llama 4 Scout. Zero data leaves your phone. Privacy-first intelligence.', status: 'Live' },
                    { icon: '👁', title: 'Eye-Tracking Heatmaps',   desc: 'Meta Movement SDK captures how prospects interact with AR tour — focus zones reveal true buying intent.', status: 'Beta' },
                  ].map((f, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{f.title}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: f.status === 'Live' ? 'rgba(16,185,129,0.15)' : f.status === 'Beta' ? 'rgba(245,158,11,0.15)' : 'rgba(167,139,250,0.15)', color: f.status === 'Live' ? '#10b981' : f.status === 'Beta' ? '#f59e0b' : '#a78bfa', fontWeight: 700 }}>{f.status}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--mist)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── AGENTS ── */}
          {activeSection === 'agents' && (
            <motion.div key="agents" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--mist)' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{agentLog.filter(a => a.status === 'done').length}</span> completed ·&nbsp;
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{agentLog.filter(a => a.status === 'running').length}</span> running ·&nbsp;
                  <span style={{ color: 'var(--mist)', fontWeight: 700 }}>{agentLog.filter(a => a.status === 'queued').length}</span> queued
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mist)' }}>Auto-updating every 2.8s</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnimatePresence>
                  {agentLog.map((a, i) => (
                    <motion.div key={a.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ display: 'flex', alignItems: 'center', gap: 14, background: a.status === 'running' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a.status === 'running' ? 'rgba(245,158,11,0.25)' : a.status === 'done' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '14px 18px', flexWrap: 'wrap' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.status === 'done' ? '#10b981' : a.status === 'running' ? '#f59e0b' : 'rgba(255,255,255,0.2)', flexShrink: 0, boxShadow: a.status === 'running' ? '0 0 8px #f59e0b' : 'none', animation: a.status === 'running' ? 'pulse 1.2s infinite' : 'none' }} />
                      <span style={{ fontWeight: 800, fontSize: 13, color: accent, minWidth: 130, flexShrink: 0 }}>{a.agent}</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--mist)', minWidth: 200 }}>{a.action}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>{a.value}</span>
                      <span style={{ fontSize: 11, color: 'var(--mist)', whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>{a.time}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                <h4 style={{ fontFamily: 'var(--font-head)', marginBottom: 20, fontSize: 16 }}>⚡ Agentforce Capabilities</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                  {[
                    { cap: 'Autonomous Lease Renewal', pct: 94, color: '#10b981' },
                    { cap: 'Rent Collection Automation', pct: 99, color: BRAND.blueLight },
                    { cap: 'Maintenance Triage',         pct: 87, color: BRAND.blue },
                    { cap: 'Compliance Monitoring',      pct: 100, color: BRAND.teal },
                    { cap: 'Lead Nurture Sequences',     pct: 82, color: '#f59e0b' },
                    { cap: 'Tenant Communication',       pct: 91, color: '#a78bfa' },
                  ].map((c, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--mist)' }}>{c.cap}</span>
                        <span style={{ color: c.color, fontWeight: 700 }}>{c.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} style={{ height: '100%', background: c.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}
