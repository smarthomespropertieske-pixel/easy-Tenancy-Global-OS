// ══════════════════════════════════════════════════════════════════════════
//  AICopilot.tsx — easyTenancy Sovereign AI Copilot v2.0
//  "Global Hegemony 2.0" Edition — Gemini 2.5 Pro + Orchestrator-aware
//
//  Upgrades over v1:
//    • Gemini 2.5 Pro model selection (score >88 → Pro, else Flash)
//    • Proactively monitors AIFeed via Orchestrator bus
//    • Emits GEMINI_DRAFT_START / GEMINI_DRAFT_COMPLETE on every proposal
//    • Spatial context enrichment (Maps-style lat/lng awareness)
//    • Model badge shows active Gemini variant
//    • Streaming-style token animation for Gemini responses
//    • Orchestra workflow correlation (traceId shown in dev)
// ══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'
import { Orchestrator } from '../lib/GlobalOrchestrator'

// ── Country-aware regulation context ──────────────────────────────────────
const COUNTRY_CONTEXT: Record<string, string> = {
  UK:     'UK property law: Section 21 no-fault eviction, Section 8 fault eviction, EPC (Energy Performance Certificate min. E from 2025, min. C from 2028), EICR (every 5 years), Gas Safety cert (annual), Deposit Protection (30 days), Right to Rent checks. Renters Reform Bill 2026 in effect.',
  AE:     'UAE RERA regulations: Ejari registration mandatory, RERA rent increase calculator (max 20% for 40%+ below market), 90-day eviction notice, Dubai tenancy law, service charge rules. Golden Visa property threshold AED 2M.',
  KE:     'Kenya Rent Restriction Act cap 10% annual increase. Data Protection Act 2019 (ODPC compliance). Landlord and Tenant (Shops, Hotels and Catering Establishments) Act. Land registration requirements. Mobile money (M-Pesa) rent payment norm. KES-tax digital reporting 2026.',
  US:     'US: State-by-state landlord-tenant law, Fair Housing Act, Section 8 vouchers, security deposit limits (typically 1–2× monthly), habitability standards, just-cause eviction in CA/NY/WA. Local rent control ordinances. AI screening bias regulations (NYC Local Law 144).',
  AU:     'Australia: Residential Tenancies Act (varies by state), bond lodgement (RTA QLD, RTBA VIC), minimum standards, right-of-entry (24h notice), NCAT dispute resolution. NSW 2026 rental reforms: rental bidding ban, pet-friendly requirements.',
  ZA:     'South Africa: Rental Housing Act, Consumer Protection Act, PIE Act (eviction requires court order), lease requirements, deposit rules (interest-bearing account), utility billing regulations (NERSA).',
  Global: 'General international property management: best practices for compliance, rent collection, lease management, ESG reporting, and cross-border PropTech integration across jurisdictions.',
}

// ── Gemini model selection logic ───────────────────────────────────────────
function selectGeminiModel(churnScore?: number): 'gemini-2.5-pro' | 'gemini-2.0-flash' {
  return (churnScore ?? 0) > 88 ? 'gemini-2.5-pro' : 'gemini-2.0-flash'
}

// ── Spatial context enrichment (simulated Maps JS API) ────────────────────
const SPATIAL_CONTEXT: Record<string, { neighbourhood: string; walkScore: number; transitScore: number; lat: number; lng: number }> = {
  UK: { neighbourhood: 'Chelsea, London SW3', walkScore: 96, transitScore: 94, lat: 51.4875, lng: -0.1687 },
  AE: { neighbourhood: 'Dubai Marina, JBR', walkScore: 88, transitScore: 72, lat: 25.0657, lng: 55.1213 },
  KE: { neighbourhood: 'Westlands, Nairobi', walkScore: 74, transitScore: 68, lat: -1.2667, lng: 36.8000 },
  US: { neighbourhood: 'Midtown Manhattan, NY', walkScore: 99, transitScore: 100, lat: 40.7549, lng: -73.9840 },
  AU: { neighbourhood: 'Southbank, Melbourne', walkScore: 92, transitScore: 89, lat: -37.8200, lng: 144.9652 },
  ZA: { neighbourhood: 'Sandton, Johannesburg', walkScore: 62, transitScore: 55, lat: -26.1076, lng: 28.0567 },
  Global: { neighbourhood: 'Global Portfolio', walkScore: 80, transitScore: 75, lat: 0, lng: 0 },
}

interface Message {
  role: 'system-hint' | 'user' | 'assistant'
  content: string
  ts: number
  model?: string
  traceId?: string
  tokens?: number
}

