// ════════════════════════════════════════════════════════════════════════
//  AuthStatusBadge.tsx — Dynamic Authentication Status & Drawer Launcher
//  ─────────────────────────────────────────────────────────────────────
//  • Reflects real-time Firebase Auth & UI UserContext state
//  • Offers visual status badges ('Authenticated', 'Guest Mode', 'Connecting')
//  • Features direct shortcut buttons to open SignInDrawer (Auth/Account)
//  • Supports 'pill', 'card', and 'compact' layout variants
// ════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { useUser } from '../context/UserContext'
import {
  User as UserIcon,
  ShieldCheck,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  Building,
  Check
} from '../lib/icons'
import SignInDrawer from './SignInDrawer'

export interface AuthStatusBadgeProps {
  /** Optional callback when shortcut button is clicked. If not provided, opens internal SignInDrawer */
  onOpenSignIn?: (tab?: 'login' | 'account' | 'auth') => void
  /** Visual presentation layout */
  variant?: 'pill' | 'card' | 'compact'
  /** Additional custom Tailwind CSS classes */
  className?: string
  /** Whether to display the user role tag */
  showRole?: boolean
  /** Whether to display secondary user details like email or status subtext */
  showDetails?: boolean
}

export function AuthStatusBadge({
  onOpenSignIn,
  variant = 'pill',
  className = '',
  showRole = true,
  showDetails = true
}: AuthStatusBadgeProps) {
  const { user, userProfile, loading, logout } = useUser()
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false)
  const [internalDrawerTab, setInternalDrawerTab] = useState<'login' | 'account'>('login')
  const [imageError, setImageError] = useState(false)

  const handleOpenDrawer = (tab: 'login' | 'account' | 'auth' = 'login') => {
    const targetTab = tab === 'account' ? 'account' : 'login'
    if (onOpenSignIn) {
      onOpenSignIn(tab)
    } else {
      setInternalDrawerTab(targetTab)
      setInternalDrawerOpen(true)
    }
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const displayName = user?.displayName || userProfile?.displayName || 'Guest User'
  const email = user?.email || userProfile?.email || null
  const photoURL = user?.photoURL || userProfile?.photoURL || null
  const role = userProfile?.role || 'Landlord'

  // ── 1. LOADING STATE ──
  if (loading) {
    if (variant === 'compact') {
      return (
        <div className={`w-8 h-8 rounded-full bg-slate-800 animate-pulse border border-white/10 ${className}`} />
      )
    }
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Authenticating...</span>
      </div>
    )
  }

  // ── 2. COMPACT VARIANT ──
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => handleOpenDrawer(user ? 'account' : 'login')}
          className={`relative group inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 border transition-all cursor-pointer ${
            user
              ? 'border-emerald-500/40 hover:border-emerald-400 shadow-sm shadow-emerald-500/10'
              : 'border-white/15 hover:border-emerald-400/60'
          } ${className}`}
          title={user ? `Signed in as ${displayName} (${role})` : 'Click to Sign In'}
        >
          {user && photoURL && !imageError ? (
            <img
              src={photoURL}
              alt={displayName}
              onError={() => setImageError(true)}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : user ? (
            <div className="w-full h-full rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
              {displayName[0] || 'U'}
            </div>
          ) : (
            <UserIcon size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
          )}

          {/* Status Indicator Dot */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
              user ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
        </button>

        {!onOpenSignIn && (
          <SignInDrawer
            isOpen={internalDrawerOpen}
            onClose={() => setInternalDrawerOpen(false)}
            initialTab={internalDrawerTab}
          />
        )}
      </>
    )
  }

  // ── 3. CARD VARIANT ──
  if (variant === 'card') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-slate-900/90 border transition-all ${
          user ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'border-white/10'
        } ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {user && photoURL && !imageError ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  onError={() => setImageError(true)}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border ${
                  user
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}>
                  {user ? displayName[0] : <UserIcon size={18} />}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-100 truncate">{displayName}</h4>
                  {user ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck size={10} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-white/10">
                      Guest
                    </span>
                  )}
                </div>

                {showDetails && (
                  <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                    {email || (user ? 'Authenticated user' : 'Not signed in')}
                  </p>
                )}

                {user && showRole && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 capitalize">
                      <Building size={11} className="text-cyan-400" />
                      Role: {role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Shortcut Button */}
            {user ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenDrawer('account')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenDrawer('login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all cursor-pointer shrink-0"
              >
                <UserIcon size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {!onOpenSignIn && (
          <SignInDrawer
            isOpen={internalDrawerOpen}
            onClose={() => setInternalDrawerOpen(false)}
            initialTab={internalDrawerTab}
          />
        )}
      </>
    )
  }

  // ── 4. PILL VARIANT (DEFAULT) ──
  return (
    <>
      <div className={`inline-flex items-center gap-2 p-1.5 pl-2.5 rounded-full bg-slate-900/90 border transition-all ${
        user
          ? 'border-emerald-500/30 hover:border-emerald-400/60 shadow-sm shadow-emerald-500/10'
          : 'border-white/10 hover:border-white/20'
      } ${className}`}>
        {/* Status indicator badge */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-mono font-medium text-slate-300">
            {user ? 'Authenticated' : 'Guest'}
          </span>
        </div>

        <span className="w-px h-3.5 bg-white/15" />

        {/* User preview button & shortcut */}
        <button
          onClick={() => handleOpenDrawer(user ? 'account' : 'login')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer group"
        >
          {user && photoURL && !imageError ? (
            <img
              src={photoURL}
              alt={displayName}
              onError={() => setImageError(true)}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-400/50"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              user ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {user ? displayName[0] : <UserIcon size={11} />}
            </div>
          )}

          <span className="max-w-[120px] truncate">
            {user ? displayName : 'Sign In'}
          </span>

          <ChevronRight size={13} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {!onOpenSignIn && (
        <SignInDrawer
          isOpen={internalDrawerOpen}
          onClose={() => setInternalDrawerOpen(false)}
          initialTab={internalDrawerTab}
        />
      )}
    </>
  )
}

export default AuthStatusBadge
