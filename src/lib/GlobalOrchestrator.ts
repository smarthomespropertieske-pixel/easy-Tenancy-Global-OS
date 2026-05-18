// ═══════════════════════════════════════════════════════════════════════════
//  GlobalOrchestrator.ts — easyTenancy Sovereign Economic OS
//  "Global Hegemony 2.0" Agentic Workflow Engine
//
//  Architecture: Event-driven pub/sub bus connecting all 14 live components
//  via typed events. Each component publishes and subscribes independently —
//  zero circular dependencies, full tree-shaking compatibility.
//
//  Holy Trinity orchestration:
//    Google  (Gemini 3.5 Pro)  → Reasoning + spatial context
//    Salesforce (Agentforce)   → Agentic economy + Einstein scores
//    Meta    (Presence SDK)    → Immersive 3D WebXR transitions
//
//  Autonomous Revenue Engine stages:
//    DETECT  → ActionableIntelligence spots high-value churn signal
//    DRAFT   → AICopilot routes to Gemini for proposal synthesis
//    STAGE   → SpatialStaging renders custom AR walkthrough via Novita GPU
//    SIGN    → WebAuthnLogin gates biometric smart-contract signature
//    CAPTURE → MetricsTicker logs success fee + updates HeroStateWidget
// ═══════════════════════════════════════════════════════════════════════════

// ── Event catalog ─────────────────────────────────────────────────────────
export type OrchestratorEventType =
  // Salesforce / Einstein layer
  | 'CHURN_DETECTED'          // ActionableIntelligence → high-value lead
  | 'AGENTFORCE_TRIGGER'      // Autonomous Negotiator activated
  | 'EINSTEIN_SCORE_UPDATE'   // Score refreshed from SF backend
  | 'LEASE_RENEWAL_INITIATED' // Renewal workflow started
  // Google / Gemini layer
  | 'GEMINI_DRAFT_START'      // AICopilot begin proposal synthesis
  | 'GEMINI_DRAFT_COMPLETE'   // Proposal ready
  | 'SPATIAL_CONTEXT_READY'   // Maps JS API location enrichment done
  // Meta / WebXR layer
  | 'AR_WALKTHROUGH_TRIGGERED'// SpatialStaging → Novita GPU render
  | 'AR_RENDER_COMPLETE'      // Asset ready for WebXR teleportation
  | 'XR_SESSION_STARTED'      // User entered WebXR mode
  | 'XR_SESSION_ENDED'
  // Auth / Security layer
  | 'WEBAUTHN_GATE_OPEN'      // Biometric check cleared
  | 'WEBAUTHN_GATE_FAIL'
  | 'CONTRACT_SIGNED'         // Smart-contract signature confirmed
  // Revenue layer
  | 'SUCCESS_FEE_CAPTURED'    // MetricsTicker logs revenue event
  | 'ARR_MILESTONE_HIT'       // $1.345B ARR milestone crossed
  | 'HERO_STATE_UPDATED'      // HeroStateWidget refreshed
  // Compliance layer
  | 'JURISDICTION_DETECTED'   // ComplianceEngine classified IP
  | 'COMPLIANCE_ALERT'        // Rule violation flagged
  | 'COMPLIANCE_CLEARED'
  // Infra / system
  | 'METRICS_TICK'            // MetricsTicker heartbeat (every 30s)
  | 'FEED_ITEM_PUBLISHED'     // AIFeed new item
  | 'RADIAL_MAP_CLICK'        // RadialMap node selected
  | 'ROI_CALC_UPDATED'        // ROI proposal regenerated
  | 'TOUR_STEP_COMPLETE'      // FeatureMicroTour step finished

