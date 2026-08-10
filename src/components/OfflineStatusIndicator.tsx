import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '../lib/icons'

export default function OfflineStatusIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setShowRestored(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showRestored) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto"
      >
        {isOffline ? (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/40 text-slate-100 shadow-2xl backdrop-blur-xl text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-amber-400">Offline Mode</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 hidden sm:inline">Workbox Cache Active</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/20">
              PRO-GRADE CACHE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-slate-100 shadow-2xl backdrop-blur-xl text-xs font-medium">
            <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-400">Network Restored</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Live Telemetry Synced</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
