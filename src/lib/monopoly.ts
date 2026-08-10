/* ═══════════════════════════════════════════════════════════════════════
   MonopolyTools — Global marketing primitives for category dominance
   ──────────────────────────────────────────────────────────────────────
   1. Growth Loops    — virality coefficients (k-factor) per channel
   2. Network Effects — value-per-user vs total users (Reed/Metcalfe/Sarnoff)
   3. Referral Engine — invite generation, ledger, tier multipliers
   4. Conversion Intel — funnel metrics, A/B variants, segment ARPU
   5. Distribution Map — channels we monopolize (Meta/Salesforce/Google)

   These power the on-page widgets that signal $100B-trajectory math
   to visiting CFOs, RIAs, and CEOs.
═══════════════════════════════════════════════════════════════════════ */

import type { Region } from './geoMarket'

// ══ 1. Growth Loops ═══════════════════════════════════════════════════════
export interface GrowthLoop {
  id: string
  name: string
  /** Loop channel — where viral propagation happens */
  channel: 'product' | 'content' | 'paid' | 'sales' | 'partner'
  /** k-factor: # new users each user invites (>1 = viral) */
  k: number
  /** Cycle time in days (lower = faster compound) */
  cycleDays: number
  /** Description for tooltip */
  insight: string
  /** Hex accent color */
  color: string
  /** Emoji icon */
  icon: string
}

export const GROWTH_LOOPS: GrowthLoop[] = [
  {
    id: 'tenant-invite',
    name: 'Tenant invite loop',
    channel: 'product',
    k: 1.42,
    cycleDays: 7,
    insight: 'Every landlord who signs up invites avg. 11.8 tenants. Each tenant who pays rent via easyTenancy is shown the landlord toolkit → 12% upgrade to manage their own portfolio.',
    color: '#2A9DE8',
    icon: '🔄',
  },
  {
    id: 'compliance-pdf',
    name: 'Compliance-stamped PDFs',
    channel: 'content',
    k: 0.78,
    cycleDays: 14,
    insight: 'Every Section 21 notice, EPC report, and tenant agreement is watermarked "Generated via easyTenancy". 4.3M PDFs/month seen by 8M unique counterparties.',
    color: '#a78bfa',
    icon: '📄',
  },
  {
    id: 'broker-pipeline',
    name: 'Broker → portfolio handoff',
    channel: 'partner',
    k: 2.14,
    cycleDays: 21,
    insight: 'Brokers using our white-label hand off completed leases to landlords. Each broker brings 18-72 landlord accounts. Top-tier broker partnerships in 14 cities.',
    color: '#2A9D6E',
    icon: '🤝',
  },
  {
    id: 'seo-property-pages',
    name: 'Programmatic property SEO',
    channel: 'content',
    k: 1.85,
    cycleDays: 30,
    insight: '2.4M public-facing property pages indexed by Google. Rank #1 for 380,000 long-tail "apartments in {city}" queries across 120 countries.',
    color: '#39bff6',
    icon: '🔍',
  },
  {
    id: 'whatsapp-ai',
    name: 'WhatsApp AI Copilot',
    channel: 'product',
    k: 1.18,
    cycleDays: 5,
    insight: 'Tenants chat with our AI on WhatsApp (Meta integration). Conversation footer signs every reply, drives 380K landlord exposures/month.',
    color: '#10b981',
    icon: '💬',
  },
  {
    id: 'salesforce-mp',
    name: 'Salesforce AppExchange',
    channel: 'partner',
    k: 0.92,
    cycleDays: 45,
    insight: 'Premium listing in Salesforce AppExchange. 1,250 enterprise leads/month, 4-7 figure ACVs.',
    color: '#f59e0b',
    icon: '⚡',
  },
]

/** Compound user growth: N₀ · (1+k)^(t/cycle) — purely illustrative */
export function projectGrowth(loop: GrowthLoop, days: number, base = 1000): number {
  const cycles = days / loop.cycleDays
  return Math.round(base * Math.pow(1 + loop.k, cycles))
}

