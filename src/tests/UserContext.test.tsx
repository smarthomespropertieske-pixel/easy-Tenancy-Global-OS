import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserProvider, useUser } from '../context/UserContext'
import { onAuthStateChanged, signInWithGoogle, logoutUser } from '../lib/firebase'
import { getDoc, setDoc } from 'firebase/firestore'
import { logUserActivity } from '../lib/activityLogger'

// 1. Mock firebase library exports
vi.mock('../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
    },
    db: {},
    signInWithGoogle: vi.fn(),
    logoutUser: vi.fn(),
    onAuthStateChanged: vi.fn(),
  }
})

// 2. Mock firestore imports
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn((db, collection, id) => `${collection}/${id}`),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
  }
})

// 3. Mock firebase/auth
vi.mock('firebase/auth', () => {
  return {
    updateProfile: vi.fn(),
  }
})

// 4. Mock activityLogger
vi.mock('../lib/activityLogger', () => {
  return {
    logUserActivity: vi.fn(),
  }
})

// Test Component that consumes useUser
const TestComponent = () => {
  const { user, userProfile, loading, error, signInWithGoogle, logout } = useUser()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {error && <div data-testid="error">{error}</div>}
      <div data-testid="user-uid">{user ? user.uid : 'No User'}</div>
      <div data-testid="profile-role">{userProfile ? userProfile.role : 'No Profile'}</div>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}

describe('UserContext Auth State Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default setup for onAuthStateChanged mock to immediately call the callback with null
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // @ts-ignore
      callback(null)
      return vi.fn() // unsubscribe function
    })
  })

  it('renders loading state initially, then resolves without a user', async () => {
    // We delay the onAuthStateChanged callback to see the loading state
    let triggerAuthChange: (user: any) => void
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // @ts-ignore
      triggerAuthChange = callback
      return vi.fn()
    })

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Should be loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Trigger auth state change with null (no user logged in)
    act(() => {
      triggerAuthChange(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('No User')
    })
    expect(screen.getByTestId('profile-role')).toHaveTextContent('No Profile')
  })

  it('fetches user profile successfully on auth state change to logged in user', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' }
    const mockProfile = { uid: '123', email: 'test@example.com', role: 'admin' }

    // Mock firestore getDoc to return a valid profile
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => mockProfile,
    } as any)

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // @ts-ignore
      callback(mockUser)
      return vi.fn()
    })

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('123')
    })
    expect(screen.getByTestId('profile-role')).toHaveTextContent('admin')
  })

  it('creates a new user profile if one does not exist', async () => {
    const mockUser = { uid: '456', email: 'new@example.com' }

    // Mock firestore getDoc to return false for exists()
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any)

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // @ts-ignore
      callback(mockUser)
      return vi.fn()
    })

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('456')
    })
    
    // Fallback role should be landlord
    expect(screen.getByTestId('profile-role')).toHaveTextContent('landlord')
    
    // Verify setDoc was called to create the profile
    expect(setDoc).toHaveBeenCalled()
  })

  it('updates state properly on signInWithGoogle success', async () => {
    const mockUser = { uid: '789', email: 'signin@example.com' }
    
    vi.mocked(signInWithGoogle).mockResolvedValueOnce(mockUser as any)
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any)

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('No User')
    })

    // Click Sign In
    act(() => { screen.getByText('Sign In').click() })

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('789')
    })
    expect(logUserActivity).toHaveBeenCalledWith('789', 'Logged in with Google', 'auth', 'signin@example.com')
  })

  it('updates state properly on logout', async () => {
    const mockUser = { uid: '999', email: 'logout@example.com' }
    
    // Start with a logged-in user
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // @ts-ignore
      callback(mockUser)
      return vi.fn()
    })
    
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any)

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('999')
    })

    // Click Sign Out
    act(() => { screen.getByText('Sign Out').click() })

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled()
    })

    // Wait for the state to clear
    await waitFor(() => {
      expect(screen.getByTestId('user-uid')).toHaveTextContent('No User')
    })
    expect(logUserActivity).toHaveBeenCalledWith('999', 'User logged out', 'auth')
  })
})
