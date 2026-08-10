import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AuthStatusBadge from '../../components/AuthStatusBadge'

// Mock UserContext hook
const mockUseUser = vi.fn()

vi.mock('../../context/UserContext', () => ({
  useUser: () => mockUseUser(),
}))

describe('AuthStatusBadge Component', () => {
  it('renders loading state when loading is true', () => {
    mockUseUser.mockReturnValue({
      user: null,
      userProfile: null,
      loading: true,
      logout: vi.fn(),
    })

    render(<AuthStatusBadge variant="pill" />)
    expect(screen.getByText(/authenticating.../i)).toBeInTheDocument()
  })

  it('renders Guest status when user is not logged in', () => {
    mockUseUser.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      logout: vi.fn(),
    })

    const handleOpen = vi.fn()
    render(<AuthStatusBadge variant="pill" onOpenSignIn={handleOpen} />)

    expect(screen.getByText('Guest')).toBeInTheDocument()
    const signInBtn = screen.getByText('Sign In')
    fireEvent.click(signInBtn)

    expect(handleOpen).toHaveBeenCalledWith('login')
  })

  it('renders Authenticated user status when user is logged in', () => {
    mockUseUser.mockReturnValue({
      user: { displayName: 'Alice Landlord', email: 'alice@example.com' },
      userProfile: { role: 'Property Owner' },
      loading: false,
      logout: vi.fn(),
    })

    const handleOpen = vi.fn()
    render(<AuthStatusBadge variant="pill" onOpenSignIn={handleOpen} />)

    expect(screen.getByText('Authenticated')).toBeInTheDocument()
    expect(screen.getByText('Alice Landlord')).toBeInTheDocument()
  })
})
