// ════════════════════════════════════════════════════════════════════════
//  CommandPalette.tsx — ⌘K / Ctrl+K global launcher with GlobalSearch
//  ─────────────────────────────────────────────────────────────────────
//  Mounted globally in App.tsx. Opens with ⌘K / Ctrl+K, closes with Esc.
//  Provides deep search across properties, tenants, documents, pages & actions.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { Search } from '../lib/icons'
import GlobalSearch from './GlobalSearch'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === 'k' || e.key === 'K'
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpenCmd = () => setOpen(true)

    window.addEventListener('keydown', onKey)
    window.addEventListener('easytenancy:open-cmdk', onOpenCmd)
    window.addEventListener('easytenancy:open-search', onOpenCmd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('easytenancy:open-cmdk', onOpenCmd)
      window.removeEventListener('easytenancy:open-search', onOpenCmd)
    }
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) {
    return (
      <button
        type="button"
        className="cmdk-hint"
        aria-label="Open command palette and global search"
        onClick={() => setOpen(true)}
      >
        <Search size={13} stroke={1.8} />
        <span>Search · Jump to</span>
        <kbd className="cmdk-kbd">⌘K</kbd>
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette and global search"
      className="cmdk-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="max-w-4xl w-full mx-auto p-2 sm:p-4">
        <GlobalSearch onClose={() => setOpen(false)} />
      </div>
    </div>
  )
}