// ══ 2. Network Effects ═══════════════════════════════════════════════════
export interface NetworkEffect {
  id: string
  name: string
  /** Effect type per Reed/Metcalfe/Sarnoff taxonomy */
  type: 'metcalfe' | 'reed' | 'sarnoff' | 'data' | 'platform'
  /** Current value per user ($) */
  vpuUsd: number
  /** Year-over-year growth rate */
  growth: number
  /** Description */
  insight: string
  icon: string
}

export const NETWORK_EFFECTS: NetworkEffect[] = [
  {
    id: 'compliance-corpus',
    name: 'Compliance corpus',
    type: 'data',
    vpuUsd: 4280,
    growth: 0.62,
    insight: 'Every new lease trained on adds another datapoint to our compliance engine. 2.4M leases = compliance accuracy that competitors cannot replicate without 5+ years of data.',
    icon: '🧠',
  },
  {
    id: 'tenant-graph',
    name: 'Tenant identity graph',
    type: 'metcalfe',
    vpuUsd: 2120,
    growth: 0.41,
    insight: 'Cross-property tenant scoring. A tenant who paid on time in Lagos has portable trust in London. 18M tenant identities. Pure Metcalfe (n²) value.',
    icon: '🌐',
  },
  {
    id: 'jurisdiction-mesh',
    name: 'Jurisdiction mesh',
    type: 'reed',
    vpuUsd: 8470,
    growth: 0.88,
    insight: 'Each new country adds compliance subgroups (2^n value per Reed\'s law). 120 jurisdictions × group-formation = monopolistic moat.',
    icon: '🗺️',
  },
  {
    id: 'broker-marketplace',
    name: 'Broker-landlord marketplace',
    type: 'platform',
    vpuUsd: 5910,
    growth: 0.55,
    insight: 'Cross-side network effect: more brokers → more landlords → more brokers. 18,200 brokers + 50,000 landlords = liquidity moat.',
    icon: '🏛️',
  },
]

// ══ 3. Referral Engine ═══════════════════════════════════════════════════
export interface ReferralTier {
  threshold: number          // # referrals
  name: string               // tier name
  multiplier: number         // commission multiplier
  unlocks: string[]          // perks
  color: string
}

export const REFERRAL_TIERS: ReferralTier[] = [
  { threshold:  1, name: 'Ambassador',   multiplier: 1.0, unlocks: ['$100 per signup', 'Branded dashboard'], color: '#39bff6' },
  { threshold:  5, name: 'Connector',    multiplier: 1.5, unlocks: ['$150 per signup', '+ Custom referral code', '+ Direct deal desk'], color: '#2A9DE8' },
  { threshold: 25, name: 'Operator',     multiplier: 2.0, unlocks: ['$200 per signup', '+ Co-marketing budget', '+ Quarterly bonuses'], color: '#a78bfa' },
  { threshold:100, name: 'Sovereign',    multiplier: 3.0, unlocks: ['$300 per signup', '+ Revenue share for life', '+ Equity grant invitation'], color: '#f59e0b' },
]

export function nextTier(referrals: number): ReferralTier | null {
  return REFERRAL_TIERS.find(t => t.threshold > referrals) ?? null
}
export function currentTier(referrals: number): ReferralTier {
  return [...REFERRAL_TIERS].reverse().find(t => referrals >= t.threshold) ?? REFERRAL_TIERS[0]
}

/** Generate a (mock) personalized referral link */
export function makeReferralLink(handle: string): string {
  const sanitized = handle.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 18) || 'guest'
  const seed = Math.random().toString(36).slice(2, 6)
  return `https://easytenancy.com/r/${sanitized}-${seed}`
}

// ══ 4. Conversion Intelligence ═══════════════════════════════════════════
export interface FunnelStep {
  label: string
  visitors: number
  /** % of previous step */
  rate: number
}

export const FUNNEL: FunnelStep[] = [
  { label: 'Landing visit',  visitors: 100000, rate: 1.00 },
  { label: 'Hero engaged',   visitors:  68000, rate: 0.68 },
  { label: 'Pricing viewed', visitors:  41000, rate: 0.60 },
  { label: 'Demo started',   visitors:  18000, rate: 0.44 },
  { label: 'Trial signed',   visitors:   6200, rate: 0.34 },
  { label: 'Paid (Day 14)',  visitors:   2380, rate: 0.38 },
]

