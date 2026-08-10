/* ═══════════════════════════════════════════════════════════════════════
   GeoBanner — top-of-hero region pill that:
   • detects user country (timezone), shows flag + region name
   • shows PPP-adjusted Professional-tier price in local currency
   • shows a "Switch region" affordance
═══════════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react'
import { detectRegion, formatPrice, listRegions, setRegion, type RegionInfo } from '../lib/geoMarket'
import { trackEvent } from '../lib/analytics'

interface Props {
  /** USD list price for the tier we're highlighting (default Professional $49) */
  usdPrice?: number
  onChange?: (info: RegionInfo) => void
}

export default function GeoBanner({ usdPrice = 49, onChange }: Props) {
  const [region, setReg] = useState<RegionInfo>(() => detectRegion())
  const [open, setOpen] = useState(false)
  const price = formatPrice(usdPrice, region)

  const pick = (country: string) => {
    const next = setRegion(country)
    setReg(next)
    setOpen(false)
    trackEvent('feature_clicked', { feature: `region_switch_${next.country}`, location: 'geo_banner' })
    onChange?.(next)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="geo-pill"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={`Region: ${region.countryName}. Click to change.`}
      >
        <span className="flag" aria-hidden="true">{region.flag}</span>
        <span>{region.countryName}</span>
        <span className="sep" aria-hidden="true" />
        <span className="price">{price.display}</span>
        {price.savings != null && (
          <span style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em',
            padding: '2px 6px', borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(57,191,246,0.12))',
            border: '1px solid rgba(16,185,129,0.32)',
            color: '#6ee7b7',
          }}>
            PPP −{price.savings}%
          </span>
        )}
        <span aria-hidden="true" style={{ fontSize: 10, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose region"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            background: 'rgba(9, 13, 26, 0.96)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 14,
            padding: 6,
            minWidth: 260, maxHeight: 320, overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            zIndex: 50,
          }}
        >
          {listRegions().map(r => {
            const rp = formatPrice(usdPrice, r)
            const active = r.country === region.country
            return (
              <button
                key={r.country}
                role="option"
                aria-selected={active}
                onClick={() => pick(r.country)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex',
                  alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: active ? 'rgba(42,157,232,0.16)' : 'transparent',
                  border: '1px solid transparent',
                  color: active ? '#fff' : 'var(--text2)',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 200ms',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16 }}>{r.flag}</span>
                <span style={{ flex: 1 }}>{r.countryName}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>
                  {rp.display}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