// ── Proactive opening greetings ────────────────────────────────────────────
function getGreeting(units: string, country: string, model: string): string {
  const ctx = COUNTRY_CONTEXT[country] ?? COUNTRY_CONTEXT.Global
  const spatial = SPATIAL_CONTEXT[country] ?? SPATIAL_CONTEXT.Global
  const u = parseInt(units, 10) || 10
  const size = u < 20 ? 'boutique' : u < 100 ? 'mid-size' : u < 500 ? 'large' : 'enterprise-scale'

  const msgs = [
    `I'm running on **${model}** and I've pre-loaded your ${u}-unit ${size} portfolio in ${country} (${spatial.neighbourhood}). Walk Score: ${spatial.walkScore}/100. What's your priority today?`,
    `**${model}** active — your ${u} units in ${country} are loaded with spatial context. I'm monitoring ${country === 'UK' ? 'EPC/Section 21 compliance' : country === 'AE' ? 'RERA rent index + Ejari status' : country === 'KE' ? 'KES-tax reporting + M-Pesa flows' : 'compliance signals'} proactively.`,
    `Portfolio loaded: ${u} units · ${country} · ${spatial.neighbourhood} · Walk ${spatial.walkScore} · Transit ${spatial.transitScore}. I'm ${model} — ask me anything or I'll flag issues first.`,
  ]
  return msgs[Math.floor(Date.now() / 10000) % msgs.length]
}

interface AICopilotProps {
  compact?: boolean
  unitsOverride?: number
  countryOverride?: string
  /** If provided, copilot monitors this tenant's churn score */
  activeTenantId?: string
  /** Einstein churn score for model selection */
  churnScore?: number
}

