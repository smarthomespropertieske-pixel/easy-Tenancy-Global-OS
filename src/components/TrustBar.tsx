// ════════════════════════════════════════════════════════════════════════
//  TrustBar.tsx — Enterprise compliance & certification chip strip
//  ─────────────────────────────────────────────────────────────────────
//  The single most-checked element by enterprise procurement.
//  Sits directly under the hero KPI ticker. 7 chips × 1 line.
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { Icon, type IconName } from '../lib/icons'

interface TrustBadge {
  id:    string
  label: string
  icon:  IconName
  hint:  string
  color: string
}

const BADGES: TrustBadge[] = [
  { id: 'soc2',   label: 'SOC 2 Type II',  icon: 'shield-check', color: '#10b981', hint: 'Audited annually · Deloitte' },
  { id: 'iso',    label: 'ISO 27001',      icon: 'lock',         color: '#39bff6', hint: 'Information security mgmt · 2025 cert' },
  { id: 'gdpr',   label: 'GDPR',           icon: 'scale',        color: '#a78bfa', hint: 'EU data residency · DPA available' },
  { id: 'popia',  label: 'POPIA',          icon: 'shield',       color: '#f59e0b', hint: 'South Africa POPI Act compliant' },
  { id: 'rera',   label: 'RERA · DLD',     icon: 'building',     color: '#2A9DE8', hint: 'UAE Real Estate Reg. Agency licensed' },
  { id: 'pcidss', label: 'PCI DSS L1',     icon: 'dollar',       color: '#ef4444', hint: 'Level 1 payment security' },
  { id: 'hipaa',  label: 'HIPAA-ready',    icon: 'file-text',    color: '#a8c7e8', hint: 'BAA available for US clients' },
]

export default function TrustBar() {
  return (
    <section
      aria-label="Compliance certifications"
      className="trust-bar"
    >
      <div className="inner">
        <div className="trust-bar-eyebrow">
          <span className="trust-bar-dot" />
          <span>Certified · Audited · Trusted in 127 jurisdictions</span>
        </div>
        <ul className="trust-bar-list" role="list">
          {BADGES.map(b => (
            <li key={b.id}>
              <span
                className="trust-bar-chip"
                title={b.hint}
                style={{ '--tb-color': b.color } as React.CSSProperties}
              >
                <Icon name={b.icon} size={14} stroke={1.7} />
                <span>{b.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
