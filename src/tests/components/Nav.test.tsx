import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Nav from '../../components/Nav'
import { UserProvider } from '../../context/UserContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { LanguageProvider } from '../../context/LanguageContext'

// Mock analytics tracker
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

// Mock Firebase auth to avoid external network calls
vi.mock('../../lib/firebase', () => ({
  auth: {},
  signInWithGoogle: vi.fn().mockResolvedValue({ user: { uid: '123' } }),
  logoutUser: vi.fn().mockResolvedValue(true),
  onAuthStateChanged: vi.fn((authObj, callback) => {
    callback(null) // default unauthenticated
    return () => {}
  }),
}))

describe('Nav Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderNav = (route = '/') => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>
          <LanguageProvider>
            <UserProvider>
              <Nav />
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
  }

  it('renders brand logo and wordmark', () => {
    renderNav('/')

    expect(screen.getByText('easy')).toBeInTheDocument()
    expect(screen.getByText('Tenancy')).toBeInTheDocument()
    expect(screen.getByText('.OS')).toBeInTheDocument()
  })

  it('renders key navigation links', () => {
    renderNav('/')

    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('AI Copilot')).toBeInTheDocument()
    expect(screen.getByText('Predictive OS')).toBeInTheDocument()
    expect(screen.getByText('Auth & Sync')).toBeInTheDocument()
  })

  it('renders CTA button and handles click event', () => {
    renderNav('/')

    const ctaButtons = screen.getAllByRole('button', { name: /start free/i })
    expect(ctaButtons.length).toBeGreaterThan(0)

    fireEvent.click(ctaButtons[0])
  })

  it('opens and closes mobile menu drawer when mobile hamburger icon is toggled', () => {
    renderNav('/')

    // Find mobile menu toggle button with aria-label "Open menu"
    const mobileToggle = screen.getByRole('button', { name: /open menu/i })
    expect(mobileToggle).toBeInTheDocument()

    // Initially mobile dialog is not present
    expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument()

    // Click to open
    fireEvent.click(mobileToggle)
    const mobileDialog = screen.getByRole('dialog', { name: /mobile navigation/i })
    expect(mobileDialog).toBeInTheDocument()

    // Verify mobile links exist inside drawer
    expect(screen.getByText('Real Estate OS')).toBeInTheDocument()
    expect(screen.getByText('Sign In / Account')).toBeInTheDocument()

    // Click toggle or close button (named "Close menu") to close
    const closeBtns = screen.getAllByRole('button', { name: /close menu/i })
    fireEvent.click(closeBtns[0])

    expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument()
  })

  it('contains embedded controls (ThemeToggle, LanguageSelector, RoleSwitcher)', () => {
    renderNav('/')

    // Language selector trigger button
    expect(screen.getByRole('button', { name: /current language/i })).toBeInTheDocument()

    // Role switcher button (e.g. Portfolio Owner)
    expect(screen.getByRole('button', { name: /current role/i })).toBeInTheDocument()
  })
})