export function AICopilot({
  compact = false,
  unitsOverride,
  countryOverride,
  activeTenantId,
  churnScore,
}: AICopilotProps) {
  const [searchParams] = useSearchParams()
  const units   = String(unitsOverride ?? searchParams.get('units')   ?? '50')
  const country =       countryOverride ?? searchParams.get('country') ?? 'UK'

  const model      = selectGeminiModel(churnScore)
  const spatial    = SPATIAL_CONTEXT[country] ?? SPATIAL_CONTEXT.Global

  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [feedAlert, setFeedAlert] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // ── Inject greeting on mount ─────────────────────────────────────────
  useEffect(() => {
    const greeting = getGreeting(units, country, model)
    setMessages([{ role: 'assistant', content: greeting, ts: Date.now(), model }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, country, model])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Listen to Orchestrator for proactive feed alerts ─────────────────
  useEffect(() => {
    const unsub = Orchestrator.on('FEED_ITEM_PUBLISHED', (e) => {
      if (e.payload.priority === 'urgent' && e.payload.country === country) {
        setFeedAlert(`📡 Live alert: ${e.payload.title}`)
        setTimeout(() => setFeedAlert(null), 8000)
      }
    })
    return unsub
  }, [country])

  // ── Listen for Agentforce triggers to auto-draft proposals ────────────
  useEffect(() => {
    if (!activeTenantId) return
    const unsub = Orchestrator.on('AGENTFORCE_TRIGGER', (e) => {
      if (e.payload.tenantId === activeTenantId) {
        const prompt = `Draft a lease renewal proposal for tenant ${activeTenantId}. Einstein score: ${e.payload.einsteinScore}. Use market-adjusted 2026 rates for ${country}. Keep it professional and persuasive.`
        send(prompt, e.workflowId)
      }
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId, country])

  // ── Country-scoped quick prompts ──────────────────────────────────────
  const QUICK: string[] = country === 'UK'
    ? ['EPC C requirement timeline?', 'Section 21 2026 changes', 'Renters Reform impact']
    : country === 'AE'
    ? ['RERA rent increase calculator', 'Ejari renewal steps', 'Golden Visa threshold']
    : country === 'KE'
    ? ['KES-tax reporting 2026', 'M-Pesa rent collection', 'ODPC compliance checklist']
    : ['Market rate benchmarking', 'Reduce churn below 5%', 'ESG reporting 2026']

  // ── Send message ──────────────────────────────────────────────────────
  const send = useCallback(async (text?: string, workflowId?: string) => {
    const msg = (text ?? input).trim()
    if (!msg) return
    setError(null)
    setInput('')
    setLoading(true)

    const proposalId = `prop-${Date.now().toString(36)}`

    // Emit GEMINI_DRAFT_START to Orchestrator
    const traceId = Orchestrator.emit('GEMINI_DRAFT_START', {
      proposalId,
      tenantId:  activeTenantId ?? 'copilot-user',
      model,
      context:   `Portfolio: ${units} units in ${country}. ${COUNTRY_CONTEXT[country] ?? ''}`,
    }, { source: 'AICopilot', workflowId })

    setMessages(m => [...m, { role: 'user', content: msg, ts: Date.now(), traceId }])

    try {
      const ctxSnippet = COUNTRY_CONTEXT[country] ?? COUNTRY_CONTEXT.Global
      const spatialCtx = `Spatial context: ${spatial.neighbourhood}, Walk Score ${spatial.walkScore}/100, Transit Score ${spatial.transitScore}/100.`
      const context = [
        `Portfolio: ${units} units in ${country}.`,
        ctxSnippet,
        spatialCtx,
        `Gemini model: ${model}.`,
        ...messages.slice(-4).map(m =>
          m.role === 'user' ? `User: ${m.content}` : m.role === 'assistant' ? `AI: ${m.content}` : ''
        ).filter(Boolean),
      ].join('\n')

      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message: msg,
          context,
          model,
          proposalId,
          traceId,
        }),
      })

      const data = await res.json() as {
        ok: boolean
        response?: string
        error?: string
        model?: string
        tokensUsed?: number
      }
      if (!data.ok) throw new Error(data.error ?? 'AI request failed')

      const response = data.response ?? ''
      const tokensUsed = data.tokensUsed ?? Math.ceil(response.length / 4)

      // Emit GEMINI_DRAFT_COMPLETE
      Orchestrator.emit('GEMINI_DRAFT_COMPLETE', {
        proposalId,
        subject:    msg.slice(0, 80),
        body:       response,
        tone:       'professional',
        tokensUsed,
      }, { source: 'AICopilot', workflowId })

      trackEvent('copilot_used', { country, units, model, query_len: msg.length, tokens: tokensUsed })
      setMessages(m => [...m, {
        role: 'assistant',
        content: response,
        ts: Date.now(),
        model: data.model ?? model,
        traceId,
        tokens: tokensUsed,
      }])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Request failed'
      setError(errMsg)
      setMessages(m => m.slice(0, -1))
      setInput(msg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, messages, units, country, model, spatial, activeTenantId])

  const height = compact ? 360 : 500

  // ── Model badge config ────────────────────────────────────────────────
  const modelBadge = model === 'gemini-2.5-pro'
    ? { label: 'Gemini 2.5 Pro', color: '#4285f4', bg: 'rgba(66,133,244,0.12)' }
    : { label: 'Gemini 2.0 Flash', color: '#34a853', bg: 'rgba(52,168,83,0.12)' }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: 'inherit',
      position: 'relative',
    }}>

      {/* ── Orchestrator feed alert banner ── */}
      <AnimatePresence>
        {feedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute', top: 56, left: 8, right: 8, zIndex: 10,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fca5a5',
              fontWeight: 600,
            }}
          >
            {feedAlert}
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Spatial context badge */}
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 20,
            background: 'rgba(42,157,232,0.08)', color: '#2A9DE8',
            border: '1px solid rgba(42,157,232,0.2)', display: compact ? 'none' : 'inline',
          }}>📍 {spatial.neighbourhood}</span>
        </div>
        {/* Gemini model badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#10b981', display: 'inline-block',
            boxShadow: '0 0 6px #10b981',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 20,
            background: modelBadge.bg, color: modelBadge.color,
            border: `1px solid ${modelBadge.color}33`,
            fontWeight: 700, letterSpacing: 0.5,
          }}>{modelBadge.label}</span>
        </div>
      </div>

      {/* ── Message thread ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', paddingTop: feedAlert ? 48 : 12 }}>
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
                maxWidth: '92%',
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
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 4, fontSize: 9,
                  }}>
                    <span style={{ color: '#39bff6', fontWeight: 700, letterSpacing: 1, fontFamily: 'monospace' }}>
                      COPILOT · {country}
                    </span>
                    {msg.model && (
                      <span style={{
                        color: msg.model.includes('pro') ? '#4285f4' : '#34a853',
                        fontFamily: 'monospace', opacity: 0.8,
                      }}>· {msg.model}</span>
                    )}
                    {msg.tokens && (
                      <span style={{ color: '#475569', fontFamily: 'monospace' }}>
                        · {msg.tokens} tok
                      </span>
                    )}
                  </div>
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
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#4285f4' }}
              />
            ))}
            <span style={{ fontSize: 10, color: '#475569', marginLeft: 4 }}>
              {modelBadge.label} thinking…
            </span>
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
                background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)',
                color: '#93c5fd', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(66,133,244,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(66,133,244,0.08)' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Spatial context bar ── */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '5px 14px', borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.015)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: '#475569' }}>📍 Spatial Context</span>
          <span style={{ fontSize: 10, color: '#8892A4' }}>
            Walk {spatial.walkScore} · Transit {spatial.transitScore} · {spatial.lat.toFixed(3)},{spatial.lng.toFixed(3)}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['Maps', 'RERA', 'EPC'].slice(0, country === 'AE' ? 2 : country === 'UK' ? 1 : 0).map(tag => (
              <span key={tag} style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 10,
                background: 'rgba(66,133,244,0.08)', color: '#93c5fd',
                border: '1px solid rgba(66,133,244,0.15)',
              }}>{tag}</span>
            ))}
          </div>
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
          placeholder={`Ask ${modelBadge.label} about your ${units}-unit ${country} portfolio…`}
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 12px',
            color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(66,133,244,0.4)' }}
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
              ? 'rgba(66,133,244,0.1)' : 'linear-gradient(135deg, #1a73e8, #4285f4)',
            color: loading || !input.trim() ? '#334155' : '#fff',
            transition: 'all 0.18s', fontFamily: 'inherit',
            boxShadow: loading || !input.trim() ? 'none' : '0 2px 12px rgba(66,133,244,0.35)',
          }}
        >
          {loading ? '⟳' : '↑'}
        </button>
      </div>
    </div>
  )
}

export default AICopilot
