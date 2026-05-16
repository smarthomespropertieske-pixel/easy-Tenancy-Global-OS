import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNavScroll } from '../hooks'
import { trackEvent } from '../lib/analytics'

export default function Nav() {
  const scrolled = useNavScroll()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleCTA = () => {
    trackEvent('cta_clicked', { location: 'nav', label: 'Start free' })
    navigate('/?demoTenantId=demo-001#trial')
  }

  return (
    <nav className={`main-nav${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">easyTenancy</Link>

      <ul className="nav-links">
        {[
          ['Platform', '#platform'],
          ['AI Copilot', '#ai-copilot'],
          ['Pricing', '#pricing'],
          ['Markets', '#markets'],
        ].map(([label, href]) => (
          <li key={label}>
            <a href={href} onClick={() => trackEvent('feature_clicked', { feature: label, location: 'nav' })}>
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div className="nav-cta">
        <a
          href="#demo"
          className="btn-ghost"
          style={{ fontSize: 13, padding: '8px 18px' }}
          onClick={() => trackEvent('demo_started', { location: 'nav' })}
        >
          View demo
        </a>
        <button className="btn-primary" style={{ fontSize: 13, padding: '9px 20px' }} onClick={handleCTA}>
          Start free →
        </button>
        <button
          className="nav-hamburger"
          aria-label="Open menu"
          onClick={() => setMenuOpen(v => !v)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 8 }}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(5,10,20,0.97)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32
        }}>
          <button onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: 'var(--text)', fontSize: 24, cursor: 'pointer' }}>✕</button>
          {[['Platform','#platform'],['AI Copilot','#ai-copilot'],['Pricing','#pricing'],['Markets','#markets']].map(([l,h]) => (
            <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{l}</a>
          ))}
          <button className="btn-primary" onClick={() => { setMenuOpen(false); handleCTA() }}>Start free →</button>
        </div>
      )}
    </nav>
  )
}
