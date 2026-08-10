// ════════════════════════════════════════════════════════════════════════
//  LoginButton.tsx — Firebase OAuth Google Sign-In Component
//  ─────────────────────────────────────────────────────────────────────
//  • Uses Firebase OAuth flow configured with clientId from firebase-applet-config.json
//  • Supports Google Sign-In & Sign-Out with active session monitoring
//  • Polished UI with loading indicators, error handling, and flexible variants
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import {
  auth,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged,
  googleProvider,
  User
} from '../lib/firebase'
import firebaseConfig from '../../firebase-applet-config.json'
import { LogOut, User as UserIcon, Check } from '../lib/icons'

export interface LoginButtonProps {
  onSuccess?: (user: User) => void
  onError?: (error: string) => void
  onSignOut?: () => void
  variant?: 'default' | 'outline' | 'compact' | 'pill'
  className?: string
  showAvatarWhenSignedIn?: boolean
}

export function LoginButton({
  onSuccess,
  onError,
  onSignOut,
  variant = 'default',
  className = '',
  showAvatarWhenSignedIn = true
}: LoginButtonProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Configure OAuth client parameters if clientId is present in firebase-applet-config.json
  useEffect(() => {
    if (firebaseConfig.oAuthClientId) {
      try {
        googleProvider.setCustomParameters({
          client_id: firebaseConfig.oAuthClientId,
          prompt: 'select_account'
        })
      } catch (e) {
        console.warn('Could not set custom OAuth client_id on provider:', e)
      }
    }
  }, [])

  // Monitor active auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const user = await signInWithGoogle()
      if (user) {
        setCurrentUser(user)
        onSuccess?.(user)
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in with Google'
      setErrorMessage(msg)
      onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      await logoutUser()
      setCurrentUser(null)
      onSignOut?.()
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign out'
      setErrorMessage(msg)
      onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // If user is signed in, show profile chip or logout button
  if (currentUser && showAvatarWhenSignedIn) {
    return (
      <div className={`inline-flex items-center gap-2 p-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl text-slate-200 text-xs shadow-md ${className}`}>
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="w-6 h-6 rounded-full ring-1 ring-emerald-400"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            {currentUser.displayName ? currentUser.displayName[0] : 'U'}
          </div>
        )}

        <span className="font-medium text-slate-100 max-w-[120px] truncate">
          {currentUser.displayName || currentUser.email?.split('@')[0]}
        </span>

        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          title="Sign Out"
        >
          {isLoading ? (
            <svg className="w-3.5 h-3.5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <LogOut size={14} />
          )}
        </button>
      </div>
    )
  }

  // Variant styling for Sign-In state
  const baseClasses =
    'inline-flex items-center justify-center gap-2.5 font-semibold text-xs rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  let variantClasses =
    'bg-slate-900/90 text-slate-100 hover:bg-slate-800/90 border border-white/15 hover:border-emerald-500/40 px-4 py-2.5 shadow-md hover:shadow-emerald-500/10'

  if (variant === 'outline') {
    variantClasses =
      'bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/15 hover:border-emerald-500/30 px-4 py-2.5 shadow-sm'
  } else if (variant === 'compact') {
    variantClasses =
      'bg-slate-900/90 text-slate-100 hover:bg-slate-800 border border-white/15 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs'
  } else if (variant === 'pill') {
    variantClasses =
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 px-4 py-2 rounded-full shadow-sm shadow-emerald-500/10'
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses} ${className}`}
        aria-label="Sign in with Google using Firebase OAuth"
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin text-slate-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign In with Google'}</span>
      </button>

      {errorMessage && (
        <span className="text-[10px] text-rose-400 max-w-[200px] truncate">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

export default LoginButton
