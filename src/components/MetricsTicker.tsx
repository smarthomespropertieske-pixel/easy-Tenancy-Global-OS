// ══════════════════════════════════════════════════════════════════════════
//  MetricsTicker.tsx — easyTenancy Value-Capture Engine v2.0
//  "Global Hegemony 2.0" — Live $1.345B ARR Growth Curve
//
//  Upgrades:
//    • ARR growth simulation: 0 → $1.345B curve over 36-month window
//    • Success fee logger: receives SUCCESS_FEE_CAPTURED from Orchestrator
//    • ARR milestone celebrations (toast + glow burst)
//    • Real-time fee stream strip (last 5 captured fees)
//    • Orchestrator METRICS_TICK heartbeat emission every 30s
//    • Existing 6 KPIs retained + 2 new: ARR + Success Fees
// ══════════════════════════════════════════════════════════════════════════
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveMetrics, useAnimatedCounter } from '../hooks'
import { trackEvent } from '../lib/analytics'
import { Orchestrator } from '../lib/GlobalOrchestrator'

// ── ARR Growth Curve Simulation ────────────────────────────────────────────
// Logistic growth model: S-curve from $0 → $1.345B over 36 months
function computeARR(monthOffset = 0): number {
  const TARGET   = 1_345_000_000  // $1.345B
  const MIDPOINT = 24             // Month 24 = inflection point
  const STEEPNESS = 0.22
  const now      = new Date()
  const month    = now.getMonth() + monthOffset
  const L        = 1 / (1 + Math.exp(-STEEPNESS * (month - MIDPOINT)))
  return Math.floor(TARGET * L)
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmtARR(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(3)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

function fmtFee(v: number): string {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// ── Captured fee events ────────────────────────────────────────────────────
interface FeeEvent {
  id:        string
  amount:    number
  currency:  string
  country:   string
  ts:        number
}

// ── Metric configs (original 6 + 2 new) ────────────────────────────────────
interface MetricConfig {
  key:    string
  label:  string
  suffix: string
  prefix?: string
  format: (v: number) => string
  color:  string
  icon:   string
  sub:    string
  live?:  boolean
}

const BASE_METRICS: MetricConfig[] = [
  { key: 'managers',       label: 'Property Managers', suffix: '+', format: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v),   color: '#39bff6', icon: '👥', sub: 'Across 120 countries' },
  { key: 'leases',         label: 'Leases Managed',    suffix: '',  format: v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`, color: '#a78bfa', icon: '📄', sub: 'AI-trained dataset' },
  { key: 'complianceRate', label: 'Compliance Rate',   suffix: '%', format: v => String(v),   color: '#10b981', icon: '⚖️', sub: 'Zero fines guarantee' },
  { key: 'countries',      label: 'Jurisdictions',     suffix: '',  format: v => String(v),   color: '#f59e0b', icon: '🌍', sub: 'Live regulatory data' },
  { key: 'roi',            label: 'Avg Year-1 ROI',    suffix: '×', format: v => String(v),   color: '#ef4444', icon: '📈', sub: 'Verified by customers' },
  { key: 'hoursaved',      label: 'Hrs Saved/Month',   suffix: '+', format: v => String(v),   color: '#06b6d4', icon: '⏱️', sub: 'Per manager average' },
]

function MetricCell({ config, value, idx }: { config: MetricConfig; value: number; idx: number }) {
  const [visible, setVisible] = useState(false)
  const ref      = useRef<HTMLDivElement>(null)
  const animated = useAnimatedCounter(visible ? value : 0, 1800, [visible, value])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: idx * 0.07, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => trackEvent('metrics_viewed', { metric: config.key })}
      style={{
        padding: '20px 16px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderTop: `2px solid ${config.color}`,
        borderRadius: 16,
        textAlign: 'center',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ background: 'rgba(255,255,255,0.08)', y: -4, boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${config.color}22` } as never}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${config.color}66, transparent)` }} />
      <div style={{ fontSize: 24, marginBottom: 6 }}>{config.icon}</div>
      <div style={{
        fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1,
        background: `linear-gradient(135deg, ${config.color}, ${config.color}aa)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        fontVariantNumeric: 'tabular-nums', marginBottom: 5,
      }}>
        {config.prefix}{config.format(animated)}{config.suffix}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 3 }}>{config.label}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{config.sub}</div>
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color, display: 'inline-block', animation: 'pulse 2s infinite' }} />
      </div>
    </motion.div>
  )
}

