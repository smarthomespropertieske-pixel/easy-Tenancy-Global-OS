// ═══════════════════════════════════════════════════════════════════════
//  ActionableIntelligence.tsx
//  easyTenancy Global OS — Salesforce Einstein GPT Churn Prediction UI
//
//  Features:
//    • Einstein GPT churn-risk cards with live score rings
//    • "Retention Strategy" CTA → triggers AI email draft via /api/ai/retention-email
//    • Glassmorphism 2.0 "Meta-Spatial" card design
//    • Framer Motion "Antigravity" hover + enter transitions
//    • Gemini-drafted email preview with copy / "Send" simulation
//    • Agentforce auto-action progress indicators
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../lib/tokens'

// ── Types ──────────────────────────────────────────────────────────────
interface ChurnRecord {
  id:           string
  tenantName:   string
  unit:         string
  country:      string
  countryFlag:  string
  leaseValue:   number
  currency:     string
  churnScore:   number          // 0-100 (Einstein GPT score)
  trend:        'rising' | 'falling' | 'stable'
  riskFactors:  string[]
  daysToLeaseEnd: number
  lastContact:  string
  segment:      'at-risk' | 'healthy' | 'champion'
}

interface RetentionEmail {
  subject:    string
  body:       string
  fullEmail:  string
  model:      string
  tone:       string
}

// ── Demo tenant churn data (Einstein GPT predictions) ─────────────────
const CHURN_RECORDS: ChurnRecord[] = [
  {
    id:           'ch-001',
    tenantName:   'James Odhiambo',
    unit:         'Unit 4B, Nairobi Heights',
    country:      'KE',
    countryFlag:  '🇰🇪',
    leaseValue:   1_850,
    currency:     'USD',
    churnScore:   91,
    trend:        'rising',
    riskFactors:  ['3 maintenance requests unresolved > 14 days', 'Lease ends in 38 days', 'Viewed competitor listings × 6'],
    daysToLeaseEnd: 38,
    lastContact:  '12 days ago',
    segment:      'at-risk',
  },
  {
    id:           'ch-002',
    tenantName:   'Sophie Laurent',
    unit:         'Flat 12, Chelsea Wharf',
    country:      'UK',
    countryFlag:  '🇬🇧',
    leaseValue:   3_200,
    currency:     'GBP',
    churnScore:   78,
    trend:        'rising',
    riskFactors:  ['Rent increased 8% at last renewal', 'NPS survey score: 4/10', 'Late payment × 2 this quarter'],
    daysToLeaseEnd: 65,
    lastContact:  '28 days ago',
    segment:      'at-risk',
  },
  {
    id:           'ch-003',
    tenantName:   'Khalid Al-Mansoori',
    unit:         'Marina Residences 9F',
    country:      'AE',
    countryFlag:  '🇦🇪',
    leaseValue:   5_400,
    currency:     'AED',
    churnScore:   62,
    trend:        'stable',
    riskFactors:  ['Downgraded apartment size request', 'Company relocating to Abu Dhabi'],
    daysToLeaseEnd: 90,
    lastContact:  '7 days ago',
    segment:      'at-risk',
  },
  {
    id:           'ch-004',
    tenantName:   'Amara Osei',
    unit:         'Unit 2A, Westlands Court',
    country:      'KE',
    countryFlag:  '🇰🇪',
    leaseValue:   2_400,
    currency:     'USD',
    churnScore:   8,
    trend:        'falling',
    riskFactors:  [],
    daysToLeaseEnd: 180,
    lastContact:  '3 days ago',
    segment:      'champion',
  },
  {
    id:           'ch-005',
    tenantName:   'Marcus Thompson',
    unit:         'Penthouse 18, SkyView NYC',
    country:      'US',
    countryFlag:  '🇺🇸',
    leaseValue:   8_900,
    currency:     'USD',
    churnScore:   45,
    trend:        'stable',
    riskFactors:  ['Market rent 12% below competing units', 'Requests pending review: 1'],
    daysToLeaseEnd: 120,
    lastContact:  '5 days ago',
    segment:      'healthy',
  },
]

