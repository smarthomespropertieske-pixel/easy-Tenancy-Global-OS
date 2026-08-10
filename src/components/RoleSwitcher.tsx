// ════════════════════════════════════════════════════════════════════════
//  RoleSwitcher.tsx — v4.4 role-based perspective selector (UX directive #2)
//  ─────────────────────────────────────────────────────────────────────
//  5-pill dropdown that lives in the top nav. Sets sessionStorage('et_role')
//  and dispatches a 'role-changed' window event so downstream components
//  (ROIRibbon, ROICalculator, etc.) can react.
//
//  NO backend, NO route changes. Pure client-side.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { trackEvent } from '../lib/analytics'

export type Role = 'owner' | 'manager' | 'finance' | 'compliance' | 'tenant'

interface RoleConfig {
  id:    Role
  label: string
  icon:  string
  sub:   string
}

const ROLES: RoleConfig[] = [
  { id: 'owner',      label: 'Portfolio Owner',   icon: '◆', sub: 'NOI · IRR · Exit' },
  { id: 'manager',    label: 'Property Manager',  icon: '◈', sub: 'Ops · Tickets · Leases' },
  { id: 'finance',    label: 'Finance',           icon: '$', sub: 'AR · AP · IFRS-16' },
  { id: 'compliance', label: 'Compliance Officer', icon: '◉', sub: '127 jurisdictions' },
  { id: 'tenant',     label: 'Tenant',            icon: '◐', sub: 'Pay · Repair · Renew' },
]

const STORAGE_KEY = 'et_role'
const EVENT_NAME  = 'et:role-changed'

// ── Public helper for other components ─────────────────────────────────
export function getStoredRole(): Role {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY) as Role | null
    if (stored && ROLES.some(r => r.id === stored)) return stored
  } catch { /* SSR-safe */ }
  return 'owner'
}

// ── Subscribe hook for downstream components ───────────────────────────
export function useRole(): Role {
  const [role, setRole] = useState<Role>(() => getStoredRole())
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Role>).detail
      if (detail) setRole(detail)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])
  return role
}

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>(() => getStoredRole())
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handlePick = useCallback((next: Role) => {
    setRole(next)
    setOpen(false)
    try { sessionStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    // Update URL hash (#role=owner) without re-render
    try {
      const u = new URL(window.location.href)
      u.hash = `role=${next}`
      window.history.replaceState({}, '', u.toString())
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent<Role>(EVENT_NAME, { detail: next }))
    trackEvent('feature_clicked', { feature: 'role_switch', role: next })
  }, [])

  const active = ROLES.find(r => r.id === role) ?? ROLES[0]

  return (
    <div className="role-switcher" ref={ref}>
      <button
        type="button"
        className={`role-switcher-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current role: ${active.label}. Click to change.`}
      >
        <span className="role-switcher-dot" aria-hidden="true" />
        <span>{active.label}</span>
        <span className="role-switcher-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="role-switcher-menu" role="listbox" aria-label="Select role">
          {ROLES.map(r => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={r.id === role}
              className={`role-switcher-item${r.id === role ? ' is-active' : ''}`}
              onClick={() => handlePick(r.id)}
            >
              <span className="role-switcher-item-icon" aria-hidden="true">{r.icon}</span>
              <span>{r.label}</span>
              <span className="role-switcher-item-sub">{r.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
