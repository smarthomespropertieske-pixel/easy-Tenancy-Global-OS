import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { trackEvent } from '../lib/analytics'
import { buildDemoUrl } from '../lib/demoData'
import { useToast } from '../hooks'

export default function ROICalculator() {
  const [units, setUnits] = useState(45)
  const [rent, setRent] = useState(2800)
  const [occupancy, setOccupancy] = useState(91)
  const [compHours, setCompHours] = useState(22)
  const [engaged, setEngaged] = useState(false)
  const navigate = useNavigate()
  const showToast = useToast()

  const monthlyRevenue = units * rent * (occupancy / 100)
  const annualRevenue = monthlyRevenue * 12
  const occupancyGain = units * rent * 0.052 * 12
  const legalSavings = compHours * 12 * 180
  const timeSavedHours = compHours * 0.85 * 12
  const noiUplift = annualRevenue * 0.23
  const totalGain = occupancyGain + legalSavings + noiUplift
  const annualCost = 149 * 12
  const roiMultiple = Math.round(totalGain / annualCost)

  const handleChange = () => {
    if (!engaged) {
      setEngaged(true)
      trackEvent('roi_engaged', { units, rent, occupancy })
    }
  }

  const handlePreview = () => {
    trackEvent('demo_started', { source: 'roi_calculator', units, rent, occupancy })
    showToast('Opening demo dashboard with your data…')
    setTimeout(() => navigate(buildDemoUrl({ units, monthlyRent: rent, occupancy, demoTenantId: 'demo-001' })), 600)
  }

  const fmt = (n: number) => n >= 1000000
    ? `$${(n/1000000).toFixed(1)}M`
    : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${Math.round(n)}`

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

      {/* Inputs */}
      <div>
        <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 24 }}>Your portfolio</h3>
        {[
          { label: 'Number of units', value: units, min: 1, max: 5000, step: 1, set: setUnits, suffix: 'units', format: (v: number) => v },
          { label: 'Avg monthly rent', value: rent, min: 100, max: 50000, step: 100, set: setRent, suffix: '/mo', format: (v: number) => `$${v.toLocaleString()}` },
          { label: 'Current occupancy', value: occupancy, min: 50, max: 100, step: 1, set: setOccupancy, suffix: '%', format: (v: number) => `${v}%` },
          { label: 'Compliance hrs/mo', value: compHours, min: 1, max: 200, step: 1, set: setCompHours, suffix: 'hrs', format: (v: number) => `${v}h` },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{field.label}</label>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                {field.format(field.value)}
              </span>
            </div>
            <input
              type="range"
              min={field.min} max={field.max} step={field.step} value={field.value}
              onChange={e => { field.set(Number(e.target.value)); handleChange() }}
              style={{ width: '100%', accentColor: 'var(--blue)', height: 4, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{field.min}{field.suffix}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{field.max}{field.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div>
        <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 24 }}>Your projected return</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Extra revenue (occupancy uplift)', value: fmt(occupancyGain), color: '#10b981' },
            { label: 'Legal cost savings', value: fmt(legalSavings), color: '#39bff6' },
            { label: 'NOI uplift (+23% median)', value: fmt(noiUplift), color: '#a78bfa' },
            { label: 'Time saved', value: `${Math.round(timeSavedHours)} hrs/yr`, color: '#f59e0b' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: row.color, fontFamily: 'JetBrains Mono, monospace' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ROI Hero */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ textAlign: 'center', padding: '24px 20px', background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(57,191,246,0.25)', borderRadius: 18, marginBottom: 16 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 6 }}>Your estimated ROI multiple</div>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-2px', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontVariantNumeric: 'tabular-nums' }}>
            {roiMultiple}×
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>vs Platform cost of {fmt(annualCost)}/yr</div>
        </motion.div>

        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}
          onClick={handlePreview}
        >
          🚀 Preview in easyTenancy →
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
          Opens your pre-configured demo dashboard
        </p>
      </div>

      {/* Mobile: stack columns */}
      <style>{`@media(max-width:768px){.roi-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
