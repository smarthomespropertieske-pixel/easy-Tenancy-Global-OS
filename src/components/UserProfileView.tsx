// ════════════════════════════════════════════════════════════════════════
//  UserProfileView.tsx — Global Auth User Profile Component
//  ─────────────────────────────────────────────────────────────────────
//  • Connects to `UserContext` via `useUser()` custom hook
//  • Displays user's photo URL, display name, email, and role details
//  • Provides sign-in/sign-out actions and profile state indicator
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react'
import { useUser } from '../context/UserContext'
import {
  User as UserIcon,
  LogOut,
  Shield,
  Check,
  Building,
  Sparkles,
  KeyIcon as Key,
  ExternalLink,
  Edit2,
  Save,
  XCircle,
  Upload,
  Camera
} from '../lib/icons'

// Preset avatars for 1-click selection
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
]

import UserActivityLogger from './UserActivityLogger'
import EditProfileModal from './EditProfileModal'

export interface UserProfileViewProps {
  variant?: 'card' | 'compact' | 'inline' | 'hero'
  className?: string
  showDetails?: boolean
  onSignOutSuccess?: () => void
  onSignInSuccess?: () => void
}

export function UserProfileView({
  variant = 'card',
  className = '',
  showDetails = true,
  onSignOutSuccess,
  onSignInSuccess
}: UserProfileViewProps) {
  const {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    logout,
    updateDisplayName,
    updatePhotoURL,
    clearError
  } = useUser()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Edit profile form state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhotoURL, setEditPhotoURL] = useState('')
  const [photoInputTab, setPhotoInputTab] = useState<'upload' | 'url' | 'presets'>('upload')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSignIn = async () => {
    setIsActionLoading(true)
    try {
      const signedIn = await signInWithGoogle()
      if (signedIn) {
        onSignInSuccess?.()
      }
    } catch (err) {
      console.error('Sign-in error in UserProfileView:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsActionLoading(true)
    try {
      await logout()
      onSignOutSuccess?.()
    } catch (err) {
      console.error('Sign-out error in UserProfileView:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStartEditing = () => {
    setEditName(user?.displayName || userProfile?.displayName || '')
    setEditPhotoURL(user?.photoURL || userProfile?.photoURL || '')
    setSaveError(null)
    setSaveSuccess(false)
    setIsModalOpen(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  // Convert uploaded image file to a compressed data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, WebP)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress & resize image to 200x200 canvas
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setEditPhotoURL(compressedDataUrl)
        setImageError(false)
        setSaveError(null)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      setSaveError('Display name cannot be empty')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const currentName = user?.displayName || userProfile?.displayName || ''
      const currentPhoto = user?.photoURL || userProfile?.photoURL || ''

      const nameChanged = editName.trim() !== currentName
      const photoChanged = editPhotoURL.trim() !== currentPhoto

      if (nameChanged) {
        await updateDisplayName(editName.trim())
      }

      if (photoChanged) {
        await updatePhotoURL(editPhotoURL.trim())
        setImageError(false)
      }

      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className={`p-4 rounded-xl bg-slate-900/60 border border-white/10 animate-pulse flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-800 rounded w-1/2" />
          <div className="h-2.5 bg-slate-800/60 rounded w-3/4" />
        </div>
      </div>
    )
  }

  const displayName = user?.displayName || userProfile?.displayName || 'Authenticated User'
  const email = user?.email || userProfile?.email || 'No email associated'
  const photoURL = user?.photoURL || userProfile?.photoURL
  const role = userProfile?.role || 'landlord'

  // Inline Variant (for navbars, headers, tight bars)
  if (variant === 'inline') {
    if (!user) {
      return (
        <button
          onClick={handleSignIn}
          disabled={isActionLoading}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer ${className}`}
        >
          <Key size={14} />
          <span>{isActionLoading ? 'Signing in...' : 'Sign In'}</span>
        </button>
      )
    }

    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 ${className}`}>
        {photoURL && !imageError ? (
          <img
            src={photoURL}
            alt={displayName}
            onError={() => setImageError(true)}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-400/60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold uppercase">
            {displayName[0]}
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold leading-tight truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono leading-tight truncate max-w-[130px]">
            {email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isActionLoading}
          className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={13} />
        </button>
      </div>
    )
  }

  // Compact Variant
  if (variant === 'compact') {
    if (!user) {
      return (
        <div className={`p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Guest Session</p>
              <p className="text-[11px] text-slate-400">Not logged in</p>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isActionLoading}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/15 hover:border-emerald-500/30 font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Sign In
          </button>
        </div>
      )
    }

    return (
      <div className={`p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          {photoURL && !imageError ? (
            <img
              src={photoURL}
              alt={displayName}
              onError={() => setImageError(true)}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-400/50 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {displayName[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{displayName}</p>
            <p className="text-[11px] text-emerald-400 font-mono truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isActionLoading}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    )
  }

  // Card Variant (Default) & Hero Variant
  if (!user) {
    return (
      <div className={`p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 text-slate-100 shadow-xl ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center">
            <UserIcon size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Guest Visitor</h3>
            <p className="text-xs text-slate-400">Sign in to access your tenant dashboard and saved properties</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-400 font-bold ml-2">×</button>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isActionLoading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/15 hover:border-emerald-500/40 font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>{isActionLoading ? 'Authenticating...' : 'Sign In with Google'}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 text-slate-100 shadow-xl space-y-4 ${className}`}>
      {/* Top Banner & Avatar Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar with click-to-edit overlay */}
          <div className="relative group shrink-0">
            {photoURL && !imageError ? (
              <img
                src={photoURL}
                alt={displayName}
                onError={() => setImageError(true)}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400/60 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xl shadow-md">
                {displayName[0]}
              </div>
            )}
            <button
              onClick={handleStartEditing}
              className="absolute inset-0 rounded-2xl bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              title="Change Photo or Profile"
            >
              <Camera size={18} className="text-emerald-400" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 truncate">{displayName}</h3>
              {!isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 size={13} />
                </button>
              )}
            </div>
            <p className="text-xs text-emerald-400 font-mono truncate">{email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Shield size={12} className="text-emerald-400" />
                Google Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 capitalize">
                <Building size={12} className="text-cyan-400" />
                Role: {role}
              </span>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  <Check size={12} /> Profile Updated
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isActionLoading}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Sign Out of Account"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Inline Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="p-4 rounded-xl bg-slate-950/95 border border-emerald-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <Edit2 size={13} />
              Edit Profile Information
            </span>
            <button
              type="button"
              onClick={handleCancelEditing}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Cancel"
            >
              <XCircle size={16} />
            </button>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-300">
              Display Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter new display name..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-slate-100 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40"
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Profile Photo Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-medium text-slate-300">
                Profile Photo
              </label>
              {/* Photo Input Mode Selector Tabs */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setPhotoInputTab('upload')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    photoInputTab === 'upload' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputTab('url')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    photoInputTab === 'url' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputTab('presets')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    photoInputTab === 'presets' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Presets
                </button>
              </div>
            </div>

            {/* Photo Preview & Inputs */}
            <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-white/10">
              <div className="shrink-0 relative">
                {editPhotoURL ? (
                  <img
                    src={editPhotoURL}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400/50"
                    onError={() => setSaveError('Invalid image URL or unreadable file format')}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center border border-white/10">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {photoInputTab === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>Choose Image File...</span>
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">Upload JPG, PNG or WebP</p>
                  </div>
                )}

                {photoInputTab === 'url' && (
                  <input
                    type="url"
                    value={editPhotoURL}
                    onChange={(e) => {
                      setEditPhotoURL(e.target.value)
                      setSaveError(null)
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/20 text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
                  />
                )}

                {photoInputTab === 'presets' && (
                  <div className="flex items-center gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setEditPhotoURL(preset)
                          setSaveError(null)
                        }}
                        className={`p-0.5 rounded-lg transition-transform hover:scale-105 cursor-pointer ${
                          editPhotoURL === preset ? 'ring-2 ring-emerald-400' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset}
                          alt={`Preset ${idx + 1}`}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-[11px] text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {saveError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelEditing}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Optional Metadata Details Grid & Real-Time Activity Log */}
      {showDetails && (
        <div className="space-y-4 pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Firebase UID</span>
              <span className="text-slate-300 truncate block text-[11px]" title={user.uid}>
                {user.uid.slice(0, 16)}…
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Authentication Provider</span>
              <span className="text-emerald-400 truncate block text-[11px] flex items-center gap-1">
                <Check size={12} />
                {user.providerData[0]?.providerId || 'google.com'}
              </span>
            </div>
          </div>

          {/* Activity Audit Feed */}
          <UserActivityLogger variant="compact" limitCount={15} title="Recent Activity Trail" />
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 text-emerald-400/90 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active Session Sync
        </span>
        <button
          onClick={handleSignOut}
          disabled={isActionLoading}
          className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-medium flex items-center gap-1 cursor-pointer"
        >
          <span>Sign Out</span>
          <LogOut size={12} />
        </button>
      </div>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setSaveSuccess(true)}
      />
    </div>
  )
}

export default UserProfileView
