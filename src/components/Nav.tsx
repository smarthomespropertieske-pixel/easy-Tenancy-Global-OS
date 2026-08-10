// ════════════════════════════════════════════════════════════════════════
//  Nav.tsx — Sovereign Global Top Nav v2
//  ─────────────────────────────────────────────────────────────────────
//  • Custom BrandMark glyph + crisp Inter Tight wordmark
//  • Glass v2 backdrop — deeper blur + iridescent border on scroll
//  • Scroll-spy active state for in-page anchors (/#section)
//  • Crisp 14px nav links with optical letter-spacing
//  • Magnetic primary CTA · ghost secondary
//  • Full mobile drawer with the same anchor logic
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useNavScroll } from '../hooks'
import { useScrollSpy, useMagnetic } from '../hooks/interactivity'
import { trackEvent } from '../lib/analytics'
import { auth, signInWithGoogle, logoutUser, onAuthStateChanged, User } from '../lib/firebase'
import { useUser } from '../context/UserContext'
import {
  BrandMark, Icon, ArrowRight, Menu, X, LogOut, User as UserIcon
} from '../lib/icons'
import RoleSwitcher from './RoleSwitcher'
import LanguageSelector from './LanguageSelector'
import SignInDrawer from './SignInDrawer'
import AuthStatusBadge from './AuthStatusBadge'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { label: 'Platform',      href: '/#platform',          icon: 'layers'       as const },
  { label: 'AI Copilot',    href: '/#ai-copilot',        icon: 'sparkles'     as const },
  { label: 'Performance',   href: '/global-performance', icon: 'chart'        as const },
  { label: 'Predictive OS', href: '/predictive-os',      icon: 'command'      as const },
  { label: 'Net Zero',      href: '/netzero',            icon: 'globe'        as const },
  { label: 'Auth & Sync',   href: '/auth-dashboard',     icon: 'lock'         as const },
] as const

const MOBILE_LINKS = [
  { label: 'Home',               href: '/',                  icon: 'home'         as const },
  { label: 'Global Performance', href: '/global-performance', icon: 'chart'        as const },
  { label: 'AI Copilot',         href: '/#ai-copilot',       icon: 'sparkles'     as const },
  { label: 'Platform',           href: '/#platform',         icon: 'layers'       as const },
  { label: 'Global Dominance',   href: '/global-dominance',  icon: 'globe'        as const },
  { label: 'Predictive OS',      href: '/predictive-os',     icon: 'command'      as const },
  { label: 'Real Estate OS',     href: '/realestate-os',     icon: 'building'     as const },
  { label: 'Net Zero',           href: '/netzero',           icon: 'globe'        as const },
  { label: 'Auth & Sync',        href: '/auth-dashboard',    icon: 'lock'         as const },
  { label: 'DB Diagnostic',      href: '/firebase-diagnostic', icon: 'layers'     as const },
] as const

// Anchor IDs to spy on the homepage
const HOME_ANCHORS = ['platform', 'ai-copilot', 'growth-engine', 'referral', 'pricing'] as const

