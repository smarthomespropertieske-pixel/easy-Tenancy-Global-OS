// ════════════════════════════════════════════════════════════════════════
//  LanguageSelector.tsx — Navigation Header Language Selector Dropdown
//  ─────────────────────────────────────────────────────────────────────
//  • Dropdown control in header supporting global languages (EN, ES, FR, DE, SW, AR, PT, ZH, JA, HI)
//  • Updates application locale state, document lang & dir attributes
//  • Searchable dropdown list with flags, localized names & quick filter
//  • Persists preference in localStorage ('et_lang')
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  useLanguageContext,
  SUPPORTED_LANGUAGES,
  LanguageCode,
  LanguageMeta,
  getStoredLanguage
} from '../context/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { Globe, Search, Check, ChevronDown, X } from '../lib/icons'

// Backward compatibility exports
export type Language = LanguageCode

export function getStoredLang(): Language {
  return getStoredLanguage()
}

export function useLanguage(): Language {
  try {
    const { language } = useLanguageContext()
    return language
  } catch {
    return getStoredLanguage()
  }
}

export interface LanguageSelectorProps {
  className?: string
  variant?: 'header' | 'compact' | 'footer'
}

export default function LanguageSelector({ className = '', variant = 'header' }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { language, setLanguage, currentLangMeta } = useLanguageContext()

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setFilterQuery('')
    }
  }, [open])

  const handlePick = useCallback(
    (nextMeta: LanguageMeta) => {
      setLanguage(nextMeta.code)
      setOpen(false)
      trackEvent('feature_clicked', { feature: 'language_switch', language: nextMeta.code })
    },
    [setLanguage]
  )

  // Filtered languages list
  const filteredLanguages = useMemo(() => {
    if (!filterQuery.trim()) return SUPPORTED_LANGUAGES
    const q = filterQuery.toLowerCase().trim()
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    )
  }, [filterQuery])

  return (
    <div className={`relative inline-block text-left ${className}`} ref={ref}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
          open
            ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10'
            : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/60 hover:border-slate-500 text-slate-200'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${currentLangMeta.name} (${currentLangMeta.nativeName}). Click to select language.`}
      >
        <Globe size={14} className="text-cyan-400 shrink-0" />
        <span className="font-mono text-[11px] font-semibold tracking-wider">
          {currentLangMeta.flag} {currentLangMeta.code.toUpperCase()}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-purple-400' : ''}`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-xl z-50 overflow-hidden space-y-1 p-2 text-slate-100 animate-fadeIn"
          role="listbox"
          aria-label="Select global interface language"
        >
          {/* SEARCH HEADER */}
          <div className="relative px-2 pt-1 pb-2 border-b border-white/10">
            <Search size={13} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search language / Weka lugha..."
              className="w-full pl-8 pr-7 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* LANGUAGE ITEMS LIST */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No matching language found
              </div>
            ) : (
              filteredLanguages.map((l) => {
                const isActive = l.code === language
                return (
                  <button
                    key={l.code}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handlePick(l)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{l.flag}</span>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-medium text-slate-100 truncate">{l.nativeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{l.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono font-semibold text-slate-400 border border-white/10 uppercase">
                        {l.code}
                      </span>
                      {isActive && <Check size={14} className="text-purple-400 shrink-0" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* FOOTER METADATA */}
          <div className="pt-2 border-t border-white/10 px-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Global OS Locale</span>
            <span className="text-purple-400">{currentLangMeta.locale}</span>
          </div>
        </div>
      )}
    </div>
  )
}
