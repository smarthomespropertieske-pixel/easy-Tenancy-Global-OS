import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveMetrics, useAnimatedCounter } from '../hooks'
import { trackEvent } from '../lib/analytics'

interface MetricConfig {
  key: keyof ReturnType<typeof useLiveMetrics>
  label: string
  suffix: string
  prefix?: string
  format: (v: number) => string
  color: string
  icon: string
  sub: string
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'managers',      label: 'Property Managers', suffix: '+', prefix: '', format: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v), color: '#39bff6', icon: '👥', sub: 'Across 120 countries' },
  { key: 'leases',        label: 'Leases Managed',    suffix: '',  prefix: '', format: v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v), color: '#a78bfa', icon: '📄', sub: 'AI-trained dataset' },
  { key: 'complianceRate',label: 'Compliance Rate',   suffix: '%', prefix: '', format: v => String(v), color: '#10b981', icon: '⚖️', sub: 'Zero fines guarantee' },
  { key: 'countries',     label: 'Jurisdictions',     suffix: '',  prefix: '', format: v => String(v), color: '#f59e0b', icon: '🌍', sub: 'Live regulatory data' },
  { key: 'roi',           label: 'Avg Year-1 ROI',    suffix: '×', prefix: '', format: v => String(v), color: '#ef4444', icon: '📈', sub: 'Verified by customers' },
  { key: 'hoursaved',     label: 'Hrs Saved/Month',   suffix: '+', prefix: '', format: v => String(v), color: '#06b6d4', icon: '⏱️', sub: 'Per manager average' },
]

function MetricCell({ config, value, idx }: { config: MetricConfig; value: number; idx: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const animated = useAnimatedCounter(visible ? value : 0, 1600, [visible, value])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => trackEvent('metrics_viewed', { metric: config.key })}
      style={{
        padding: '24px 20px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderTop: `2px solid ${config.color}`,
        borderRadius: 16,
        textAlign: 'center',
        cursor: 'default',
        transition: 'background 0.25s, transform 0.25s, box-shadow 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ background: 'rgba(255,255,255,0.08)', y: -4, boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${config.color}22` } as never}
    >
      {/* Subtle shimmer on top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${config.color}66, transparent)` }} />

      <div style={{ fontSize: 28, marginBottom: 8 }}>{config.icon}</div>
      <div style={{
        fontSize: 'clamp(28px, 3vw, 40px)',
        fontWeight: 900,
        letterSpacing: '-1.5px',
        lineHeight: 1,
        background: `linear-gradient(135deg, ${config.color}, ${config.color}aa)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 6,
      }}>
        {config.prefix}{config.format(animated)}{config.suffix}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{config.label}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{config.sub}</div>

      {/* Live indicator */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color, display: 'inline-block', animation: 'pulse 2s infinite' }} />
      </div>
    </motion.div>
  )
}

export default function MetricsTicker() {
  const metrics = useLiveMetrics()

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {METRIC_CONFIGS.map((cfg, i) => (
          <MetricCell key={cfg.key} config={cfg} value={metrics[cfg.key] as number} idx={i} />
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 14, fontFamily: 'JetBrains Mono, monospace' }}>
        ⚡ Metrics update every 10s from live platform data
      </p>
    </div>
  )
}
