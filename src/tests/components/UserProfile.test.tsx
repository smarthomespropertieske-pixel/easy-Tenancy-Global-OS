import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UserProfile from '../../components/UserProfile'
import { UserProfileView } from '../../components/UserProfileView'

// Mock UserContext hook
const mockUseUser = vi.fn()

vi.mock('../../context/UserContext', () => ({
  useUser: () => mockUseUser(),
}))

describe('UserProfile Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest state when user is unauthenticated', () => {
    mockUseUser.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfile variant="card" />)

    expect(screen.getByText(/guest visitor/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in to access your tenant dashboard/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('calls signInWithGoogle when Google sign in button is clicked', async () => {
    const mockSignIn = vi.fn().mockResolvedValue(true)
    const mockOnSignInSuccess = vi.fn()

    mockUseUser.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      error: null,
      signInWithGoogle: mockSignIn,
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfile variant="card" onSignInSuccess={mockOnSignInSuccess} />)

    const signInBtn = screen.getByRole('button', { name: /sign in with google/i })
    fireEvent.click(signInBtn)

    expect(mockSignIn).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(mockOnSignInSuccess).toHaveBeenCalled()
    })
  })

  it('renders authenticated user profile details in card variant', () => {
    mockUseUser.mockReturnValue({
      user: {
        uid: 'user-001',
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        photoURL: 'https://example.com/avatar.jpg',
        providerData: [{ providerId: 'google.com' }],
      },
      userProfile: {
        role: 'Property Owner',
        orgName: 'Acme Properties Ltd',
      },
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfile variant="card" showDetails={true} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Role: Property Owner/i)).toBeInTheDocument()
    expect(screen.getByTitle('Sign Out of Account')).toBeInTheDocument()
  })

  it('calls logout and onSignOutSuccess callback on sign out click', async () => {
    const mockLogout = vi.fn().mockResolvedValue(true)
    const mockOnSignOutSuccess = vi.fn()

    mockUseUser.mockReturnValue({
      user: {
        uid: 'user-001',
        displayName: 'Jane Smith',
        email: 'jane@example.com',
        providerData: [{ providerId: 'google.com' }],
      },
      userProfile: {
        role: 'Tenant',
      },
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: mockLogout,
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfile variant="card" onSignOutSuccess={mockOnSignOutSuccess} />)

    const signOutBtn = screen.getByTitle('Sign Out of Account')
    fireEvent.click(signOutBtn)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(mockOnSignOutSuccess).toHaveBeenCalled()
    })
  })

  it('renders compact variant cleanly', () => {
    mockUseUser.mockReturnValue({
      user: {
        uid: 'user-002',
        displayName: 'Sarah Connor',
        email: 'sarah@example.com',
        providerData: [{ providerId: 'google.com' }],
      },
      userProfile: {
        role: 'Asset Manager',
      },
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfileView variant="compact" />)

    expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    expect(screen.getByText('sarah@example.com')).toBeInTheDocument()
  })

  it('opens edit profile modal when edit button is clicked', () => {
    mockUseUser.mockReturnValue({
      user: {
        uid: 'user-003',
        displayName: 'Michael Scott',
        email: 'michael@dundermifflin.com',
        providerData: [{ providerId: 'google.com' }],
      },
      userProfile: {
        role: 'Regional Manager',
      },
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePhotoURL: vi.fn(),
      clearError: vi.fn(),
    })

    render(<UserProfile variant="card" />)

    const editBtn = screen.getByTitle('Edit Profile')
    expect(editBtn).toBeInTheDocument()

    fireEvent.click(editBtn)
    expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
  })
})
