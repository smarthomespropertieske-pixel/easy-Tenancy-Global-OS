import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GlobalSearch from '../../components/GlobalSearch'
import CommandPalette from '../../components/CommandPalette'

// Mock analytics tracker
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

describe('GlobalSearch & Command Palette Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderGlobalSearch = (onClose = vi.fn()) => {
    return render(
      <MemoryRouter>
        <GlobalSearch onClose={onClose} />
      </MemoryRouter>
    )
  }

  it('renders search input and placeholder', () => {
    renderGlobalSearch()

    const input = screen.getByPlaceholderText(/Search properties, tenants, documents, pages/i)
    expect(input).toBeInTheDocument()
  })

  it('renders category tabs and default results for properties, tenants, documents', () => {
    renderGlobalSearch()

    expect(screen.getByText(/🏢 Properties/i)).toBeInTheDocument()
    expect(screen.getByText(/👤 Tenants/i)).toBeInTheDocument()
    expect(screen.getByText(/📄 Documents/i)).toBeInTheDocument()
    expect(screen.getByText(/🧭 Pages/i)).toBeInTheDocument()
    expect(screen.getByText(/⚡ Actions/i)).toBeInTheDocument()

    // Default item checks
    expect(screen.getAllByText('LDN-247 Westlands Block').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dr. Marcus Vance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Master Lease Agreement 2026').length).toBeGreaterThan(0)
  })

  it('filters results based on search input query', () => {
    renderGlobalSearch()

    const input = screen.getByPlaceholderText(/Search properties, tenants, documents, pages/i)
    fireEvent.change(input, { target: { value: 'Nairobi' } })

    expect(screen.getAllByText('LDN-247 Westlands Block').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NBI-033 Kilimani Suites').length).toBeGreaterThan(0)
    expect(screen.queryByText('Mayfair Premium Residences')).not.toBeInTheDocument()
  })

  it('filters by category tab when clicked', () => {
    renderGlobalSearch()

    const tenantsTab = screen.getByText(/👤 Tenants/i)
    fireEvent.click(tenantsTab)

    expect(screen.getAllByText('Dr. Marcus Vance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sarah Jenkins & Partners (Apex Legal)').length).toBeGreaterThan(0)
    expect(screen.queryByText('LDN-247 Westlands Block')).not.toBeInTheDocument()
  })

  it('shows live inspector pane details when selecting or hovering an item', () => {
    renderGlobalSearch()

    expect(screen.getByText(/properties inspector/i)).toBeInTheDocument()
    expect(screen.getByText('Westlands, Nairobi, Kenya')).toBeInTheDocument()
    expect(screen.getByText('48 Units · 97.9% Occ')).toBeInTheDocument()
  })

  it('persists and displays recent searches from localStorage', () => {
    localStorage.setItem('easytenancy_recent_searches', JSON.stringify(['Mombasa', 'Kilimani']))
    renderGlobalSearch()

    expect(screen.getAllByText('Mombasa').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kilimani').length).toBeGreaterThan(0)

    const clearButton = screen.getByTitle(/Clear saved search history/i)
    fireEvent.click(clearButton)

    expect(screen.queryByText('Mombasa')).not.toBeInTheDocument()
  })

  it('CommandPalette opens when keyboard shortcut or event is triggered', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    )

    // Initial hint button should be rendered
    const hintButton = screen.getByRole('button', { name: /Open command palette and global search/i })
    expect(hintButton).toBeInTheDocument()

    // Click hint button to open
    fireEvent.click(hintButton)

    // Modal overlay with GlobalSearch should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search properties, tenants, documents, pages/i)).toBeInTheDocument()
  })
})
