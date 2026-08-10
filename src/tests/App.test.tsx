import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../App'

// Mock context providers that App requires
vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: null,
    userProfile: null,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../components/Preloader', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePreloader: () => ({ isLoaded: true }),
}))

// Mock out some lazy-loaded components or dependencies
vi.mock('../routes/HomePage', () => ({
  default: () => <div data-testid="page-home">Home Page</div>,
}))

vi.mock('../routes/AppDemo', () => ({
  default: () => <div data-testid="page-appdemo">App Demo</div>,
}))

vi.mock('../routes/GlobalDominance', () => ({
  default: () => <div data-testid="page-global-dominance">Global Dominance</div>,
}))

vi.mock('../components/Nav', () => ({
  default: () => <nav data-testid="nav">Mock Nav</nav>,
}))

vi.mock('../components/SpatialNavigation', () => ({
  default: () => <div data-testid="spatial-nav">Spatial Nav</div>,
}))

vi.mock('../components/CommandPalette', () => ({
  default: () => <div data-testid="command-palette">Command Palette</div>,
}))

describe('App Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Silence some expected warnings like "No routes matched location" or IntersectionObserver
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('renders HomePage on default route "/"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    // Wait for the lazy loaded components or suspense boundaries
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument()
    })
  })

  it('renders lazy loaded route "/app/demo"', async () => {
    render(
      <MemoryRouter initialEntries={['/app/demo']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-appdemo')).toBeInTheDocument()
    })
  })

  it('renders lazy loaded route "/global-dominance"', async () => {
    render(
      <MemoryRouter initialEntries={['/global-dominance']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-global-dominance')).toBeInTheDocument()
    })
  })

  it('triggers NotFound page on unknown routes', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route-123']}>
        <App />
      </MemoryRouter>
    )

    // Wait for NotFound to be rendered
    await waitFor(() => {
      expect(screen.getByText('Page not found')).toBeInTheDocument()
    })
  })
})
