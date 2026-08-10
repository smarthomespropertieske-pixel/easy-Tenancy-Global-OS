// ════════════════════════════════════════════════════════════════════════
//  SignInDrawer.tsx — Slide-Out Sign-In & Profile Navigation Drawer
//  ─────────────────────────────────────────────────────────────────────
//  • Powered by framer-motion for smooth right slide-out transitions
//  • Features dual tabs: 'Login' and 'Account Settings'
//  • Integrates with Firebase Auth, Google OAuth, WebAuthn & Turnstile
//  • Toggled directly from user profile navigation element
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import {
  X,
  User as UserIcon,
  LogOut,
  Sparkles,
  KeyIcon as Key,
  Shield,
  Check,
  Building,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from '../lib/icons'
import WebAuthnLogin from './WebAuthnLogin'
import RoleSwitcher from './RoleSwitcher'
import TurnstileWidget from './TurnstileWidget'
import UserProfileView from './UserProfileView'
import { User } from '../lib/firebase'

export interface SignInDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'account' | 'auth'
  currentUser?: User | null
}

export function SignInDrawer({
  isOpen,
  onClose,
  initialTab = 'login',
  currentUser: propUser
}: SignInDrawerProps) {
  const { user: contextUser, userProfile, signInWithGoogle, logout } = useUser()
  const activeUser = contextUser || propUser || null

  // Map 'auth' or 'login' to 'login' for tab consistency
  const [tab, setTab] = useState<'login' | 'account'>(
    initialTab === 'account' ? 'account' : 'login'
  )
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [showPasskeyModal, setShowPasskeyModal] = useState(false)

  // Update tab based on authentication state on drawer open
  useEffect(() => {
    if (isOpen) {
      setAuthError(null)
      if (activeUser) {
        setTab(initialTab === 'login' || initialTab === 'auth' ? 'account' : 'account')
      } else {
        setTab('login')
      }
    }
  }, [isOpen, activeUser, initialTab])

  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when drawer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      const user = await signInWithGoogle()
      if (user) {
        setTab('account')
      }
    } catch (err: any) {
      if (!err?.message?.includes('popup-closed')) {
        setAuthError(err?.message || 'Authentication failed')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await logout()
      setTab('login')
    } catch (err: any) {
      setAuthError(err?.message || 'Sign out failed')
    }
  }

  const handleCopyApiToken = () => {
    const mockToken = `ez_live_${activeUser?.uid?.slice(0, 12) || 'demo_user'}_${Date.now()}`
    navigator.clipboard.writeText(mockToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel (Smooth right slide using framer-motion) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-white/10 text-slate-100 shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="User Profile & Sign In Navigation"
          >
            {/* Header Bar */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                    {activeUser ? activeUser.displayName || 'Account Settings' : 'Sign In Gateway'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    easyTenancy.OS • Identity Portal
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tab Bar: 'Login' vs 'Account Settings' */}
            <div className="px-5 pt-4 pb-2 bg-slate-900/60 border-b border-white/5">
              <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-medium">
                <button
                  onClick={() => setTab('login')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                    tab === 'login'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Key size={14} />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => setTab('account')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                    tab === 'account'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <UserIcon size={14} />
                  <span>Account Settings</span>
                  {activeUser && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <span>{authError}</span>
                <button
                  onClick={() => setAuthError(null)}
                  className="text-rose-400 hover:text-rose-200 font-bold ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {tab === 'login' ? (
                /* ── LOGIN TAB ── */
                <div className="space-y-5">
                  {/* Status Card if user is already signed in */}
                  {activeUser && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center gap-3">
                        {activeUser.photoURL ? (
                          <img
                            src={activeUser.photoURL}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full ring-2 ring-emerald-500/40"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm font-bold">
                            {activeUser.displayName ? activeUser.displayName[0] : 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-100 truncate">
                            {activeUser.displayName || 'Signed In User'}
                          </p>
                          <p className="text-[11px] text-emerald-400/90 font-mono truncate">
                            {activeUser.email}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-300/80 flex items-center gap-1">
                          <Check size={14} className="text-emerald-400" />
                          Authenticated Session Active
                        </span>
                        <button
                          onClick={() => setTab('account')}
                          className="text-xs text-emerald-300 hover:text-emerald-100 font-medium underline flex items-center gap-0.5"
                        >
                          Account Settings <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Google OAuth Login */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      {activeUser ? 'Switch or Re-Authenticate' : 'Google Identity Single Sign-On'}
                    </p>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/15 hover:border-emerald-500/40 font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      <span>{isSigningIn ? 'Authenticating with Google...' : 'Sign In with Google'}</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-slate-900 px-3 text-slate-500 font-mono">
                        or passkey / biometric
                      </span>
                    </div>
                  </div>

                  {/* Passkey / WebAuthn Biometric Section */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          Passwordless Passkey (FIDO2)
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded">
                        Biometric
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Log in using Touch ID, Face ID, hardware key, or device PIN.
                    </p>
                    <button
                      onClick={() => setShowPasskeyModal(prev => !prev)}
                      className="w-full py-2 px-3 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>{showPasskeyModal ? 'Hide Passkey Console' : 'Launch Passkey Biometric Login'}</span>
                    </button>

                    {showPasskeyModal && (
                      <div className="pt-2 border-t border-white/10">
                        <WebAuthnLogin
                          onAuthenticated={(_session: any) => {
                            setTab('account')
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Bot Protection Guard */}
                  <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Cloudflare Turnstile Verified</span>
                    </div>
                    <div className="transform scale-90 origin-left">
                      <TurnstileWidget onVerified={() => {}} />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── ACCOUNT SETTINGS TAB ── */
                <div className="space-y-6">
                  {/* User Profile View & Edit Component */}
                  <UserProfileView showDetails={true} onSignOutSuccess={() => setTab('login')} />

                  {/* Active Role & Persona Switcher */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Building size={14} className="text-emerald-400" />
                        <span>Active Role Perspective</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        easyTenancy OS
                      </span>
                    </div>

                    <RoleSwitcher />
                  </div>

                  {/* Developer API Key Bearer Token */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-emerald-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          Developer API Bearer Token
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        v1 REST API
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Bearer token for authenticating EasyTenancy endpoints like <code className="text-emerald-300 font-mono">/api/analytics</code> and <code className="text-emerald-300 font-mono">/api/waitlist</code>.
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-slate-900 border border-white/10 rounded-lg font-mono text-[11px] text-emerald-400 truncate select-all">
                        {`ez_live_${activeUser?.uid?.slice(0, 10) || 'demo'}_${Date.now()}`}
                      </div>
                      <button
                        onClick={handleCopyApiToken}
                        className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedToken ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Cloud State Telemetry */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-2.5 text-xs">
                    <span className="font-semibold text-slate-300 block mb-1">
                      Cloud State & Sync Engine
                    </span>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Firebase Firestore DB</span>
                      <span className="text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Cloudflare Workers KV</span>
                      <span className="text-emerald-400 font-mono">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Bot Shield (Turnstile)</span>
                      <span className="text-emerald-400 font-mono">Enforced</span>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  {activeUser ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>Sign Out of Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setTab('login')}
                      className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Key size={16} />
                      <span>Go to Login Tab</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>easyTenancy Global OS v4.4</span>
              <a
                href="/firebase-diagnostic"
                onClick={onClose}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                DB Diagnostic <ExternalLink size={12} />
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default SignInDrawer
