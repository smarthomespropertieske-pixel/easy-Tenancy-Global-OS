import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useNavScroll } from '../hooks'
import { trackEvent } from '../lib/analytics'

const NAV_LINKS = [
  { label: 'Platform',          href: '/#platform' },
  { label: 'AI Copilot',        href: '/#ai-copilot' },
  { label: 'Pricing',           href: '/#pricing' },
  { label: 'Global Dominance',  href: '/global-dominance' },
  { label: 'Predictive OS',     href: '/predictive-os' },
] as const

const MOBILE_LINKS = [
  { label: '🏠 Home',             href: '/' },
  { label: '📊 App Demo',         href: '/app/demo' },
  { label: '🌐 Global Dominance', href: '/global-dominance' },
  { label: '⚡ Predictive OS',    href: '/predictive-os' },
  { label: '🎨 AI Staging',       href: '/spatial-staging' },
  { label: '🔐 Security Demo',    href: '/security-demo' },
  { label: '💰 Pricing',          href: '/#pricing' },
  { label: '🤖 AI Copilot',       href: '/#ai-copilot' },
] as const

export default function Nav() {
  const scrolled    = useNavScroll()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate    = useNavigate()
  const location    = useLocation()

  const handleCTA = () => {
    trackEvent('cta_clicked', { location: 'nav', label: 'Start free' })
    navigate('/?demoTenantId=demo-001#trial')
  }

  const isActive = (href: string) =>
    href.startsWith('/') && !href.includes('#') && location.pathname === href

  return (
    <nav
      className={`main-nav${scrolled ? ' scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link to="/" className="nav-logo" aria-label="easyTenancy home">
        easyTenancy
      </Link>

      {/* Desktop links */}
      <ul className="nav-links" role="list">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              style={{
                color: isActive(href) ? 'var(--cyan)' : undefined,
                borderBottom: isActive(href) ? '2px solid var(--cyan)' : '2px solid transparent',
                paddingBottom: 2,
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onClick={() => trackEvent('feature_clicked', { feature: label, location: 'nav' })}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA buttons */}
      <div className="nav-cta">
        <a
          href="/app/demo"
          className="btn-ghost"
          style={{ fontSize: 13, padding: '8px 18px' }}
          onClick={() => trackEvent('demo_started', { location: 'nav' })}
        >
          View demo
        </a>
        <button
          className="btn-primary"
          style={{ fontSize: 13, padding: '9px 20px' }}
          onClick={handleCTA}
        >
          Start free →
        </button>

        {/* Hamburger — visible via CSS on mobile */}
        <button
          className="nav-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'var(--text)', cursor: 'pointer',
            padding: '6px 10px', fontSize: 18, lineHeight: 1,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(5,10,20,0.97)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '60px 32px',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'none', border: 'none',
              color: 'var(--text)', fontSize: 28, cursor: 'pointer',
            }}
          >✕</button>

          {/* Brand */}
          <div style={{
            fontSize: 28, fontWeight: 900,
            fontFamily: 'var(--font-head)',
            background: 'linear-gradient(135deg, #1A6DB5, #39bff6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 24,
          }}>
            easyTenancy
          </div>

          {MOBILE_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => { setMenuOpen(false); trackEvent('mobile_nav_clicked', { label }) }}
              style={{
                fontSize: 20, fontWeight: 700,
                color: isActive(href) ? 'var(--cyan)' : 'var(--text)',
                textDecoration: 'none',
                padding: '10px 24px',
                borderRadius: 12,
                background: isActive(href) ? 'rgba(57,191,246,0.1)' : 'transparent',
                border: isActive(href) ? '1px solid rgba(57,191,246,0.3)' : '1px solid transparent',
                width: '100%', textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </a>
          ))}

          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 14 }}
            onClick={() => { setMenuOpen(false); handleCTA() }}
          >
            Start free →
          </button>
        </div>
      )}
    </nav>
  )
}