export default function Nav() {
  const scrolled  = useNavScroll()
  const { user: contextUser } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false)
  const [drawerInitialTab, setDrawerInitialTab] = useState<'auth' | 'account'>('auth')
  const [currentUser, setCurrentUser] = useState<User | null>(contextUser || null)
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    setCurrentUser(contextUser)
  }, [contextUser])

  const openAuthDrawer = (tab: 'auth' | 'account' | 'login' = 'auth') => {
    setDrawerInitialTab(tab === 'account' ? 'account' : 'auth')
    setAuthDrawerOpen(true)
  }

  // Scroll-spy — only meaningful on the homepage
  const isHome    = location.pathname === '/'
  const activeId  = useScrollSpy(isHome ? [...HOME_ANCHORS] : [], { rootMargin: '-25% 0% -60% 0%' })

  // Magnetic CTA
  const ctaRef    = useMagnetic<HTMLButtonElement>(0.45)

  // Lock body scroll while drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleCTA = () => {
    trackEvent('cta_clicked', { location: 'nav', label: 'Start free' })
    navigate('/?demoTenantId=demo-001#trial')
  }

  // Determine which nav link is currently "active"
  const isActive = (href: string): boolean => {
    // External pages — match by pathname
    if (href.startsWith('/') && !href.includes('#')) {
      return location.pathname === href
    }
    // In-page anchor (/#foo)
    if (href.startsWith('/#') && isHome) {
      const id = href.slice(2)
      return activeId === id
    }
    return false
  }

  return (
    <nav
      className={`nav-v2${scrolled ? ' scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Brand lockup ── */}
      <Link to="/" className="nav-v2-brand" aria-label="easyTenancy home">
        <BrandMark size={28} animated={!scrolled} />
        <span className="nav-v2-wordmark">
          easy<span className="nav-v2-wordmark-accent">Tenancy</span>
        </span>
        <span className="nav-v2-tld">.OS</span>
      </Link>

      {/* ── Desktop link rail ── */}
      <ul className="nav-v2-links" role="list">
        {NAV_LINKS.map(({ label, href, icon }) => {
          const active = isActive(href)
          return (
            <li key={label}>
              <a
                href={href}
                className={`nav-v2-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => trackEvent('feature_clicked', { feature: label, location: 'nav' })}
              >
                <Icon name={icon} size={14} stroke={1.6} className="nav-v2-link-icon" />
                <span>{label}</span>
                {active && <span className="nav-v2-link-dot" aria-hidden="true" />}
              </a>
            </li>
          )
        })}
      </ul>

      {/* ── CTA cluster ── */}
      <div className="nav-v2-cta">
        {/* Global Search (⌘K) Trigger Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('easytenancy:open-cmdk'))}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl transition-all group cursor-pointer"
          title="Global Site-Wide Search (⌘K)"
        >
          <Icon name="search" size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-slate-300">Search</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/10 text-slate-200 border border-white/15 rounded">⌘K</kbd>
        </button>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Global Theme Toggle */}
        <ThemeToggle variant="icon" />

        {/* v4.4 — role-based perspective selector (UX directive #2) */}
        <RoleSwitcher />

        {/* Dynamic Auth Status Badge & Drawer Shortcut */}
        <AuthStatusBadge onOpenSignIn={openAuthDrawer} variant="pill" />

        <Link
          to="/firebase-diagnostic"
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-lg transition-colors"
          title="Firebase Diagnostic Tool"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>DB Diagnostic</span>
        </Link>

        <a
          href="/app/demo"
          className="nav-v2-ghost"
          onClick={() => trackEvent('demo_started', { location: 'nav' })}
        >
          View demo
        </a>
        <button
          ref={ctaRef}
          className="nav-v2-primary btn-magnetic"
          onClick={handleCTA}
        >
          <span>Start free</span>
          <ArrowRight size={14} stroke={2} />
        </button>

        {/* Hamburger — mobile only via CSS */}
        <button
          className="nav-v2-burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={18} stroke={1.8} /> : <Menu size={18} stroke={1.8} />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="nav-v2-drawer"
        >
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="nav-v2-drawer-close"
          >
            <X size={22} stroke={1.8} />
          </button>

          <Link to="/" onClick={() => setMenuOpen(false)} className="nav-v2-drawer-brand">
            <BrandMark size={36} />
            <span>easyTenancy</span>
          </Link>

          <div className="px-4 py-2 border-b border-white/10 mb-2">
            <button
              onClick={() => {
                setMenuOpen(false)
                window.dispatchEvent(new CustomEvent('easytenancy:open-cmdk'))
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 font-medium text-xs text-left"
            >
              <Icon name="search" size={16} className="text-cyan-400 shrink-0" />
              <span className="truncate">Search properties, docs, pages…</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/10 text-cyan-300 border border-white/15 rounded shrink-0">⌘K</kbd>
            </button>
          </div>

          <ul className="nav-v2-drawer-list" role="list">
            {MOBILE_LINKS.map(({ label, href, icon }) => {
              const active = isActive(href)
              return (
                <li key={label}>
                  <a
                    href={href}
                    onClick={() => { setMenuOpen(false); trackEvent('mobile_nav_clicked', { label }) }}
                    className={`nav-v2-drawer-link${active ? ' is-active' : ''}`}
                  >
                    <Icon name={icon} size={18} stroke={1.6} />
                    <span>{label}</span>
                    <ArrowRight size={14} stroke={1.6} className="nav-v2-drawer-arrow" />
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="px-4 py-2 my-2 border-y border-white/10">
            <button
              onClick={() => {
                setMenuOpen(false)
                openAuthDrawer(currentUser ? 'account' : 'auth')
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs"
            >
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-emerald-400" />
                <span>{currentUser ? (currentUser.displayName || currentUser.email) : 'Sign In / Account'}</span>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>

          <button
            className="nav-v2-drawer-cta"
            onClick={() => { setMenuOpen(false); handleCTA() }}
          >
            <span>Start free</span>
            <ArrowRight size={16} stroke={2} />
          </button>
        </div>
      )}

      {/* Slide-out Sign-In & Profile Navigation Drawer */}
      <SignInDrawer
        isOpen={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        initialTab={drawerInitialTab === 'auth' ? 'login' : 'account'}
        currentUser={currentUser}
      />
    </nav>
  )
}