// ── Score ring SVG ─────────────────────────────────────────────────────
function ScoreRing({
  score, size = 64, color, label
}: { score: number; size?: number; color: string; label?: string }) {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(Math.max(score, 0), 100)
  const dash = (pct / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position:  'absolute', inset: 0,
        display:   'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, color, lineHeight: 1 }}>{pct}</span>
        {label && <span style={{ fontSize: 8, color: '#8892A4', marginTop: 1 }}>{label}</span>}
      </div>
    </div>
  )
}

// ── Churn severity helpers ─────────────────────────────────────────────
function churnColor(score: number): string {
  if (score >= 75) return BRAND.red
  if (score >= 50) return BRAND.amber
  if (score >= 25) return '#3b82f6'
  return BRAND.green
}

function churnLabel(score: number): string {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'
  return 'LOW'
}

// ── Email modal ────────────────────────────────────────────────────────
function EmailModal({
  email, tenant, onClose, onSend
}: {
  email:   RetentionEmail
  tenant:  ChurnRecord
  onClose: () => void
  onSend:  () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email.fullEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [email.fullEmail])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,10,20,0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          width: '100%', maxWidth: 620,
          background: 'rgba(26,31,46,0.96)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(42,157,232,0.15)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>✉️</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.green }}>
                Gemini 3 Ultra · Retention Email Draft
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#8892A4', margin: 0 }}>
              AI-drafted for {tenant.tenantName} · {tenant.countryFlag} {tenant.country} · Churn risk {tenant.churnScore}%
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#8892A4', width: 30, height: 30,
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Email subject */}
        <div style={{ padding: '14px 24px 0' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8892A4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subject</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE8', margin: '4px 0 0' }}>{email.subject}</p>
          </div>
        </div>

        {/* Email body */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '14px',
            maxHeight: 240, overflowY: 'auto',
          }}>
            <pre style={{
              fontSize: 13, color: '#D4CEC4', lineHeight: 1.7, whiteSpace: 'pre-wrap',
              fontFamily: 'inherit', margin: 0,
            }}>{email.body}</pre>
          </div>
        </div>

        {/* Agent attribution */}
        <div style={{
          padding: '0 24px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#8892A4' }}>Generated by</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: BRAND.blueLight,
            background: 'rgba(42,157,232,0.1)', padding: '2px 8px', borderRadius: 20,
            border: '1px solid rgba(42,157,232,0.2)',
          }}>Gemini 3 Ultra · 2M context · Agentforce orchestrated</span>
        </div>

        {/* Actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '9px 18px', color: '#F0EDE8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(16,185,129,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onSend}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: 10, padding: '9px 20px',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            ✉️ Send via Agentforce
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────
export default function ActionableIntelligence({
  filterSegment = 'all',
  maxCards      = 5,
}: {
  filterSegment?: 'all' | 'at-risk' | 'healthy' | 'champion'
  maxCards?:      number
}) {
  const headingId = useId()
  const [loadingId,   setLoadingId]   = useState<string | null>(null)
  const [emailData,   setEmailData]   = useState<RetentionEmail | null>(null)
  const [activeTenant, setActiveTenant] = useState<ChurnRecord | null>(null)
  const [sentIds,     setSentIds]     = useState<Set<string>>(new Set())
  const [agentRunning, setAgentRunning] = useState<Set<string>>(new Set())
  const [error,       setError]       = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'at-risk' | 'healthy' | 'champion'>(filterSegment)

  const displayed = CHURN_RECORDS
    .filter(r => activeFilter === 'all' || r.segment === activeFilter)
    .slice(0, maxCards)

  // ── Generate retention email via API ──────────────────────────────
  const generateRetentionEmail = useCallback(async (tenant: ChurnRecord) => {
    setLoadingId(tenant.id)
    setError(null)
    try {
      const res = await fetch('/api/ai/retention-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tenantName:  tenant.tenantName,
          churnScore:  tenant.churnScore,
          leaseValue:  tenant.leaseValue,
          currency:    tenant.currency,
          riskFactors: tenant.riskFactors,
          managerName: 'easyTenancy AI Manager',
          tone:        tenant.churnScore >= 75 ? 'warm' : 'formal',
        }),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json() as RetentionEmail & { ok: boolean; error?: string }

      if (!data.ok) throw new Error(data.error ?? 'Unknown error')

      setEmailData(data)
      setActiveTenant(tenant)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setError(msg)
      // Fallback: show a demo email
      setEmailData({
        subject:   `We'd love to keep you — exclusive renewal offer for ${tenant.tenantName}`,
        body:      `Dear ${tenant.tenantName},\n\nThank you for being a valued tenant at ${tenant.unit}. We truly appreciate your residency.\n\nWe noticed it's been a while since we connected, and we want to ensure your experience is exceptional. We'd like to offer you a 5% rent reduction on a 12-month renewal, along with priority maintenance response.\n\nCould we schedule a 15-minute call this week to discuss your renewal? Click the link below or simply reply to this email.\n\nWarm regards,\nYour easyTenancy Property Manager`,
        fullEmail:  '',
        model:     'cf-workers-ai-fallback',
        tone:      'warm',
      })
      setActiveTenant(tenant)
    } finally {
      setLoadingId(null)
    }
  }, [])

  // ── Simulate Agentforce auto-action ───────────────────────────────
  const handleAgentAction = useCallback((tenant: ChurnRecord, action: string) => {
    const key = `${tenant.id}-${action}`
    setAgentRunning(prev => new Set(prev).add(key))
    setTimeout(() => {
      setAgentRunning(prev => { const s = new Set(prev); s.delete(key); return s })
    }, 2500 + Math.random() * 1500)
  }, [])

  // ── Handle "sent" ──────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (activeTenant) {
      setSentIds(prev => new Set(prev).add(activeTenant.id))
      handleAgentAction(activeTenant, 'email')
    }
    setEmailData(null)
    setActiveTenant(null)
  }, [activeTenant, handleAgentAction])

  // ── Card variants ─────────────────────────────────────────────────
  const cardVariants = {
    hidden:  { opacity: 0, y: 24, scale: 0.97 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 260, damping: 22 },
    }),
  }

  const FILTERS: { key: typeof activeFilter; label: string; color: string }[] = [
    { key: 'all',      label: 'All Tenants',    color: BRAND.blueLight },
    { key: 'at-risk',  label: '⚠️ At Risk',      color: BRAND.amber },
    { key: 'healthy',  label: '📊 Healthy',      color: '#3b82f6' },
    { key: 'champion', label: '💚 Champions',    color: BRAND.green },
  ]

  return (
    <section aria-labelledby={headingId} style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>⚡</div>
              <h2
                id={headingId}
                style={{
                  fontSize: 18, fontWeight: 800, color: '#F0EDE8',
                  margin: 0, letterSpacing: '-0.4px',
                }}
              >
                Actionable Intelligence
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 700, color: BRAND.amber,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                padding: '2px 8px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Einstein GPT</span>
            </div>
            <p style={{ fontSize: 12, color: '#8892A4', margin: 0 }}>
              AI-predicted churn risk · Agentforce-ready retention actions
            </p>
          </div>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: BRAND.green,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 11, color: '#8892A4' }}>Live · Updated 2s ago</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: '1px solid',
                borderColor: activeFilter === f.key ? f.color + '55' : 'rgba(255,255,255,0.08)',
                background:  activeFilter === f.key ? f.color + '15' : 'rgba(255,255,255,0.03)',
                color:       activeFilter === f.key ? f.color : '#8892A4',
                transition:  'all 0.2s',
              }}
            >{f.label}</motion.button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: 12, padding: '8px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#fca5a5',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            ⚠️ {error} — Showing demo email instead.
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
        gap: 14,
      }}>
        <AnimatePresence mode="popLayout">
          {displayed.map((tenant, i) => {
            const color    = churnColor(tenant.churnScore)
            const label    = churnLabel(tenant.churnScore)
            const isLoading = loadingId === tenant.id
            const isSent    = sentIds.has(tenant.id)
            const isAtRisk  = tenant.churnScore >= 50

            return (
              <motion.article
                key={tenant.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                whileHover={{
                  y: -6,
                  boxShadow: `0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px ${color}25, inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
                style={{
                  background: `rgba(26,31,46,0.85)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${isAtRisk ? color + '30' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                  cursor: 'default',
                  position: 'relative',
                }}
              >
                {/* Sent overlay */}
                <AnimatePresence>
                  {isSent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        background: 'rgba(16,185,129,0.12)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 18,
                      }}
                    >
                      <div style={{
                        textAlign: 'center',
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 12, padding: '12px 20px',
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>✉️</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.green }}>Retention Email Sent</div>
                        <div style={{ fontSize: 11, color: '#8892A4', marginTop: 2 }}>Agentforce dispatched</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Risk severity bar */}
                <div style={{
                  height: 3,
                  background: `linear-gradient(90deg, ${color} ${tenant.churnScore}%, rgba(255,255,255,0.04) ${tenant.churnScore}%)`,
                }} />

                {/* Card body */}
                <div style={{ padding: '16px 18px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 15 }}>{tenant.countryFlag}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tenant.tenantName}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color, padding: '2px 6px', borderRadius: 20,
                          background: color + '15', border: `1px solid ${color}33`,
                          textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', marginLeft: 'auto',
                        }}>{label}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#8892A4', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tenant.unit}
                      </p>
                    </div>

                    <ScoreRing
                      score={tenant.churnScore}
                      size={58}
                      color={color}
                      label="CHURN"
                    />
                  </div>

                  {/* Metrics row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
                    marginBottom: 12,
                  }}>
                    {[
                      { label: 'Lease Value',    value: `${tenant.currency} ${tenant.leaseValue.toLocaleString()}/mo` },
                      { label: 'Lease Ends',     value: `${tenant.daysToLeaseEnd}d` },
                      { label: 'Last Contact',   value: tenant.lastContact },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 9px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ fontSize: 9, color: '#8892A4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#F0EDE8' }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Risk factors */}
                  {tenant.riskFactors.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8892A4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                        Risk Factors · Einstein GPT
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {tenant.riskFactors.slice(0, 3).map((f, ri) => (
                          <li key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontSize: 9, color, marginTop: 3, flexShrink: 0 }}>▶</span>
                            <span style={{ fontSize: 11, color: '#8892A4', lineHeight: 1.5 }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Healthy tenant CTA */}
                  {tenant.segment === 'champion' && (
                    <div style={{
                      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                      borderRadius: 10, padding: '8px 12px', marginBottom: 12,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 14 }}>💚</span>
                      <span style={{ fontSize: 11, color: BRAND.green, fontWeight: 600 }}>
                        Champion tenant — Agentforce will send renewal offer in 14 days
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {isAtRisk && !isSent && (
                      <motion.button
                        whileHover={{ scale: 1.04, boxShadow: `0 6px 20px ${color}40` }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => generateRetentionEmail(tenant)}
                        disabled={isLoading}
                        style={{
                          flex: 1, minWidth: 140,
                          padding: '9px 14px', borderRadius: 10,
                          background: isLoading
                            ? 'rgba(255,255,255,0.06)'
                            : `linear-gradient(135deg, ${color}DD, ${color}BB)`,
                          border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                          cursor: isLoading ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          boxShadow: isLoading ? 'none' : `0 4px 14px ${color}35`,
                          opacity: isLoading ? 0.7 : 1,
                          transition: 'all 0.2s',
                        }}
                      >
                        {isLoading ? (
                          <>
                            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                            Drafting email…
                          </>
                        ) : (
                          <>✉️ Retention Strategy</>
                        )}
                      </motion.button>
                    )}

                    {isSent && (
                      <div style={{
                        flex: 1, padding: '9px 14px', borderRadius: 10,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: 12, fontWeight: 700, color: BRAND.green,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        ✓ Email sent via Agentforce
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleAgentAction(tenant, 'call')}
                      style={{
                        padding: '9px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#8892A4', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {agentRunning.has(`${tenant.id}-call`) ? (
                          <motion.span key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ fontSize: 10, color: BRAND.blueLight }}>
                            ⟳ Scheduling…
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            📞 Schedule Call
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Summary row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 18, padding: '12px 18px',
          background: 'rgba(255,255,255,0.02)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'At-Risk ARR',  value: '$94K', color: BRAND.red },
            { label: 'Avg Churn Score', value: '57%', color: BRAND.amber },
            { label: 'Auto-Actions Ready', value: '3', color: BRAND.green },
            { label: 'Emails Sent',   value: `${sentIds.size}`, color: BRAND.blueLight },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: '#8892A4', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#8892A4' }}>
          Powered by Einstein GPT · Agentforce · Gemini 3 Ultra
        </span>
      </motion.div>

      {/* Email modal */}
      <AnimatePresence>
        {emailData && activeTenant && (
          <EmailModal
            email={emailData}
            tenant={activeTenant}
            onClose={() => { setEmailData(null); setActiveTenant(null) }}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
