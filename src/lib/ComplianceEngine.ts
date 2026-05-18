// ══════════════════════════════════════════════════════════════════════════
//  ComplianceEngine.ts — easyTenancy Sovereign Compliance Layer
//  "Global Hegemony 2.0" — Jurisdiction-aware, IP-intelligence-driven
//
//  Features:
//    • Cloudflare IP Intelligence integration (CF-IPCountry header)
//    • GDPR / CCPA / KES / PDPA / POPIA automatic regime detection
//    • Per-jurisdiction rule engine with severity scoring
//    • Orchestrator integration: emits JURISDICTION_DETECTED + COMPLIANCE_ALERT
//    • CompliancePanel adapter: real-time rule status for UI consumption
//    • Post-quantum JWT signing awareness (P-384 ECDSA → CRYSTALS-Dilithium roadmap)
// ══════════════════════════════════════════════════════════════════════════

import { Orchestrator, detectJurisdiction } from './GlobalOrchestrator'

// ── Privacy regime definitions ─────────────────────────────────────────────
export type PrivacyRegime = 'GDPR' | 'CCPA' | 'KES' | 'PDPA' | 'POPIA' | 'generic'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface ComplianceRule {
  id:           string
  regime:       PrivacyRegime
  title:        string
  description:  string
  severity:     Severity
  jurisdiction: string
  remediation:  string
  deadline?:    string    // ISO date
  link?:        string    // Official guidance URL
  active:       boolean   // Currently triggered?
}

// ── Country → regime mapping ───────────────────────────────────────────────
const COUNTRY_REGIME: Record<string, PrivacyRegime> = {
  // GDPR zone
  GB: 'GDPR', DE: 'GDPR', FR: 'GDPR', IT: 'GDPR', ES: 'GDPR', NL: 'GDPR',
  SE: 'GDPR', NO: 'GDPR', FI: 'GDPR', DK: 'GDPR', PL: 'GDPR', IE: 'GDPR',
  PT: 'GDPR', AT: 'GDPR', BE: 'GDPR', CH: 'GDPR', // Swiss equivalent
  // CCPA
  US: 'CCPA',
  // Kenya Data Protection Act 2019 (KES = Kenya regime)
  KE: 'KES',
  // PDPA (Thailand / Singapore)
  TH: 'PDPA', SG: 'PDPA',
  // POPIA
  ZA: 'POPIA',
  // UAE = generic (DIFC follows GDPR principles for DIFC-registered entities)
  AE: 'generic',
}

