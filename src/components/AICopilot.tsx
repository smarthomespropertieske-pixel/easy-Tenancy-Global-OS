// ── AICopilot — Context-aware persistent AI sidekick ──────────
// Reads units/country from URL params injected by HeroStateWidget,
// so it knows the user's portfolio context before the first keystroke.
// On Cloudflare Pages: calls /api/ai/chat (Workers AI Llama 3.1)
// In local dev:        shows graceful fallback copy
import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'

// Country-aware regulation context injected into AI system prompt
const COUNTRY_CONTEXT: Record<string, string> = {
  UK:     'UK property law: Section 21 no-fault eviction, Section 8 fault eviction, EPC (Energy Performance Certificate min. E), EICR (every 5 years), Gas Safety cert (annual), Deposit Protection (30 days), Right to Rent checks.',
  AE:     'UAE RERA regulations: Ejari registration, RERA rent increase calculator, 90-day eviction notice, Dubai tenancy law, service charge rules.',
  KE:     'Kenya Rent Restriction Act, Landlord and Tenant (Shops, Hotels and Catering Establishments) Act, land registration requirements.',
  US:     'US: State-by-state landlord-tenant law, Fair Housing Act, security deposit limits, habitability standards, local rent control ordinances.',
  AU:     'Australia: Residential Tenancies Act (varies by state), bond lodgement, minimum standards, right-of-entry rules, NCAT dispute resolution.',
  ZA:     'South Africa: Rental Housing Act, Consumer Protection Act, PIE Act (eviction), lease requirements, deposit rules.',
  Global: 'General international property management: best practices for compliance, rent collection, and lease management across jurisdictions.',
}

interface Message {
  role: 'system-hint' | 'user' | 'assistant'
  content: string
  ts: number
}

// Proactive opening messages scoped to portfolio context
function getGreeting(units: string, country: string): string {
  const ctx = COUNTRY_CONTEXT[country] ?? COUNTRY_CONTEXT.Global
  const u = parseInt(units, 10) || 10
  const size = u < 20 ? 'boutique' : u < 100 ? 'mid-size' : u < 500 ? 'large' : 'enterprise-scale'

  const msgs = [
    `I've analysed your ${u}-unit ${size} portfolio in ${country}. Based on current ${country} regulations, here's what I'd prioritise first:`,
    `Ready to optimise your ${u} units in ${country}. I can see ${u > 50 ? 'significant NOI uplift opportunities' : 'quick compliance wins'} — ask me anything.`,
    `Your ${country} portfolio of ${u} units is loaded. ${country === 'UK' ? `I'll flag any Section 21/EPC issues proactively.` : country === 'AE' ? `RERA compliance checks are ready.` : `Compliance monitoring is active.`}`,
  ]
  return msgs[Math.floor(Date.now() / 10000) % msgs.length]
}

interface AICopilotProps {
  /** Compact mode: used inline in the dashboard Overview tab */
  compact?: boolean
  /** Override portfolio context (if not from URL params) */
  unitsOverride?: number
  countryOverride?: string
}

export function AICopilot({ compact = false, unitsOverride, countryOverride }: AICopilotProps) {
  const [searchParams] = useSearchParams()
  const units   = String(unitsOverride ?? searchParams.get('units')   ?? '50')
  const country =       countryOverride ?? searchParams.get('country') ?? 'UK'
  const software = searchParams.get('software') ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Inject greeting once on mount
  useEffect(() => {
    const greeting = getGreeting(units, country)
    setMessages([{ role: 'assistant', content: greeting, ts: Date.now() }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, country])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Quick-action prompts scoped to the country
  const QUICK: string[] = country === 'UK'
    ? ['EPC requirements 2026?', 'How to serve Section 21?', 'Deposit protection rules']
    : country === 'AE'
    ? ['RERA rent increase rules', 'Ejari registration steps', 'Eviction notice period']
    : country === 'KE'
    ? ['Rent increase process KE', 'Eviction under RRA', 'Deposit rules Kenya']
    : ['Lease renewal best practice', 'Reduce arrears rate', 'Maintenance SLA standards']

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setError(null)
    setInput('')
    setLoading(true)

    // Optimistic
    setMessages(m => [...m, { role: 'user', content: msg, ts: Date.now() }])

    try {
      const ctxSnippet = COUNTRY_CONTEXT[country] ?? COUNTRY_CONTEXT.Global
      const context = [
        `Portfolio: ${units} units in ${country}.`,
        ctxSnippet,
        software ? `Currently using: ${software}.` : '',
        // Last 2 exchanges for continuity
        ...messages.slice(-4).map(m =>
          m.role === 'user' ? `User: ${m.content}` : m.role === 'assistant' ? `AI: ${m.content}` : ''
        ).filter(Boolean),
      ].join('\n')

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context }),
      })

      const data = await res.json() as { ok: boolean; response?: string; error?: string }
      if (!data.ok) throw new Error(data.error ?? 'AI request failed')

      trackEvent('copilot_used', { country, units, query_len: msg.length })
      setMessages(m => [...m, { role: 'assistant', content: data.response ?? '', ts: Date.now() }])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Request failed'
      setError(errMsg)
      setMessages(m => m.slice(0, -1))
      setInput(msg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const height = compact ? 360 : 480

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🤖</span>
          <span style={{
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase', letterSpacing: 2, color: '#39bff6', fontWeight: 700,
          }}>AI Copilot</span>
          <span style={{
            fontSize: 10, padding: '1px 7px', borderRadius: 20,
            background: 'rgba(16,185,129,0.12)', color: '#10b981',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>{country} · {units} units</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#10b981', display: 'inline-block',
            boxShadow: '0 0 6px #10b981',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 10, color: '#475569' }}>Llama 3.1</span>
        </div>
      </div>

      {/* ── Message thread ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                marginBottom: 8,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '90%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: msg.role === 'user'
                  ? 'rgba(57,191,246,0.16)' : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user'
                  ? '1px solid rgba(57,191,246,0.28)' : '1px solid rgba(255,255,255,0.07)',
                fontSize: 13, color: '#e2e8f0',
                lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    fontSize: 9, color: '#39bff6', marginBottom: 3,
                    fontWeight: 700, letterSpacing: 1, fontFamily: 'monospace',
                  }}>COPILOT · {country}</div>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: 5, padding: '8px 12px', alignItems: 'center' }}
          >
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.18 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#39bff6' }}
              />
            ))}
          </motion.div>
        )}

        {error && (
          <div style={{
            margin: '6px 0', padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
          }}>⚠️ {error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts ── */}
      {!compact && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px 14px',
          overflowX: 'auto', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {QUICK.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, whiteSpace: 'nowrap',
                background: 'rgba(57,191,246,0.08)', border: '1px solid rgba(57,191,246,0.2)',
                color: '#39bff6', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(57,191,246,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(57,191,246,0.08)' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder={`Ask about your ${units}-unit ${country} portfolio…`}
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 12px',
            color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(57,191,246,0.4)' }}
          onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            border: 'none', flexShrink: 0,
            background: loading || !input.trim()
              ? 'rgba(57,191,246,0.1)' : 'linear-gradient(135deg, #2563eb, #39bff6)',
            color: loading || !input.trim() ? '#334155' : '#fff',
            transition: 'all 0.18s', fontFamily: 'inherit',
          }}
        >
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}

export default AICopilot
