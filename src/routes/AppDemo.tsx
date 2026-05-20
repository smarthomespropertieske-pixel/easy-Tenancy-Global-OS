// ── AppDemo — Pre-populated demo dashboard ────────────────────
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeepLinkParams, useAIFeed, useAnimatedCounter, useIsMobile } from '../hooks'
import AICopilot from '../components/AICopilot'
import SovereignPageHeader from '../components/SovereignPageHeader'
import { getDemoTenant, DEMO_TENANTS, type DemoTenant, type DemoProperty } from '../lib/demoData'
import { trackEvent } from '../lib/analytics'
import { type AIFeedEvent } from '../lib/wsStream'

// ── Helpers ──────────────────────────────────────────────────
function fmt(n: number, prefix = '') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`
  return `${prefix}${n}`
}
function pct(n: number) { return `${n.toFixed(1)}%` }
function statusColor(s: DemoProperty['status']) {
  return s === 'compliant' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444'
}
function typeIcon(t: AIFeedEvent['type']) {
  return { compliance: '🛡️', collection: '💳', maintenance: '🔧', lease: '📋', ai: '🤖', alert: '⚠️' }[t]
}
function priorityBadge(p: AIFeedEvent['priority']) {
  const map = { low: '#10b981', medium: '#39bff6', high: '#f59e0b', critical: '#ef4444' }
  return map[p]
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#39bff6', animate = false }:
  { label: string; value: string; sub?: string; color?: string; animate?: boolean }) {
  const [vis, setVis] = useState(!animate)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!animate) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [animate])

  return (
    <motion.div
      ref={ref}
      className="glass-card"
      whileHover={{ translateY: -4, scale: 1.02 }}
      style={{ padding: '20px 24px', borderRadius: 12, textAlign: 'center' }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: -0.5 }}>
        {vis ? value : '—'}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  )
}

// ── Property row ─────────────────────────────────────────────
function PropertyRow({ prop, currency, onNavigate }: { prop: DemoProperty; currency: string; onNavigate: (propId: string, section: string) => void }) {
  const sc = statusColor(prop.status)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card"
      style={{ padding: '16px 20px', borderRadius: 10, cursor: 'pointer', marginBottom: 8 }}
      whileHover={{ translateX: 4 }}
      onClick={() => onNavigate(prop.id, 'overview')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}` }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{prop.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{prop.units} units · Last check: {prop.lastCompliance}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#39bff6', fontWeight: 600 }}>{pct(prop.occupancy)}</div>
            <div style={{ color: '#475569', fontSize: 11 }}>Occupancy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontWeight: 600 }}>{pct(prop.collections)}</div>
            <div style={{ color: '#475569', fontSize: 11 }}>Collections</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: sc, fontWeight: 600, textTransform: 'capitalize' }}>{prop.status}</div>
            <div style={{ color: '#475569', fontSize: 11 }}>Compliance</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['compliance', 'collections', 'maintenance', 'leases'] as const).map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onNavigate(prop.id, s) }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#94a3b8',
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(57,191,246,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── ROI Summary banner ────────────────────────────────────────
function ROISummary({ units, monthlyRent, occupancy }: { units: number; monthlyRent: number; occupancy: number }) {
  const annualRent = monthlyRent * 12
  const occupancyGain = annualRent * 0.042
  const legalSavings = units * 380
  const noUplift = (occupancyGain + legalSavings) * 1.3
  const roi = Math.round((noUplift / (units * 49 * 12)) * 100)

  const items = [
    { label: 'Est. Annual NOI Uplift', value: fmt(Math.round(noUplift), '£'), color: '#10b981' },
    { label: 'Occupancy Gain (4.2%)', value: fmt(Math.round(occupancyGain), '£'), color: '#39bff6' },
    { label: 'Legal Cost Savings', value: fmt(Math.round(legalSavings), '£'), color: '#a78bfa' },
    { label: 'Projected ROI', value: `${roi}%`, color: '#f59e0b' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(57,191,246,0.08) 100%)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 24
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <span style={{ fontWeight: 600, color: '#10b981', fontSize: 14 }}>Your ROI Projection — based on inputs from calculator</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Tenant selector ───────────────────────────────────────────
function TenantSelector({ current, onChange }: { current: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Object.values(DEMO_TENANTS).map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: current === t.id ? '1px solid #39bff6' : '1px solid rgba(255,255,255,0.1)',
            background: current === t.id ? 'rgba(57,191,246,0.15)' : 'rgba(255,255,255,0.04)',
            color: current === t.id ? '#39bff6' : '#64748b',
            transition: 'all 0.2s'
          }}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}

// ── AI Feed panel ─────────────────────────────────────────────
function DemoFeedPanel({ orgId }: { orgId: string }) {
  const events = useAIFeed(6)
  const navigate = useNavigate()

  return (
    <div className="glass-card" style={{ borderRadius: 14, padding: '20px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>Live AI Activity</span>
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>Real-time</span>
      </div>
      <AnimatePresence initial={false}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#334155', padding: '40px 0', fontSize: 13 }}>
            Connecting to AI feed…
          </div>
        ) : (
          events.map(evt => (
            <motion.div
              key={evt.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                trackEvent('ai_feed_clicked', { type: evt.type, property: evt.property })
                navigate(evt.deepLink)
              }}
              style={{
                borderLeft: `3px solid ${evt.color}`,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '0 8px 8px 0',
                padding: '10px 12px',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              whileHover={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{typeIcon(evt.type)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{evt.title}</span>
                </div>
                {evt.metric && (
                  <span style={{ fontSize: 11, color: evt.color, background: `${evt.color}20`, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                    {evt.metric}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, paddingLeft: 24 }}>{evt.detail}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 24 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>{evt.property}</span>
                <span style={{ fontSize: 10, color: priorityBadge(evt.priority), textTransform: 'uppercase', letterSpacing: 0.5 }}>{evt.priority}</span>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Quick actions panel ───────────────────────────────────────
function QuickActions({ tenant, onNavigate }: { tenant: DemoTenant; onNavigate: (propId: string, section: string) => void }) {
  const actions = [
    { icon: '📋', label: 'Run Lease Renewal', desc: `${tenant.properties.length} leases due`, action: () => onNavigate(tenant.properties[0].id, 'leases'), color: '#39bff6' },
    { icon: '🛡️', label: 'Compliance Audit', desc: '1 expiring soon', action: () => onNavigate(tenant.properties[0].id, 'compliance'), color: '#a78bfa' },
    { icon: '💳', label: 'Collections Report', desc: `${pct(tenant.occupancy)} collected`, action: () => onNavigate(tenant.properties[0].id, 'collections'), color: '#10b981' },
    { icon: '🔧', label: 'Maintenance Queue', desc: 'View open tickets', action: () => onNavigate(tenant.properties[0].id, 'maintenance'), color: '#f59e0b' },
    { icon: '🤖', label: 'AI Recommendations', desc: '+6.2% NOI queued', action: () => {}, color: '#e879f9' },
    { icon: '📄', label: 'Generate Notice', desc: 'Section 21 / S8', action: () => onNavigate(tenant.properties[0].id, 'arrears'), color: '#fb7185' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
      {actions.map(({ icon, label, desc, action, color }) => (
        <motion.button
          key={label}
          whileHover={{ translateY: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { trackEvent('feature_clicked', { feature: label }); action() }}
          className="glass-card"
          style={{
            borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
            textAlign: 'left', border: `1px solid ${color}22`, background: 'transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{desc}</div>
        </motion.button>
      ))}
    </div>
  )
}

// ── Portfolio health donut (CSS-only) ────────────────────────
function HealthRing({ occupancy, collections }: { occupancy: number; collections: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const occDash = (occupancy / 100) * circ
  const colDash = (collections / 100) * circ

  return (
    <div className="glass-card" style={{ borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>Portfolio Health</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
          <circle cx={65} cy={65} r={r} fill="none" stroke="#39bff6" strokeWidth={12}
            strokeDasharray={`${occDash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
          <circle cx={65} cy={65} r={r - 16} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
          <circle cx={65} cy={65} r={r - 16} fill="none" stroke="#10b981" strokeWidth={10}
            strokeDasharray={`${colDash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        </svg>
        <div style={{ fontSize: 12, lineHeight: 2.2 }}>
          <div><span style={{ color: '#39bff6' }}>●</span> <span style={{ color: '#64748b' }}>Occupancy</span> <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{pct(occupancy)}</span></div>
          <div><span style={{ color: '#10b981' }}>●</span> <span style={{ color: '#64748b' }}>Collections</span> <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
            {pct(collections)}
          </span></div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#334155', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            Overall: <span style={{ color: '#a78bfa', fontWeight: 600 }}>Excellent</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Compliance status widget ──────────────────────────────────
function ComplianceWidget({ properties, onNavigate }: { properties: DemoProperty[]; onNavigate: (id: string, section: string) => void }) {
  const compliant = properties.filter(p => p.status === 'compliant').length
  const warning = properties.filter(p => p.status === 'warning').length
  const critical = properties.filter(p => p.status === 'critical').length

  return (
    <div className="glass-card" style={{ borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>Compliance Status</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Compliant', val: compliant, color: '#10b981' },
          { label: 'Warning', val: warning, color: '#f59e0b' },
          { label: 'Critical', val: critical, color: '#ef4444' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', background: `${color}12`, borderRadius: 8, padding: '10px 0', border: `1px solid ${color}30` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12 }}>
        {properties.filter(p => p.status !== 'compliant').map(p => (
          <div
            key={p.id}
            onClick={() => onNavigate(p.id, 'compliance')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', color: '#94a3b8'
            }}
          >
            <span>{p.name}</span>
            <span style={{ color: statusColor(p.status), textTransform: 'capitalize', fontWeight: 600 }}>{p.status} →</span>
          </div>
        ))}
        {properties.filter(p => p.status !== 'compliant').length === 0 && (
          <div style={{ textAlign: 'center', color: '#10b981', padding: '8px 0' }}>✓ All properties compliant</div>
        )}
      </div>
    </div>
  )
}

// ── AI Assistant panel ────────────────────────────────────────
type AIMode = 'chat' | 'describe' | 'summarize'

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

function AIAssistant({ tenant }: { tenant: DemoTenant }) {
  const [mode, setMode] = useState<AIMode>('chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const MODES = [
    { id: 'chat'      as AIMode, icon: '💬', label: 'Ask AI',    placeholder: 'e.g. How do I serve a Section 21 notice? What are EPC requirements?' },
    { id: 'describe'  as AIMode, icon: '✍️',  label: 'Describe',  placeholder: 'e.g. Describe a modern 24-unit development in Nairobi CBD…' },
    { id: 'summarize' as AIMode, icon: '📊', label: 'Summarise', placeholder: 'Click "Run Summary" to analyse this portfolio automatically' },
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function callAI(body: Record<string, unknown>, endpoint: string): Promise<string> {
    const res = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { ok: boolean; response?: string; error?: string }
    if (!data.ok) throw new Error(data.error ?? 'AI request failed')
    return data.response ?? ''
  }

  async function send() {
    const text = input.trim()
    if (!text && mode !== 'summarize') return
    setError(null)
    setLoading(true)
    if (mode !== 'summarize') setMessages(m => [...m, { role: 'user', content: text }])
    setInput('')

    try {
      let response = ''
      if (mode === 'chat') {
        const ctx = messages.slice(-3).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')
        response = await callAI({ message: text, context: ctx || undefined }, 'chat')
      } else if (mode === 'describe') {
        response = await callAI({
          name: text || tenant.properties[0]?.name,
          units: tenant.units,
          location: tenant.country,
          features: ['Modern finishes', 'Secure parking', 'Fibre internet', 'Energy efficient'],
        }, 'describe')
      } else {
        const snapshot = {
          name: tenant.name, country: tenant.country, units: tenant.units,
          occupancy: tenant.occupancy, arrears: tenant.arrears, noi: tenant.noi,
          monthlyRent: tenant.monthlyRent, currency: tenant.currency,
          properties: tenant.properties.map(p => ({
            name: p.name, units: p.units, occupancy: p.occupancy,
            collections: p.collections, status: p.status, lastCompliance: p.lastCompliance,
          })),
        }
        setMessages(m => [...m, { role: 'user', content: `Summarise ${tenant.name} portfolio` }])
        response = await callAI({ portfolio: snapshot }, 'summarize')
      }
      trackEvent('ai_assistant_used', { mode, tenant: tenant.id })
      setMessages(m => [...m, { role: 'assistant', content: response }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI request failed'
      setError(msg)
      if (mode !== 'summarize') { setMessages(m => m.slice(0, -1)); setInput(text) }
    } finally {
      setLoading(false)
    }
  }

  function clearChat() { setMessages([]); setError(null); setInput('') }

  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="glass-card" style={{ borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', height: 540 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>AI Assistant</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.3)',
          }}>Workers AI · Llama 3.1</span>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12 }}>
            Clear ✕
          </button>
        )}
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3 }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setError(null) }}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: 'none', transition: 'all 0.18s',
              background: mode === m.id ? 'rgba(167,139,250,0.18)' : 'transparent',
              color: mode === m.id ? '#a78bfa' : '#475569',
              fontWeight: mode === m.id ? 600 : 400,
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── Message thread ── */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 4 }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{currentMode.icon}</div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              {mode === 'chat'      && 'Ask anything about property management — compliance, collections, lease law, maintenance.'}
              {mode === 'describe'  && 'Enter a property name or prompt. The AI will generate a professional letting description.'}
              {mode === 'summarize' && `Click "Run Summary" to get an AI-powered executive summary of the ${tenant.name} portfolio.`}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 10, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{
                maxWidth: '88%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: msg.role === 'user' ? 'rgba(57,191,246,0.18)' : 'rgba(255,255,255,0.06)',
                border: msg.role === 'user' ? '1px solid rgba(57,191,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>
                    🤖 AI ASSISTANT
                  </div>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: 6, padding: '10px 14px', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa' }}
              />
            ))}
            <span style={{ fontSize: 12, color: '#475569', marginLeft: 4 }}>AI is thinking…</span>
          </motion.div>
        )}

        {error && (
          <div style={{
            margin: '8px 0', padding: '10px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 12, color: '#fca5a5',
          }}>⚠️ {error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input row ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {mode !== 'summarize' ? (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={currentMode.placeholder}
            rows={2}
            disabled={loading}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13,
              resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'  }}
          />
        ) : (
          <div style={{ flex: 1, fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
            Sends live portfolio data for {tenant.name} ({tenant.units} units, {tenant.properties.length} properties)
          </div>
        )}
        <button
          onClick={send}
          disabled={loading || (mode !== 'summarize' && !input.trim())}
          style={{
            padding: '0 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: loading || (mode !== 'summarize' && !input.trim()) ? 'not-allowed' : 'pointer',
            border: 'none', alignSelf: 'stretch', minWidth: 100,
            background: (loading || (mode !== 'summarize' && !input.trim()))
              ? 'rgba(167,139,250,0.12)' : 'linear-gradient(135deg, #a78bfa, #6366f1)',
            color: (loading || (mode !== 'summarize' && !input.trim())) ? '#475569' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '…' : mode === 'summarize' ? 'Run Summary' : '↑ Send'}
        </button>
      </div>
    </div>
  )
}

// ── Main AppDemo component ────────────────────────────────────
export default function AppDemo() {
  const navigate = useNavigate()
  const params = useDeepLinkParams()
  const isMobile = useIsMobile()

  // Resolve initial tenant from deep-link or default
  const initId = params.demoTenantId ?? 'demo-001'
  const [tenantId, setTenantId] = useState(initId)
  const [tenant, setTenant] = useState<DemoTenant>(getDemoTenant(initId) ?? DEMO_TENANTS['demo-001'])
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'actions' | 'ai'>('overview')

  // Animated portfolio KPIs
  const unitsCount = useAnimatedCounter(tenant.units, 1200)
  const rentCount = useAnimatedCounter(Math.round(tenant.monthlyRent / 1000), 1400)
  const noiCount = useAnimatedCounter(Math.round(tenant.noi), 1600)

  useEffect(() => {
    const t = getDemoTenant(tenantId)
    if (t) setTenant(t)
    trackEvent('demo_started', { tenantId })
  }, [tenantId])

  // Track that we came from deep-link
  useEffect(() => {
    if (params.demoTenantId) {
      trackEvent('deep_link_activated', {
        tenantId: params.demoTenantId,
        units: params.units,
        monthlyRent: params.monthlyRent,
        occupancy: params.occupancy,
      })
    }
  }, [])

  const handlePropertyNav = (propId: string, section: string) => {
    trackEvent('property_viewed', { propId, section })
    navigate(`/org/${tenantId}/properties/${propId}/${section}`)
  }

  const avgCollections = tenant.properties.reduce((a, p) => a + p.collections, 0) / (tenant.properties.length || 1)

  const tabs = [
    { id: 'overview',   label: '📊 Overview' },
    { id: 'properties', label: '🏢 Properties' },
    { id: 'actions',    label: '⚡ Quick Actions' },
    { id: 'ai',         label: '🤖 AI Assistant' },
  ] as const

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1528 40%, #0a1525 100%)',
      paddingTop: 72,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── Sovereign Page Header ── */}
      <SovereignPageHeader
        badge="Live Demo · Real Data · All 14 Components"
        badgeColor="#39bff6"
        title={
          <>
            <span style={{ color: 'var(--white)' }}>{tenant.name}</span>
            {' '}
            <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--mist)', verticalAlign: 'middle' }}>
              {tenant.units} units · {tenant.country}
            </span>
          </>
        }
        subtitle={`${pct(tenant.occupancy)} occupancy · ${tenant.currency}${Math.round(tenant.monthlyRent / 1000)}K/mo revenue · ${tenant.properties.length} properties across ${tenant.country}`}
        stats={[
          { label: 'Total Units',    value: String(unitsCount),                    icon: '🏢', color: '#39bff6' },
          { label: 'Monthly Rent',   value: `${tenant.currency}${rentCount}K`,     icon: '💰', color: '#10b981' },
          { label: 'Occupancy',      value: pct(tenant.occupancy),                 icon: '📊', color: '#a78bfa' },
          { label: 'NOI Margin',     value: `${noiCount}%`,                        icon: '📈', color: '#f59e0b' },
        ]}
        actions={[
          { label: '← Back to Home', href: '/' },
          { label: '🌍 Global Dominance', href: '/global-dominance' },
          { label: '🤖 Predictive OS', href: '/predictive-os', primary: true },
        ]}
        compact
      />
      {/* Tenant selector sticky bar */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 40,
        background: 'rgba(10,15,30,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>Viewing portfolio:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{tenant.name}</span>
            {params.demoTenantId && (
              <span style={{ fontSize: 10, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderRadius: 4, padding: '2px 8px', border: '1px solid rgba(167,139,250,0.3)' }}>Deep-linked</span>
            )}
          </div>
          <TenantSelector current={tenantId} onChange={setTenantId} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* ── ROI banner (only when coming from ROI calculator) ── */}
        {params.units && params.monthlyRent && params.occupancy && (
          <ROISummary
            units={params.units}
            monthlyRent={params.monthlyRent}
            occupancy={params.occupancy}
          />
        )}

        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Units" value={String(unitsCount)} color="#39bff6" animate />
          <StatCard label="Monthly Rent" value={`${tenant.currency} ${rentCount}K`} color="#10b981" animate />
          <StatCard label="Occupancy" value={pct(tenant.occupancy)} color="#a78bfa" animate />
          <StatCard label="NOI Margin" value={`${noiCount}%`} color="#f59e0b" animate />
          <StatCard label="Arrears Rate" value={pct(tenant.arrears)} color={tenant.arrears < 3 ? '#10b981' : '#ef4444'} animate />
          <StatCard label="Properties" value={String(tenant.properties.length)} color="#39bff6" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: 'none', transition: 'all 0.2s',
                background: activeTab === id ? 'rgba(57,191,246,0.15)' : 'transparent',
                color: activeTab === id ? '#39bff6' : '#64748b',
                fontWeight: activeTab === id ? 600 : 400
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <HealthRing occupancy={tenant.occupancy} collections={avgCollections} />
                <ComplianceWidget properties={tenant.properties} onNavigate={handlePropertyNav} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Properties</div>
                  {tenant.properties.map(p => (
                    <PropertyRow key={p.id} prop={p} currency={tenant.currency} onNavigate={handlePropertyNav} />
                  ))}
                </div>
                <DemoFeedPanel orgId={tenantId} />
              </div>
              {/* AICopilot compact preview strip in Overview */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  AI Copilot
                  <button
                    onClick={() => setActiveTab('ai')}
                    style={{ marginLeft: 10, fontSize: 11, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >Open full panel →</button>
                </div>
                <AICopilot
                  compact
                  unitsOverride={tenant.units}
                  countryOverride={tenant.country}
                />
              </div>
            </motion.div>
          )}

          {/* ── Properties tab ── */}
          {activeTab === 'properties' && (
            <motion.div key="properties" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {tenant.properties.length} Properties — {tenant.country}
              </div>
              {tenant.properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card"
                  style={{ borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: statusColor(p.status), boxShadow: `0 0 10px ${statusColor(p.status)}` }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{p.id} · {p.units} units</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: `${statusColor(p.status)}20`, color: statusColor(p.status),
                      border: `1px solid ${statusColor(p.status)}40`, textTransform: 'capitalize'
                    }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {[
                      { l: 'Occupancy', v: pct(p.occupancy), c: '#39bff6' },
                      { l: 'Collections', v: pct(p.collections), c: '#10b981' },
                      { l: 'Last Compliance', v: p.lastCompliance, c: '#a78bfa' },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px' }}>
                        <div style={{ color: c, fontWeight: 600, fontSize: 15 }}>{v}</div>
                        <div style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['compliance', 'collections', 'maintenance', 'leases', 'arrears', 'screening'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handlePropertyNav(p.id, s)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                          color: '#94a3b8', textTransform: 'capitalize', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(57,191,246,0.4)'; b.style.color = '#39bff6' }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.1)'; b.style.color = '#94a3b8' }}
                      >
                        {s} →
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Actions tab ── */}
          {activeTab === 'actions' && (
            <motion.div key="actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Quick Actions for {tenant.name}
              </div>
              <QuickActions tenant={tenant} onNavigate={handlePropertyNav} />
            </motion.div>
          )}

          {/* ── AI Copilot tab ── */}
          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                AI Copilot — {tenant.name}
                <span style={{ marginLeft: 10, fontSize: 11, color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  Context-aware · Country law · Cloudflare Workers AI
                </span>
              </div>
              <AICopilot
                unitsOverride={tenant.units}
                countryOverride={tenant.country}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Demo CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 40, textAlign: 'center', padding: '32px',
            background: 'linear-gradient(135deg, rgba(57,191,246,0.08) 0%, rgba(167,139,250,0.08) 100%)',
            borderRadius: 20, border: '1px solid rgba(57,191,246,0.2)'
          }}
        >
          <div style={{ fontSize: 11, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>This is a demo environment</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Ready to manage your actual portfolio?</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Get your real dashboard in under 10 minutes</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { trackEvent('cta_clicked', { location: 'demo_page', type: 'start_trial' }); navigate('/') }}
              style={{
                padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: 'linear-gradient(135deg, #39bff6, #6366f1)', color: '#fff', border: 'none'
              }}
            >
              Start Free Trial →
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              ← Back to Site
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
