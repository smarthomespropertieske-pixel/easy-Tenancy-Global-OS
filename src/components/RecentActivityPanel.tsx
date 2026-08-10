// ════════════════════════════════════════════════════════════════════════
//  RecentActivityPanel.tsx — Real-Time Firestore Property Audit Panel
//  ─────────────────────────────────────────────────────────────────────
//  • Fetches & displays live property audit events from Firestore
//  • Filters by property & category (compliance, finance, lease, maintenance, security)
//  • Supports search, relative timestamps, CSV exports, and manual audit recording
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import {
  PropertyAuditEvent,
  subscribeToPropertyAudits,
  logPropertyAuditEvent,
  seedInitialPropertyAudits
} from '../lib/propertyAuditLogger'
import { DemoProperty } from '../lib/demoData'
import {
  Activity,
  Clock,
  Search,
  Filter,
  Plus,
  Shield,
  ShieldCheck,
  Building,
  Download,
  RefreshCw,
  Sparkles,
  Check,
  Scale,
  Dollar,
  FileText,
  XCircle,
  ChevronDown
} from '../lib/icons'

export interface RecentActivityPanelProps {
  properties?: DemoProperty[]
  limitCount?: number
  className?: string
  title?: string
}

export function RecentActivityPanel({
  properties = [],
  limitCount = 25,
  className = '',
  title = 'Recent Property Audit Activity'
}: RecentActivityPanelProps) {
  const { user } = useUser()
  const [events, setEvents] = useState<PropertyAuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<'all' | PropertyAuditEvent['category']>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // New audit log modal/drawer state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPropId, setNewPropId] = useState(properties[0]?.id || 'prop_default')
  const [newAction, setNewAction] = useState('')
  const [newCategory, setNewCategory] = useState<PropertyAuditEvent['category']>('compliance')
  const [newSeverity, setNewSeverity] = useState<PropertyAuditEvent['severity']>('info')
  const [newDetails, setNewDetails] = useState('')
  const [newActor, setNewActor] = useState('Property Operations')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 1. Seed initial property audits to Firestore if needed
  useEffect(() => {
    if (properties.length > 0) {
      seedInitialPropertyAudits(user?.uid || 'guest_user', properties).catch(() => {})
    }
  }, [user?.uid, properties])

  // 2. Subscribe to real-time property audit stream from Firestore
  useEffect(() => {
    setLoading(true)
    const activeUid = user?.uid || 'guest_user'

    const unsubscribe = subscribeToPropertyAudits(
      activeUid,
      (fetchedEvents) => {
        setEvents(fetchedEvents)
        setLoading(false)
      },
      limitCount
    )

    return () => unsubscribe()
  }, [user?.uid, limitCount])

  // Filtered property events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesProp = selectedPropertyId === 'all' || evt.propertyId === selectedPropertyId
      const matchesCat = selectedCategory === 'all' || evt.category === selectedCategory

      const queryLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !queryLower ||
        evt.action.toLowerCase().includes(queryLower) ||
        evt.propertyName.toLowerCase().includes(queryLower) ||
        evt.details.toLowerCase().includes(queryLower) ||
        evt.actor.toLowerCase().includes(queryLower)

      return matchesProp && matchesCat && matchesSearch
    })
  }, [events, selectedPropertyId, selectedCategory, searchQuery])

  // Handle manual audit submission
  const handleRecordAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAction.trim()) return

    setIsSubmitting(true)
    try {
      const activeUid = user?.uid || 'guest_user'
      const matchedProp = properties.find((p) => p.id === newPropId)
      const propName = matchedProp?.name || 'Selected Property'

      await logPropertyAuditEvent({
        uid: activeUid,
        propertyId: newPropId,
        propertyName: propName,
        action: newAction.trim(),
        category: newCategory,
        severity: newSeverity,
        details: newDetails.trim() || `Manual audit entry recorded for ${propName}`,
        actor: newActor.trim() || 'Property Admin'
      })

      setNewAction('')
      setNewDetails('')
      setShowAddForm(false)
      setToastMessage('Audit event recorded in Firestore!')
      setTimeout(() => setToastMessage(null), 3500)
    } catch (err) {
      console.error('Failed to log property audit event:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export audit events to CSV
  const handleExportCSV = () => {
    const dataToExport = filteredEvents.length > 0 ? filteredEvents : events
    if (dataToExport.length === 0) return

    const headers = ['Audit ID', 'Timestamp', 'Property Name', 'Property ID', 'Action', 'Category', 'Severity', 'Actor', 'Details']
    const csvRows = [
      headers.join(','),
      ...dataToExport.map((evt) => {
        return [
          `"${(evt.id || '').replace(/"/g, '""')}"`,
          `"${(evt.timestamp || '').replace(/"/g, '""')}"`,
          `"${(evt.propertyName || '').replace(/"/g, '""')}"`,
          `"${(evt.propertyId || '').replace(/"/g, '""')}"`,
          `"${(evt.action || '').replace(/"/g, '""')}"`,
          `"${(evt.category || '').replace(/"/g, '""')}"`,
          `"${(evt.severity || '').replace(/"/g, '""')}"`,
          `"${(evt.actor || '').replace(/"/g, '""')}"`,
          `"${(evt.details || '').replace(/"/g, '""')}"`
        ].join(',')
      })
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `property_audit_events_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format relative timestamp
  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr)
      if (isNaN(date.getTime())) return 'Recently'

      const diffMs = Date.now() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)

      if (diffSec < 15) return 'Just now'
      if (diffSec < 60) return `${diffSec}s ago`

      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin}m ago`

      const diffHours = Math.floor(diffMin / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 7) return `${diffDays}d ago`

      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recently'
    }
  }

  // Category badge & icon mapping
  const getCategoryMeta = (category: PropertyAuditEvent['category']) => {
    switch (category) {
      case 'compliance':
        return { label: 'Compliance', icon: Scale, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' }
      case 'finance':
        return { label: 'Finance', icon: Dollar, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
      case 'lease':
        return { label: 'Lease', icon: FileText, color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' }
      case 'maintenance':
        return { label: 'Maintenance', icon: Building, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
      case 'security':
      default:
        return { label: 'Security', icon: Shield, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' }
    }
  }

  // Severity indicator badge
  const getSeverityBadge = (severity: PropertyAuditEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return { label: 'Critical', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dot: 'bg-rose-500 animate-pulse' }
      case 'warning':
        return { label: 'Warning', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' }
      case 'success':
        return { label: 'Verified', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' }
      case 'info':
      default:
        return { label: 'Info', bg: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' }
    }
  }

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4 text-slate-100 ${className}`}>
      {/* ── HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Firestore Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Audited event log for {properties.length > 0 ? `${properties.length} tracked assets` : 'logged user properties'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {toastMessage && (
            <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 animate-fadeIn">
              <Check size={13} /> {toastMessage}
            </span>
          )}

          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-purple-300 border border-white/10 hover:border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            title="Export property audit logs to CSV"
          >
            <Download size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Export Audit CSV</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Audit Event</span>
          </button>
        </div>
      </div>

      {/* ── RECORD NEW AUDIT EVENT FORM MODAL/PANEL ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleRecordAudit}
            className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-bold text-purple-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} /> Record Custom Property Audit Entry to Firestore
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Property Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Property Asset</label>
                <select
                  value={newPropId}
                  onChange={(e) => setNewPropId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {properties.length === 0 && <option value="prop_default">Default Property Asset</option>}
                </select>
              </div>

              {/* Action Description */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Audit Action Title</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. Electrical Safety (EICR) Inspection Completed"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PropertyAuditEvent['category'])}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="compliance">Compliance</option>
                  <option value="finance">Finance</option>
                  <option value="lease">Lease</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Audit Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as PropertyAuditEvent['severity'])}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="success">Verified (Success)</option>
                  <option value="info">Informational</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical / Action Required</option>
                </select>
              </div>

              {/* Actor */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Auditor / Agent</label>
                <input
                  type="text"
                  value={newActor}
                  onChange={(e) => setNewActor(e.target.value)}
                  placeholder="e.g. ComplyCore AI Agent"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-400 uppercase">Audit Record Notes / Findings</label>
              <input
                type="text"
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="e.g. Inspector verified 0 Category 1 hazards. Valid to Aug 2029."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newAction.trim()}
                className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Writing to Firestore...' : 'Commit Audit Record'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Property Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full appearance-none px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
          >
            <option value="all">All Properties ({properties.length || 'All'})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.units} Units)
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-mono overflow-x-auto">
          {(['all', 'compliance', 'finance', 'lease', 'maintenance', 'security'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                selectedCategory === cat
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* ── AUDIT LIST ── */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs space-y-2">
            <RefreshCw size={18} className="animate-spin mx-auto text-purple-400" />
            <p>Fetching property audit logs from Firestore...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-white/10 space-y-2">
            <Shield size={24} className="mx-auto text-slate-600" />
            <p className="text-xs text-slate-300 font-medium">No property audit events found</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {searchQuery || selectedPropertyId !== 'all' || selectedCategory !== 'all'
                ? 'Try broadening your search or property filter'
                : 'Property compliance updates, tenant collections, and lease changes will stream here'}
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const catMeta = getCategoryMeta(evt.category)
            const sevBadge = getSeverityBadge(evt.severity)
            const IconComp = catMeta.icon

            return (
              <motion.div
                key={evt.id || evt.createdAt}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 hover:border-purple-500/30 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${catMeta.color}`}>
                      <IconComp size={14} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                          {evt.action}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-white/5 text-slate-300 border border-white/10">
                          {evt.propertyName}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {evt.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${sevBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sevBadge.dot}`} />
                      {sevBadge.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(evt.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    Audited by <strong className="text-slate-400 font-normal">{evt.actor}</strong>
                  </span>
                  <span className="text-slate-600">ID: {evt.id ? evt.id.slice(0, 8) : 'local'}</span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ── FOOTER BAR ── */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>{filteredEvents.length} Events Logged</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Firestore Real-Time Engine</span>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={events.length === 0}
          className="text-purple-400 hover:text-purple-300 hover:underline cursor-pointer transition-colors"
        >
          Download Audit Log
        </button>
      </div>
    </div>
  )
}

export default RecentActivityPanel
