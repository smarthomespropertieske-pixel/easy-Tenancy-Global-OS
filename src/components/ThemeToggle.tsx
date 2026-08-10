// ════════════════════════════════════════════════════════════════════════
//  ThemeToggle.tsx — Global Dark / Light Theme Switcher Control
//  ─────────────────────────────────────────────────────────────────────
//  • Allows toggling between 'dark' and 'light' modes globally
//  • Supports pill, icon-only, and compact variants
//  • Includes accessible tooltips and fluid Framer Motion animations
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from '../lib/icons'

export interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'compact'
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({
  variant = 'pill',
  className = '',
  showLabel = true,
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme()

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 transition-all cursor-pointer relative ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-sky-400" />}
        </motion.div>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-900 text-slate-300 border border-white/10 hover:border-amber-400/40 hover:text-amber-300'
            : 'bg-slate-100 text-slate-800 border border-slate-300 hover:border-amber-500 hover:text-amber-600 shadow-sm'
        } ${className}`}
        title={`Current: ${theme.toUpperCase()} mode. Click to toggle.`}
      >
        {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-sky-500" />}
        {showLabel && <span className="capitalize">{theme}</span>}
      </button>
    )
  }

  // Default 'pill' variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
        isDark
          ? 'bg-slate-900/80 text-slate-200 border-white/10 hover:border-amber-400/50 hover:bg-slate-800/90'
          : 'bg-white text-slate-900 border-slate-300 hover:border-sky-400 hover:bg-slate-50 shadow-slate-200/50'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      <div className={`p-1 rounded-lg ${isDark ? 'bg-amber-400/15 text-amber-400' : 'bg-sky-500/15 text-sky-600'}`}>
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  )
}

export default ThemeToggle
