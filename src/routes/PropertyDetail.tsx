// ── PropertyDetail — /org/:orgId/properties/:propId/:section ──
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getDemoTenant, DEMO_TENANTS, type DemoProperty, type DemoTenant } from '../lib/demoData'
import { trackEvent } from '../lib/analytics'
import { useIsMobile } from '../hooks'

// ── Types ─────────────────────────────────────────────────────
type Section = 'overview' | 'compliance' | 'collections' | 'maintenance' | 'leases' | 'arrears' | 'screening' | 'vacancies'

// ── Helpers ───────────────────────────────────────────────────
function statusColor(s: DemoProperty['status']) {
  return s === 'compliant' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444'
}
function pct(n: number) { return `${n.toFixed(1)}%` }
function fmt(n: number, prefix = '') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`
  return `${prefix}${n}`
}

// ── Mock data generators ──────────────────────────────────────
function genLeases(propId: string, count: number) {
  const statuses = ['Active', 'Active', 'Active', 'Due Renewal', 'Expired', 'Active'] as const
  const names = ['James Mwangi', 'Sarah Chen', 'David Okafor', 'Priya Nair', 'Mohammed Al-Rashid', 'Elena Kovacs', 'Tom Webster', 'Ana Flores']
  return Array.from({ length: Math.min(count, 8) }, (_, i) => ({
    id: `${propId}-L${String(i + 1).padStart(3, '0')}`,
    unit: `Unit ${Math.floor(i / 2) + 1}${String.fromCharCode(65 + (i % 4))}`,
    tenant: names[i % names.length],
    start: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
    end: `2025-${String(((i + 6) % 12) + 1).padStart(2, '0')}-01`,
    rent: 1200 + i * 150,
    status: statuses[i % statuses.length],
    uplift: (2.8 + i * 0.3).toFixed(1),
  }))
}

function genMaintenanceTickets(propId: string) {
  const types = ['Plumbing', 'HVAC', 'Electrical', 'General', 'Structural', 'Appliance']
  const priorities = ['Low', 'Medium', 'High', 'Critical'] as const
  const statuses = ['Open', 'In Progress', 'Resolved', 'Pending Parts'] as const
  return Array.from({ length: 7 }, (_, i) => ({
    id: `${propId}-MX-${1000 + i}`,
    unit: `Unit ${i + 1}B`,
    type: types[i % types.length],
    description: [
      'Dripping tap — bathroom sink',
      'HVAC filter replacement due',
      'Circuit breaker tripping — kitchen',
      'Doorbell not working',
      'Hairline crack — exterior wall',
      'Dishwasher not draining',
      'Boiler annual service',
    ][i],
    priority: priorities[i % priorities.length],
    status: statuses[i % statuses.length],
    created: `2025-0${(i % 4) + 1}-${String(i * 3 + 2).padStart(2, '0')}`,
    sla: `${12 + i * 8}h`,
    resolved: i % statuses.length === 2,
  }))
}

function genCollections(count: number, currency: string) {
  const methods = ['M-Pesa', 'Bank Transfer', 'Direct Debit', 'Card', 'Cheque']
  const statuses = ['Paid', 'Paid', 'Paid', 'Pending', 'Overdue'] as const
  return Array.from({ length: Math.min(count, 8) }, (_, i) => ({
    id: `TXN-${10000 + i}`,
    unit: `Unit ${i + 1}${String.fromCharCode(65 + (i % 4))}`,
    amount: 1200 + i * 200,
    method: methods[i % methods.length],
    date: `2025-04-${String(i + 1).padStart(2, '0')}`,
    status: statuses[i % statuses.length],
    currency,
    receipt: `RCT-${20000 + i}`,
  }))
}

function genComplianceItems(propId: string) {
  return [
    { id: `${propId}-C001`, category: 'EPC', item: 'Energy Performance Certificate', status: 'Valid', expiry: '2026-03-15', score: 'B', required: true },
    { id: `${propId}-C002`, category: 'Gas Safety', item: 'Annual Gas Safety Certificate', status: 'Valid', expiry: '2025-11-20', score: '—', required: true },
    { id: `${propId}-C003`, category: 'EICR', item: 'Electrical Installation Condition Report', status: 'Due Soon', expiry: '2025-06-01', score: '—', required: true },
    { id: `${propId}-C004`, category: 'Fire', item: 'Fire Risk Assessment', status: 'Valid', expiry: '2026-01-10', score: '—', required: true },
    { id: `${propId}-C005`, category: 'HHSRS', item: 'Housing Health & Safety Rating', status: 'Valid', expiry: '2026-05-01', score: 'Pass', required: false },
    { id: `${propId}-C006`, category: 'Legionella', item: 'Legionella Risk Assessment', status: 'Valid', expiry: '2025-09-12', score: '—', required: true },
  ]
}

function genArrears() {
  return [
    { unit: 'Unit 3C', tenant: 'John Smith', days: 42, amount: 2400, stage: 'Notice Issued', noticeType: 'Section 8', issued: '2025-03-25' },
    { unit: 'Unit 7A', tenant: 'Maria Garcia', days: 18, amount: 1200, stage: 'Reminder Sent', noticeType: null, issued: null },
    { unit: 'Unit 12B', tenant: 'Kevin Osei', days: 65, amount: 3900, stage: 'Legal Proceedings', noticeType: 'Section 21', issued: '2025-02-10' },
  ]
}

function genVacancies(propId: string, units: number) {
  const vacant = Math.max(1, Math.floor(units * 0.05))
  return Array.from({ length: vacant }, (_, i) => ({
    id: `${propId}-V${i + 1}`,
    unit: `Unit ${units - i}D`,
    since: `2025-03-${String(10 + i * 5).padStart(2, '0')}`,
    marketRent: 1400 + i * 200,
    bedrooms: 2 + i,
    status: i === 0 ? 'Active Marketing' : 'Pre-Marketing',
    applications: i === 0 ? 3 : 0,
    predictedFill: `${14 - i * 3} days`,
  }))
}

function genScreening() {
  return [
    { id: 'APP-001', name: 'James Harrison', score: 94, income: '£48,000', creditScore: 'Excellent', status: 'Recommended', applied: '2025-04-20', referenceStatus: 'Verified' },
    { id: 'APP-002', name: 'Fatima Al-Zahra', score: 87, income: '£41,000', creditScore: 'Good', status: 'Review', applied: '2025-04-21', referenceStatus: 'Pending' },
    { id: 'APP-003', name: 'Yusuf Okonkwo', score: 61, income: '£29,000', creditScore: 'Fair', status: 'Decline', applied: '2025-04-19', referenceStatus: 'Failed' },
  ]
}

// ── Section components ────────────────────────────────────────

function OverviewSection({ prop, tenant }: { prop: DemoProperty; tenant: DemoTenant }) {
  const items = [
    { l: 'Units', v: String(prop.units), c: '#39bff6' },
    { l: 'Occupancy', v: pct(prop.occupancy), c: '#a78bfa' },
    { l: 'Collections', v: pct(prop.collections), c: '#10b981' },
    { l: 'Compliance', v: prop.status, c: statusColor(prop.status) },
    { l: 'Last Check', v: prop.lastCompliance, c: '#f59e0b' },
    { l: 'Currency', v: tenant.currency, c: '#39bff6' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {items.map(({ l, v, c }) => (
          <motion.div key={l} whileHover={{ translateY: -3 }} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c, textTransform: 'capitalize' }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass-card" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8', marginBottom: 14 }}>Property Summary</div>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
          <strong style={{ color: '#e2e8f0' }}>{prop.name}</strong> is a {prop.units}-unit residential property managed through easyTenancy.
          Current occupancy stands at <strong style={{ color: '#a78bfa' }}>{pct(prop.occupancy)}</strong> with a collections rate of{' '}
          <strong style={{ color: '#10b981' }}>{pct(prop.collections)}</strong>. Compliance status is{' '}
          <strong style={{ color: statusColor(prop.status), textTransform: 'capitalize' }}>{prop.status}</strong>.
          Last compliance check was conducted on {prop.lastCompliance}.
        </p>
        <div style={{ marginTop: 16, padding: '12px', background: 'rgba(57,191,246,0.06)', borderRadius: 8, border: '1px solid rgba(57,191,246,0.15)', fontSize: 13, color: '#64748b' }}>
          🤖 <strong style={{ color: '#39bff6' }}>AI Insight:</strong> Based on current occupancy trends, this property is projected to achieve{' '}
          <span style={{ color: '#10b981' }}>+2.1% NOI improvement</span> over the next quarter through proactive lease renewals and maintenance pre-scheduling.
        </div>
      </div>
    </div>
  )
}

function ComplianceSection({ prop }: { prop: DemoProperty }) {
  const items = genComplianceItems(prop.id)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    trackEvent('notice_generated', { propId: prop.id })
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 1800)
  }

  const compColor = (s: string) => s === 'Valid' ? '#10b981' : s === 'Due Soon' ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { l: 'Valid', count: items.filter(i => i.status === 'Valid').length, c: '#10b981' },
          { l: 'Due Soon', count: items.filter(i => i.status === 'Due Soon').length, c: '#f59e0b' },
          { l: 'Expired', count: items.filter(i => i.status === 'Expired').length, c: '#ef4444' },
        ].map(({ l, count, c }) => (
          <div key={l} style={{ flex: 1, minWidth: 100, textAlign: 'center', background: `${c}12`, borderRadius: 10, padding: '12px', border: `1px solid ${c}30` }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{count}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card"
            style={{ borderRadius: 10, padding: '14px 18px', marginBottom: 8, borderLeft: `3px solid ${compColor(item.status)}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.item}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                  {item.category} · Expires: {item.expiry}
                  {item.score !== '—' && ` · Score: ${item.score}`}
                  {item.required && ' · Required'}
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: `${compColor(item.status)}20`, color: compColor(item.status),
                border: `1px solid ${compColor(item.status)}40`
              }}>{item.status}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card" style={{ borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(167,139,250,0.2)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#a78bfa', marginBottom: 12 }}>⚡ Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', border: 'none',
              opacity: generating ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {generating ? '⏳ Generating…' : generated ? '✅ Notice Ready' : '📄 Generate Notice'}
          </button>
          <button style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
            📅 Schedule Renewal
          </button>
          <button style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
            📤 Export Certificates
          </button>
        </div>
        {generated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 14, padding: '12px', background: 'rgba(167,139,250,0.08)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace', fontSize: 12, color: '#c4b5fd' }}
          >
            NOTICE RE: {prop.name}<br />
            Date: {new Date().toLocaleDateString('en-GB')}<br />
            Re: Compliance Certificate Update Notice<br />
            <br />
            This notice confirms that the following certifications have been reviewed…<br />
            [Full notice auto-populated by easyTenancy AI]
          </motion.div>
        )}
      </div>
    </div>
  )
}