// ── Typed event payload map ────────────────────────────────────────────────
export interface OrchestratorPayloads {
  CHURN_DETECTED: {
    tenantId: string
    tenantName: string
    score: number
    unit: string
    country: string
    leaseValue: number
    currency: string
    daysToLeaseEnd: number
  }
  AGENTFORCE_TRIGGER: {
    workflowId: string
    tenantId: string
    action: 'renewal' | 'retention' | 'upsell'
    einsteinScore: number
  }
  EINSTEIN_SCORE_UPDATE: {
    tenantId: string
    oldScore: number
    newScore: number
    delta: number
  }
  LEASE_RENEWAL_INITIATED: {
    tenantId: string
    proposalId: string
    marketRate: number
    currency: string
  }
  GEMINI_DRAFT_START: {
    tenantId: string
    proposalId: string
    model: 'gemini-2.0-flash' | 'gemini-2.5-pro'
    context: string
  }
  GEMINI_DRAFT_COMPLETE: {
    proposalId: string
    subject: string
    body: string
    tone: string
    tokensUsed: number
  }
  SPATIAL_CONTEXT_READY: {
    tenantId: string
    lat: number
    lng: number
    placeId: string
    neighbourhood: string
    walkScore: number
    transitScore: number
  }
  AR_WALKTHROUGH_TRIGGERED: {
    propertyId: string
    style: string
    novitaModel: 'flux-dev' | 'sdxl' | 'flux-schnell'
    referenceImageUrl?: string
  }
  AR_RENDER_COMPLETE: {
    propertyId: string
    imageUrl: string
    renderMs: number
    model: string
  }
  XR_SESSION_STARTED: { propertyId: string; deviceType: string }
  XR_SESSION_ENDED:   { propertyId: string; durationMs: number }
  WEBAUTHN_GATE_OPEN: { userId: string; credentialId: string; method: string }
  WEBAUTHN_GATE_FAIL: { reason: string; attempt: number }
  CONTRACT_SIGNED: {
    contractId: string
    tenantId: string
    proposalId: string
    signatureTs: string
    biometricMethod: string
  }
  SUCCESS_FEE_CAPTURED: {
    feeId: string
    contractId: string
    amount: number
    currency: string
    feePercentage: number
    portfolioCountry: string
  }
  ARR_MILESTONE_HIT: {
    milestone: number   // e.g. 1_345_000_000
    totalARR: number
    growthRate: number
    ts: string
  }
  HERO_STATE_UPDATED: {
    activeUnits: number
    totalManagers: number
    countries: number
    arrUSD: number
  }
  JURISDICTION_DETECTED: {
    ip: string
    country: string
    region: string
    regime: 'GDPR' | 'CCPA' | 'KES' | 'PDPA' | 'POPIA' | 'generic'
    riskLevel: 'low' | 'medium' | 'high'
  }
  COMPLIANCE_ALERT: {
    ruleId: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    jurisdiction: string
    description: string
    remediation: string
  }
  COMPLIANCE_CLEARED: { ruleId: string; jurisdiction: string }
  METRICS_TICK: {
    activeUnits: number
    totalManagers: number
    leases: number
    countries: number
    arrUSD: number
    tickMs: number
  }
  FEED_ITEM_PUBLISHED: {
    id: string
    type: 'lead' | 'renewal' | 'alert' | 'market' | 'ai'
    title: string
    body: string
    country: string
    priority: 'urgent' | 'normal' | 'low'
  }
  RADIAL_MAP_CLICK: {
    nodeId: string
    country: string
    unitCount: number
    revenue: number
  }
  ROI_CALC_UPDATED: {
    proposalId: string
    noi: number
    capRate: number
    irr: number
    paybackYears: number
    marketAdjusted: boolean
  }
  TOUR_STEP_COMPLETE: { tourId: string; step: number; totalSteps: number }
}

// ── Generic event envelope ────────────────────────────────────────────────
export interface OrchestratorEvent<T extends OrchestratorEventType = OrchestratorEventType> {
  type: T
  payload: T extends keyof OrchestratorPayloads ? OrchestratorPayloads[T] : Record<string, unknown>
  ts: number         // Unix ms timestamp
  source: string     // Component name that emitted
  traceId: string    // End-to-end correlation ID
  workflowId?: string
}

