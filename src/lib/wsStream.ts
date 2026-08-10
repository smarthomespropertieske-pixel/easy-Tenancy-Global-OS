// ── WebSocket mock for AI feed ────────────────────────────────
export interface AIFeedEvent {
  id: string
  type: 'compliance' | 'collection' | 'maintenance' | 'lease' | 'ai' | 'alert'
  title: string
  detail: string
  property: string
  propertyId: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  deepLink: string
  metric?: string
  color: string
}

const FEED_POOL: Omit<AIFeedEvent, 'id' | 'timestamp'>[] = [
  { type: 'collection', title: 'M-Pesa reconciled', detail: 'KES 45,000 received — Unit 14B auto-matched', property: 'NBI-033', propertyId: 'NBI-033', priority: 'low', deepLink: '/org/demo/properties/NBI-033/collections', metric: 'KES 45K', color: '#10b981' },
  { type: 'compliance', title: 'EPC expiry alert', detail: 'Certificate expires in 30 days — action required', property: 'LDN-247', propertyId: 'LDN-247', priority: 'critical', deepLink: '/org/demo/properties/LDN-247/compliance', metric: '30d left', color: '#ef4444' },
  { type: 'lease', title: 'Lease renewal generated', detail: '+3.2% rent uplift — 12-month term, Flat 3A', property: 'NBI-033', propertyId: 'NBI-033', priority: 'medium', deepLink: '/org/demo/properties/NBI-033/leases', metric: '+3.2%', color: '#39bff6' },
  { type: 'ai', title: 'AI: 48 actions queued', detail: 'Portfolio optimisation across 12 properties → +6.2% NOI', property: 'ALL', propertyId: '', priority: 'medium', deepLink: '/org/demo/ai-copilot', metric: '+6.2% NOI', color: '#a78bfa' },
  { type: 'maintenance', title: 'SLA met — Unit 7C', detail: 'Maintenance resolved in 31 hrs. Tenant satisfaction: 4.9★', property: 'MSA-011', propertyId: 'MSA-011', priority: 'low', deepLink: '/org/demo/properties/MSA-011/maintenance', metric: '31 hrs', color: '#10b981' },
  { type: 'alert', title: 'Arrears escalation', detail: 'Unit 22A — 42-day arrears, notice auto-filed', property: 'LDN-247', propertyId: 'LDN-247', priority: 'high', deepLink: '/org/demo/properties/LDN-247/arrears', metric: '42d', color: '#f59e0b' },
  { type: 'lease', title: 'Tenant pre-qualified', detail: 'Risk score 94/100 in 42s — recommend approval', property: 'DXB-001', propertyId: 'DXB-001', priority: 'low', deepLink: '/org/demo/properties/DXB-001/screening', metric: '94/100', color: '#39bff6' },
  { type: 'compliance', title: 'RERA reg auto-updated', detail: 'Dubai Rental Index Q2 2025 applied to 3 leases', property: 'DXB-001', propertyId: 'DXB-001', priority: 'medium', deepLink: '/org/demo/properties/DXB-001/compliance', metric: '3 leases', color: '#a78bfa' },
  { type: 'collection', title: 'eTIMS receipt generated', detail: 'KES 12,400 — VAT compliant receipt issued', property: 'NBI-033', propertyId: 'NBI-033', priority: 'low', deepLink: '/org/demo/properties/NBI-033/collections', metric: 'KES 12.4K', color: '#10b981' },
  { type: 'ai', title: 'Vacancy prediction', detail: 'Unit 8D likely to vacate in 34 days — pre-marketing started', property: 'LDN-247', propertyId: 'LDN-247', priority: 'medium', deepLink: '/org/demo/properties/LDN-247/vacancies', metric: '34d', color: '#a78bfa' },
  { type: 'lease', title: 'Block renewal — 24 units', detail: 'Lease renewal batch: Block C, avg +3.2% uplift', property: 'MSA-011', propertyId: 'MSA-011', priority: 'medium', deepLink: '/org/demo/properties/MSA-011/leases', metric: '24 units', color: '#39bff6' },
  { type: 'maintenance', title: 'Predictive alert: HVAC', detail: 'Unit 2F — sensor anomaly detected, pre-emptive order placed', property: 'NBI-033', propertyId: 'NBI-033', priority: 'medium', deepLink: '/org/demo/properties/NBI-033/maintenance', metric: 'Pre-empted', color: '#f59e0b' },
]

export function createMockWebSocket(onEvent: (event: AIFeedEvent) => void): () => void {
  let idx = 0
  let stopped = false

  function emit() {
    if (stopped) return
    const template = FEED_POOL[idx % FEED_POOL.length]
    idx++
    const event: AIFeedEvent = {
      ...template,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }
    onEvent(event)
    const delay = 3000 + Math.random() * 4000
    setTimeout(emit, delay)
  }

  // Initial burst of 3 events, then stream
  setTimeout(() => emit(), 600)
  setTimeout(() => { idx = 3; emit() }, 2200)
  setTimeout(() => { idx = 7; emit() }, 4100)

  return () => { stopped = true }
}