function CollectionsSection({ prop, tenant }: { prop: DemoProperty; tenant: DemoTenant }) {
  const records = genCollections(prop.units, tenant.currency)
  const totalCollected = records.filter(r => r.status === 'Paid').reduce((a, r) => a + r.amount, 0)
  const totalPending = records.filter(r => r.status === 'Pending').reduce((a, r) => a + r.amount, 0)
  const totalOverdue = records.filter(r => r.status === 'Overdue').reduce((a, r) => a + r.amount, 0)
  const sc = (s: string) => s === 'Paid' ? '#10b981' : s === 'Pending' ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Collected', v: fmt(totalCollected, `${tenant.currency} `), c: '#10b981' },
          { l: 'Pending', v: fmt(totalPending, `${tenant.currency} `), c: '#f59e0b' },
          { l: 'Overdue', v: fmt(totalOverdue, `${tenant.currency} `), c: '#ef4444' },
          { l: 'Collection Rate', v: pct(prop.collections), c: '#39bff6' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: 13, color: '#94a3b8' }}>
          Recent Transactions
        </div>
        {records.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              flexWrap: 'wrap', gap: 8
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc(r.status), flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{r.unit}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{r.method} · {r.date} · {r.receipt}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: sc(r.status) }}>{r.currency} {r.amount.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: sc(r.status), background: `${sc(r.status)}18`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${sc(r.status)}30` }}>{r.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MaintenanceSection({ prop }: { prop: DemoProperty }) {
  const tickets = genMaintenanceTickets(prop.id)
  const [selected, setSelected] = useState<string | null>(null)
  const pc = (p: string) => ({ Low: '#10b981', Medium: '#39bff6', High: '#f59e0b', Critical: '#ef4444' }[p] ?? '#94a3b8')
  const sc = (s: string) => ({ Open: '#ef4444', 'In Progress': '#f59e0b', Resolved: '#10b981', 'Pending Parts': '#a78bfa' }[s] ?? '#94a3b8')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Open', v: tickets.filter(t => t.status === 'Open').length, c: '#ef4444' },
          { l: 'In Progress', v: tickets.filter(t => t.status === 'In Progress').length, c: '#f59e0b' },
          { l: 'Resolved', v: tickets.filter(t => t.status === 'Resolved').length, c: '#10b981' },
          { l: 'Avg SLA', v: '18h', c: '#39bff6' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {tickets.map((t, i) => (
        <motion.div
          key={t.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => { setSelected(selected === t.id ? null : t.id); trackEvent('feature_clicked', { feature: 'maintenance_ticket', id: t.id }) }}
          className="glass-card"
          style={{ borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', borderLeft: `3px solid ${pc(t.priority)}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{t.unit} — {t.type}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.description}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: pc(t.priority), background: `${pc(t.priority)}18`, padding: '2px 7px', borderRadius: 4 }}>{t.priority}</span>
              <span style={{ fontSize: 11, color: sc(t.status), background: `${sc(t.status)}18`, padding: '2px 7px', borderRadius: 4 }}>{t.status}</span>
              <span style={{ fontSize: 11, color: '#475569' }}>SLA: {t.sla}</span>
            </div>
          </div>
          <AnimatePresence>
            {selected === t.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Assign Contractor', 'Update Status', 'Request Parts', 'Close Ticket'].map(action => (
                    <button key={action} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      {action}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#334155' }}>
                  Created: {t.created} · Ticket: {t.id}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

function LeasesSection({ prop, tenant }: { prop: DemoProperty; tenant: DemoTenant }) {
  const leases = genLeases(prop.id, Math.min(prop.units, 8))
  const sc = (s: string) => ({ Active: '#10b981', 'Due Renewal': '#f59e0b', Expired: '#ef4444' }[s] ?? '#94a3b8')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Active Leases', v: leases.filter(l => l.status === 'Active').length, c: '#10b981' },
          { l: 'Due Renewal', v: leases.filter(l => l.status === 'Due Renewal').length, c: '#f59e0b' },
          { l: 'Expired', v: leases.filter(l => l.status === 'Expired').length, c: '#ef4444' },
          { l: 'Avg Uplift', v: `+${(leases.reduce((a, l) => a + parseFloat(l.uplift), 0) / leases.length).toFixed(1)}%`, c: '#a78bfa' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#94a3b8' }}>Lease Schedule</span>
          <button style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(57,191,246,0.15)', border: '1px solid rgba(57,191,246,0.3)', color: '#39bff6' }}>
            Batch Renew
          </button>
        </div>
        {leases.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: 8 }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{l.unit} — {l.tenant}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{l.start} → {l.end} · {tenant.currency} {l.rent.toLocaleString()}/mo</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#10b981' }}>+{l.uplift}% uplift</span>
              <span style={{ fontSize: 11, color: sc(l.status), background: `${sc(l.status)}18`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${sc(l.status)}30` }}>
                {l.status}
              </span>
              {l.status === 'Due Renewal' && (
                <button style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  Renew →
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ArrearsSection({ prop, tenant }: { prop: DemoProperty; tenant: DemoTenant }) {
  const records = genArrears()
  const [noticeModal, setNoticeModal] = useState<string | null>(null)
  const stageColor = (s: string) => ({ 'Reminder Sent': '#f59e0b', 'Notice Issued': '#ef4444', 'Legal Proceedings': '#dc2626' }[s] ?? '#94a3b8')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'In Arrears', v: records.length, c: '#ef4444' },
          { l: 'Total Owed', v: fmt(records.reduce((a, r) => a + r.amount, 0), `${tenant.currency} `), c: '#f59e0b' },
          { l: 'Notices Filed', v: records.filter(r => r.noticeType).length, c: '#a78bfa' },
          { l: 'Arrears Rate', v: pct(tenant.arrears), c: tenant.arrears < 3 ? '#10b981' : '#ef4444' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {records.map((r, i) => (
        <motion.div
          key={r.unit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card"
          style={{ borderRadius: 12, padding: '16px 20px', marginBottom: 10, borderLeft: `3px solid ${stageColor(r.stage)}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{r.unit} — {r.tenant}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {r.days} days overdue · {tenant.currency} {r.amount.toLocaleString()} owed
                {r.noticeType && ` · ${r.noticeType} issued ${r.issued}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: stageColor(r.stage), background: `${stageColor(r.stage)}18`, padding: '3px 10px', borderRadius: 4, border: `1px solid ${stageColor(r.stage)}30` }}>
                {r.stage}
              </span>
              <button
                onClick={() => { setNoticeModal(r.unit); trackEvent('notice_generated', { unit: r.unit }) }}
                style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}
              >
                📄 Generate Notice
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Notice modal */}
      <AnimatePresence>
        {noticeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNoticeModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass-card"
              style={{ maxWidth: 520, width: '100%', borderRadius: 16, padding: '28px', background: 'rgba(13,21,40,0.98)' }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 4 }}>📄 Notice Preview</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>Auto-generated by easyTenancy AI · {noticeModal}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '16px', lineHeight: 1.8, border: '1px solid rgba(255,255,255,0.06)' }}>
                SECTION 8 NOTICE TO QUIT<br />
                Property: {prop.name}<br />
                Unit: {noticeModal}<br />
                Date: {new Date().toLocaleDateString('en-GB')}<br />
                <br />
                To the Tenant(s) of the above property,<br />
                <br />
                TAKE NOTICE that the landlord intends to apply to the court for<br />
                an order for possession on the grounds set out below.<br />
                Ground 8, 10 & 11 — Rent Arrears<br />
                <br />
                [Full notice auto-populated — AI reviewed for legal accuracy]
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', border: 'none', fontWeight: 600 }}>
                  Download PDF
                </button>
                <button onClick={() => setNoticeModal(null)} style={{ padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScreeningSection({ prop }: { prop: DemoProperty }) {
  const applicants = genScreening()
  const sc = (s: string) => ({ Recommended: '#10b981', Review: '#f59e0b', Decline: '#ef4444' }[s] ?? '#94a3b8')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Applications', v: applicants.length, c: '#39bff6' },
          { l: 'Recommended', v: applicants.filter(a => a.status === 'Recommended').length, c: '#10b981' },
          { l: 'For Review', v: applicants.filter(a => a.status === 'Review').length, c: '#f59e0b' },
          { l: 'Avg Score', v: `${Math.round(applicants.reduce((a, x) => a + x.score, 0) / applicants.length)}/100`, c: '#a78bfa' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {applicants.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card"
          style={{ borderRadius: 12, padding: '18px 22px', marginBottom: 10 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${sc(a.status)}, ${sc(a.status)}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: '#fff'
              }}>
                {a.score}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  Income: {a.income} · Credit: {a.creditScore} · Applied: {a.applied}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#475569' }}>Refs: {a.referenceStatus}</span>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: `${sc(a.status)}18`, color: sc(a.status),
                border: `1px solid ${sc(a.status)}30`
              }}>{a.status}</span>
              {a.status === 'Recommended' && (
                <button style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                  Approve →
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function VacanciesSection({ prop, tenant }: { prop: DemoProperty; tenant: DemoTenant }) {
  const vacancies = genVacancies(prop.id, prop.units)
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Vacant Units', v: vacancies.length, c: '#ef4444' },
          { l: 'Vacancy Rate', v: pct((vacancies.length / prop.units) * 100), c: '#f59e0b' },
          { l: 'Est. Lost Rent', v: fmt(vacancies.reduce((a, v) => a + v.marketRent, 0), `${tenant.currency} `), c: '#ef4444' },
          { l: 'Active Applications', v: vacancies.reduce((a, v) => a + v.applications, 0), c: '#10b981' },
        ].map(({ l, v, c }) => (
          <div key={l} className="glass-card" style={{ borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {vacancies.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card"
          style={{ borderRadius: 12, padding: '18px 22px', marginBottom: 10 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{v.unit} — {v.bedrooms} Bed</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                Vacant since {v.since} · Market rent: {tenant.currency} {v.marketRent.toLocaleString()}/mo
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#39bff6' }}>AI: fills in ~{v.predictedFill}</span>
              <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 4 }}>
                {v.applications} applicants
              </span>
              <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 4 }}>{v.status}</span>
              <button
                onClick={() => navigate(`/org/demo-001/properties/${prop.id}/screening`)}
                style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(57,191,246,0.15)', border: '1px solid rgba(57,191,246,0.3)', color: '#39bff6' }}
              >
                View Applicants →
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Section nav config ────────────────────────────────────────
const SECTION_CONFIG: { id: Section; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'compliance', label: 'Compliance', icon: '🛡️' },
  { id: 'collections', label: 'Collections', icon: '💳' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'leases', label: 'Leases', icon: '📋' },
  { id: 'arrears', label: 'Arrears', icon: '⚠️' },
  { id: 'screening', label: 'Screening', icon: '🔍' },
  { id: 'vacancies', label: 'Vacancies', icon: '🏠' },
]

// ── Main PropertyDetail component ─────────────────────────────
export default function PropertyDetail() {
  const { orgId, propId, section } = useParams<{ orgId: string; propId: string; section: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Resolve section from URL param
  const activeSection = (SECTION_CONFIG.find(s => s.id === section)?.id ?? 'overview') as Section

  // Resolve property + tenant from any matching demo tenant
  const tenant = Object.values(DEMO_TENANTS).find(t =>
    t.properties.some(p => p.id === propId)
  ) ?? DEMO_TENANTS['demo-001']

  const property = tenant.properties.find(p => p.id === propId) ?? tenant.properties[0]

  useEffect(() => {
    trackEvent('property_viewed', { propId, section, orgId })
  }, [propId, section])

  const handleSection = (s: Section) => {
    navigate(`/org/${orgId}/properties/${propId}/${s}`)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':     return <OverviewSection prop={property} tenant={tenant} />
      case 'compliance':   return <ComplianceSection prop={property} />
      case 'collections':  return <CollectionsSection prop={property} tenant={tenant} />
      case 'maintenance':  return <MaintenanceSection prop={property} />
      case 'leases':       return <LeasesSection prop={property} tenant={tenant} />
      case 'arrears':      return <ArrearsSection prop={property} tenant={tenant} />
      case 'screening':    return <ScreeningSection prop={property} />
      case 'vacancies':    return <VacanciesSection prop={property} tenant={tenant} />
      default:             return <OverviewSection prop={property} tenant={tenant} />
    }
  }

  const sc = statusColor(property.status)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1528 40%, #0a1525 100%)',
      paddingTop: 72,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 40,
        background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(`/app/demo?demoTenantId=${tenant.id}`)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← Dashboard
            </button>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}` }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{property.name}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{property.id} · {property.units} units · {tenant.name}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: 11, background: `${sc}18`, color: sc, borderRadius: 4, padding: '3px 10px',
              border: `1px solid ${sc}35`, textTransform: 'capitalize', fontWeight: 600
            }}>{property.status}</span>
            <span style={{ fontSize: 11, background: 'rgba(57,191,246,0.12)', color: '#39bff6', borderRadius: 4, padding: '3px 10px', border: '1px solid rgba(57,191,246,0.25)' }}>
              Demo Mode
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* ── Section nav ── */}
        <div style={{
          display: 'flex', gap: 4, overflowX: 'auto', padding: '16px 0',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24
        }}>
          {SECTION_CONFIG.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { handleSection(id); trackEvent('section_navigated', { section: id, propId }) }}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                border: activeSection === id ? '1px solid rgba(57,191,246,0.4)' : '1px solid transparent',
                background: activeSection === id ? 'rgba(57,191,246,0.12)' : 'transparent',
                color: activeSection === id ? '#39bff6' : '#475569',
                fontWeight: activeSection === id ? 600 : 400, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {!isMobile && label}
            </button>
          ))}
        </div>

        {/* ── Section heading ── */}
        <div style={{ marginBottom: 20 }}>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span style={{ fontSize: 20 }}>{SECTION_CONFIG.find(s => s.id === activeSection)?.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                {SECTION_CONFIG.find(s => s.id === activeSection)?.label}
              </h2>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{property.name} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </motion.div>
        </div>

        {/* ── Section content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