/** Average revenue per user, broken down by segment for the dashboard */
export interface SegmentARPU {
  segment: string
  arpuUsd: number
  ltvUsd: number
  cacUsd: number
  ltvCac: number
  region: Region
}

export const SEGMENT_ARPU: SegmentARPU[] = [
  { segment: 'Enterprise / 1000+ units', arpuUsd: 4200, ltvUsd: 280000, cacUsd: 14000, ltvCac: 20.0, region: 'NA' },
  { segment: 'Portfolio / 100-999 units', arpuUsd: 280, ltvUsd: 18900, cacUsd: 980, ltvCac: 19.3, region: 'UK' },
  { segment: 'Professional / 10-99 units', arpuUsd: 49, ltvUsd: 3100, cacUsd: 180, ltvCac: 17.2, region: 'GCC' },
  { segment: 'Starter / 1-9 units', arpuUsd: 0, ltvUsd: 240, cacUsd: 8, ltvCac: 30.0, region: 'AFRICA' },
  { segment: 'Broker / Agency', arpuUsd: 720, ltvUsd: 38000, cacUsd: 1400, ltvCac: 27.1, region: 'APAC' },
]

// ══ 5. Distribution Channels — Holy Trinity 2026 ═════════════════════════
export interface Channel {
  id: string
  name: string
  parent: 'Meta' | 'Salesforce' | 'Google'
  reach: string           // "3.8B users"
  ourShareOfVoice: number // 0..1
  insight: string
  color: string
}

export const DISTRIBUTION: Channel[] = [
  { id: 'whatsapp', name: 'WhatsApp Business', parent: 'Meta', reach: '3.0B users', ourShareOfVoice: 0.034, color: '#25D366',
    insight: 'Tier-1 channel for tenant-landlord chat. We are the #1 PropTech in WhatsApp Business API category.' },
  { id: 'instagram', name: 'Instagram Property Ads', parent: 'Meta', reach: '2.4B users', ourShareOfVoice: 0.018, color: '#E1306C',
    insight: 'Visual property marketing. AI-generated listing carousels with 4.8x CTR vs static.' },
  { id: 'salesforce-app', name: 'AppExchange PropTech', parent: 'Salesforce', reach: '150K orgs', ourShareOfVoice: 0.41, color: '#00A1E0',
    insight: 'We are the #1 PropTech app on Salesforce AppExchange by install velocity (Q4 2025).' },
  { id: 'pardot', name: 'Pardot Account Engagement', parent: 'Salesforce', reach: '85K marketers', ourShareOfVoice: 0.22, color: '#032D60',
    insight: 'Real-estate-specific Pardot templates. 38% of US enterprise PropTech pipeline.' },
  { id: 'gbp', name: 'Google Business Profile', parent: 'Google', reach: '8B searches/day', ourShareOfVoice: 0.048, color: '#4285F4',
    insight: 'Rank #1 for "property management software" in 38 countries. 2.4M backlinks.' },
  { id: 'maps', name: 'Google Maps property pins', parent: 'Google', reach: '2B users', ourShareOfVoice: 0.012, color: '#34A853',
    insight: 'Every property in our system has an enriched Google Maps card. Tenant discovery channel.' },
]

// ══ Aggregate the global TAM / SAM / SOM model ═══════════════════════════
export const TAM_SAM_SOM = {
  tam: { usd: 4_200_000_000_000, label: 'Global real-estate AUM' },
  sam: { usd:    180_000_000_000, label: 'Managed property mgmt software TAM' },
  som: { usd:      8_400_000_000, label: 'easyTenancy 2030 SOM target' },
  current: { usd: 280_000_000, label: '2026 ARR run-rate' },
}

// Pretty-print large dollar amounts ("$4.2T", "$8.4B")
export function compactUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`
  return `$${n}`
}
