// ════════════════════════════════════════════════════════════════════════
//  ThemeContext.tsx — Global Theme State & Persistence Provider
//  ─────────────────────────────────────────────────────────────────────
//  • Manages global 'dark' | 'light' theme state
//  • Persists selection in localStorage ('easytenancy_theme')
//  • Syncs data-theme attribute, color-scheme style & root CSS classes
//  • Provides useTheme hook for application-wide toggle access
// ════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeMode = 'dark' | 'light'

export interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

const STORAGE_KEY = 'easytenancy_theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeMode
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') {
          return saved
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          return 'light'
        }
      }
    } catch {
      // Fallback on error or SSR
    }
    return defaultTheme
  })

  // Synchronize DOM attributes, root classes, and localStorage on theme change
  useEffect(() => {
    try {
      const root = document.documentElement
      root.setAttribute('data-theme', theme)
      root.style.colorScheme = theme

      if (theme === 'light') {
        root.classList.add('light')
        root.classList.remove('dark')
      } else {
        root.classList.add('dark')
        root.classList.remove('light')
      }

      localStorage.setItem(STORAGE_KEY, theme)

      // Notify external non-React listeners if any
      window.dispatchEvent(new CustomEvent('easytenancy:theme-change', { detail: { theme } }))
    } catch (err) {
      console.warn('Theme synchronization error:', err)
    }
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Custom hook to consume global theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
