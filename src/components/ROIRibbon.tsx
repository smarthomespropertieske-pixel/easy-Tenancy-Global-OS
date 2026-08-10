// ════════════════════════════════════════════════════════════════════════
//  ROIRibbon.tsx — v4.4 sticky ROI strip (UX directive #3)
//  ─────────────────────────────────────────────────────────────────────
//  Sticky-on-scroll strip right above the hero, with a unit-count dropdown
//  that recomputes savings live. Reads current role via useRole().
//
//  Pure CSS sticky (no scroll JS), no count-up animation (initial render only).
//  Bundle: ~1.5 KB gz.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react'
import { useRole, type Role } from './RoleSwitcher'
import { trackEvent } from '../lib/analytics'

const UNIT_OPTIONS = [10, 50, 100, 500, 1000] as const

// Per-unit annual savings benchmark — by role
const ROLE_SAVINGS: Record<Role, { yr: number; hr: number; vs: string }> = {
  owner:      { yr: 84,  hr: 0.28, vs: 'vs Yardi'    },
  manager:    { yr: 72,  hr: 0.34, vs: 'vs AppFolio' },
  finance:    { yr: 96,  hr: 0.22, vs: 'vs MRI'      },
  compliance: { yr: 64,  hr: 0.42, vs: 'vs manual'   },
  tenant:     { yr: 28,  hr: 0.18, vs: 'vs landlord-direct' },
}

const STORAGE_KEY = 'et_units'

function fmtMoney(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}M`
  if (v >= 10_000)    return `£${(v / 1_000).toFixed(1)}k`
  return `£${v.toLocaleString()}`
}

function fmtHours(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k hrs`
  return `${Math.round(v)} hrs`
}

export default function ROIRibbon() {
  const role = useRole()
  const [units, setUnits] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) return parseInt(stored, 10) || 50
    } catch { /* ignore */ }
    return 50
  })

  const stats = useMemo(() => {
    const s = ROLE_SAVINGS[role]
    const yr  = units * s.yr * 12        // monthly per-unit → annual
    const hr  = units * s.hr * 12        // monthly per-unit → annual hours
    const mo  = hr / 12
    return { yr, hr, mo, vs: s.vs }
  }, [role, units])

  const handleUnits = useCallback((u: number) => {
    setUnits(u)
    try { sessionStorage.setItem(STORAGE_KEY, String(u)) } catch { /* ignore */ }
    trackEvent('roi_engaged', { units: u, role, source: 'ribbon' })
  }, [role])

  return (
    <div className="roi-ribbon" role="region" aria-label="Live ROI snapshot">
      <div className="roi-ribbon-inner">
        <span className="roi-ribbon-label">
          <span className="roi-ribbon-dot" />
          LIVE ROI
        </span>

        <span className="roi-ribbon-stat">
          At a portfolio of
          <select
            className="roi-ribbon-select"
            value={units}
            onChange={(e) => handleUnits(parseInt(e.target.value, 10))}
            aria-label="Select portfolio size in units"
          >
            {UNIT_OPTIONS.map(u => (
              <option key={u} value={u}>{u.toLocaleString()} units</option>
            ))}
          </select>
        </span>

        <span className="roi-ribbon-sep">·</span>

        <span className="roi-ribbon-stat">
          easyTenancy saves
          <span className="roi-ribbon-num">{fmtMoney(stats.yr)}/yr</span>
        </span>

        <span className="roi-ribbon-sep">·</span>

        <span className="roi-ribbon-stat">
          <span className="roi-ribbon-num">{fmtHours(stats.mo)}/mo</span>
          back to your team
        </span>

        <span className="roi-ribbon-sep">·</span>

        <span className="roi-ribbon-vs">{stats.vs}</span>
      </div>
    </div>
  )
}