// ── Rule database ──────────────────────────────────────────────────────────
export const COMPLIANCE_RULES: ComplianceRule[] = [
  // ── GDPR rules ─────────────────────────────────────────────────────────
  {
    id: 'gdpr-dpa-001',
    regime: 'GDPR',
    title: 'Data Processing Agreement required',
    description: 'All third-party processors handling tenant PII (Salesforce, Google Maps, Meta APIs) must have a signed DPA with SCCs for non-EEA transfers.',
    severity: 'critical',
    jurisdiction: 'EU/UK',
    remediation: 'Execute DPAs with Salesforce (SF DPA 2024), Google (GAC 2.0), and Meta (GDPR addendum). Review SCCs for US transfers post-Schrems II.',
    deadline: '2026-01-01',
    link: 'https://gdpr.eu/data-processing-agreement/',
    active: false,
  },
  {
    id: 'gdpr-rt-001',
    regime: 'GDPR',
    title: 'Right to Erasure (Article 17)',
    description: 'Tenants can request deletion of all personal data. System must honour erasure within 30 days. AI model training data must also be purged.',
    severity: 'high',
    jurisdiction: 'EU/UK',
    remediation: 'Implement /api/privacy/erasure endpoint. Purge from D1, KV, and Salesforce CRM. Submit erasure request to Gemini training data team.',
    active: false,
  },
  {
    id: 'gdpr-ai-001',
    regime: 'GDPR',
    title: 'AI Act Article 22 — Automated Decision Making',
    description: 'Einstein churn scores and Agentforce decisions that affect lease terms require human review and explainability disclosure to tenants.',
    severity: 'high',
    jurisdiction: 'EU',
    remediation: 'Add "How this score was calculated" disclosure to all churn score UI. Route decisions >85 score through human Compliance Officer queue.',
    deadline: '2026-08-02',
    active: false,
  },
  {
    id: 'gdpr-cookie-001',
    regime: 'GDPR',
    title: 'Cookie Consent (ePrivacy Directive)',
    description: 'Google Maps JS API, Meta Presence SDK, and analytics scripts require explicit opt-in consent before loading.',
    severity: 'medium',
    jurisdiction: 'EU/UK',
    remediation: 'Implement consent management (CMP) before any third-party script loads. Use Cloudflare Consent Manager or OneTrust.',
    active: false,
  },

  // ── CCPA rules ──────────────────────────────────────────────────────────
  {
    id: 'ccpa-opt-001',
    regime: 'CCPA',
    title: 'Do Not Sell / Share opt-out',
    description: 'California residents must have a prominent "Do Not Sell My Personal Information" link. Einstein Salesforce sharing must respect this signal.',
    severity: 'high',
    jurisdiction: 'US-CA',
    remediation: 'Add DNSMI link to footer. Wire opt-out to Salesforce consent API. Block Meta data sharing for opted-out users.',
    active: false,
  },
  {
    id: 'ccpa-dsrp-001',
    regime: 'CCPA',
    title: 'Data Subject Rights Portal',
    description: 'CCPA requires a 12-month look-back period for data access requests. Response within 45 days.',
    severity: 'medium',
    jurisdiction: 'US',
    remediation: 'Build /privacy/request portal. Export from D1 + Salesforce. Respond within 45 days. Log all requests.',
    active: false,
  },

  // ── KES (Kenya) rules ────────────────────────────────────────────────────
  {
    id: 'kes-odpc-001',
    regime: 'KES',
    title: 'ODPC Data Controller Registration',
    description: 'Kenya Data Protection Act 2019: any entity processing personal data of Kenyan residents must register with the Office of the Data Protection Commissioner.',
    severity: 'critical',
    jurisdiction: 'KE',
    remediation: 'Complete ODPC registration at odpc.go.ke. Appoint a Kenya-based Data Protection Officer (DPO). Annual compliance report due.',
    deadline: '2026-03-31',
    link: 'https://www.odpc.go.ke/registration/',
    active: false,
  },
  {
    id: 'kes-tax-001',
    regime: 'KES',
    title: 'KES Digital Tax Reporting 2026',
    description: 'Kenya Revenue Authority mandates digital reporting of all rental income transactions above KES 50,000/month via iTax portal. AI-generated rent receipts must include KRA PIN.',
    severity: 'high',
    jurisdiction: 'KE',
    remediation: 'Integrate iTax API for automated monthly filing. Add KRA PIN to all generated receipts. Enable M-Pesa transaction reconciliation.',
    deadline: '2026-01-01',
    active: false,
  },
  {
    id: 'kes-mpesa-001',
    regime: 'KES',
    title: 'M-Pesa Transaction Audit Trail',
    description: 'All M-Pesa rent payments must be reconciled against lease records within 24 hours. Daraja API receipts stored for 7 years.',
    severity: 'medium',
    jurisdiction: 'KE',
    remediation: 'Implement Daraja API webhook to auto-reconcile payments. Store STK push receipts in D1 with 7-year TTL.',
    active: false,
  },

  // ── PDPA rules ───────────────────────────────────────────────────────────
  {
    id: 'pdpa-consent-001',
    regime: 'PDPA',
    title: 'Purpose Limitation (Singapore PDPA)',
    description: 'Personal data collected for lease management cannot be used for AI model training without separate, specific consent.',
    severity: 'high',
    jurisdiction: 'SG/TH',
    remediation: 'Separate consent collection for (a) lease management, (b) AI personalisation, (c) marketing. Update privacy policy.',
    active: false,
  },

  // ── POPIA rules ──────────────────────────────────────────────────────────
  {
    id: 'popia-io-001',
    regime: 'POPIA',
    title: 'Information Officer Registration (POPIA)',
    description: 'South Africa POPIA: Responsible Party must register an Information Officer with the Information Regulator within 1 month of commencing processing.',
    severity: 'critical',
    jurisdiction: 'ZA',
    remediation: 'Register IO at inforegulator.org.za. Submit PAIA manual. Complete annual compliance audit.',
    active: false,
  },
]

// ── Jurisdiction detection from CF headers ────────────────────────────────
export interface JurisdictionContext {
  country:       string
  region:        string
  regime:        PrivacyRegime
  rules:         ComplianceRule[]
  riskScore:     number    // 0-100
  alertCount:    number
  gdprApplies:   boolean
  taxReporting:  boolean
}

export function detectFromHeaders(headers: Record<string, string | undefined>): JurisdictionContext {
  // Cloudflare injects CF-IPCountry, CF-IPCity, CF-IPContinent
  const cfCountry = (headers['cf-ipcountry'] ?? headers['x-country'] ?? 'US').toUpperCase()
  const cfRegion  = headers['cf-region'] ?? headers['x-region'] ?? ''

  return buildContext(cfCountry, cfRegion)
}