type Listener<T extends OrchestratorEventType> = (
  event: OrchestratorEvent<T>
) => void | Promise<void>

// ── Event history (last N events per type, ring buffer) ───────────────────
const HISTORY_LIMIT = 50

// ── Core bus ──────────────────────────────────────────────────────────────
class GlobalOrchestratorBus {
  private listeners = new Map<string, Set<Listener<OrchestratorEventType>>>()
  private history:   OrchestratorEvent[] = []
  private workflows: Map<string, WorkflowState> = new Map()

  // ── Subscribe ───────────────────────────────────────────────────
  on<T extends OrchestratorEventType>(
    type: T,
    listener: Listener<T>
  ): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener as Listener<OrchestratorEventType>)
    // Return unsubscribe function
    return () => this.off(type, listener)
  }

  // Subscribe to multiple events
  onMany<T extends OrchestratorEventType>(
    types: T[],
    listener: Listener<T>
  ): () => void {
    const unsubs = types.map(t => this.on(t, listener))
    return () => unsubs.forEach(u => u())
  }

  // ── Unsubscribe ─────────────────────────────────────────────────
  off<T extends OrchestratorEventType>(type: T, listener: Listener<T>): void {
    this.listeners.get(type)?.delete(listener as Listener<OrchestratorEventType>)
  }

  // ── Emit ────────────────────────────────────────────────────────
  emit<T extends OrchestratorEventType>(
    type: T,
    payload: OrchestratorEvent<T>['payload'],
    meta?: { source?: string; workflowId?: string }
  ): string {
    const traceId = `et-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const event: OrchestratorEvent<T> = {
      type,
      payload,
      ts:         Date.now(),
      source:     meta?.source     ?? 'unknown',
      traceId,
      workflowId: meta?.workflowId,
    }

    // Ring buffer
    this.history.push(event as OrchestratorEvent)
    if (this.history.length > HISTORY_LIMIT) this.history.shift()

    // Notify listeners (async, non-blocking)
    const set = this.listeners.get(type)
    if (set) {
      set.forEach(fn => {
        try {
          const result = fn(event as OrchestratorEvent<OrchestratorEventType>)
          if (result instanceof Promise) result.catch(console.error)
        } catch (err) {
          console.error(`[Orchestrator] Listener error on ${type}:`, err)
        }
      })
    }

    if (import.meta.env.DEV) {
      console.groupCollapsed(`🎯 [Orchestrator] ${type} ← ${meta?.source ?? '?'}`)
      console.log('Trace:', traceId)
      console.log('Payload:', payload)
      console.groupEnd()
    }

    return traceId
  }

  // ── History ─────────────────────────────────────────────────────
  getHistory(type?: OrchestratorEventType): OrchestratorEvent[] {
    return type ? this.history.filter(e => e.type === type) : [...this.history]
  }

  // ── Workflow state machine ────────────────────────────────────────
  startWorkflow(tenantId: string, leadScore: number): string {
    const workflowId = `wf-${Date.now().toString(36)}-${tenantId.slice(-4)}`
    this.workflows.set(workflowId, {
      id:       workflowId,
      tenantId,
      stage:    'DETECT',
      score:    leadScore,
      startedAt: Date.now(),
      log:      [],
    })
    return workflowId
  }

  advanceWorkflow(workflowId: string, stage: WorkflowStage, note?: string): void {
    const wf = this.workflows.get(workflowId)
    if (!wf) return
    wf.stage = stage
    wf.log.push({ stage, ts: Date.now(), note })
    this.workflows.set(workflowId, wf)
  }

  getWorkflow(workflowId: string): WorkflowState | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): WorkflowState[] {
    return Array.from(this.workflows.values()).sort((a, b) => b.startedAt - a.startedAt)
  }
}

// ── Workflow types ─────────────────────────────────────────────────────────
export type WorkflowStage = 'DETECT' | 'DRAFT' | 'STAGE' | 'SIGN' | 'CAPTURE' | 'COMPLETE' | 'FAILED'

export interface WorkflowState {
  id:        string
  tenantId:  string
  stage:     WorkflowStage
  score:     number
  startedAt: number
  proposalId?: string
  contractId?: string
  feeAmount?:  number
  log:       Array<{ stage: WorkflowStage; ts: number; note?: string }>
}

// ── Singleton export ───────────────────────────────────────────────────────
export const Orchestrator = new GlobalOrchestratorBus()

// ── Holy Trinity Revenue Engine hooks ─────────────────────────────────────
// Wires the autonomous churn → draft → sign → capture pipeline on init.
// Call once from main.tsx (or lazy-init on first /app/demo visit).

export function initRevenueEngine(): () => void {
  const unsubs: Array<() => void> = []

  // ① Einstein detects churn → start workflow + trigger Agentforce
  unsubs.push(
    Orchestrator.on('CHURN_DETECTED', (e) => {
      const { tenantId, score, leaseValue, country } = e.payload
      if (score < 75) return // Only high-value leads

      const workflowId = Orchestrator.startWorkflow(tenantId, score)
      Orchestrator.advanceWorkflow(workflowId, 'DETECT', `Score ${score} — Agentforce triggered`)

      Orchestrator.emit('AGENTFORCE_TRIGGER', {
        workflowId,
        tenantId,
        action:        'renewal',
        einsteinScore: score,
      }, { source: 'ActionableIntelligence', workflowId })

      // Concurrently request spatial context from Maps API
      Orchestrator.emit('GEMINI_DRAFT_START', {
        proposalId: `prop-${Date.now().toString(36)}`,
        tenantId,
        model:      score > 88 ? 'gemini-2.5-pro' : 'gemini-2.0-flash',
        context:    `Tenant ${tenantId} in ${country}, lease value ${leaseValue}, churn score ${score}`,
      }, { source: 'AICopilot', workflowId })
    })
  )

  // ② Gemini draft complete → trigger Novita AR render
  unsubs.push(
    Orchestrator.on('GEMINI_DRAFT_COMPLETE', (e) => {
      const wfs = Orchestrator.getAllWorkflows().find(
        w => w.proposalId === e.payload.proposalId || w.stage === 'DETECT'
      )
      if (wfs) {
        Orchestrator.advanceWorkflow(wfs.id, 'DRAFT', `Proposal ${e.payload.proposalId} ready`)
        Orchestrator.emit('AR_WALKTHROUGH_TRIGGERED', {
          propertyId:       wfs.tenantId,
          style:            'photorealistic-2026',
          novitaModel:      'flux-dev',
        }, { source: 'SpatialStaging', workflowId: wfs.id })
      }
    })
  )

  // ③ AR render complete → open WebAuthn gate
  unsubs.push(
    Orchestrator.on('AR_RENDER_COMPLETE', (e) => {
      const wf = Orchestrator.getAllWorkflows().find(w => w.tenantId === e.payload.propertyId)
      if (wf) {
        Orchestrator.advanceWorkflow(wf.id, 'STAGE', `AR asset ready (${e.payload.renderMs}ms)`)
        Orchestrator.emit('WEBAUTHN_GATE_OPEN', {
          userId:       wf.tenantId,
          credentialId: `cred-${Date.now().toString(36)}`,
          method:       'touch-id',
        }, { source: 'WebAuthnLogin', workflowId: wf.id })
      }
    })
  )

  // ④ Contract signed → capture success fee
  unsubs.push(
    Orchestrator.on('CONTRACT_SIGNED', (e) => {
      const wf = Orchestrator.getWorkflow(e.payload.proposalId) ??
        Orchestrator.getAllWorkflows().find(w => w.tenantId === e.payload.tenantId)
      if (wf) {
        Orchestrator.advanceWorkflow(wf.id, 'SIGN', 'Biometric contract signed')
        const feeAmount = (wf.score / 100) * 2500 // Success fee calc
        Orchestrator.emit('SUCCESS_FEE_CAPTURED', {
          feeId:              `fee-${Date.now().toString(36)}`,
          contractId:         e.payload.contractId,
          amount:             feeAmount,
          currency:           'USD',
          feePercentage:      2.5,
          portfolioCountry:   'GLOBAL',
        }, { source: 'MetricsTicker', workflowId: wf.id })
      }
    })
  )

  // ⑤ Fee captured → update HeroStateWidget + check ARR milestones
  const ARR_MILESTONES = [500_000_000, 1_000_000_000, 1_345_000_000, 2_000_000_000]
  let totalARR = 0

  unsubs.push(
    Orchestrator.on('SUCCESS_FEE_CAPTURED', (e) => {
      const wf = Orchestrator.getAllWorkflows().find(w => w.stage === 'SIGN')
      if (wf) Orchestrator.advanceWorkflow(wf.id, 'CAPTURE', `Fee $${e.payload.amount}`)

      totalARR += e.payload.amount * 12 * 52_400 // Annualised across portfolio

      // HeroState update
      Orchestrator.emit('HERO_STATE_UPDATED', {
        activeUnits:    892_000 + Math.floor(totalARR / 1_000),
        totalManagers:  52_400  + Math.floor(totalARR / 100_000),
        countries:      120,
        arrUSD:         totalARR,
      }, { source: 'HeroStateWidget' })

      // Milestone check
      for (const m of ARR_MILESTONES) {
        if (totalARR >= m && totalARR - (e.payload.amount * 12 * 52_400) < m) {
          Orchestrator.emit('ARR_MILESTONE_HIT', {
            milestone:  m,
            totalARR,
            growthRate: 0.34,
            ts:         new Date().toISOString(),
          }, { source: 'MetricsTicker' })
        }
      }

      // Mark workflow complete
      const completedWf = Orchestrator.getAllWorkflows().find(w => w.stage === 'CAPTURE')
      if (completedWf) Orchestrator.advanceWorkflow(completedWf.id, 'COMPLETE')
    })
  )

  // Return cleanup function
  return () => unsubs.forEach(u => u())
}

// ── Convenience helpers ────────────────────────────────────────────────────

/** Emit a churn detection from ActionableIntelligence data */
export function detectChurn(
  tenantId: string,
  tenantName: string,
  score: number,
  options: { unit: string; country: string; leaseValue: number; currency: string; daysToLeaseEnd: number }
): string {
  return Orchestrator.emit('CHURN_DETECTED', {
    tenantId,
    tenantName,
    score,
    ...options,
  }, { source: 'ActionableIntelligence' })
}

/** Update ROI calculator with market-adjusted data */
export function updateROI(
  proposalId: string,
  data: { noi: number; capRate: number; irr: number; paybackYears: number }
): void {
  Orchestrator.emit('ROI_CALC_UPDATED', {
    proposalId,
    ...data,
    marketAdjusted: true,
  }, { source: 'ROICalculator' })
}

/** Mark a compliance jurisdiction */
export function detectJurisdiction(
  ip: string,
  country: string,
  region: string
): void {
  const REGIME_MAP: Record<string, 'GDPR' | 'CCPA' | 'KES' | 'PDPA' | 'POPIA' | 'generic'> = {
    GB: 'GDPR', DE: 'GDPR', FR: 'GDPR', IT: 'GDPR', NL: 'GDPR', SE: 'GDPR',
    US: 'CCPA',
    KE: 'KES',
    TH: 'PDPA', SG: 'PDPA',
    ZA: 'POPIA',
  }
  Orchestrator.emit('JURISDICTION_DETECTED', {
    ip,
    country,
    region,
    regime:    REGIME_MAP[country.toUpperCase()] ?? 'generic',
    riskLevel: ['KE', 'NG', 'GH'].includes(country.toUpperCase()) ? 'high' : 'low',
  }, { source: 'ComplianceEngine' })
}
