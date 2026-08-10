// ════════════════════════════════════════════════════════════════════════
//  UserContext.tsx — Global Authentication & Profile Context v1.0
//  ─────────────────────────────────────────────────────────────────────
//  • Tracks global Firebase Auth user state across the entire application
//  • Syncs and provides user profile details from Firestore
//  • Exposes signInWithGoogle, logout, and profile refresh helpers
//  • Exports `useUser` and `useAuth` custom hooks for consumption
// ════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import {
  auth,
  db,
  signInWithGoogle as firebaseSignInWithGoogle,
  logoutUser as firebaseLogoutUser,
  onAuthStateChanged,
  User
} from '../lib/firebase'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { logUserActivity, ActivityLog } from '../lib/activityLogger'

export interface UserProfileData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role?: string
  lastLogin?: string
  createdAt?: string
  bio?: string
  organizationId?: string
}

export interface UserContextType {
  user: User | null
  userProfile: UserProfileData | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<User | null>
  logout: () => Promise<void>
  handleSignOut: () => Promise<void>
  signOut: () => Promise<void>
  updateDisplayName: (newDisplayName: string) => Promise<void>
  updatePhotoURL: (newPhotoURL: string) => Promise<void>
  logActivity: (action: string, category?: ActivityLog['category'], details?: string) => Promise<void>
  refreshUserProfile: () => Promise<void>
  clearError: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch or initialize user profile from Firestore
  const fetchUserProfile = useCallback(async (authUser: User) => {
    try {
      const userDocRef = doc(db, 'users', authUser.uid)
      const snap = await getDoc(userDocRef)

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfileData)
      } else {
        // Initialize new profile document if missing
        const newProfile: UserProfileData = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          role: 'landlord',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
        await setDoc(userDocRef, newProfile, { merge: true })
        setUserProfile(newProfile)
      }
    } catch (err: any) {
      console.warn('Could not load user profile from Firestore:', err)
      // Fallback profile object built directly from Auth User
      setUserProfile({
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        role: 'landlord'
      })
    }
  }, [])

  // Listen to Firebase auth state changes to persist session across page reloads
  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!isMounted) return
        setUser(currentUser)

        if (currentUser) {
          try {
            await fetchUserProfile(currentUser)
          } catch (err) {
            console.error('Error restoring user profile on auth state change:', err)
          }
        } else {
          setUserProfile(null)
        }

        if (isMounted) {
          setLoading(false)
        }
      },
      (authError) => {
        console.error('Firebase onAuthStateChanged error:', authError)
        if (isMounted) {
          setError(authError.message || 'Authentication state error')
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [fetchUserProfile])

  const handleSignInWithGoogle = async (): Promise<User | null> => {
    setError(null)
    try {
      const signedInUser = await firebaseSignInWithGoogle()
      if (signedInUser) {
        setUser(signedInUser)
        await fetchUserProfile(signedInUser)
        await logUserActivity(signedInUser.uid, 'Logged in with Google', 'auth', signedInUser.email || undefined)
      }
      return signedInUser
    } catch (err: any) {
      const msg = err?.message || 'Google Sign-In failed'
      setError(msg)
      throw err
    }
  }

  const handleSignOut = async (): Promise<void> => {
    setError(null)
    const activeUid = user?.uid
    try {
      if (activeUid) {
        await logUserActivity(activeUid, 'User logged out', 'auth')
      }
      await firebaseLogoutUser()
      setUser(null)
      setUserProfile(null)
    } catch (err: any) {
      const msg = err?.message || 'Sign out failed'
      setError(msg)
      throw err
    }
  }

  const handleUpdateDisplayName = async (newDisplayName: string): Promise<void> => {
    setError(null)
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('No authenticated user found to update display name')
    }

    try {
      // 1. Update Firebase Auth user profile
      await updateProfile(currentUser, { displayName: newDisplayName })

      // 2. Sync to Firestore document
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(userDocRef, { displayName: newDisplayName }, { merge: true })
      } catch (dbErr) {
        console.warn('Could not update Firestore user document:', dbErr)
      }

      // 3. Update local state
      setUser({ ...currentUser, displayName: newDisplayName } as User)
      setUserProfile((prev) => (prev ? { ...prev, displayName: newDisplayName } : {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: newDisplayName,
        photoURL: currentUser.photoURL,
        role: 'landlord'
      }))

      // 4. Log activity
      await logUserActivity(currentUser.uid, 'Profile updated', 'profile', `Changed name to "${newDisplayName}"`)
    } catch (err: any) {
      const msg = err?.message || 'Failed to update display name'
      setError(msg)
      throw err
    }
  }

  const handleUpdatePhotoURL = async (newPhotoURL: string): Promise<void> => {
    setError(null)
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('No authenticated user found to update photo URL')
    }

    try {
      // 1. Update Firebase Auth user profile
      await updateProfile(currentUser, { photoURL: newPhotoURL })

      // 2. Sync to Firestore document
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true })
      } catch (dbErr) {
        console.warn('Could not update Firestore user document:', dbErr)
      }

      // 3. Update local state
      setUser({ ...currentUser, photoURL: newPhotoURL } as User)
      setUserProfile((prev) => (prev ? { ...prev, photoURL: newPhotoURL } : {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: newPhotoURL,
        role: 'landlord'
      }))

      // 4. Log activity
      await logUserActivity(currentUser.uid, 'Profile picture updated', 'profile')
    } catch (err: any) {
      const msg = err?.message || 'Failed to update photo URL'
      setError(msg)
      throw err
    }
  }

  const handleLogActivity = async (action: string, category: ActivityLog['category'] = 'action', details?: string): Promise<void> => {
    if (user?.uid) {
      await logUserActivity(user.uid, action, category, details)
    }
  }

  const refreshUserProfile = async (): Promise<void> => {
    if (user) {
      await fetchUserProfile(user)
    }
  }

  const clearError = () => setError(null)

  const value: UserContextType = {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleSignOut,
    handleSignOut,
    signOut: handleSignOut,
    updateDisplayName: handleUpdateDisplayName,
    updatePhotoURL: handleUpdatePhotoURL,
    logActivity: handleLogActivity,
    refreshUserProfile,
    clearError
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Hook to access global UserContext
export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Convenient alias for useUser
export const useAuth = useUser

export default UserContext
