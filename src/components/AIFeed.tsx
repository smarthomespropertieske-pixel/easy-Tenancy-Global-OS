import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIFeed } from '../hooks'
import { trackEvent } from '../lib/analytics'
import { useNavigate } from 'react-router-dom'
import type { AIFeedEvent } from '../lib/wsStream'

const TYPE_ICONS: Record<string, string> = {
  compliance: '⚖️', collection: '💰', maintenance: '🔧',
  lease: '📋', ai: '🤖', alert: '🚨'
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'LOW', medium: 'MED', high: 'HIGH', critical: 'CRIT'
}

export default function AIFeed() {
  const events = useAIFeed(8)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  const handleClick = (evt: AIFeedEvent) => {
    trackEvent('ai_feed_clicked', {
      event_id: evt.id,
      type: evt.type,
      property: evt.propertyId,
      deep_link: evt.deepLink
    })
    navigate(evt.deepLink)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>LIVE AI ACTIVITY FEED</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, padding: '1px 6px' }}>
            WebSocket
          </span>
        </div>
        <button
          onClick={() => setPaused(p => !p)}
          style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Feed list */}
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 380 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              layout
              initial={{ opacity: 0, x: -18, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => !paused && handleClick(evt)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${evt.color}22`,
                borderLeft: `3px solid ${evt.color}`,
                borderRadius: 12,
                cursor: paused ? 'default' : 'pointer',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              whileHover={!paused ? { background: 'rgba(255,255,255,0.07)', boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${evt.color}33` } : {}}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${evt.color}15`, border: `1px solid ${evt.color}30`, fontSize: 16
              }}>
                {TYPE_ICONS[evt.type] ?? '📡'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{evt.title}</span>
                  {evt.metric && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: evt.color, background: `${evt.color}15`, borderRadius: 4, padding: '1px 6px' }}>
                      {evt.metric}
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: evt.priority === 'critical' ? '#ef4444' : evt.priority === 'high' ? '#f59e0b' : 'var(--text3)',
                    marginLeft: 'auto'
                  }}>
                    {PRIORITY_LABELS[evt.priority]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, lineHeight: 1.5 }}>{evt.detail}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {evt.propertyId && <><span style={{ color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{evt.propertyId}</span> · </>}
                    {evt.timestamp.toLocaleTimeString()}
                  </span>
                  {!paused && (
                    <span style={{ fontSize: 11, color: 'var(--blue)', marginLeft: 'auto', fontWeight: 600 }}>
                      View details →
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
            <div style={{ fontSize: 14 }}>Connecting to AI stream…</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
        <span>{events.length} events · streaming live</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>ws://ai.easytenancy.co/feed</span>
      </div>
    </div>
  )
}
