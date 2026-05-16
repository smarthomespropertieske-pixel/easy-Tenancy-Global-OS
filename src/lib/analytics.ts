// ── Analytics instrumentation — production-grade ─────────────
type EventName =
  | 'page_view'
  | 'feature_clicked'
  | 'roi_engaged'
  | 'demo_started'
  | 'compliance_panel_opened'
  | 'micro_tour_started'
  | 'micro_tour_completed'
  | 'ai_feed_clicked'
  | 'radial_node_clicked'
  | 'waitlist_submitted'
  | 'cta_clicked'
  | 'pricing_toggled'
  | 'metrics_viewed'
  | 'deep_link_activated'
  | 'property_viewed'
  | 'section_navigated'
  | 'notice_generated'
  | 'demo_cta_clicked'

interface EventPayload {
  [key: string]: string | number | boolean | undefined
}

interface QueuedEvent {
  name: EventName
  payload: EventPayload
  ts: number
  session: string
  url: string
}

// ── Session ID (persisted per tab) ─────────────────────────────
function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('et_sid')
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      sessionStorage.setItem('et_sid', id)
    }
    return id
  } catch {
    return `s_${Date.now().toString(36)}`
  }
}

const SESSION_ID = getSessionId()
const queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false

// ── Flush logic ────────────────────────────────────────────────
async function flush() {
  if (queue.length === 0 || flushing) return
  flushing = true
  const batch = queue.splice(0, queue.length) // drain atomically

  if (import.meta.env.DEV) {
    // Dev: pretty-print to console
    console.groupCollapsed(`%c[Analytics] ${batch.length} event(s)`, 'color:#39bff6;font-weight:600')
    batch.forEach(e => console.log(`  %c${e.name}`, 'color:#a78bfa', e.payload))
    console.groupEnd()
    flushing = false
    return
  }

  // Production: POST to /api/analytics with retry
  try {
    const res = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': SESSION_ID,
      },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    })
    if (!res.ok) {
      // Re-queue on server error (max 2 retries, don't re-queue 4xx)
      if (res.status >= 500 && batch[0]?._retries === undefined) {
        batch.forEach(e => { (e as any)._retries = ((e as any)._retries ?? 0) + 1 })
        if ((batch[0] as any)._retries < 3) queue.unshift(...batch)
      }
    }
  } catch {
    // Network offline — re-queue silently (max 3 attempts)
    const retries = (batch[0] as any)?._retries ?? 0
    if (retries < 3) {
      batch.forEach(e => { (e as any)._retries = retries + 1 })
      queue.unshift(...batch)
    }
  } finally {
    flushing = false
  }
}

// ── Flush on page unload via sendBeacon ────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (queue.length === 0) return
    const body = JSON.stringify({ events: queue.splice(0) })
    try {
      navigator.sendBeacon('/api/analytics', body)
    } catch {
      // sendBeacon not available — ignore
    }
  })
}

// ── Public API ─────────────────────────────────────────────────
export function trackEvent(name: EventName, payload: EventPayload = {}) {
  const event: QueuedEvent = {
    name,
    payload,
    ts: Date.now(),
    session: SESSION_ID,
    url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
  }
  queue.push(event)
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, 500)
}

export function trackPageView(path: string) {
  trackEvent('page_view', {
    path,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : '',
  })
}

// ── Flush immediately (e.g. before navigation) ─────────────────
export function flushNow() {
  if (flushTimer) clearTimeout(flushTimer)
  flush()
}