export function detectFromBrowser(): JurisdictionContext {
  // Fallback: use browser locale / timezone
  const tz       = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  const locale   = navigator.language ?? 'en-US'

  const TZ_COUNTRY: Record<string, string> = {
    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Stockholm': 'SE',
    'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
    'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
    'Asia/Dubai': 'AE', 'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  }

  const country = TZ_COUNTRY[tz] ?? locale.split('-')[1]?.toUpperCase() ?? 'US'
  return buildContext(country, tz)
}

function buildContext(country: string, region: string): JurisdictionContext {
  const regime = COUNTRY_REGIME[country] ?? 'generic'
  const rules  = COMPLIANCE_RULES.filter(r => r.regime === regime || r.regime === 'generic').slice(0, 6)
  const criticalCount = rules.filter(r => r.severity === 'critical').length
  const highCount     = rules.filter(r => r.severity === 'high').length
  const riskScore     = Math.min(100, criticalCount * 35 + highCount * 20)

  // Emit to Orchestrator
  try {
    detectJurisdiction('browser', country, region)
  } catch { /* ignore during SSR */ }

  return {
    country,
    region,
    regime,
    rules,
    riskScore,
    alertCount:   criticalCount + highCount,
    gdprApplies:  regime === 'GDPR',
    taxReporting: ['KE', 'ZA', 'NG'].includes(country),
  }
}

// ── Real-time compliance monitor ───────────────────────────────────────────
// Call this once to start monitoring. Returns cleanup function.
export function startComplianceMonitor(country: string): () => void {
  const ctx = buildContext(country, '')

  // Fire alerts for critical rules
  const criticalRules = ctx.rules.filter(r => r.severity === 'critical')
  criticalRules.forEach(rule => {
    setTimeout(() => {
      Orchestrator.emit('COMPLIANCE_ALERT', {
        ruleId:       rule.id,
        severity:     rule.severity,
        jurisdiction: rule.jurisdiction,
        description:  rule.description,
        remediation:  rule.remediation,
      }, { source: 'ComplianceEngine' })
    }, 1500 + Math.random() * 3000)
  })

  // Periodic re-check every 5 minutes
  const interval = setInterval(() => {
    const refreshed = buildContext(country, '')
    refreshed.rules.filter(r => r.severity !== 'low').forEach(rule => {
      Orchestrator.emit('COMPLIANCE_ALERT', {
        ruleId:       rule.id,
        severity:     rule.severity,
        jurisdiction: rule.jurisdiction,
        description:  rule.description,
        remediation:  rule.remediation,
      }, { source: 'ComplianceEngine' })
    })
  }, 5 * 60 * 1000)

  return () => clearInterval(interval)
}

// ── UI data adapter (for CompliancePanel.tsx) ─────────────────────────────
export interface CompliancePanelData {
  regime:      PrivacyRegime
  country:     string
  riskScore:   number
  rules:       Array<{
    id:          string
    title:       string
    severity:    Severity
    status:      'compliant' | 'warning' | 'critical' | 'unknown'
    description: string
    remediation: string
    deadline?:   string
  }>
  summary: {
    total:    number
    critical: number
    high:     number
    medium:   number
    low:      number
  }
}

export function buildCompliancePanelData(country: string): CompliancePanelData {
  const ctx = buildContext(country, '')
  return {
    regime:    ctx.regime,
    country,
    riskScore: ctx.riskScore,
    rules: ctx.rules.map(r => ({
      id:          r.id,
      title:       r.title,
      severity:    r.severity,
      status:      r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'warning' : 'unknown',
      description: r.description,
      remediation: r.remediation,
      deadline:    r.deadline,
    })),
    summary: {
      total:    ctx.rules.length,
      critical: ctx.rules.filter(r => r.severity === 'critical').length,
      high:     ctx.rules.filter(r => r.severity === 'high').length,
      medium:   ctx.rules.filter(r => r.severity === 'medium').length,
      low:      ctx.rules.filter(r => r.severity === 'low').length,
    },
  }
}

// ── Post-quantum JWT awareness ─────────────────────────────────────────────
// Roadmap: RS256/ES256 → CRYSTALS-Dilithium (ML-DSA) per NIST FIPS 204
export const PQ_ROADMAP = {
  currentAlgorithm: 'ES256 (P-256 ECDSA)',
  targetAlgorithm:  'ML-DSA-65 (CRYSTALS-Dilithium)',
  nistStandard:     'FIPS 204',
  migrationDate:    '2027-01-01',
  cloudflareSupport: 'Planned: Workers Crypto API v2 (Q3 2026)',
  note: 'Cloudflare PQC TLS (X25519Kyber768) already active at network layer. Application-layer JWT migration pending FIPS 204 finalisation.',
} as const
