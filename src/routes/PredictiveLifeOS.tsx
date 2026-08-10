import React, {
  useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy
} from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { BRAND, COUNTRY_ACCENT } from '../lib/tokens'
import SovereignPageHeader from '../components/SovereignPageHeader'
import { SEO } from '../components/SEO'
import ExpandableFooterColumn from '../components/ExpandableFooterColumn'

// ── Lazily loaded panels ─────────────────────────────────────────────────
const SpatialStaging        = lazy(() => import('../components/SpatialStaging'))
const ActionableIntelligence = lazy(() => import('../components/ActionableIntelligence'))
const EnterpriseHub          = lazy(() => import('../components/EnterpriseHub'))

function PanelLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:220, gap:12, color:'#8892A4', fontSize:13 }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
        style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(42,157,232,0.2)', borderTopColor:'#2A9DE8' }} />
      {label}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
interface PersonaFeature { name: string; desc: string; icon: string }
interface PersonaPrompt  { cmd: string; desc: string }
interface Persona {
  id: string; title: string; emoji: string
  accent: string; gradFrom: string; gradTo: string
  headline: string
  kpis: { label: string; value: string }[]
  features: PersonaFeature[]
  prompts: PersonaPrompt[]
  agentFilter: string[]
}

const PERSONAS: Persona[] = [
  {
    id:'landlord', title:'Landlord', emoji:'🏠',
    accent:'#1A6DB5', gradFrom:'#1A6DB5', gradTo:'#2A9D6E',
    headline:"Your 47-unit portfolio just renewed 12 leases, collected $284K, and flagged 3 evictions — while you slept.",
    kpis:[{label:'AUM',value:'$48.2M'},{label:'Active Leases',value:'142'},{label:'Health Score',value:'98.4%'},{label:'Rent Growth',value:'+8.2%'}],
    features:[
      {icon:'🚀',name:'Portfolio Autopilot',          desc:'Auto-reconciles bank feeds, executes payouts, and schedules routine repairs. Zero manual steps.'},
      {icon:'💡',name:'Smart Rent Pricing AI',         desc:'Real-time competitive yield analysis predicting localized demand elasticities across 127 markets.'},
      {icon:'📉',name:'Vacancy Forecasting',           desc:'Predictive modeling identifies tenants likely to vacate 90 days before they do — with 91% accuracy.'},
      {icon:'🔍',name:'Tenant Screening Scorecards',   desc:'Combines FICO, behavioral indicators, and global eviction database across 195+ jurisdictions.'},
      {icon:'📝',name:'Auto-Lease Renewal Negotiator', desc:'Self-correcting email/SMS agent negotiates optimal lease rates and handles counter-offers.'},
      {icon:'💰',name:'Cash Flow Predictor',           desc:'Simulates 36-month capital reserves based on macroeconomic indices, vacancy cycles, and cap rates.'},
      {icon:'🔧',name:'Maintenance Triage Bot',        desc:'Routes maintenance tickets via voice/photo → vendor assigned → ETA set within 4 minutes average.'},
      {icon:'📊',name:'Capital Improvement ROI Sim',   desc:'Models NPV of every improvement project and ranks by yield-per-dollar-invested over 5-year horizon.'},
    ],
    prompts:[
      {cmd:'/forecast vacancy Q3',                  desc:'Generate seasonal vacancy probability vectors for your portfolio.'},
      {cmd:'/draft rent increase notice CA-civ-1947',desc:'Legal compliance-drafting for rental adjustment.'},
      {cmd:'/score tenant ssn-last4 4421',           desc:'Run comprehensive behavioral and background analysis.'},
      {cmd:'/simulate capex roof_replacement_2026',  desc:'Model 10-year NPV of major capital expenditure.'},
    ],
    agentFilter:['RentBot','RenewIQ','ChurnGuard','MaintenanceMind','ScreenerX','CashFlowOracle','FraudShield'],
  },
  {
    id:'tenant', title:'Tenant', emoji:'🧑‍💼',
    accent:'#2A9D6E', gradFrom:'#2A9D6E', gradTo:'#1A6DB5',
    headline:"Move in by Friday. Score your dream lease in 90 seconds. Zero paperwork.",
    kpis:[{label:'Passport Score',value:'840/900'},{label:'Rent Paid',value:'$24,500'},{label:'Savings Yield',value:'4.2%'},{label:'Carbon Saved',value:'1.2t'}],
    features:[
      {icon:'🛂',name:'Universal Tenant Passport',  desc:'Portable real estate credit rating — KYC verified, accepted across 120+ countries instantly.'},
      {icon:'🏡',name:'Rent-to-Own Pathway',         desc:'Directs a slice of monthly rent into diversified fractional equity portfolios automatically.'},
      {icon:'🤝',name:'Split-Rent Hub',               desc:'Multi-party balance splits with direct automated tenant micro-payments and dispute resolution.'},
      {icon:'💳',name:'BNPL Deposit Financing',       desc:'Securitized deposit installment loans featuring 0.00% introductory APR for qualified tenants.'},
      {icon:'⚡',name:'Utility Auto-Switch',           desc:'Continuously monitors and switches energy suppliers for optimal cost — saves avg £340/year.'},
      {icon:'🌍',name:'Lease Translator (120 langs)', desc:'Translates legal contracts into plain English across 120 languages with jurisdiction annotations.'},
      {icon:'🔊',name:'Voice Complaint Logger',       desc:'One-tap voice memo triggers AI-structured maintenance/dispute log with timestamp and evidence chain.'},
      {icon:'⚖️',name:'Tenant Rights Copilot',        desc:'Real-time jurisdiction-specific rights advisor — never face a landlord unprepared again.'},
    ],
    prompts:[
      {cmd:'/translate lease de-to-en',   desc:'Translate contract with localized regulatory annotations.'},
      {cmd:'/split rent room_3',          desc:'Allocate dynamic utilities and rent weights to co-tenants.'},
      {cmd:'/calculate buy_back_equity',  desc:'Compute cumulative equity transfer options toward ownership.'},
      {cmd:'/check rights jurisdiction UK',desc:'Pull tenant rights summary for your jurisdiction instantly.'},
    ],
    agentFilter:['ConciergeGPT','DisputeDiplomat','ComplyCore','FraudShield'],
  },
  {
    id:'agent', title:'Agent / Broker', emoji:'🤝',
    accent:'#4F46E5', gradFrom:'#1A6DB5', gradTo:'#4F46E5',
    headline:"Listing syndicated to 400+ portals. Lead scoring auto-updated. GCI up 44%.",
    kpis:[{label:'Listings',value:'24'},{label:'Close Ratio',value:'89.2%'},{label:'Avg GCI',value:'$420K'},{label:'Lead Flow',value:'1,420/mo'}],
    features:[
      {icon:'📡',name:'Multi-Portal Syndication',      desc:'Instantly push inventory to 400+ portals: Zillow, Rightmove, Realestate.com.au, and WeChat.'},
      {icon:'🏠',name:'3D Dollhouse AI Tour Generator',desc:'Generates interactive spatial walk-throughs from standard smartphone video recordings in minutes.'},
      {icon:'🎯',name:'Lead Scoring & Auto-Nurture',   desc:'Self-driving follow-ups adjusting script based on buyer persona profiles and engagement signals.'},
      {icon:'💼',name:'Smart Contract Commission Split',desc:'Immutable multi-party splits executed on hyperledger rails — instant settlement, zero disputes.'},
      {icon:'🪪',name:'Biometric Open House Registry', desc:'Secure compliance framework logging guest data and verifying IDs instantly at viewings.'},
      {icon:'📈',name:'GCI Forecast Engine',            desc:'Probability-weighted transaction visualizer linked to regional sales queues and market velocity.'},
      {icon:'📋',name:'Compliance Doc Vault',           desc:'Auto-populates RESPA, MLS, GDPR-compliant forms based on transaction type and jurisdiction.'},
      {icon:'💬',name:'WhatsApp/iMessage Client Hub',  desc:'Unified inbox across all messaging platforms with AI-suggested response and CRM sync.'},
    ],
    prompts:[
      {cmd:'/syndicate list_902',            desc:'Distribute unit profile across global rental aggregates.'},
      {cmd:'/generate dollhouse photo_dir',  desc:'Synthesize spatial layouts using generative 3D kernels.'},
      {cmd:'/calculate commission split_82', desc:'Generate escrow settlement sheets instantly.'},
      {cmd:'/score lead email_inquiry_901',  desc:'Run behavioral lead qualification in real time.'},
    ],
    agentFilter:['RentBot','ValuationAI','FraudShield','ConciergeGPT','ComplyCore'],
  },
  {
    id:'investor', title:'Investor', emoji:'📈',
    accent:'#E11D48', gradFrom:'#E11D48', gradTo:'#1A6DB5',
    headline:"487 off-market deals matched your thesis today. 14 cleared your IRR floor.",
    kpis:[{label:'Portfolio IRR',value:'18.4%'},{label:'Total Invested',value:'$14.2M'},{label:'Cash-on-Cash',value:'7.8%'},{label:'Deal Pipeline',value:'487'}],
    features:[
      {icon:'🎯',name:'Deal Flow Radar',             desc:'Scans non-MLS lists, court filings, and foreclosure portals globally in real-time — first mover advantage.'},
      {icon:'🗺️',name:'Cap Rate Heatmaps',           desc:'Real-time geographic overlay maps measuring cap yield compressions across 127 metro markets.'},
      {icon:'🔄',name:'1031 Exchange Concierge',      desc:'Algorithmically identifies asset swaps before 45-day identification window expires with tax optimisation.'},
      {icon:'🪙',name:'Fractional Tokenization',      desc:'Tokenize portfolio equity into compliant ERC-3643 securities. List on regulated ATS platforms.'},
      {icon:'⚡',name:'Stress-Test Scenarios',         desc:'Execute multi-variable stress tests: rate shocks (+300bps), recession scenarios, vacancy spikes.'},
      {icon:'📄',name:'Auto-Generated PPMs',           desc:'Instantly drafts SEC/FCA-compliant Private Placement Memorandums — from term sheet to offering in 4 hours.'},
      {icon:'💧',name:'Distribution Waterfall Engine', desc:'Calculates LP/GP splits, preferred returns, and catch-ups across complex fund structures automatically.'},
      {icon:'🌿',name:'ESG Portfolio Scoring',         desc:'Real-time ESG scoring against GRESB, MSCI, and SASB standards with remediation roadmaps.'},
    ],
    prompts:[
      {cmd:'/match 1031 target_asset_2',     desc:'Identify optimal replacement properties matching yield metrics.'},
      {cmd:'/stress test rate_shock 300bps', desc:'Model asset performance under sudden rate increases.'},
      {cmd:'/generate ppm fund_v',           desc:'Draft SEC-compliant private placement offering documents.'},
      {cmd:'/heatmap caprate miami_dade',    desc:'Render live cap rate compression map for target submarket.'},
    ],
    agentFilter:['ValuationAI','CashFlowOracle','RentBot','ComplyCore','FraudShield','EnergySage'],
  },
  {
    id:'vc', title:'VC / PropTech Fund', emoji:'💰',
    accent:'#D97706', gradFrom:'#D97706', gradTo:'#2A9D6E',
    headline:"PropTech portfolio benchmarks automated. Real-time alpha signals unlocked.",
    kpis:[{label:'Active LPs',value:'84'},{label:'Capital Invested',value:'$120M'},{label:'TVPI',value:'2.45×'},{label:'Aggregate IRR',value:'28.1%'}],
    features:[
      {icon:'📡',name:'Portfolio Co. Telemetry',  desc:'Direct secure ledger feed of KPIs from all portfolio companies — ARR, churn, NRR, burn rate.'},
      {icon:'🔬',name:'Diligence Data Room AI',   desc:'Analyzes financial health models, maps competitive vulnerabilities, and flags cap table anomalies.'},
      {icon:'📝',name:'Term Sheet Synthesizer',    desc:'Drafts term sheets using standard regulatory parameters adapted per jurisdiction automatically.'},
      {icon:'🗂️',name:'Cap Table Sync',            desc:'Real-time integration with Carta, Pulley, and Shareworks — always know your fully-diluted ownership.'},
      {icon:'🚪',name:'Exit Comparables Matcher',  desc:'Predicts valuations using latest international M&A markers, public comps, and precedent transactions.'},
      {icon:'📐',name:'Anti-Dilution Modeler',     desc:'Calculates cap adjustments during multi-layered funding rounds with weighted-average/full-ratchet support.'},
      {icon:'📊',name:'LP Reporting Studio',        desc:'One-click quarterly LP reports with waterfall calculations, fund metrics, and benchmark comparisons.'},
      {icon:'🧭',name:'Founder-Match for Follow-ons',desc:'AI identifies and scores portfolio companies ready for follow-on based on leading KPI indicators.'},
    ],
    prompts:[
      {cmd:'/benchmark portfolio peer_index',  desc:'Run portfolio growth curves against SaaS PropTech trends.'},
      {cmd:'/analyze dataroom company_x',      desc:'Perform multi-vector risk checks on raw diligence records.'},
      {cmd:'/simulate dilution round_b_50m',   desc:'Generate cap adjustments across diverse share structures.'},
      {cmd:'/generate lp_report q2_2026',      desc:'Compile LP quarterly report with waterfall calculation.'},
    ],
    agentFilter:['ValuationAI','CashFlowOracle','ComplyCore','FraudShield'],
  },
  {
    id:'pm', title:'Property Manager', emoji:'🏢',
    accent:'#8B5CF6', gradFrom:'#8B5CF6', gradTo:'#1A6DB5',
    headline:"8,400 doors consolidated. Vendor handoffs automated. NPS hit 74.",
    kpis:[{label:'Door Count',value:'8,410'},{label:'Dispatch Time',value:'12 min'},{label:'NPS Score',value:'74'},{label:'OpEx Reduction',value:'18%'}],
    features:[
      {icon:'🏗️',name:'Multi-Entity Consolidation', desc:'Rolls up multiple operating structures into centralized, auditable dashboards with cross-entity analytics.'},
      {icon:'🔧',name:'Work Order Orchestrator',     desc:'Extracts maintenance tickets via voice/text/photo → assigns SLA-bonded vendors → tracks completion.'},
      {icon:'✅',name:'Vendor SLA Verification',     desc:'Computer vision verifies work completion from photos — triggers automated payments on confirmation.'},
      {icon:'🌡️',name:'IoT Energy & ESG Analytics',  desc:'Monitors smart HVAC, water sensors, and occupancy data to alert on performance drift in real time.'},
      {icon:'🏛️',name:'Section 8 Compliance Bridge', desc:'Maintains HAP contract integrations and automates housing authority payment reconciliation.'},
      {icon:'🔐',name:'Live SOC 2 Audit Panel',      desc:'Real-time visibility into access audits, tenant PII safety, and data flows for compliance teams.'},
      {icon:'💬',name:'Resident Experience NPS',     desc:'Automated pulse surveys, sentiment analysis, and escalation routing — drive NPS above industry average.'},
      {icon:'🧾',name:'Rent Roll Audit Bot',          desc:'Detects discrepancies across ledgers, flags under-market units, and generates board-ready rent roll reports.'},
    ],
    prompts:[
      {cmd:'/consolidate reit_ledger_9',     desc:'Merge multi-entity records into unified audit trail.'},
      {cmd:'/dispatch maintenance leak_301', desc:'Trigger automated vendor dispatch and SLA routing.'},
      {cmd:'/verify audit live_soc2',        desc:'Confirm data hygiene and role permissions for SOC 2.'},
      {cmd:'/generate nps_report q2_2026',   desc:'Compile resident satisfaction analytics and action plan.'},
    ],
    agentFilter:['MaintenanceMind','ComplyCore','EnergySage','RentBot','ChurnGuard','FraudShield'],
  },
  {
    id:'govt', title:'Housing Authority', emoji:'🏛️',
    accent:'#0EA5E9', gradFrom:'#0EA5E9', gradTo:'#2A9D6E',
    headline:"Affordable housing compliance automated. Eviction diversion saving 2,400 families.",
    kpis:[{label:'Vouchers Managed',value:'14,200'},{label:'Compliance Rate',value:'99.1%'},{label:'Avg Processing',value:'3.2 days'},{label:'Savings/yr',value:'$8.4M'}],
    features:[
      {icon:'🏠',name:'Affordable Housing Compliance', desc:'Real-time monitoring of rent limits, income limits, and habitability standards across the portfolio.'},
      {icon:'⚖️',name:'Eviction Diversion AI',          desc:'Identifies households at eviction risk 45 days early and routes to targeted intervention programs.'},
      {icon:'📋',name:'Section 8 Voucher Reconciliation',desc:'Automated HAP payment matching, HAP contract generation, and portability tracking.'},
      {icon:'📊',name:'Rent Stabilization Ledger',       desc:'Immutable audit trail of all rent adjustments with locality-specific stabilization law compliance.'},
      {icon:'💸',name:'Subsidy Disbursement Rails',       desc:'Automated disbursement to landlords with real-time bank verification and fraud screening.'},
      {icon:'🔍',name:'Anti-Discrimination Audit',        desc:'AI scans every listing and correspondence for Fair Housing Act/Equality Act violations automatically.'},
      {icon:'📈',name:'Housing Market Intelligence',      desc:'Supply/demand analytics informing policy: vacancy rates, affordability gaps, displacement risk maps.'},
      {icon:'🌐',name:'Multi-Jurisdiction Compliance',    desc:'Tracks local ordinance changes across 195+ jurisdictions and auto-updates compliance rules.'},
    ],
    prompts:[
      {cmd:'/check compliance unit_4b',        desc:'Run full habitability and rent limit compliance check.'},
      {cmd:'/flag eviction_risk block_7',       desc:'Identify households at risk and trigger diversion.'},
      {cmd:'/reconcile hap_payments march',     desc:'Match and verify all housing authority payments.'},
      {cmd:'/audit discrimination listing_29',  desc:'Scan listing for Fair Housing Act compliance.'},
    ],
    agentFilter:['ComplyCore','DisputeDiplomat','FraudShield','RentBot'],
  },
  {
    id:'vendor', title:'Vendor / Contractor', emoji:'🔧',
    accent:'#F97316', gradFrom:'#F97316', gradTo:'#D97706',
    headline:"42 jobs dispatched. $18,400 cleared in 4 hours. Insurance auto-verified.",
    kpis:[{label:'Jobs/Month',value:'284'},{label:'Avg Job Value',value:'$648'},{label:'Payment Speed',value:'4 hrs'},{label:'Rating',value:'4.9★'}],
    features:[
      {icon:'📋',name:'Job Marketplace',              desc:'Browse and claim verified maintenance jobs from 8,400+ managed properties on the platform.'},
      {icon:'⚡',name:'Instant Payment Rails',          desc:'Get paid within 4 hours of photo-verified job completion — no net-30, no invoice chasing.'},
      {icon:'🔏',name:'Insurance Auto-Verify',          desc:'COI verification happens automatically — never chase a document or lose a job over insurance.'},
      {icon:'🗺️',name:'Route Optimization AI',          desc:'Smart scheduling clusters nearby jobs to minimize drive time and maximize daily earnings.'},
      {icon:'📸',name:'Photo-Verified Completion',      desc:'AI vision confirms work quality from job photos — disputes resolved automatically within 2 hours.'},
      {icon:'💵',name:'Lien Waiver Auto-Generation',    desc:'Jurisdiction-specific lien waivers generated and counter-signed automatically on payment.'},
      {icon:'⭐',name:'Reputation Engine',               desc:'Verified reviews from property managers build your profile — top-rated vendors get priority routing.'},
      {icon:'📦',name:'Materials Marketplace',          desc:'Order supplies directly through the platform — bulk pricing, same-day delivery to job site.'},
    ],
    prompts:[
      {cmd:'/claim job maintenance_#9841',  desc:'Accept and schedule a maintenance job from the marketplace.'},
      {cmd:'/verify insurance coi_upload',  desc:'Submit COI for instant AI verification and approval.'},
      {cmd:'/optimize route today_jobs',    desc:'Get AI-optimized schedule for maximum daily earnings.'},
      {cmd:'/dispute job_completion #9841', desc:'Raise a completion dispute with evidence chain.'},
    ],
    agentFilter:['MaintenanceMind','FraudShield','ComplyCore','ConciergeGPT'],
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// AGENT CONSTELLATION DATA (12 agents)
// ═══════════════════════════════════════════════════════════════════════════
interface Agent {
  id: string; name: string; model: string
  tasksPerMin: number; accuracy: number; lastDecision: string
  color: string; icon: string; x: number; y: number
}

const AGENTS: Agent[] = [
  { id:'RentBot',         name:'RentBot',          model:'GPT-4o',           tasksPerMin:42,  accuracy:99.1, lastDecision:'Collected $18,400 from 23 tenants',        color:'#1A6DB5', icon:'💰', x:0.50, y:0.15 },
  { id:'RenewIQ',         name:'RenewIQ',           model:'Gemini 2.5 Pro',   tasksPerMin:18,  accuracy:94.7, lastDecision:'Renewed 12 leases in Nairobi portfolio',    color:'#2A9DE8', icon:'📝', x:0.78, y:0.25 },
  { id:'ChurnGuard',      name:'ChurnGuard',         model:'Claude Opus 4',    tasksPerMin:31,  accuracy:91.3, lastDecision:'Flagged 5 tenants at >75% churn risk',      color:'#f59e0b', icon:'⚠️', x:0.92, y:0.50 },
  { id:'MaintenanceMind', name:'MaintenanceMind',    model:'Gemini 2.5 Flash', tasksPerMin:57,  accuracy:97.2, lastDecision:'Routed 3 tickets → vendors assigned',       color:'#F97316', icon:'🔧', x:0.78, y:0.75 },
  { id:'ComplyCore',      name:'ComplyCore',         model:'GPT-4o',           tasksPerMin:12,  accuracy:100,  lastDecision:'Zero violations — RERA audit clean',        color:'#a78bfa', icon:'⚖️', x:0.50, y:0.85 },
  { id:'ScreenerX',       name:'ScreenerX',          model:'Llama 4 Scout',    tasksPerMin:24,  accuracy:96.4, lastDecision:'Scored 8 applicants — 2 flagged',           color:'#10b981', icon:'🔍', x:0.22, y:0.75 },
  { id:'ValuationAI',     name:'ValuationAI',        model:'Gemini 2.5 Pro',   tasksPerMin:8,   accuracy:93.8, lastDecision:'£4.2M comp report — London W1',             color:'#E11D48', icon:'📊', x:0.08, y:0.50 },
  { id:'CashFlowOracle',  name:'CashFlowOracle',     model:'GPT-4o',           tasksPerMin:5,   accuracy:97.1, lastDecision:'36mo forecast updated — $1.24M/30d',        color:'#2A9D6E', icon:'🔮', x:0.22, y:0.25 },
  { id:'DisputeDiplomat', name:'DisputeDiplomat',    model:'Claude Opus 4',    tasksPerMin:3,   accuracy:89.6, lastDecision:'Bond dispute resolved — $2,400 returned',   color:'#0EA5E9', icon:'🕊️', x:0.35, y:0.08 },
  { id:'EnergySage',      name:'EnergySage',         model:'Gemini 2.5 Flash', tasksPerMin:19,  accuracy:95.5, lastDecision:'IoT alert: HVAC unit_301 18% above baseline',color:'#84cc16', icon:'🌿', x:0.65, y:0.08 },
  { id:'FraudShield',     name:'FraudShield',        model:'GPT-4o',           tasksPerMin:88,  accuracy:99.8, lastDecision:'0 fraud attempts blocked — last 1h',         color:'#ef4444', icon:'🛡️', x:0.35, y:0.92 },
  { id:'ConciergeGPT',    name:'ConciergeGPT',       model:'GPT-4o mini',      tasksPerMin:214, accuracy:98.2, lastDecision:'1,847 tenant messages handled',             color:'#D97706', icon:'🤵', x:0.65, y:0.92 },
]

// ═══════════════════════════════════════════════════════════════════════════
// COPILOT RESPONSES MAP
// ═══════════════════════════════════════════════════════════════════════════
const COPILOT_RESPONSES: Record<string, string> = {
  '/forecast vacancy Q3': '▸ Running Predictive Engine v4.8...\n\n✅ Forecast complete.\n• Expected Vacancy Rate: 1.84% (↓45bps YoY)\n• High-risk units: Unit 302, Unit 1109 (Lease expiry: Sept 30)\n• Auto-Renewal Negotiator initiated for Unit 1109\n• Confidence: 91.3% [CashFlowOracle v2.4]',
  '/draft rent increase notice CA-civ-1947': '▸ Initiating Regulatory Compliance Draftsman...\n\n✅ DRAFT COMPLETED — CA Civil Code § 1947.12\n• Unit 401 · New Rent: $3,450 (4.2% + CPI)\n• Notice period: 30 days (< 10% increase)\n• Verification hash generated · DocuSign queue active\n• [ComplyCore] — 100% compliant',
  '/score tenant ssn-last4 4421': '▸ Gathering signals from verified databases...\n\n✅ TENANT PROFILE GENERATED\n• Identity Verification: ✓ PASSED\n• Payment History: 98.2/100 (36 months clean)\n• Risk Profile: LOW — 0 disputes, 0 evictions\n• ScreenerX Recommendation: AUTO-APPROVE ✓',
  '/translate lease de-to-en': '▸ Translating with jurisdiction annotations...\n\n✅ TRANSLATION COMPLETE\n• §14 (Nebenkosten): "Additional utility costs on structural floor area"\n• §21 (Kündigung): "90-day notice required for landlord termination"\n• Tenant protection match: Valid under state consumer guidelines\n• [ComplyCore] — German BGB § 573 verified',
  '/split rent room_3': '▸ Calculating dynamic split allocations...\n\n✅ SPLIT ACTIVE\n• Total: $4,500/month\n• Room A (Master): $1,800 · Room B: $1,400 · Room C: $1,300\n• Automated invoicing via split-deposit ledger ✓\n• Payment tracking: Active on all 3 tenants',
  '/calculate buy_back_equity': '▸ Recalculating rent-to-equity pathways...\n\n✅ COMPUTATION COMPLETE\n• Cumulative rent paid: $36,000\n• Equity pool allocation: 2.5% monthly → ETF units\n• Portfolio share equivalent: 0.042% ownership\n• Projected ownership at 5yr: 3.1% of Building A',
  '/syndicate list_902': '▸ Connecting 412 API distribution nodes...\n\n✅ SYNC COMPLETED\n• Dispatched to 412 portals (Zillow, Rightmove, Realestate.com.au +409)\n• Live tracking links: active on all nodes\n• Avg listing propagation time: 4.2 minutes\n• SEO optimization score: 94/100',
  '/match 1031 target_asset_2': '▸ Scanning 127 market indices...\n\n✅ TARGETS IDENTIFIED\n• Asset #TX-48291: Class A Multi-family, Dallas TX\n  Cap Rate: 6.8% · Price: $4.2M · LTV: 72%\n• 45-day identification window: 38 days remaining\n• Qualified intermediary: Auto-notified ✓',
  '/stress test rate_shock 300bps': '▸ Applying 300bps shock scenarios...\n\n✅ SIMULATION COMPLETE\n• DSCR: 1.62 → 1.34 (threshold: 1.25)\n• Core coverage: INTACT (5.3% margin)\n• Max drawdown on NAV: -8.4%\n• Recommendation: Swap variable LOC to fixed-rate\n• [CashFlowOracle] — confidence 97.1%',
  '/benchmark portfolio peer_index': '▸ Accessing PropTech peer benchmarks...\n\n✅ COMPILATION COMPLETE\n• Gross margin: 78.4% (peer avg: 72.1%) ↑\n• Churn: 1.2% (peer avg: 2.8%) ↑\n• Capital efficiency: Top 5th percentile\n• ARR growth: 84% YoY vs 61% peer median ↑',
  '/consolidate reit_ledger_9': '▸ Reconciling 9 independent operational files...\n\n✅ LEDGER UNIFIED\n• Balance sheet total: $148,290,110\n• 4 currencies normalized (EUR/USD/AED/JPY)\n• 23 intercompany eliminations processed\n• Audit trail: Immutable hash generated',
  '/dispatch maintenance leak_301': '▸ Analyzing priority ticket...\n\n✅ DISPATCH COMPLETED\n• Vendor: Master Flow Plumbing LLC\n• SLA: 2-hour response guaranteed\n• Tenant notified: SMS + push sent\n• Estimated completion: Today 15:30\n• [MaintenanceMind] — routed in 47 seconds',
  '/check compliance unit_4b': '▸ Running full compliance audit...\n\n✅ COMPLIANCE CLEAR\n• HHSRS Category 1 hazards: 0\n• EPC Rating: C (above min Band E) ✓\n• Gas Safety cert: Valid to Dec 2026 ✓\n• EICR: Valid to Aug 2027 ✓\n• [ComplyCore] — 100% compliant',
  '/claim job maintenance_#9841': '▸ Processing job claim...\n\n✅ JOB CLAIMED — #9841\n• Location: 47 Westlands Rd, Nairobi\n• Type: HVAC repair · Est. time: 3hrs\n• Payout: $284 (on photo-verified completion)\n• COI: Auto-verified ✓ · Tools list: Sent to app',
  '/generate ppm fund_v': '▸ Compiling SEC Regulation D PPM...\n\n✅ DRAFT CREATED\n• Structure: 506(c) — accredited investors\n• Target raise: $25,000,000\n• Minimum investment: $100,000\n• Management fee: 2% · Carry: 20% above 8% hurdle\n• Legal validation key generated',
}

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING AGENT LOG DATA
// ═══════════════════════════════════════════════════════════════════════════
interface AgentAction { id:string; agent:string; action:string; status:'running'|'done'|'queued'; time:string; value:string }
const AGENT_LOG: AgentAction[] = [
  { id:'a1', agent:'RentBot',        action:'Auto-renewed 47 leases in Nairobi portfolio', status:'done',    time:'2s ago',  value:'+KES 2.3M' },
  { id:'a2', agent:'ComplyCore',     action:'Running RERA compliance check on Dubai units', status:'running', time:'now',     value:'14 units'  },
  { id:'a3', agent:'ValuationAI',    action:'Generating market comp report — London W1',    status:'running', time:'now',     value:'£4.2M est' },
  { id:'a4', agent:'RentBot',        action:'Sent 23 rent reminders (7-day pre-due)',        status:'done',    time:'8s ago',  value:'$18,400'   },
  { id:'a5', agent:'ScreenerX',      action:'On-device lease risk scoring — batch 300',      status:'queued',  time:'in 12s',  value:'300 leases'},
  { id:'a6', agent:'MaintenanceMind',action:'Maintenance ticket → vendor assigned → ETA set',status:'done',   time:'34s ago', value:'3 tickets' },
  { id:'a7', agent:'ChurnGuard',     action:'Churn risk flagged: 5 tenants (>75% score)',    status:'queued',  time:'in 30s',  value:'$94K ARR'  },
]

interface PredictiveCard { title:string; score:number; trend:'up'|'down'|'stable'; insight:string; action:string; color:string; icon:string }
const PREDICTIVE_CARDS: PredictiveCard[] = [
  { title:'Portfolio Health Score', score:94, trend:'up',     icon:'💚', color:'#10b981', insight:'94/100 — above 89% of comparable portfolios. 3 maintenance items driving the 6% gap.', action:'Fix 3 items → hit 100' },
  { title:'Renewal Probability',    score:88, trend:'up',     icon:'📄', color:BRAND.blueLight, insight:'88% of leases renewing in next 60 days — payment history + sentiment analysis.', action:'Nudge 12 at-risk' },
  { title:'Churn Risk Index',       score:12, trend:'down',   icon:'⚠️', color:'#f59e0b', insight:'12% churn risk — 5 tenants flagged. Auto-retention offers launching in 2 minutes.', action:'Review 5 flagged' },
  { title:'Yield Optimisation',     score:76, trend:'stable', icon:'📈', color:BRAND.blue,  insight:'Market data: 8.3% rent increase opportunity in KE + UK portfolios identified.', action:'Apply AI pricing' },
  { title:'Compliance Exposure',    score:2,  trend:'down',   icon:'⚖️', color:'#a78bfa', insight:'2 compliance gaps across 847 units. Auto-remediation notices drafting now.', action:'Auto-fix 2 gaps' },
  { title:'Revenue Forecast (30d)', score:97, trend:'up',     icon:'💰', color:BRAND.teal,  insight:'$1.24M collected next 30 days — 97% confidence. 3% hedged against forex variance.', action:'See full forecast' },
]

interface CRMRecord { name:string; type:'tenant'|'landlord'|'lead'; score:number; nextAction:string; value:string; country:string }
const CRM_RECORDS: CRMRecord[] = [
  { name:'Amara Osei',       type:'tenant',   score:96, nextAction:'Send renewal offer in 14 days',        value:'$2,400/mo', country:'KE' },
  { name:'James Thornton',   type:'landlord', score:88, nextAction:'Quarterly portfolio review call',       value:'£4.2M AUM', country:'UK' },
  { name:'Fatima Al-Rashid', type:'lead',     score:74, nextAction:'AI pitch deck auto-sent via email',     value:'AED 850K',  country:'AE' },
  { name:'David Kim',        type:'tenant',   score:91, nextAction:'Maintenance follow-up (open 3d)',        value:'$3,100/mo', country:'US' },
  { name:'Ngozi Adeyemi',    type:'landlord', score:82, nextAction:'Cross-sell compliance module',           value:'₦120M AUM', country:'ZA' },
  { name:'Sophie Laurent',   type:'lead',     score:65, nextAction:'Retarget — viewed pricing 4×',           value:'€1.1M',     country:'UK' },
]

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const num = parseFloat(value.replace(/[^0-9.]/g, ''))
  const prefix = value.match(/^[^0-9]*/)?.[0] ?? ''
  const sfx = value.match(/[^0-9.]+$/)?.[0] ?? suffix

  useEffect(() => {
    if (!ref.current || isNaN(num)) {
      if (ref.current) ref.current.textContent = value
      return
    }
    const ctrl = animate(0, num, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${v.toFixed(num % 1 !== 0 ? 1 : 0)}${sfx}`
        }
      },
    })
    return () => ctrl.stop()
  }, [value])

  return <span ref={ref}>{value}</span>
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE RING
// ═══════════════════════════════════════════════════════════════════════════
function ScoreRing({ score, color, size = 64 }: { score:number; color:string; size?:number }) {
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1s ease' }} />
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
        fontSize={size<60?11:14} fontWeight={800}
        style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }}>{score}</text>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SPATIAL GRAPH (Architecture Canvas)
// ═══════════════════════════════════════════════════════════════════════════
interface SpatialNode { id:string; label:string; x:number; y:number; size:number; color:string; connections:string[] }
function SpatialGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const NODES: SpatialNode[] = [
    { id:'core',    label:'easyTenancy OS', x:0.5,  y:0.5,  size:22, color:BRAND.blue,     connections:['gemini','einstein','meta','d1','kv'] },
    { id:'gemini',  label:'Gemini 2.5',     x:0.18, y:0.22, size:16, color:BRAND.blueLight, connections:['core','vertex'] },
    { id:'vertex',  label:'Vertex AI',      x:0.08, y:0.55, size:13, color:'#4285f4',       connections:['gemini','core'] },
    { id:'einstein',label:'Einstein GPT',   x:0.82, y:0.22, size:16, color:'#00a1e0',       connections:['core','datacloud'] },
    { id:'datacloud',label:'Data Cloud',    x:0.92, y:0.5,  size:13, color:'#0070d2',       connections:['einstein','core'] },
    { id:'meta',    label:'Meta AR/VR',     x:0.5,  y:0.12, size:15, color:BRAND.teal,      connections:['core','llama'] },
    { id:'llama',   label:'Llama 4',        x:0.75, y:0.08, size:12, color:'#00b5ad',       connections:['meta','core'] },
    { id:'d1',      label:'D1 SQLite',      x:0.22, y:0.78, size:12, color:'#f59e0b',       connections:['core'] },
    { id:'kv',      label:'Workers KV',     x:0.78, y:0.78, size:12, color:'#10b981',       connections:['core'] },
    { id:'edge',    label:'Edge 300+ PoPs', x:0.5,  y:0.88, size:14, color:'#a78bfa',       connections:['core','d1','kv'] },
  ]
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const draw = () => {
      timeRef.current += 0.008
      const t = timeRef.current
      ctx.clearRect(0, 0, W, H)
      NODES.forEach(node => {
        node.connections.forEach(tid => {
          const target = NODES.find(n => n.id === tid)
          if (!target) return
          const nx = node.x*W, ny = node.y*H, tx = target.x*W, ty = target.y*H
          ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(tx,ty)
          ctx.strokeStyle = `rgba(26,109,181,${0.3+0.15*Math.sin(t*2+node.x*10)})`
          ctx.lineWidth = 1; ctx.stroke()
          const prog = (t*0.4+node.x)%1
          const px = nx+(tx-nx)*prog, py = ny+(ty-ny)*prog
          ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2)
          ctx.fillStyle = `rgba(42,157,232,${0.7+0.3*Math.sin(t*3)})`; ctx.fill()
        })
      })
      NODES.forEach(node => {
        const x = node.x*W, y = node.y*H
        const glow = ctx.createRadialGradient(x,y,0,x,y,node.size*2)
        glow.addColorStop(0, node.color+'55'); glow.addColorStop(1,'transparent')
        ctx.beginPath(); ctx.arc(x,y,node.size*2,0,Math.PI*2)
        ctx.fillStyle = glow; ctx.fill()
        ctx.beginPath(); ctx.arc(x,y,node.size,0,Math.PI*2)
        ctx.fillStyle = node.color+'33'; ctx.strokeStyle = node.color
        ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${node.size<14?9:10}px DM Sans,sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(node.label, x, y+node.size+14)
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return <canvas ref={canvasRef} width={600} height={340} style={{ width:'100%', height:'auto', maxWidth:600 }} />
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENTFORCE CONSTELLATION (D3-style force canvas)
// ═══════════════════════════════════════════════════════════════════════════
function AgentConstellation({ activeFilter }: { activeFilter: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const t = useRef(0)
  const [hovered, setHovered] = useState<Agent | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.clientWidth * devicePixelRatio
    const H = canvas.clientHeight * devicePixelRatio
    canvas.width = W; canvas.height = H
    ctx.scale(devicePixelRatio, devicePixelRatio)
    const CW = canvas.clientWidth, CH = canvas.clientHeight

    const draw = () => {
      t.current += 0.006
      ctx.clearRect(0,0,CW,CH)

      // Center connection lines
      const cx = CW/2, cy = CH/2
      AGENTS.forEach(agent => {
        const ax = agent.x*CW, ay = agent.y*CH
        const isActive = activeFilter.length===0 || activeFilter.includes(agent.id)
        const alpha = isActive ? 0.18+0.08*Math.sin(t.current*2+agent.x*8) : 0.04
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ax,ay)
        ctx.strokeStyle = `rgba(26,109,181,${alpha})`; ctx.lineWidth=1; ctx.stroke()
        // packet
        if (isActive) {
          const prog = ((t.current*0.5+agent.x*2)%1)
          const px=cx+(ax-cx)*prog, py=cy+(ay-cy)*prog
          ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2)
          ctx.fillStyle=agent.color+'cc'; ctx.fill()
        }
      })

      // Center core node
      const coreGlow = ctx.createRadialGradient(cx,cy,0,cx,cy,36)
      coreGlow.addColorStop(0,'rgba(26,109,181,0.5)'); coreGlow.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(cx,cy,36,0,Math.PI*2); ctx.fillStyle=coreGlow; ctx.fill()
      ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2)
      ctx.fillStyle='rgba(26,109,181,0.3)'; ctx.strokeStyle='#1A6DB5'; ctx.lineWidth=2; ctx.fill(); ctx.stroke()
      ctx.fillStyle='#fff'; ctx.font='bold 9px DM Sans,sans-serif'; ctx.textAlign='center'
      ctx.fillText('CORE v4.8',cx,cy+4)

      AGENTS.forEach(agent => {
        const ax = agent.x*CW, ay = agent.y*CH
        const isActive = activeFilter.length===0 || activeFilter.includes(agent.id)
        const r = isActive ? 14 : 10
        const pulse = isActive ? 1+0.12*Math.sin(t.current*3+agent.x*5) : 1
        const glow = ctx.createRadialGradient(ax,ay,0,ax,ay,r*2.5*pulse)
        glow.addColorStop(0, agent.color+(isActive?'44':'11'))
        glow.addColorStop(1,'transparent')
        ctx.beginPath(); ctx.arc(ax,ay,r*2.5*pulse,0,Math.PI*2)
        ctx.fillStyle=glow; ctx.fill()
        ctx.beginPath(); ctx.arc(ax,ay,r*pulse,0,Math.PI*2)
        ctx.fillStyle=isActive?(agent.color+'44'):'rgba(255,255,255,0.04)'
        ctx.strokeStyle=isActive?agent.color:'rgba(255,255,255,0.1)'
        ctx.lineWidth=isActive?2:1; ctx.fill(); ctx.stroke()
        ctx.font=`${isActive?13:10}px DM Sans,sans-serif`; ctx.textAlign='center'
        ctx.fillText(agent.icon,ax,ay+5)
        ctx.font=`bold ${isActive?9:8}px DM Sans,sans-serif`
        ctx.fillStyle=isActive?'#fff':'rgba(255,255,255,0.3)'
        ctx.fillText(agent.name,ax,ay+r*pulse+14)
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [activeFilter])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const CW = canvas.clientWidth, CH = canvas.clientHeight
    const found = AGENTS.find(a => {
      const dx = a.x*CW-mx, dy = a.y*CH-my
      return Math.sqrt(dx*dx+dy*dy) < 28
    })
    setHovered(found ?? null)
  }, [])

  return (
    <div style={{ position:'relative' }}>
      <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)}
        style={{ width:'100%', height:420, cursor:'crosshair', borderRadius:16 }} />
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
            style={{ position:'absolute', top:16, right:16, background:'rgba(9,13,26,0.95)', border:`1px solid ${hovered.color}44`, borderRadius:16, padding:'16px 20px', width:260, backdropFilter:'blur(16px)', zIndex:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ fontSize:22 }}>{hovered.icon}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#fff' }}>{hovered.name}</div>
                <div style={{ fontSize:11, color:hovered.color }}>{hovered.model}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {[['Tasks/min', hovered.tasksPerMin.toString()], ['Accuracy', `${hovered.accuracy}%`]].map(([l,v]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'var(--mist)' }}>{l}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:hovered.color }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--mist)', marginBottom:12, lineHeight:1.5 }}>
              <span style={{ color:'var(--white)', fontWeight:600 }}>Last decision:</span> {hovered.lastDecision}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['Pause','Promote','Clone'].map(action => (
                <button key={action} style={{ flex:1, padding:'5px 0', borderRadius:6, border:`1px solid ${hovered.color}33`, background:`${hovered.color}11`, color:hovered.color, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  {action}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUEPRINT SYSTEM MAP (SVG with plane nodes + side-sheet)
// ═══════════════════════════════════════════════════════════════════════════
type PlaneId = 'data'|'ai'|'action'|'compliance'
interface BlueprintPlane {
  id: PlaneId; label: string; color: string
  x: number; y: number
  elements: { name:string; sla:string; latency:string; desc:string }[]
}
const BLUEPRINT_PLANES: BlueprintPlane[] = [
  { id:'data', label:'Data Plane', color:'#1A6DB5', x:25, y:30,
    elements:[
      {name:'Cloudflare D1 (SQLite)', sla:'99.999%', latency:'<2ms',   desc:'Globally distributed SQLite for lease, tenant, and property records.'},
      {name:'Cloudflare KV',          sla:'99.99%',  latency:'<1ms',   desc:'Edge key-value store for session state, cache, and real-time signals.'},
      {name:'Cloudflare R2',          sla:'99.99%',  latency:'<8ms',   desc:'S3-compatible object storage for documents, images, and lease PDFs.'},
      {name:'Workers AI Binding',     sla:'99.9%',   latency:'<12ms',  desc:'Inference at the edge via Workers AI — Llama 3.1, DistilWhisper.'},
    ]
  },
  { id:'ai', label:'AI Plane', color:'#2A9DE8', x:75, y:30,
    elements:[
      {name:'Google Gemini 2.5 Pro',  sla:'99.95%',  latency:'<800ms', desc:'Primary reasoning engine for lease analysis, compliance, and valuations.'},
      {name:'OpenAI GPT-4o',          sla:'99.9%',   latency:'<600ms', desc:'Copilot, screening, document generation, and multi-turn conversations.'},
      {name:'Anthropic Claude Opus 4',sla:'99.9%',   latency:'<900ms', desc:'Long-context legal documents, dispute resolution, and safety filtering.'},
      {name:'Meta Llama 4 Scout',     sla:'n/a',     latency:'<50ms',  desc:'On-device inference for privacy-first tenant scoring — zero data egress.'},
    ]
  },
  { id:'action', label:'Action Plane', color:'#2A9D6E', x:25, y:70,
    elements:[
      {name:'Stripe Connect',         sla:'99.99%',  latency:'<200ms', desc:'Rent collection, vendor payments, and split-rent disbursement rails.'},
      {name:'DocuSign eSignature',    sla:'99.9%',   latency:'<400ms', desc:'Lease execution, renewals, and compliance doc signing workflows.'},
      {name:'Twilio (SMS/WhatsApp)',  sla:'99.95%',  latency:'<300ms', desc:'Tenant/landlord communications, alerts, and 2FA verification.'},
      {name:'Plaid (Open Banking)',   sla:'99.9%',   latency:'<500ms', desc:'Bank verification, rent payment automation, and income verification.'},
    ]
  },
  { id:'compliance', label:'Compliance Plane', color:'#a78bfa', x:75, y:70,
    elements:[
      {name:'SOC 2 Type II',          sla:'Annual',  latency:'n/a',    desc:'Continuous monitoring with automated evidence collection for auditors.'},
      {name:'GDPR / UK GDPR',         sla:'Always',  latency:'n/a',    desc:'Data residency controls, DSAR automation, and consent management.'},
      {name:'Fair Housing Act (US)',  sla:'Always',  latency:'n/a',    desc:'AI-powered discrimination detection in listings and communications.'},
      {name:'RERA (UAE/IN)',          sla:'Always',  latency:'n/a',    desc:'Dubai and Indian real estate regulatory compliance automation.'},
    ]
  },
]

function BlueprintSystemMap() {
  const [selected, setSelected] = useState<BlueprintPlane>(BLUEPRINT_PLANES[0])

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
      {/* SVG Map */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--mist)', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.1em' }}>System Architecture — Click Any Plane</div>
        <svg viewBox="0 0 100 100" style={{ width:'100%', height:'auto' }} preserveAspectRatio="xMidYMid meet">
          {/* Connections to center */}
          {BLUEPRINT_PLANES.map(p => (
            <line key={p.id} x1={p.x} y1={p.y} x2={50} y2={50}
              stroke={selected.id===p.id?p.color:'rgba(255,255,255,0.08)'} strokeWidth={selected.id===p.id?0.8:0.4}
              strokeDasharray={selected.id===p.id?'none':'2,2'} />
          ))}
          {/* Center sovereign core */}
          <circle cx={50} cy={50} r={8} fill="rgba(26,109,181,0.3)" stroke="#1A6DB5" strokeWidth={1} />
          <text x={50} y={51.5} textAnchor="middle" fill="#fff" fontSize={2.8} fontWeight="bold">SOVEREIGN</text>
          <text x={50} y={54.5} textAnchor="middle" fill="#8892A4" fontSize={2.2}>OS CORE v4.8</text>
          {/* Plane nodes */}
          {BLUEPRINT_PLANES.map(p => (
            <g key={p.id} onClick={() => setSelected(p)} style={{ cursor:'pointer' }}>
              <circle cx={p.x} cy={p.y} r={selected.id===p.id?9:7}
                fill={selected.id===p.id?`${p.color}33`:'rgba(255,255,255,0.04)'}
                stroke={p.color} strokeWidth={selected.id===p.id?1.5:0.8}
                style={{ transition:'all 0.3s' }} />
              <text x={p.x} y={p.y+1.2} textAnchor="middle" fill={selected.id===p.id?'#fff':'#8892A4'}
                fontSize={2.6} fontWeight="bold">{p.label.split(' ')[0]}</text>
              <text x={p.x} y={p.y+4} textAnchor="middle" fill={p.color} fontSize={2}>{p.label.split(' ')[1]||''}</text>
            </g>
          ))}
        </svg>
      </div>
      {/* Side-sheet */}
      <AnimatePresence mode="wait">
        <motion.div key={selected.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${selected.color}33`, borderRadius:20, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:selected.color, boxShadow:`0 0 12px ${selected.color}` }} />
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#fff' }}>{selected.label}</div>
              <div style={{ fontSize:11, color:'var(--mist)' }}>{selected.elements.length} services integrated</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {selected.elements.map((el, i) => (
              <motion.div key={el.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'#fff' }}>{el.name}</span>
                  <div style={{ display:'flex', gap:8, fontSize:10 }}>
                    <span style={{ color:'#10b981', fontWeight:700 }}>{el.sla}</span>
                    <span style={{ color:selected.color, fontWeight:700 }}>{el.latency}</span>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--mist)', lineHeight:1.5 }}>{el.desc}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button style={{ flex:1, padding:'9px 0', borderRadius:10, border:`1px solid ${selected.color}44`, background:`${selected.color}11`, color:selected.color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              Inspect API Docs
            </button>
            <button style={{ flex:1, padding:'9px 0', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'var(--mist)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              Connect →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF LOGOS
// ═══════════════════════════════════════════════════════════════════════════
const LOGOS = ['Blackstone','Greystar','CBRE','Zillow','Compass','JLL','Brookfield',
  'Equity Residential','Vonovia','Mitsubishi Estate','Hines','Mitsui Fudosan',
  'AvalonBay','Invitation Homes','Essex Property','Camden Property','MAA','NMI',
  'Colliers','Savills','Knight Frank','Cushman & Wakefield','Nuveen','Starwood']

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMY COURSES DATA
// ═══════════════════════════════════════════════════════════════════════════
const ACADEMY_TRACKS: Record<string, { next:string; cert:string; progress:number }> = {
  landlord: { next:'Portfolio Autopilot Masterclass', cert:'CPM Prep — Module 4', progress:65 },
  tenant:   { next:'Know Your Rights — UK Edition', cert:'Tenant Passport Certification', progress:42 },
  agent:    { next:'AI-Powered Listing Mastery', cert:'NAR CE Credits — Fair Housing', progress:78 },
  investor: { next:'Cap Rate & IRR Deep Dive', cert:'CCIM Fundamentals — Module 2', progress:30 },
  vc:       { next:'PropTech Due Diligence 101', cert:'LP Reporting & Fiduciary Duty', progress:55 },
  pm:       { next:'Work Order Orchestration at Scale', cert:'REIT Analyst Track — Module 3', progress:88 },
  govt:     { next:'Fair Housing Act — 2026 Updates', cert:'RERA Compliance Certification', progress:22 },
  vendor:   { next:'Maximising Platform Earnings', cert:'Verified Contractor Badge', progress:91 },
}

const LEADERBOARD = [
  { rank:'1', user:'Marcus K.', country:'🇬🇧', xp:'42,850', title:'Platinum Portfolio Architect', badge:'🏆' },
  { rank:'2', user:'Serena L.',  country:'🇦🇪', xp:'39,120', title:'Diamond Asset Principal',      badge:'💎' },
  { rank:'3', user:'Julian R.',  country:'🇺🇸', xp:'35,400', title:'Gold Landlord Lead',            badge:'🥇' },
  { rank:'4', user:'Amara O.',   country:'🇰🇪', xp:'31,800', title:'Gold Property Manager',         badge:'🏅' },
  { rank:'5', user:'Sophie L.',  country:'🇫🇷', xp:'28,240', title:'Silver Compliance Expert',      badge:'🥈' },
]

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER DATA
// ═══════════════════════════════════════════════════════════════════════════
const FOOTER_COLS = [
  { title:'Platform', links:['Predictive OS','Agentforce','AI Copilot','Blueprint Studio','Rent Engine','Lease Vault','Maintenance Hub','Compliance Cloud','Payments Rails','Open API','Mobile Apps (iOS/Android)','Status Page','Changelog','Roadmap'] },
  { title:'Solutions', links:['For Landlords','For Tenants','For Real Estate Agents','For Brokerages','For Property Managers','For REITs','For Investors','For VC Funds','For Family Offices','For Housing Authorities','For Vendors','For Insurance Carriers','For Mortgage Lenders','For Title Companies'] },
  { title:'Academy', links:['Browse All Courses','Landlord Bootcamp','Tenant Rights Masterclass','Agent Licensing Prep','Investor Fundamentals','REIT Analyst Track','PropTech Founder School','Certifications Catalog','CPM Prep','CCIM Prep','RERA Prep (UAE/IN)','NAR CE Credits','Live Cohorts','Podcasts','Scholarships','Leaderboard'] },
  { title:'Resources', links:['Help Center','Documentation','API Reference','SDKs (JS/Python/Go)','Postman Collection','Developer Portal','Integrations (600+)','Templates Gallery','Lease Library','Market Reports','Annual Tenancy Index','Research Lab','Blog','Newsroom','ROI Calculator','Trust Center'] },
  { title:'Community', links:['Global Tenancy Summit','easyTenancy Connect','Regional Meetups','Slack Community','Discord','Reddit r/easyTenancy','Customer Advisory Board','Partner Network','Affiliate Program','Referral Rewards','Open-Source Projects','Hackathons','easyTenancy Ventures','Startup Accelerator'] },
  { title:'Company', links:['About','Mission & Manifesto','Leadership','Board of Directors','Careers (400+ open)','Press Kit','Investor Relations','Annual Report','Impact Report (ESG)','DEI Report','Sustainability','24 Global Offices','Contact Sales','Contact Support','Bug Bounty'] },
  { title:'Legal & Trust', links:['Privacy Policy','Terms of Service','Acceptable Use','Cookie Settings','DPA','GDPR Compliance','CCPA','LGPD / PDPA','SOC 2 Type II','ISO 27001 / 27701','HIPAA Policy','Fair Housing Pledge','Accessibility (WCAG 2.2 AA)','Responsible AI Charter','Modern Slavery Statement'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function PredictiveLifeOS() {
  const [params] = useSearchParams()
  const country = params.get('country') ?? 'KE'
  const accent = COUNTRY_ACCENT[country] ?? BRAND.blue

  // Persona state — reads from URL hash
  const [activePersonaId, setActivePersonaId] = useState<string>('landlord')
  const persona = useMemo(() => PERSONAS.find(p=>p.id===activePersonaId)??PERSONAS[0], [activePersonaId])

  // Tab state (existing tabs preserved + new tabs)
  const [activeSection, setActiveSection] = useState<'enterprise'|'overview'|'crm'|'intelligence'|'spatial'|'staging'|'agents'|'blueprint'>('enterprise')

  // Copilot
  const [copilotInput, setCopilotInput] = useState('')
  const [copilotOutput, setCopilotOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const streamRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // Demo modal
  const [demoOpen, setDemoOpen] = useState(false)

  // Agent log live simulation
  const [agentLog, setAgentLog] = useState<AgentAction[]>(AGENT_LOG)
  useEffect(() => {
    const t = setInterval(() => {
      setAgentLog(prev => {
        const updated = [...prev]
        const running = updated.filter(a=>a.status==='running')
        const queued  = updated.filter(a=>a.status==='queued')
        if (running.length>0 && Math.random()>0.5) {
          const idx = updated.indexOf(running[0])
          updated[idx] = {...updated[idx], status:'done', time:'just now'}
        }
        if (queued.length>0 && Math.random()>0.6) {
          const idx = updated.indexOf(queued[0])
          updated[idx] = {...updated[idx], status:'running', time:'now'}
        }
        return updated
      })
    }, 2800)
    return () => clearInterval(t)
  }, [])

  // Hash-based persona routing
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace('#persona=','')
      if (PERSONAS.find(p=>p.id===hash)) setActivePersonaId(hash)
    }
    window.addEventListener('hashchange', readHash)
    readHash()
    return () => window.removeEventListener('hashchange', readHash)
  }, [])

  const switchPersona = useCallback((id: string) => {
    setActivePersonaId(id)
    history.replaceState(null,'',`#persona=${id}`)
  }, [])

  // Streaming copilot
  const runCopilot = useCallback((cmd: string) => {
    if (streamRef.current) clearInterval(streamRef.current)
    setCopilotInput(cmd)
    setCopilotOutput('')
    setIsStreaming(true)
    const target = COPILOT_RESPONSES[cmd] ?? `▸ Executing: ${cmd}\n\n✅ Command queued for processing by Agentforce constellation.`
    let i = 0
    streamRef.current = setInterval(() => {
      setCopilotOutput(prev => prev + target[i])
      i++
      if (i >= target.length) {
        clearInterval(streamRef.current!)
        setIsStreaming(false)
      }
    }, 12)
  }, [])

  const TABS = [
    { id:'enterprise',  label:'Enterprise Hub',   icon:'◆' },
    { id:'overview',    label:'Overview',         icon:'⚡' },
    { id:'crm',         label:'CRM Intelligence', icon:'🎯' },
    { id:'intelligence',label:'Actionable Intel', icon:'🧠' },
    { id:'spatial',     label:'Spatial Graph',    icon:'🌐' },
    { id:'staging',     label:'AI Staging',       icon:'🏠' },
    { id:'agents',      label:'Agentforce Live',  icon:'🤖' },
    { id:'blueprint',   label:'Blueprint Map',    icon:'🗺️' },
  ] as const

  // ─────────────────────────────────────────────────────────────────────────
  // JSON-LD for Academy SEO
  const jsonLd = {
    "@context":"https://schema.org",
    "@graph":[
      { "@type":"Course", "name":"easyTenancy Academy — Landlord Foundations",
        "description":"Scale property portfolio to zero-touch operation using sovereign AI agents.",
        "provider":{"@type":"Organization","name":"easyTenancy Academy"} },
      { "@type":"PodcastSeries", "name":"The Yield Curve",
        "description":"Weekly deep-dives into real estate tax planning, automation, and PropTech.",
        "url":"https://easytenancy.com/academy/podcasts/the-yield-curve" },
      { "@type":"BreadcrumbList", "itemListElement":[
        {"@type":"ListItem","position":1,"name":"Home","item":"https://easytenancy.com"},
        {"@type":"ListItem","position":2,"name":"Predictive OS","item":"https://easytenancy.com/predictive-os"},
        {"@type":"ListItem","position":3,"name":"Academy","item":"https://easytenancy.com/academy"}
      ]}
    ]
  }

  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
  }

  return (
    <motion.main initial="initial" animate="enter" exit="exit" variants={PAGE_VARIANTS} style={{ paddingTop:64, background:'var(--ink)', minHeight:'100vh', color:'var(--white)' }}>
      <SEO title="Predictive OS" description="Enterprise Hub powered by autonomous AI agents." url="/predictive-os" />
      {/* ── JSON-LD Schema ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(jsonLd) }} />

      {/* ── Sovereign Page Header ── */}
      <SovereignPageHeader
        badge="Live · Agentforce Running"
        badgeColor="#10b981"
        title={<>Predictive OS Enterprise Hub<br /><span style={{ fontSize:'clamp(14px,1.8vw,24px)', fontWeight:600, color:'var(--mist)', letterSpacing:'-0.5px' }}>Powered by Google · Salesforce · Meta</span></>}
        subtitle="Autonomous AI agents run your entire portfolio — churn prediction, lease renewal, compliance audits, rent collection — without a single manual step."
        stats={[
          { label:'Agents Active',   value:'12',   icon:'🤖', color:'#10b981' },
          { label:'Predictions/day', value:'48M',  icon:'🧠', color:accent },
          { label:'Leases Managed',  value:'2.4M', icon:'📄', color:BRAND.blueLight },
          { label:'Avg ROI',         value:'400×', icon:'📈', color:'#f59e0b' },
        ]}
        actions={[
          { label:'📊 Blueprint', href:'/global-dominance' },
          { label:'🤖 AI Copilot', href:'/app/demo', primary:true },
        ]}
        compact
      />

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: PERSONA SWITCHER — Sticky glassmorphic pill bar
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ position:'sticky', top:64, zIndex:50, background:'rgba(5,8,16,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'10px 0' }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, overflowX:'auto', paddingBottom:2 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--mist)', textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap', flexShrink:0 }}>Role:</span>
            <div style={{ display:'flex', gap:4, padding:'4px', background:'rgba(255,255,255,0.04)', borderRadius:999, border:'1px solid rgba(255,255,255,0.06)' }}>
              {PERSONAS.map(p => {
                const isActive = activePersonaId === p.id
                return (
                  <motion.button key={p.id} onClick={() => switchPersona(p.id)} layoutId={isActive?'persona-active':undefined}
                    style={{ position:'relative', padding:'6px 14px', borderRadius:999, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', fontFamily:'var(--font-body)',
                      background:isActive?`linear-gradient(135deg,${p.gradFrom},${p.gradTo})`:'transparent',
                      color:isActive?'#fff':'var(--mist)',
                      boxShadow:isActive?`0 0 16px ${p.accent}44`:'none',
                      transition:'all 0.28s cubic-bezier(0.32,0.72,0,1)' }}>
                    {p.emoji} {p.title}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: DYNAMIC HERO — Persona-aware
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'56px 0 48px', background:`radial-gradient(ellipse 80% 60% at 50% 0%, ${persona.accent}18, transparent 70%)` }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activePersonaId} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}>

              {/* Headline */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', borderRadius:999, background:`${persona.accent}22`, border:`1px solid ${persona.accent}44`, marginBottom:20 }}>
                <span style={{ fontSize:16 }}>{persona.emoji}</span>
                <span style={{ fontSize:11, fontWeight:700, color:persona.accent, textTransform:'uppercase', letterSpacing:'0.1em' }}>{persona.title} Intelligence Active</span>
              </div>
              <h1 style={{ fontSize:'clamp(22px,3.5vw,46px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-1.5px', lineHeight:1.15, maxWidth:760, marginBottom:20, color:'#fff' }}>
                {persona.headline}
              </h1>
              <p style={{ fontSize:'clamp(14px,1.4vw,17px)', color:'var(--mist)', maxWidth:600, lineHeight:1.7, marginBottom:32 }}>
                easyTenancy Predictive OS — the world's first AI-native real estate operating system designed for {persona.title.toLowerCase()}s. Every signal, every action, every decision — autonomous.
              </p>

              {/* CTAs */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ padding:'14px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${persona.gradFrom},${persona.gradTo})`, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'var(--font-body)', boxShadow:`0 8px 28px ${persona.accent}44` }}>
                  Initialize Autonomous Mode →
                </motion.button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={() => setDemoOpen(true)}
                  style={{ padding:'14px 24px', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:28, height:28, borderRadius:'50%', background:`${persona.accent}33`, border:`1px solid ${persona.accent}66`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>▶</span>
                  Watch 90-sec Demo
                </motion.button>
                <a href={`/app/demo#persona=${activePersonaId}`}
                  style={{ padding:'14px 24px', borderRadius:12, border:`1px solid ${persona.accent}44`, background:'transparent', color:persona.accent, fontWeight:700, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-body)' }}>
                  🤖 Live AI Copilot →
                </a>
              </div>

              {/* KPI Quartet */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, maxWidth:680 }}>
                {persona.kpis.map((kpi,i) => (
                  <motion.div key={kpi.label} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1+i*0.05 }}
                    style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${persona.accent}33`, borderRadius:16, padding:'16px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:'clamp(18px,2vw,26px)', fontWeight:900, color:persona.accent, fontFamily:'var(--font-head)', letterSpacing:'-0.5px' }}>
                      <AnimatedCounter value={kpi.value} />
                    </div>
                    <div style={{ fontSize:10, color:'var(--mist)', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{kpi.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: SOCIAL PROOF MARQUEE
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'20px 0', overflow:'hidden', background:'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign:'center', marginBottom:10, fontSize:11, fontWeight:700, color:'var(--mist)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
          $1.4T Assets Under Management · 127 Countries · 4.9★ from 12,847 Reviews · 99.997% Uptime
        </div>
        <div style={{ overflow:'hidden', position:'relative' }}>
          <div className="animate-marquee">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <div key={i} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:160, height:40, margin:'0 8px',
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'0 20px',
                fontSize:12, fontWeight:700, color:'var(--mist)', whiteSpace:'nowrap', flexShrink:0 }}>
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4: PERSONA FEATURE GRID + AI COPILOT (side by side)
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding:'48px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activePersonaId+'-features'}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
              transition={{ duration:0.28 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:28, alignItems:'start' }}>

              {/* Feature Grid */}
              <div>
                <h2 style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.8px', marginBottom:8, color:'#fff' }}>
                  {persona.emoji} {persona.title} Feature Suite
                </h2>
                <p style={{ fontSize:13, color:'var(--mist)', marginBottom:24, lineHeight:1.6 }}>
                  {persona.features.length} AI-powered capabilities engineered specifically for {persona.title.toLowerCase()}s. Every feature runs autonomously 24/7.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
                  {persona.features.map((feat,i) => (
                    <motion.div key={feat.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                      style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${persona.accent}22`, borderRadius:14, padding:'14px 16px',
                        transition:'all 0.2s', cursor:'default' }}
                      whileHover={{ borderColor:`${persona.accent}55`, background:'rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:18 }}>{feat.icon}</span>
                        <span style={{ fontWeight:700, fontSize:13, color:'#fff' }}>{feat.name}</span>
                      </div>
                      <p style={{ fontSize:11.5, color:'var(--mist)', margin:0, lineHeight:1.55 }}>{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI Copilot Panel */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${persona.accent}33`, borderRadius:20, padding:20, position:'sticky', top:120 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', animation:'pulse 1.5s infinite' }} />
                  <span style={{ fontWeight:800, fontSize:14 }}>AI Copilot</span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:'var(--mist)', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:999 }}>GPT-4o · Gemini 2.5</span>
                </div>

                {/* Output terminal */}
                <div style={{ background:'#050810', borderRadius:12, padding:14, marginBottom:14, minHeight:120, maxHeight:220, overflowY:'auto',
                  fontFamily:'var(--font-mono)', fontSize:11.5, lineHeight:1.7, color:copilotOutput?'#a8e6cf':'var(--mist)',
                  whiteSpace:'pre-wrap', border:'1px solid rgba(255,255,255,0.06)' }}>
                  {copilotOutput || 'Select a prompt below or type a command...\nPowered by Agentforce constellation (12 agents active).'}
                  {isStreaming && <span style={{ animation:'blink 0.7s infinite', color:persona.accent }}>▌</span>}
                </div>

                {/* Preset prompts */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--mist)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    Preset Commands — {persona.title}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {persona.prompts.map(p => (
                      <button key={p.cmd} onClick={() => runCopilot(p.cmd)}
                        style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:8, border:`1px solid rgba(255,255,255,0.06)`, background:'rgba(255,255,255,0.03)',
                          cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor=`${persona.accent}55`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
                        <div style={{ fontSize:11, fontWeight:700, color:persona.accent, fontFamily:'var(--font-mono)' }}>{p.cmd}</div>
                        <div style={{ fontSize:10, color:'var(--mist)', marginTop:2 }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div style={{ display:'flex', gap:8 }}>
                  <input value={copilotInput} onChange={e => setCopilotInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && runCopilot(copilotInput)}
                    placeholder="Type a slash command..."
                    style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:12, fontFamily:'var(--font-mono)', color:'#fff', outline:'none' }} />
                  <button onClick={() => runCopilot(copilotInput)}
                    style={{ padding:'9px 14px', borderRadius:8, border:'none', background:persona.accent, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    Run
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5: AGENTFORCE CONSTELLATION (12 agents)
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding:'48px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.8px', marginBottom:6, color:'#fff' }}>
                Agentforce Constellation
              </h2>
              <p style={{ fontSize:13, color:'var(--mist)', margin:0, maxWidth:540 }}>
                12 autonomous AI agents — hover any node to inspect model, tasks/min, accuracy, last decision, and take control. Persona switch dims irrelevant agents.
              </p>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[['Running','#f59e0b',agentLog.filter(a=>a.status==='running').length],['Done','#10b981',agentLog.filter(a=>a.status==='done').length],['Queued','var(--mist)',agentLog.filter(a=>a.status==='queued').length]].map(([l,c,v]) => (
                <div key={l as string} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:8, padding:'6px 12px', fontSize:12 }}>
                  <span style={{ color:c as string, fontWeight:700 }}>{v as number}</span>
                  <span style={{ color:'var(--mist)', marginLeft:4 }}>{l as string}</span>
                </div>
              ))}
            </div>
          </div>
          <AgentConstellation activeFilter={persona.agentFilter} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TAB BAR (existing tabs preserved)
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
        <div className="inner">
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id as typeof activeSection)}
                style={{ padding:'16px 22px', border:'none', background:'none', color:activeSection===tab.id?accent:'var(--mist)', fontWeight:700, fontSize:13, cursor:'pointer', borderBottom:`2px solid ${activeSection===tab.id?accent:'transparent'}`, transition:'all 0.2s', whiteSpace:'nowrap', fontFamily:'var(--font-body)' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab panels */}
      <div className="inner" style={{ padding:'32px clamp(18px,5vw,64px)' }}>
        <AnimatePresence mode="wait">

          {/* ENTERPRISE HUB — PRD-aligned command surface (8 personas × 8 modules × edge-cases) */}
          {activeSection==='enterprise' && (
            <motion.div key="enterprise"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
              transition={{ duration:0.25 }}>
              <Suspense fallback={<PanelLoader label="Loading Enterprise Hub…" />}>
                <EnterpriseHub />
              </Suspense>
            </motion.div>
          )}

          {/* OVERVIEW */}
          {activeSection==='overview' && (
            <motion.div key="overview" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:32 }}>
                {PREDICTIVE_CARDS.map((card,i) => (
                  <motion.div key={i} initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.06 }}
                    style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${card.color}33`, borderRadius:20, padding:22 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:22 }}>{card.icon}</span>
                        <span style={{ fontSize:13, fontWeight:700 }}>{card.title}</span>
                      </div>
                      <span style={{ fontSize:12, color:card.trend==='up'?'#10b981':card.trend==='down'?'#ef4444':'var(--mist)' }}>
                        {card.trend==='up'?'↑':card.trend==='down'?'↓':'→'}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
                      <ScoreRing score={card.score} color={card.color} size={56} />
                      <p style={{ fontSize:12, color:'var(--mist)', lineHeight:1.55, margin:0 }}>{card.insight}</p>
                    </div>
                    <button style={{ width:'100%', padding:'9px 0', borderRadius:10, border:`1px solid ${card.color}44`, background:`${card.color}15`, color:card.color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                      {card.action} →
                    </button>
                  </motion.div>
                ))}
              </div>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--mist)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>Agentforce — Last 7 Actions</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {agentLog.slice(0,4).map(a => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, fontSize:13 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:a.status==='done'?'#10b981':a.status==='running'?'#f59e0b':'var(--mist)', flexShrink:0 }} />
                      <span style={{ color:accent, fontWeight:700, minWidth:120, flexShrink:0 }}>{a.agent}</span>
                      <span style={{ color:'var(--mist)', flex:1 }}>{a.action}</span>
                      <span style={{ color:'#10b981', fontWeight:700, whiteSpace:'nowrap' }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CRM */}
          {activeSection==='crm' && (
            <motion.div key="crm" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.6px', margin:'0 0 6px' }}>Einstein CRM Intelligence</h2>
              <p style={{ fontSize:14, color:'var(--mist)', margin:'0 0 24px' }}>Salesforce Data Cloud unifies all records — Einstein Prediction Builder scores every contact automatically.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
                {[['52,400','Managed Contacts',BRAND.blue],['94.2%','Einstein Score Avg',BRAND.blueLight],['3.2×','Lead Conversion Lift',BRAND.teal]].map(([v,l,c],i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${c}33`, borderRadius:16, padding:'16px 20px', textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:900, color:c as string, fontFamily:'var(--font-head)', letterSpacing:'-0.5px' }}>{v}</div>
                    <div style={{ fontSize:12, color:'var(--mist)', marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {CRM_RECORDS.map((rec,i) => {
                  const ac = COUNTRY_ACCENT[rec.country]??BRAND.blue
                  return (
                    <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}
                      style={{ display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px 20px', flexWrap:'wrap' }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:`${ac}22`, border:`1px solid ${ac}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                        {rec.type==='tenant'?'🏠':rec.type==='landlord'?'🏢':'💼'}
                      </div>
                      <div style={{ flex:1, minWidth:140 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{rec.name}</div>
                        <div style={{ fontSize:11, color:'var(--mist)', textTransform:'capitalize' }}>{rec.type} · {rec.country}</div>
                      </div>
                      <ScoreRing score={rec.score} color={ac} size={44} />
                      <div style={{ flex:2, minWidth:180 }}>
                        <div style={{ fontSize:12, color:'var(--mist)', marginBottom:2 }}>Next Action</div>
                        <div style={{ fontSize:13 }}>{rec.nextAction}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:ac }}>{rec.value}</div>
                        <div style={{ fontSize:11, color:'var(--mist)' }}>value</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* SPATIAL */}
          {activeSection==='spatial' && (
            <motion.div key="spatial" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.6px', margin:'0 0 6px' }}>Spatial Social Ecosystem</h2>
              <p style={{ fontSize:14, color:'var(--mist)', margin:'0 0 24px' }}>Meta Presence Platform + WebXR AR creates a live spatial layer over every property. Llama 4 on-device for zero-latency intelligence.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
                <div>
                  <h3 style={{ fontSize:18, fontWeight:800, fontFamily:'var(--font-head)', marginBottom:8 }}>Live Architecture Graph</h3>
                  <SpatialGraph />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[{icon:'🥽',title:'AR Property Scan',desc:'Point phone at building → instant overlay: yield, vacancy, compliance, tenant satisfaction.',status:'Live'},{icon:'🌐',title:'Social Graph Overlay',desc:'Benchmark vs. 50K+ peers in Meta Social Graph. Connect in-app.',status:'Live'},{icon:'📊',title:'Spatial Market Intel',desc:'Walk a street and see AI valuations projected via WebXR passthrough AR.',status:'Beta'},{icon:'🤝',title:'Virtual Deal Room',desc:'Meta Horizon Worlds-powered virtual property showcases for global buyers.',status:'Q3 2026'},{icon:'🧠',title:'On-Device Llama 4',desc:'All AI inference on-device via Llama 4 Scout. Zero data leaves your phone.',status:'Live'},{icon:'👁',title:'Eye-Tracking Heatmaps',desc:'Meta Movement SDK captures prospect focus zones — reveals true buying intent.',status:'Beta'}].map((f,i) => (
                    <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{f.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontWeight:700, fontSize:13 }}>{f.title}</span>
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:f.status==='Live'?'rgba(16,185,129,0.15)':f.status==='Beta'?'rgba(245,158,11,0.15)':'rgba(167,139,250,0.15)', color:f.status==='Live'?'#10b981':f.status==='Beta'?'#f59e0b':'#a78bfa', fontWeight:700 }}>{f.status}</span>
                        </div>
                        <p style={{ fontSize:12, color:'var(--mist)', margin:0, lineHeight:1.5 }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* INTELLIGENCE */}
          {activeSection==='intelligence' && (
            <motion.div key="intelligence" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.6px', margin:'0 0 6px' }}>Actionable Intelligence</h2>
              <p style={{ fontSize:14, color:'var(--mist)', margin:'0 0 24px' }}>Einstein GPT churn prediction + Agentforce retention sequences — identifies at-risk tenants and launches interventions automatically.</p>
              <Suspense fallback={<PanelLoader label="Loading Actionable Intelligence…" />}>
                <ActionableIntelligence filterSegment="all" maxCards={5} />
              </Suspense>
            </motion.div>
          )}

          {/* STAGING */}
          {activeSection==='staging' && (
            <motion.div key="staging" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <Suspense fallback={<PanelLoader label="Loading Spatial Staging…" />}>
                <SpatialStaging propertyData={{ name:'Nairobi Heights — Unit 4B', type:'Apartment', bedrooms:'3', bathrooms:'2', sqm:'142', price:'KES 185,000/mo', location:'Westlands, Nairobi, Kenya', features:'Smart Home Ready · City View · Secure Parking · Fibre Internet' }} />
              </Suspense>
            </motion.div>
          )}

          {/* AGENTS */}
          {activeSection==='agents' && (
            <motion.div key="agents" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                <div style={{ fontSize:13, color:'var(--mist)' }}>
                  <span style={{ color:'#10b981', fontWeight:700 }}>{agentLog.filter(a=>a.status==='done').length}</span> completed ·&nbsp;
                  <span style={{ color:'#f59e0b', fontWeight:700 }}>{agentLog.filter(a=>a.status==='running').length}</span> running ·&nbsp;
                  <span style={{ fontWeight:700 }}>{agentLog.filter(a=>a.status==='queued').length}</span> queued
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, color:'var(--mist)' }}>Auto-updating every 2.8s</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <AnimatePresence>
                  {agentLog.map((a,i) => (
                    <motion.div key={a.id} layout initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                      style={{ display:'flex', alignItems:'center', gap:14, background:a.status==='running'?'rgba(245,158,11,0.06)':'rgba(255,255,255,0.04)', border:`1px solid ${a.status==='running'?'rgba(245,158,11,0.25)':a.status==='done'?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.07)'}`, borderRadius:14, padding:'14px 18px', flexWrap:'wrap' }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:a.status==='done'?'#10b981':a.status==='running'?'#f59e0b':'rgba(255,255,255,0.2)', flexShrink:0, boxShadow:a.status==='running'?'0 0 8px #f59e0b':'none' }} />
                      <span style={{ fontWeight:800, fontSize:13, color:accent, minWidth:130, flexShrink:0 }}>{a.agent}</span>
                      <span style={{ flex:1, fontSize:13, color:'var(--mist)', minWidth:200 }}>{a.action}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#10b981', whiteSpace:'nowrap' }}>{a.value}</span>
                      <span style={{ fontSize:11, color:'var(--mist)', whiteSpace:'nowrap', minWidth:60, textAlign:'right' }}>{a.time}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div style={{ marginTop:32, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:28 }}>
                <h4 style={{ fontFamily:'var(--font-head)', marginBottom:20, fontSize:16 }}>⚡ Agentforce Capabilities</h4>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
                  {[{cap:'Autonomous Lease Renewal',pct:94,color:'#10b981'},{cap:'Rent Collection Automation',pct:99,color:BRAND.blueLight},{cap:'Maintenance Triage',pct:87,color:BRAND.blue},{cap:'Compliance Monitoring',pct:100,color:BRAND.teal},{cap:'Lead Nurture Sequences',pct:82,color:'#f59e0b'},{cap:'Tenant Communication',pct:91,color:'#a78bfa'}].map((c,i) => (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
                        <span style={{ color:'var(--mist)' }}>{c.cap}</span>
                        <span style={{ color:c.color, fontWeight:700 }}>{c.pct}%</span>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${c.pct}%` }} transition={{ duration:1, delay:i*0.1 }} style={{ height:'100%', background:c.color, borderRadius:4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* BLUEPRINT MAP */}
          {activeSection==='blueprint' && (
            <motion.div key="blueprint" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}>
              <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.6px', margin:'0 0 6px' }}>System Architecture Map</h2>
              <p style={{ fontSize:14, color:'var(--mist)', margin:'0 0 28px' }}>Four interconnected planes powering the easyTenancy sovereign stack. Click any plane to inspect services, SLAs, and latency profiles.</p>
              <BlueprintSystemMap />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6: easyTENANCY ACADEMY
      ════════════════════════════════════════════════════════════════ */}
      <section id="academy" style={{ padding:'64px 0', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.01)' }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>

          {/* Academy header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'flex-end', marginBottom:40, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', borderRadius:999, background:'rgba(42,157,110,0.15)', border:'1px solid rgba(42,157,110,0.3)', marginBottom:16 }}>
                <span style={{ fontSize:14 }}>🎓</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#2A9D6E', textTransform:'uppercase', letterSpacing:'0.1em' }}>easyTenancy Academy</span>
              </div>
              <h2 style={{ fontSize:'clamp(24px,4vw,48px)', fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-1.5px', margin:'0 0 12px', color:'#fff' }}>
                The Harvard of Real Estate
              </h2>
              <p style={{ fontSize:'clamp(14px,1.3vw,17px)', color:'var(--mist)', maxWidth:560, lineHeight:1.7, margin:0 }}>
                Advance your functional mastery. Globally recognized certifications, self-paced learning paths, and live cohort programs mapped to multi-jurisdiction frameworks.
              </p>
            </div>
            <a href="/academy" style={{ padding:'12px 24px', borderRadius:12, background:'rgba(42,157,110,0.15)', border:'1px solid rgba(42,157,110,0.3)', color:'#2A9D6E', fontWeight:700, fontSize:13, textDecoration:'none', whiteSpace:'nowrap' }}>
              Browse Full Catalog →
            </a>
          </div>

          {/* 4 Pillar Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:40 }}>
            {[
              { num:'01', title:'Professional Courses', sub:'240+ Self-Paced Tracks', icon:'📚', color:'#1A6DB5',
                desc:'From core landlord structures to institutional REIT portfolio management. Tax structures, asset depreciation, and local ordinance mechanics.' },
              { num:'02', title:'Global Certifications', sub:'Accredited Credentials', icon:'🏅', color:'#2A9D6E',
                desc:'CPM, CCIM-aligned, RERA UAE/IN, NAR CE credits, ARLA UK, REIQ AU — globally verified credentials mapped to regulatory frameworks.' },
              { num:'03', title:'Podcasts & Media', sub:'Weekly Audio Deepdives', icon:'🎙️', color:'#a78bfa',
                desc:'"The Yield Curve", "Tenant Tales", "PropTech Builders", "Capital Stack Confidential" — weekly expert breakdowns with embedded players.' },
              { num:'04', title:'Live Bootcamps', sub:'6-Week Cohorts', icon:'👥', color:'#f59e0b',
                desc:'Instructor-led bootcamps with cohort Slack, capstone projects, and direct grading. Network with peers across 127 countries.' },
            ].map((pillar,i) => (
              <motion.div key={pillar.num} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
                style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${pillar.color}33`, borderRadius:20, padding:24, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:16, right:16, fontSize:11, fontWeight:800, color:pillar.color, opacity:0.3, fontFamily:'var(--font-head)' }}>{pillar.num}</div>
                <span style={{ fontSize:28, display:'block', marginBottom:14 }}>{pillar.icon}</span>
                <div style={{ fontWeight:800, fontSize:15, color:'#fff', marginBottom:4 }}>{pillar.title}</div>
                <div style={{ fontSize:11, color:pillar.color, fontWeight:700, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>{pillar.sub}</div>
                <p style={{ fontSize:12, color:'var(--mist)', margin:0, lineHeight:1.6 }}>{pillar.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Your Learning Path + Leaderboard */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

            {/* Persona-adaptive learning path */}
            <AnimatePresence mode="wait">
              <motion.div key={activePersonaId+'-academy'} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
                style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${persona.accent}33`, borderRadius:20, padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:20 }}>{persona.emoji}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14 }}>Your Learning Path</div>
                    <div style={{ fontSize:11, color:'var(--mist)' }}>Tailored for {persona.title}s · XP Level 12</div>
                  </div>
                </div>
                {(() => {
                  const track = ACADEMY_TRACKS[activePersonaId] ?? ACADEMY_TRACKS.landlord
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'14px 16px' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:persona.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Recommended Next</div>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{track.next}</div>
                        <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                          <motion.div initial={{ width:0 }} whileInView={{ width:`${track.progress}%` }} viewport={{ once:true }} transition={{ duration:1.2, delay:0.2 }}
                            style={{ height:'100%', background:`linear-gradient(90deg,${persona.gradFrom},${persona.gradTo})`, borderRadius:3 }} />
                        </div>
                        <div style={{ fontSize:11, color:'var(--mist)', marginTop:6 }}>{track.progress}% complete · +{Math.round((100-track.progress)*2.4)} XP remaining</div>
                      </div>
                      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'14px 16px' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Upcoming Certification</div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{track.cert}</div>
                        <div style={{ fontSize:11, color:'var(--mist)', marginTop:4 }}>+500 XP · Globally recognized</div>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Global Leaderboard */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14 }}>Global Leaderboard</div>
                  <div style={{ fontSize:11, color:'var(--mist)' }}>Top 1,000 learners worldwide</div>
                </div>
                <span style={{ fontSize:11, color:BRAND.blueLight, fontWeight:700, cursor:'pointer' }}>See all →</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {LEADERBOARD.map((row,i) => (
                  <motion.div key={row.rank} initial={{ opacity:0, x:16 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.06 }}
                    style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'10px 14px' }}>
                    <span style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>{row.badge}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{row.user} {row.country}</div>
                      <div style={{ fontSize:10, color:'var(--mist)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.title}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:BRAND.blueLight, whiteSpace:'nowrap' }}>{row.xp} XP</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 7: KNOWLEDGE EMPIRE FOOTER — 7 columns
      ════════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.01)', padding:'56px 0 0' }}>
        <div className="inner" style={{ padding:'0 clamp(18px,5vw,64px)' }}>

          {/* Logo + mission line */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:48, flexWrap:'wrap', gap:24 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.8px', marginBottom:8 }}>
                easyTenancy<span style={{ color:BRAND.blue }}>.</span>
              </div>
              <p style={{ fontSize:12, color:'var(--mist)', maxWidth:280, lineHeight:1.7, margin:0 }}>
                The world's #1 Global Real Estate Operating System. AI-native, sovereign, and built for 2.4M leases across 120+ countries.
              </p>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {['𝕏','in','▶','♪','📸','⌨️','🦋'].map((icon,i) => (
                <div key={i} style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(26,109,181,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.06)')}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* 7-column grid → expandable cards on mobile, dense grid on desktop */}
          <div className="predictive-footer-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:24, marginBottom:40 }}>
            {FOOTER_COLS.map(col => (
              <ExpandableFooterColumn
                key={col.title}
                title={col.title}
                links={col.links}
                hrefBase="#"
                theme={{
                  titleColor:         'var(--mist)',
                  titleHover:         BRAND.blueLight,
                  linkColor:          'var(--cream)',
                  linkHover:          BRAND.blueLight,
                  border:             'rgba(255,255,255,0.08)',
                  chevronBg:          'rgba(255,255,255,0.04)',
                  titleFontSize:      10,
                  linkFontSize:       11.5,
                  titleLetterSpacing: '0.12em',
                }}
              />
            ))}
          </div>

          {/* Footer base bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'24px 0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--mist)' }}>🌍 40 Languages</span>
              <span style={{ fontSize:11, color:'var(--mist)' }}>💰 140 Currencies</span>
              <span style={{ fontSize:11, color:'#10b981' }}>🌿 Carbon-neutral since 2023</span>
              <span style={{ fontSize:11, color:'var(--mist)' }}>☁️ 100% Renewable Energy</span>
            </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <a href="#" style={{ fontSize:11, color:'var(--mist)', textDecoration:'none' }}>Privacy</a>
              <a href="#" style={{ fontSize:11, color:'var(--mist)', textDecoration:'none' }}>Terms</a>
              <a href="#" style={{ fontSize:11, color:'var(--mist)', textDecoration:'none' }}>Cookies</a>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.04)', padding:'16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>© 2026 easyTenancy, Inc. · Delaware C-Corp · NYSE: ETNC (planned) · All rights reserved.</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Designed for a $100B future. Shipped to 127 countries today.</span>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          DEMO MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {demoOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setDemoOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(8px)' }}>
            <motion.div initial={{ scale:0.9, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:30 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#0D1017', border:`1px solid ${persona.accent}44`, borderRadius:20, width:'100%', maxWidth:860, overflow:'hidden', position:'relative' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:16 }}>easyTenancy — 90 Second Demo</div>
                  <div style={{ fontSize:12, color:'var(--mist)' }}>{persona.emoji} {persona.title} Intelligence Mode</div>
                </div>
                <button onClick={() => setDemoOpen(false)}
                  style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'var(--mist)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, fontFamily:'var(--font-body)' }}>
                  ✕ Close
                </button>
              </div>
              <div style={{ background:'#050810', aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:`${persona.accent}22`, border:`2px solid ${persona.accent}66`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>▶</div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>easyTenancy Predictive OS</div>
                  <div style={{ fontSize:13, color:'var(--mist)' }}>Demo video — Add Vimeo/YouTube embed URL in production</div>
                </div>
              </div>
              <div style={{ padding:'14px 24px', display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                {PERSONAS.map(p => (
                  <button key={p.id} onClick={() => switchPersona(p.id)}
                    style={{ padding:'5px 12px', borderRadius:999, border:`1px solid ${activePersonaId===p.id?p.accent:'rgba(255,255,255,0.1)'}`, background:activePersonaId===p.id?`${p.accent}22`:'transparent', color:activePersonaId===p.id?p.accent:'var(--mist)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                    {p.emoji} {p.title}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.main>
  )
}
