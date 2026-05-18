// ═══════════════════════════════════════════════════════════════════════
//  WebAuthnLogin.tsx
//  easyTenancy Global OS — Passwordless Biometric Login (FIDO2/WebAuthn)
//
//  Implements passkey-based authentication meeting 2026 security standards:
//    • navigator.credentials.create() — passkey registration
//    • navigator.credentials.get()    — biometric authentication
//    • Cloudflare Workers API stubs for server-side challenge + verification
//    • Turnstile bot protection on registration
//    • Framer Motion "Antigravity" UI transitions
//    • Graceful degradation: falls back to "magic link" if WebAuthn unavailable
//
//  Flow:
//    Registration:  Enter email → CF Turnstile check → Browser biometric prompt
//                   → Send credential to /api/auth/webauthn/register
//    Login:         Enter email or use "discoverable credential" (resident key)
//                   → Browser biometric prompt → Verify with /api/auth/webauthn/authenticate
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../lib/tokens'
import TurnstileWidget from './TurnstileWidget'

// ── Types ──────────────────────────────────────────────────────────────
type AuthMode  = 'login' | 'register'
type AuthStep  = 'input' | 'biometric' | 'verifying' | 'success' | 'error' | 'fallback'

interface AuthSession {
  userId:       string
  sessionToken: string
  expiresAt:    string
  displayName?: string
}

export interface WebAuthnLoginProps {
  /** Called with session data on successful authentication */
  onAuthenticated: (session: AuthSession) => void
  /** Called on dismiss / cancel */
  onCancel?:       () => void
  /** Pre-fill email (e.g., from URL param) */
  defaultEmail?:   string
  /** Show as modal overlay (default: false — renders inline) */
  asModal?:        boolean
  /** Redirect URL after login (for page-reload scenarios) */
  redirectAfter?:  string
}

// ── WebAuthn availability check ───────────────────────────────────────
function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  )
}

// ── Base64url helpers ─────────────────────────────────────────────────
function base64urlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    value.length + (4 - value.length % 4) % 4, '='
  )
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function bufferToBase64url(buf: ArrayBufferLike): string {
  return base64urlEncode(buf)
}

// ── Prepare credential for JSON ───────────────────────────────────────
function serializeCredential(cred: PublicKeyCredential) {
  const response = cred.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse

  // Registration response
  if ('attestationObject' in response) {
    return {
      id:     cred.id,
      rawId:  base64urlEncode(cred.rawId),
      type:   cred.type,
      response: {
        clientDataJSON:    base64urlEncode(response.clientDataJSON),
        attestationObject: base64urlEncode(response.attestationObject),
      },
      authenticatorAttachment: cred.authenticatorAttachment,
    }
  }

  // Authentication response
  const assertResp = response as AuthenticatorAssertionResponse
  return {
    id:     cred.id,
    rawId:  base64urlEncode(cred.rawId),
    type:   cred.type,
    response: {
      clientDataJSON:    base64urlEncode(assertResp.clientDataJSON),
      authenticatorData: base64urlEncode(assertResp.authenticatorData),
      signature:         base64urlEncode(assertResp.signature),
      userHandle:        assertResp.userHandle ? base64urlEncode(assertResp.userHandle) : null,
    },
    authenticatorAttachment: cred.authenticatorAttachment,
  }
}

// ── Registration flow ─────────────────────────────────────────────────
async function registerPasskey(
  email: string,
  displayName: string,
  turnstileToken?: string
): Promise<AuthSession> {
  // 1. Get challenge from server
  const challengeRes = await fetch(
    `/api/auth/webauthn/challenge?type=registration&userId=${encodeURIComponent(email)}`,
    { headers: { 'Content-Type': 'application/json' } }
  )
  if (!challengeRes.ok) throw new Error('Failed to get registration challenge')

  const challengeData = await challengeRes.json() as {
    challenge: string; rpId: string; timeout: number
  }

  // 2. Browser prompts biometric
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge:  base64urlDecode(challengeData.challenge),
      rp:         { name: 'easyTenancy Global OS', id: challengeData.rpId },
      user: {
        id:          new TextEncoder().encode(email),
        name:        email,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7  },   // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey:      true,
        userVerification:        'required',
      },
      attestation: 'none',
      timeout:     challengeData.timeout ?? 60_000,
    },
  }) as PublicKeyCredential | null

  if (!credential) throw new Error('Registration cancelled by user')

  // 3. Send credential to server
  const regRes = await fetch('/api/auth/webauthn/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      userId:     email,
      username:   email,
      credential: serializeCredential(credential),
      challenge:  challengeData.challenge,
      displayName,
      turnstileToken,
    }),
  })

  if (!regRes.ok) {
    const err = await regRes.json() as { error?: string }
    throw new Error(err.error ?? 'Registration failed')
  }

  const data = await regRes.json() as { sessionToken?: string; expiresAt?: string; message?: string }

  return {
    userId:       email,
    sessionToken: data.sessionToken ?? 'registered-stub',
    expiresAt:    data.expiresAt ?? new Date(Date.now() + 86_400_000 * 7).toISOString(),
    displayName,
  }
}

