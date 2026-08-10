// ════════════════════════════════════════════════════════════════════════
//  EditProfileModal.tsx — Firebase Auth & Firestore Profile Edit Modal
//  ─────────────────────────────────────────────────────────────────────
//  • Allows authenticated users to update their Display Name & Photo URL
//  • Supports 3 avatar modes: File Upload (compressed), Direct URL, Presets
//  • Persists updates to both Firebase Auth profile and Firestore 'users' collection
//  • Smooth Framer Motion modal dialog with ESC key / overlay click dismiss
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import {
  User as UserIcon,
  XCircle,
  Save,
  Upload,
  Camera,
  Check,
  Sparkles,
  Edit2
} from '../lib/icons'

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
]

export interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const { user, userProfile, updateDisplayName, updatePhotoURL } = useUser()

  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [photoInputTab, setPhotoInputTab] = useState<'upload' | 'url' | 'presets'>('upload')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset & populate form on open
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || userProfile?.displayName || '')
      setPhotoURL(user.photoURL || userProfile?.photoURL || '')
      setSaveError(null)
      setSaveSuccess(false)
    }
  }, [isOpen, user, userProfile])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  // Process uploaded image file & compress into a compact data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSaveError('Please upload a valid image file (PNG, JPG, WebP)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 250
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
        setPhotoURL(compressedDataUrl)
        setSaveError(null)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setSaveError('Display name cannot be empty')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const currentName = user.displayName || userProfile?.displayName || ''
      const currentPhoto = user.photoURL || userProfile?.photoURL || ''

      const nameChanged = displayName.trim() !== currentName
      const photoChanged = photoURL.trim() !== currentPhoto

      if (nameChanged) {
        await updateDisplayName(displayName.trim())
      }

      if (photoChanged) {
        await updatePhotoURL(photoURL.trim())
      }

      setSaveSuccess(true)
      onSuccess?.()
      setTimeout(() => {
        setSaveSuccess(false)
        onClose()
      }, 1200)
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Edit2 size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Edit Profile</h2>
                <p className="text-[11px] text-slate-400 font-mono">Firebase Auth & Firestore Sync</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {saveSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 text-sm font-semibold"
              >
                <Check size={20} className="text-emerald-400 shrink-0" />
                <span>Profile details successfully saved to Firebase!</span>
              </motion.div>
            ) : null}

            {/* Avatar Preview & Primary Details */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="relative shrink-0">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'User'}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400/60 shadow-lg"
                    onError={() => setSaveError('Unable to load photo preview from URL')}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-2xl shadow-lg">
                    {displayName[0] || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full shadow-md">
                  <Camera size={12} />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Authenticated User
                </span>
                <p className="text-sm font-bold text-slate-100 truncate">
                  {displayName || 'No display name set'}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {user.email || 'No email'}
                </p>
              </div>
            </div>

            {/* Display Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/20 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Profile Picture Option Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Profile Picture
                </label>

                {/* Tab Switcher */}
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-white/10 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setPhotoInputTab('upload')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      photoInputTab === 'upload'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoInputTab('url')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      photoInputTab === 'url'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoInputTab('presets')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      photoInputTab === 'presets'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Presets
                  </button>
                </div>
              </div>

              {/* Upload Tab */}
              {photoInputTab === 'upload' && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-dashed border-white/20 text-center space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex justify-center text-slate-400">
                    <Upload size={28} />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Select an image from your device
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports JPG, PNG or WebP (auto-resized for performance)
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Choose Local Image...</span>
                  </button>
                </div>
              )}

              {/* Direct URL Tab */}
              {photoInputTab === 'url' && (
                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => {
                      setPhotoURL(e.target.value)
                      setSaveError(null)
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/20 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Paste a publicly hosted image web address
                  </p>
                </div>
              )}

              {/* Presets Tab */}
              {photoInputTab === 'presets' && (
                <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPhotoURL(preset)
                        setSaveError(null)
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        photoURL === preset
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {photoURL === preset && (
                        <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center text-emerald-200">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {saveError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSaving ? 'Saving Profile...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
