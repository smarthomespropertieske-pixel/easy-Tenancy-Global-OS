// ── HeroStateWidget — State-Injected Handover ─────────────────
// Replaces simple email CTA with a context-aware demo launcher.
// User's intent (units, country, software) is encoded into the URL
// and consumed by AppDemo via useDeepLinkParams().
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'

const COUNTRIES = [
  { code: 'UK', label: '🇬🇧 United Kingdom' },
  { code: 'AE', label: '🇦🇪 UAE (Dubai)' },
  { code: 'KE', label: '🇰🇪 Kenya' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'ZA', label: '🇿🇦 South Africa' },
  { code: 'Global', label: '🌍 Global / Other' },
]

const SOFTWARE = [
  'Buildium', 'AppFolio', 'Yardi', 'RealPage', 'MRI Software',
  'Re-Leased', 'Fixflo', 'Qube PM', 'Excel / Spreadsheet', 'None yet',
]

interface HandoverState {
  units: number
  country: string
  software: string
}

export default function HeroStateWidget() {
  const navigate = useNavigate()
  const [data, setData] = useState<HandoverState>({ units: 50, country: 'UK', software: 'Buildium' })
  const [launched, setLaunched] = useState(false)

  const startDemo = () => {
    if (launched) return
    setLaunched(true)

    trackEvent('hero_widget_launched', {
      units:    data.units,
      country:  data.country,
      software: data.software,
    })

    // Encode all user intent into URL params so AppDemo can hydrate instantly
    const params = new URLSearchParams({
      units:        String(data.units),
      country:      data.country,
      software:     data.software,
      tour:         'auto',
      demoTenantId: data.country === 'KE' ? 'demo-001'
                  : data.country === 'UK' ? 'demo-002'
                  : 'demo-003',
    })

    setTimeout(() => navigate(`/app/demo?${params.toString()}`), 260)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      {/* Input row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}>

        {/* Units */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.08)',
          flex: '0 0 auto',
        }}>
          <span style={{ fontSize: 14, color: '#475569' }}>🏢</span>
          <input
            type="number"
            min={1}
            max={100000}
            value={data.units}
            onChange={e => setData(d => ({ ...d, units: Math.max(1, Number(e.target.value)) }))}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontWeight: 700, fontSize: 15, width: 64,
              fontFamily: 'inherit',
            }}
          />
          <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>units</span>
        </div>

        {/* Country */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 14px', borderRight: '1px solid rgba(255,255,255,0.08)',
          flex: '1 1 140px',
        }}>
          <select
            value={data.country}
            onChange={e => setData(d => ({ ...d, country: e.target.value }))}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit',
              cursor: 'pointer', flex: 1, minWidth: 0,
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: '#0d1528' }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Current software */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 14px',
          flex: '1 1 140px',
        }}>
          <span style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>from</span>
          <select
            value={data.software}
            onChange={e => setData(d => ({ ...d, software: e.target.value }))}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit',
              cursor: 'pointer', flex: 1, minWidth: 0,
            }}
          >
            {SOFTWARE.map(s => (
              <option key={s} value={s} style={{ background: '#0d1528' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Launch button */}
      <motion.button
        onClick={startDemo}
        disabled={launched}
        whileHover={!launched ? { scale: 1.02, y: -2 } : {}}
        whileTap={!launched ? { scale: 0.98 } : {}}
        style={{
          width: '100%',
          padding: '15px 24px',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: launched ? 'not-allowed' : 'pointer',
          border: 'none',
          background: launched
            ? 'rgba(57,191,246,0.2)'
            : 'linear-gradient(135deg, #2563eb 0%, #39bff6 50%, #7c3aed 100%)',
          color: launched ? '#475569' : '#fff',
          letterSpacing: '-0.3px',
          transition: 'all 0.2s',
          boxShadow: launched ? 'none' : '0 8px 32px rgba(57,191,246,0.25)',
          fontFamily: 'inherit',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {launched ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Building your {data.units}-unit {data.country} OS…
            </motion.span>
          ) : (
            <motion.span key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Build My OS → {data.units} units · {data.country}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Context hint */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', margin: 0 }}>
        Migrating from <strong style={{ color: '#475569' }}>{data.software}</strong>
        {' '}— free migration included · no credit card
      </p>
    </motion.div>
  )
}