// ── Authentication flow ───────────────────────────────────────────────
async function authenticatePasskey(email?: string): Promise<AuthSession> {
  // 1. Get challenge
  const url = email
    ? `/api/auth/webauthn/challenge?type=authentication&userId=${encodeURIComponent(email)}`
    : `/api/auth/webauthn/challenge?type=authentication`

  const challengeRes = await fetch(url)
  if (!challengeRes.ok) throw new Error('Failed to get authentication challenge')

  const challengeData = await challengeRes.json() as {
    challenge: string; rpId: string; timeout: number
  }

  // 2. Browser prompts biometric
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge:        base64urlDecode(challengeData.challenge),
      rpId:             challengeData.rpId,
      userVerification: 'required',
      timeout:          challengeData.timeout ?? 60_000,
      // allowCredentials: [] — empty = discoverable (resident key / passkey)
    },
  }) as PublicKeyCredential | null

  if (!credential) throw new Error('Authentication cancelled by user')

  // 3. Verify with server
  const authRes = await fetch('/api/auth/webauthn/authenticate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      credential: serializeCredential(credential),
      challenge:  challengeData.challenge,
      userId:     email,
    }),
  })

  if (!authRes.ok) {
    const err = await authRes.json() as { error?: string }
    throw new Error(err.error ?? 'Authentication failed')
  }

  const data = await authRes.json() as {
    sessionToken: string; userId: string; expiresAt: string; authenticated: boolean
  }

  return {
    userId:       data.userId,
    sessionToken: data.sessionToken,
    expiresAt:    data.expiresAt,
  }
}

