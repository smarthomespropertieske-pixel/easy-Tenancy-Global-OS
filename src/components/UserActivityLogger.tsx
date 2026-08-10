// ════════════════════════════════════════════════════════════════════════
//  UserActivityLogger.tsx — Real-Time Firebase User Activity Feed
//  ─────────────────────────────────────────────────────────────────────
//  • Connects to Firestore user activities subcollection via onSnapshot
//  • Real-time updates as user performs actions across the application
//  • Category filtering, search, relative timestamps, and custom log trigger
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react'
import { useUser } from '../context/UserContext'
import {
  subscribeToUserActivities,
  logUserActivity,
  ActivityLog
} from '../lib/activityLogger'
import {
  Activity,
  Clock,
  Search,
  Filter,
  Plus,
  Shield,
  User as UserIcon,
  Sparkles,
  Check,
  RefreshCw,
  Building,
  Download
} from '../lib/icons'

export interface UserActivityLoggerProps {
  /** Display variant: 'full' dashboard view, 'compact' sidebar view, or 'widget' drawer panel */
  variant?: 'full' | 'compact' | 'widget'
  /** Optional custom container CSS classes */
  className?: string
  /** Maximum number of activity items to fetch from Firestore */
  limitCount?: number
  /** Title header text override */
  title?: string
}

export function UserActivityLogger({
  variant = 'full',
  className = '',
  limitCount = 30,
  title = 'User Activity Log'
}: UserActivityLoggerProps) {
  const { user, userProfile } = useUser()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'auth' | 'profile' | 'action' | 'system'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // New log form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAction, setNewAction] = useState('')
  const [newCategory, setNewCategory] = useState<ActivityLog['category']>('action')
  const [newDetails, setNewDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true)
    const activeUid = user?.uid || 'guest_user'

    const unsubscribe = subscribeToUserActivities(
      activeUid,
      (updatedLogs) => {
        setLogs(updatedLogs)
        setLoading(false)
      },
      limitCount
    )

    return () => unsubscribe()
  }, [user?.uid, limitCount])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
      const queryLower = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !queryLower ||
        log.action.toLowerCase().includes(queryLower) ||
        (log.details && log.details.toLowerCase().includes(queryLower)) ||
        log.category.toLowerCase().includes(queryLower)

      return matchesCategory && matchesQuery
    })
  }, [logs, categoryFilter, searchQuery])

  // Handle logging custom user activity
  const handleAddCustomLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAction.trim()) return

    setIsSubmitting(true)
    try {
      const activeUid = user?.uid || 'guest_user'
      await logUserActivity(activeUid, newAction.trim(), newCategory, newDetails.trim())
      setNewAction('')
      setNewDetails('')
      setShowAddModal(false)
      setJustLogged(true)
      setTimeout(() => setJustLogged(false), 3000)
    } catch (err) {
      console.error('Failed to log custom activity:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle CSV export of activity logs
  const handleDownloadCSV = () => {
    const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs
    if (dataToExport.length === 0) return

    const headers = ['Log ID', 'Timestamp (ISO)', 'Action', 'Category', 'Details', 'User ID']
    const csvRows = [
      headers.join(','),
      ...dataToExport.map((log) => {
        const id = `"${(log.id || '').replace(/"/g, '""')}"`
        const timestamp = `"${(log.timestamp || '').replace(/"/g, '""')}"`
        const action = `"${(log.action || '').replace(/"/g, '""')}"`
        const category = `"${(log.category || '').replace(/"/g, '""')}"`
        const details = `"${(log.details || '').replace(/"/g, '""')}"`
        const uid = `"${(log.uid || '').replace(/"/g, '""')}"`
        return [id, timestamp, action, category, details, uid].join(',')
      })
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    link.setAttribute('download', `user_activity_logs_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format relative time
  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr)
      if (isNaN(date.getTime())) return 'Recently'

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)

      if (diffSec < 10) return 'Just now'
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

  // Get category badge styling
  const getCategoryBadge = (category: ActivityLog['category']) => {
    switch (category) {
      case 'auth':
        return {
          label: 'Auth',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400'
        }
      case 'profile':
        return {
          label: 'Profile',
          classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          dot: 'bg-cyan-400'
        }
      case 'system':
        return {
          label: 'System',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400'
        }
      case 'action':
      default:
        return {
          label: 'Action',
          classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400'
        }
    }
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4 ${className}`}>
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {title}
              {user && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Live Firestore
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {user ? `Real-time activity audit trail for ${user.displayName || user.email}` : 'Guest session activity history'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {justLogged && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 animate-pulse">
              <Check size={12} /> Logged to Firestore
            </span>
          )}

          <button
            onClick={handleDownloadCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 font-semibold text-xs transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            title="Download activity records as CSV"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Download Logs</span>
          </button>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all cursor-pointer"
            title="Log Custom Activity"
          >
            <Plus size={14} />
            <span>Record Action</span>
          </button>
        </div>
      </div>

      {/* ── CUSTOM LOG FORM MODAL/PANEL ── */}
      {showAddModal && (
        <form onSubmit={handleAddCustomLog} className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} /> Record Custom Activity Entry
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[10px] font-medium text-slate-400">Action Description</label>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="e.g. Generated quarterly lease report..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-medium text-slate-400">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ActivityLog['category'])}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
              >
                <option value="action">Action</option>
                <option value="profile">Profile</option>
                <option value="auth">Auth</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-slate-400">Optional Details</label>
            <input
              type="text"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="e.g. Exported 42 property records to PDF"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !newAction.trim()}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      )}

      {/* ── CONTROLS & FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-mono overflow-x-auto">
          {(['all', 'auth', 'profile', 'action', 'system'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* ── ACTIVITY FEED LIST ── */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs space-y-2">
            <RefreshCw size={18} className="animate-spin mx-auto text-emerald-400" />
            <p>Syncing activity logs from Firestore...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-white/10 space-y-2">
            <Activity size={24} className="mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">No activity records found</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Actions like profile edits or sign-ins will automatically log here'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getCategoryBadge(log.category)
            return (
              <div
                key={log.id}
                className="group flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${badge.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {log.action}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                  <Clock size={11} />
                  <span>{formatTimeAgo(log.timestamp)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── FOOTER STATS ── */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>Total Logs: {logs.length}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Auto-persisted to Firestore</span>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer transition-colors"
        >
          <Download size={12} />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  )
}

export default UserActivityLogger