// ── ARR Card ───────────────────────────────────────────────────────────────
function ARRCard({ arr, milestone, feeStream }: { arr: number; milestone: boolean; feeStream: FeeEvent[] }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const pct = Math.min(100, (arr / 1_345_000_000) * 100)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.5, duration: 0.6 }}
      style={{
        gridColumn: '1 / -1',
        padding: '24px',
        background: milestone
          ? 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(26,31,46,0.95))'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${milestone ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow burst on milestone */}
      {milestone && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.6), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>💰</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>
              Autonomous Revenue Engine
            </span>
            {milestone && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}
              >
                🎯 MILESTONE HIT
              </motion.span>
            )}
          </div>
          <div style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, color: '#f59e0b', marginBottom: 4 }}>
            {fmtARR(arr)}
          </div>
          <div style={{ fontSize: 13, color: '#8892A4' }}>Annualised Recurring Revenue · Target: $1.345B</div>
        </div>

        {/* Fee stream */}
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Live Success Fees
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <AnimatePresence>
              {feeStream.slice(-4).reverse().map((fee) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: '#34d399', fontWeight: 700 }}>+{fmtFee(fee.amount)}</span>
                  <span style={{ color: '#475569' }}>{fee.country}</span>
                  <span style={{ color: '#475569', fontSize: 9 }}>{new Date(fee.ts).toLocaleTimeString()}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {feeStream.length === 0 && (
              <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Waiting for first deal…</div>
            )}
          </div>
        </div>
      </div>

      {/* ARR progress bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10, color: '#475569' }}>
          <span>$0</span>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>{pct.toFixed(1)}% to target</span>
          <span>$1.345B</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #34d399)',
              borderRadius: 3,
              boxShadow: '0 0 12px rgba(245,158,11,0.5)',
            }}
          />
        </div>
        {/* Milestone markers */}
        <div style={{ position: 'relative', height: 12, marginTop: 2 }}>
          {[500_000_000, 1_000_000_000, 1_345_000_000].map(m => {
            const mPct = (m / 1_345_000_000) * 100
            return (
              <div key={m} style={{
                position: 'absolute', left: `${mPct}%`, top: 0,
                width: 1, height: 8, background: arr >= m ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                transform: 'translateX(-50%)',
              }}>
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: arr >= m ? '#f59e0b' : '#475569', whiteSpace: 'nowrap' }}>
                  {m >= 1_000_000_000 ? `$${(m/1_000_000_000).toFixed(1)}B` : `$${m/1_000_000}M`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main MetricsTicker ─────────────────────────────────────────────────────
export default function MetricsTicker() {
  const metrics    = useLiveMetrics()
  const [arr,      setArr]      = useState(() => computeARR())
  const [feeStream,setFeeStream]= useState<FeeEvent[]>([])
  const [milestone,setMilestone]= useState(false)

  // ── Simulate organic ARR growth every 15s ──────────────────────────────
  useEffect(() => {
    const tick = () => setArr(prev => {
      const next = prev + Math.floor(Math.random() * 85_000 + 15_000)
      return Math.min(next, 1_345_000_000)
    })
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [])

  // ── Orchestrator integration ───────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      // Log incoming success fees
      Orchestrator.on('SUCCESS_FEE_CAPTURED', (e) => {
        const fee: FeeEvent = {
          id:       e.payload.feeId,
          amount:   e.payload.amount,
          currency: e.payload.currency,
          country:  e.payload.portfolioCountry,
          ts:       e.ts,
        }
        setFeeStream(prev => [...prev.slice(-9), fee])
        setArr(prev => Math.min(1_345_000_000, prev + fee.amount * 12 * 100))
      }),

      // Milestone celebration
      Orchestrator.on('ARR_MILESTONE_HIT', () => {
        setMilestone(true)
        setTimeout(() => setMilestone(false), 5000)
      }),
    ]

    // Emit METRICS_TICK heartbeat every 30s
    const tickId = setInterval(() => {
      Orchestrator.emit('METRICS_TICK', {
        activeUnits:   metrics.activeUnits ?? 892_000,
        totalManagers: metrics.managers    ?? 52_400,
        leases:        metrics.leases      ?? 2_400_000,
        countries:     metrics.countries   ?? 120,
        arrUSD:        arr,
        tickMs:        Date.now(),
      }, { source: 'MetricsTicker' })
    }, 30_000)

    return () => {
      unsubs.forEach(u => u())
      clearInterval(tickId)
    }
  }, [arr, metrics])

  // ── Simulate demo fees (one fee every ~45s to show the stream) ──────────
  const simulateFee = useCallback(() => {
    const countries = ['UK', 'AE', 'KE', 'US', 'AU', 'ZA']
    const fee: FeeEvent = {
      id:       `fee-demo-${Date.now()}`,
      amount:   Math.floor(Math.random() * 4_500 + 500),
      currency: 'USD',
      country:  countries[Math.floor(Math.random() * countries.length)],
      ts:       Date.now(),
    }
    setFeeStream(prev => [...prev.slice(-9), fee])
    setArr(prev => Math.min(1_345_000_000, prev + fee.amount * 12 * 50))
    trackEvent('success_fee_demo', { amount: fee.amount, country: fee.country })
  }, [])

  useEffect(() => {
    // Trigger first demo fee after 8s, then every 45s
    const first = setTimeout(simulateFee, 8_000)
    const id    = setInterval(simulateFee, 45_000)
    return () => { clearTimeout(first); clearInterval(id) }
  }, [simulateFee])

  return (
    <div>
      {/* ── Main KPI grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: 12,
        marginBottom: 12,
      }}>
        {BASE_METRICS.map((cfg, i) => (
          <MetricCell
            key={cfg.key}
            config={cfg}
            value={metrics[cfg.key as keyof typeof metrics] as number ?? 0}
            idx={i}
          />
        ))}
      </div>

      {/* ── ARR Value-Capture Engine ── */}
      <div style={{ display: 'grid', gap: 12 }}>
        <ARRCard arr={arr} milestone={milestone} feeStream={feeStream} />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginTop: 14, fontFamily: 'JetBrains Mono, monospace' }}>
        ⚡ KPIs update every 10s · ARR curve refreshes every 15s · Orchestrator heartbeat every 30s
      </p>
    </div>
  )
}