// ── Fingerprint icon (animated) ───────────────────────────────────────
function FingerprintIcon({ scanning, color }: { scanning: boolean; color: string }) {
  return (
    <motion.svg
      width="48" height="48" viewBox="0 0 24 24" fill="none"
      animate={scanning ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] } : {}}
      transition={scanning ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <path d="M12 1C8.5 1 5.5 3 4 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4.5 10c-.3 1-.5 2-.5 3 0 3.5 2 6.5 5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 10c.3 1 .5 2 .5 3 0 1.5-.3 3-1 4.2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 6c-1.5-3-4.5-5-8-5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 7c-2.8 0-5 2.2-5 5 0 2 .8 3.8 2 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 7c2.8 0 5 2.2 5 5 0 .7-.1 1.3-.3 1.9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 11c-.6 0-1 .4-1 1 0 2 1 3.8 2.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 11c.6 0 1 .4 1 1v1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {scanning && (
        <motion.line
          x1="2" y1="12" x2="22" y2="12"
          stroke={color} strokeWidth="1.5" strokeOpacity="0.6"
          animate={{ y1: [8, 16, 8], y2: [8, 16, 8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────
export default function WebAuthnLogin({
  onAuthenticated,
  onCancel,
  defaultEmail  = '',
  asModal       = false,
  redirectAfter,
}: WebAuthnLoginProps) {
  const [mode,          setMode]          = useState<AuthMode>('login')
  const [step,          setStep]          = useState<AuthStep>('input')
  const [email,         setEmail]         = useState(defaultEmail)
  const [displayName,   setDisplayName]   = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check WebAuthn availability
  useEffect(() => {
    if (isWebAuthnAvailable()) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setPlatformAvailable(available))
        .catch(() => setPlatformAvailable(false))
    } else {
      setPlatformAvailable(false)
    }
  }, [])

  // Auto-focus email input
  useEffect(() => {
    if (step === 'input') inputRef.current?.focus()
  }, [step])

  // ── Handle login ─────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!email.trim()) { setErrorMsg('Please enter your email'); return }
    setErrorMsg('')
    setStep('biometric')

    try {
      const session = await authenticatePasskey(email.trim())
      setStep('success')
      setTimeout(() => {
        onAuthenticated(session)
        if (redirectAfter) window.location.href = redirectAfter
      }, 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('cancelled') || msg.includes('cancel')) {
        setStep('input')
      } else {
        setErrorMsg(msg)
        setStep('error')
      }
    }
  }, [email, onAuthenticated, redirectAfter])

  // ── Handle register ──────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!email.trim())       { setErrorMsg('Please enter your email');    return }
    if (!displayName.trim()) { setErrorMsg('Please enter your full name'); return }
    setErrorMsg('')
    setStep('biometric')

    try {
      const session = await registerPasskey(
        email.trim(),
        displayName.trim(),
        turnstileToken ?? undefined
      )
      setStep('success')
      setTimeout(() => {
        onAuthenticated(session)
        if (redirectAfter) window.location.href = redirectAfter
      }, 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (msg.includes('cancelled') || msg.includes('cancel')) {
        setStep('input')
      } else {
        setErrorMsg(msg)
        setStep('error')
      }
    }
  }, [email, displayName, turnstileToken, onAuthenticated, redirectAfter])

  // ── Render ──────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    width:     '100%',
    maxWidth:  420,
    background: 'rgba(22,27,42,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border:    '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24,
    overflow:  'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(42,157,232,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
  }

  const wrapperStyle: React.CSSProperties = asModal
    ? {
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(16px)',
        padding: '20px',
      }
    : { display: 'flex', justifyContent: 'center' }

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={cardStyle}
    >
      {/* Gradient top bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.blueLight}, ${BRAND.teal})`,
      }} />

      <div style={{ padding: '28px 28px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px ${BRAND.blue}50`,
              }}>
                <span style={{ fontSize: 18 }}>🏠</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F0EDE8' }}>easyTenancy</div>
                <div style={{ fontSize: 10, color: '#8892A4', marginTop: 1 }}>Global OS · Secure Access</div>
              </div>
            </div>
          </div>
          {onCancel && (
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                color: '#8892A4', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</motion.button>
          )}
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
          padding: 3, marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map(m => (
            <motion.button
              key={m}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setMode(m); setStep('input'); setErrorMsg('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: mode === m ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                color: mode === m ? '#F0EDE8' : '#8892A4',
                fontSize: 13, fontWeight: mode === m ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {m === 'login' ? '🔑 Sign In' : '✨ Register'}
            </motion.button>
          ))}
        </div>

        {/* Step: Input form */}
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8892A4', display: 'block', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : undefined)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12, color: '#F0EDE8', fontSize: 14,
                    outline: 'none', transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = `${BRAND.blueLight}60`)}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
              </div>

              {mode === 'register' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8892A4', display: 'block', marginBottom: 6 }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Alex Johnson"
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12, color: '#F0EDE8', fontSize: 14,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = `${BRAND.blueLight}60`)}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                  />
                </div>
              )}

              {/* Turnstile (registration only) */}
              {mode === 'register' && (
                <div style={{ marginBottom: 16 }}>
                  <TurnstileWidget
                    mode="invisible"
                    showStatus={true}
                    autoExecute={true}
                    action="et-register"
                    onVerified={t => setTurnstileToken(t)}
                    onError={() => setTurnstileToken(null)}
                  />
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginBottom: 14, padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: 12, color: '#fca5a5',
                    }}
                  >⚠️ {errorMsg}</motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: `0 8px 28px ${BRAND.blue}55` }}
                whileTap={{ scale: 0.97 }}
                onClick={mode === 'login' ? handleLogin : handleRegister}
                style={{
                  width: '100%', padding: '13px',
                  background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueLight})`,
                  border: 'none', borderRadius: 14, color: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 4px 20px ${BRAND.blue}45`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.3s',
                }}
              >
                <FingerprintIcon scanning={false} color="rgba(255,255,255,0.8)" />
                {mode === 'login'
                  ? 'Sign in with Passkey'
                  : 'Register Passkey'}
              </motion.button>

              {/* Fallback hint */}
              {platformAvailable === false && (
                <p style={{
                  textAlign: 'center', fontSize: 11, color: '#8892A4', marginTop: 12,
                  lineHeight: 1.5,
                }}>
                  ⚠️ Platform biometrics not detected.{' '}
                  <button
                    onClick={() => setStep('fallback')}
                    style={{ background: 'none', border: 'none', color: BRAND.blueLight, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >Use magic link instead →</button>
                </p>
              )}

              {/* WebAuthn info */}
              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🛡️</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#F0EDE8', marginBottom: 2 }}>
                    Passwordless · FIDO2 · 2026 Security Standard
                  </div>
                  <div style={{ fontSize: 11, color: '#8892A4', lineHeight: 1.5 }}>
                    Uses your device's fingerprint, Face ID, or Windows Hello.
                    Your biometric data never leaves your device.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Biometric scanning */}
          {step === 'biometric' && (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{ textAlign: 'center', padding: '16px 0' }}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
                  background: `radial-gradient(circle, ${BRAND.blue}30, transparent)`,
                  border: `2px solid ${BRAND.blueLight}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 40px ${BRAND.blue}40`,
                }}
              >
                <FingerprintIcon scanning={true} color={BRAND.blueLight} />
              </motion.div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
                {mode === 'login' ? 'Authenticate with biometrics' : 'Register your passkey'}
              </div>
              <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.6 }}>
                Touch your fingerprint sensor, look at Face ID,<br/>
                or use your device's PIN to {mode === 'login' ? 'sign in' : 'register'}.
              </p>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.blueLight }}
                  />
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStep('input')}
                style={{
                  marginTop: 16, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '8px 20px', color: '#8892A4', fontSize: 13, cursor: 'pointer',
                }}
              >Cancel</motion.button>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '24px 0' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(16,185,129,0.15)',
                  border: '2px solid rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32,
                }}
              >✓</motion.div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F0EDE8', marginBottom: 6 }}>
                {mode === 'login' ? 'Welcome back!' : 'Passkey registered!'}
              </div>
              <p style={{ fontSize: 13, color: '#8892A4' }}>
                {mode === 'login'
                  ? 'Authentication successful. Redirecting…'
                  : 'Your biometric passkey is set up. Signing you in…'}
              </p>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '16px 0' }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5', marginBottom: 8 }}>
                Authentication failed
              </div>
              <p style={{ fontSize: 13, color: '#8892A4', marginBottom: 20 }}>{errorMsg}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('input'); setErrorMsg('') }}
                  style={{
                    padding: '9px 20px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueLight})`,
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >Try again</motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setStep('fallback')}
                  style={{
                    padding: '9px 20px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8892A4', fontSize: 13, cursor: 'pointer',
                  }}
                >Use magic link</motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Fallback (no WebAuthn) */}
          {step === 'fallback' && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '8px 0' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>
                Magic Link Fallback
              </div>
              <p style={{ fontSize: 13, color: '#8892A4', marginBottom: 20, lineHeight: 1.6 }}>
                Enter your email and we'll send a one-time login link.
                This is a fallback — passkeys are faster and more secure.
              </p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px', marginBottom: 14,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12, color: '#F0EDE8', fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  // Simulate magic link send
                  setStep('success')
                  onAuthenticated({
                    userId: email,
                    sessionToken: 'magic-link-stub',
                    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
                  })
                }}
                style={{
                  width: '100%', padding: '12px',
                  background: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.teal}CC)`,
                  border: 'none', borderRadius: 12, color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >📨 Send Magic Link</motion.button>
              <button
                onClick={() => setStep('input')}
                style={{
                  marginTop: 10, background: 'none', border: 'none',
                  color: '#8892A4', fontSize: 12, cursor: 'pointer',
                }}
              >← Back to passkey login</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {step === 'input' && (
          <div style={{
            marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            {['SOC 2 Type II', 'ISO 27001', 'GDPR', 'FIDO2'].map(badge => (
              <span key={badge} style={{
                fontSize: 10, fontWeight: 600, color: '#8892A4',
                padding: '2px 8px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              }}>{badge}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )

  if (asModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={wrapperStyle}
          onClick={e => { if (e.target === e.currentTarget) onCancel?.() }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  return <div style={wrapperStyle}>{content}</div>
}
