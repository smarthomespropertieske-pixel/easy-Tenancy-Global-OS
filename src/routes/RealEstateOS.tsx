/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RealEstateOS.tsx — $100B Real Estate Operating System
 *  Elite Principal Product Architecture · Mobile-First Progressive Enhancement
 *
 *  VIEWPORT TIERS:
 *    Mobile  < 768px  → Sticky bottom nav (4 tabs) · Single-column · Touch-optimised
 *    Tablet  768-1023px → Collapsible left sidebar · Dual-column layout
 *    Desktop 1024px+  → Full sidebar + user profile · 12-col CSS Grid · Split-pane
 *
 *  ROUTE: /realestate-os
 *
 *  COMPONENT TREE:
 *    RealEstateOS
 *      ├── OSLayout (responsive shell)
 *      │     ├── MobileBottomNav   (mobile only, sticky, glassmorphism)
 *      │     ├── DesktopSidebar    (tablet+, collapsible)
 *      │     └── <main> content area
 *      ├── DashboardView           (Daily Action Stream → multi-widget)
 *      ├── ListingsView            (Swipe cards → server-side data table)
 *      ├── MapView                 (Spatial portfolio map)
 *      └── PipelineView            (Single-stage swipe → full Kanban)
 *
 *  TECH: React 19 + TypeScript + Framer Motion v12 + Lucide React icons
 *        Brand tokens from src/lib/tokens.ts · global.css Neural-Glass system
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { BRAND } from '../lib/tokens'
import { SEO } from '../components/SEO'
import { exportToCSV } from '../lib/exportCsv'

// ─────────────────────────────────────────────────────────────────────────────
//  LUCIDE ICONS  (inline SVG stubs — zero external dependency)
//  Each icon is a pure <svg> returning a React element.
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string; className?: string; strokeWidth?: number; style?: React.CSSProperties }
const Icon = ({ d, size = 20, color = 'currentColor', className = '', strokeWidth = 2, style }: IconProps & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}>
    <path d={d} />
  </svg>
)
const IcoHome    = (p: IconProps) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
const IcoUsers   = (p: IconProps) => <Icon {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
const IcoMap     = (p: IconProps) => <Icon {...p} d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6" />
const IcoKanban  = (p: IconProps) => <Icon {...p} d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 3v18 M15 3v18" />
const IcoTrend   = (p: IconProps) => <Icon {...p} d="M22 7l-8.5 8.5-5-5L2 17 M22 7h-6 M22 7v6" />
const IcoBell    = (p: IconProps) => <Icon {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />
const IcoSearch  = (p: IconProps) => <Icon {...p} d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
const IcoFilter  = (p: IconProps) => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
const IcoChevR   = (p: IconProps) => <Icon {...p} d="M9 18l6-6-6-6" />
const IcoChevL   = (p: IconProps) => <Icon {...p} d="M15 18l-6-6 6-6" />
const IcoDollar  = (p: IconProps) => <Icon {...p} d="M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
const IcoCheck   = (p: IconProps) => <Icon {...p} d="M20 6L9 17l-5-5" />
const IcoClock   = (p: IconProps) => <Icon {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M12 6v6l4 2" />
const IcoAlert   = (p: IconProps) => <Icon {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
const IcoPhone   = (p: IconProps) => <Icon {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
const IcoShare   = (p: IconProps) => <Icon {...p} d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.59 13.51l6.83 3.98 M15.41 6.51l-6.82 3.98" />
const IcoEdit    = (p: IconProps) => <Icon {...p} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
const IcoPlus    = (p: IconProps) => <Icon {...p} d="M12 5v14 M5 12h14" />
const IcoBars    = (p: IconProps) => <Icon {...p} d="M3 12h18 M3 6h18 M3 18h18" />
const IcoX       = (p: IconProps) => <Icon {...p} d="M18 6L6 18 M6 6l12 12" />
const IcoBuilding= (p: IconProps) => <Icon {...p} d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18 M2 22h20 M10 6h1 M13 6h1 M10 10h1 M13 10h1 M10 14h1 M13 14h1" />
const IcoStar    = (p: IconProps) => <Icon {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
const IcoArrowR  = (p: IconProps) => <Icon {...p} d="M5 12h14 M12 5l7 7-7 7" />
const IcoSettings= (p: IconProps) => <Icon {...p} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS  (local, aligned to global.css Neural-Glass system)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#050810',
  bg2:       '#090D1A',
  card:      '#111826',
  card2:     '#1C2235',
  border:    'rgba(255,255,255,0.06)',
  borderHi:  'rgba(42,157,232,0.30)',
  text:      '#F0EDE8',
  text2:     '#8892A4',
  text3:     '#3a5a7a',
  blue:      '#1A6DB5',
  blueL:     '#2A9DE8',
  teal:      '#2A9D6E',
  green:     '#10b981',
  amber:     '#f59e0b',
  red:       '#ef4444',
  purple:    '#a78bfa',
  cyan:      '#39bff6',
  grad:      'linear-gradient(135deg, #1A6DB5 0%, #2A9DE8 60%, #2A9D6E 100%)',
  gradHero:  'linear-gradient(135deg, #2563eb 0%, #39bff6 50%, #7c3aed 100%)',
  glass:     'rgba(14,20,38,0.94)',
  glassBlur: 'blur(24px) saturate(1.6)',
  sidebar:   240, // px width desktop
  sidebarCollapsed: 64,
} as const

// ─────────────────────────────────────────────────────────────────────────────
//  DATA MODELS
// ─────────────────────────────────────────────────────────────────────────────

type NavTab = 'dashboard' | 'leads' | 'map' | 'pipeline'

interface ActionCard {
  id: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  time: string
  icon: string
  action: string
  value?: string
  color: string
}

interface Listing {
  id: string
  address: string
  type: 'Apartment' | 'House' | 'Commercial' | 'Villa'
  beds: number
  baths: number
  sqm: number
  price: string
  priceNum: number
  status: 'For Sale' | 'For Rent' | 'Under Offer' | 'Let Agreed'
  yield: string
  agent: string
  days: number
  score: number
  image: string
  lat: number
  lng: number
  country: string
}

interface Deal {
  id: string
  property: string
  client: string
  value: string
  valueNum: number
  stage: PipelineStage
  probability: number
  agentName: string
  daysInStage: number
  priority: 'hot' | 'warm' | 'cold'
  nextAction: string
  flag: string
}

type PipelineStage =
  | 'New Lead'
  | 'Qualified'
  | 'Viewing Scheduled'
  | 'Under Offer'
  | 'Due Diligence'
  | 'Exchanged'
  | 'Completed'

interface KpiWidget {
  label: string
  value: string
  delta: string
  up: boolean
  color: string
  icon: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEMO DATA  (representative, globally diverse)
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_CARDS: ActionCard[] = [
  {
    id: 'ac1', urgency: 'critical',
    title: 'Counter-offer expiring',
    subtitle: 'Mayfair Penthouse — buyer counter at £2.85M · expires in 12 min',
    time: '12 min', icon: '⏱️', action: 'Review Offer', value: '£2.85M', color: T.red,
  },
  {
    id: 'ac2', urgency: 'critical',
    title: 'Compliance breach alert',
    subtitle: 'Dubai Marina Tower A — RERA certificate expired 3 days ago',
    time: '3 days overdue', icon: '🚨', action: 'File Now', value: 'AED 50K fine risk', color: T.red,
  },
  {
    id: 'ac3', urgency: 'high',
    title: 'Lease renewal — tenant response needed',
    subtitle: 'Westlands Block NBI-033 · Tenant: J. Kamau · Rent increase 8.2%',
    time: '2 hrs', icon: '📋', action: 'Send Renewal', value: 'KES 145,000/mo', color: T.amber,
  },
  {
    id: 'ac4', urgency: 'high',
    title: 'Maintenance emergency',
    subtitle: 'Manchester City Quarter Unit 14C · Boiler failure · Tenant escalated',
    time: '45 min ago', icon: '🔧', action: 'Dispatch Vendor', value: '£380 est.', color: T.amber,
  },
  {
    id: 'ac5', urgency: 'medium',
    title: 'New qualified lead — hot buyer',
    subtitle: 'Sarah Chen · $2.4M budget · 3BR Dubai · Pre-approved mortgage',
    time: '1 hr ago', icon: '🔥', action: 'Book Viewing', value: '$2.4M budget', color: T.blueL,
  },
  {
    id: 'ac6', urgency: 'medium',
    title: 'Rent collection — 3 arrears',
    subtitle: 'Kilimani Suites — Units 4B, 7A, 12D · Total KES 187,500 overdue',
    time: '5 days', icon: '💰', action: 'Send Demand', value: 'KES 187,500', color: T.amber,
  },
  {
    id: 'ac7', urgency: 'low',
    title: 'Portfolio health score improved',
    subtitle: 'Actis Capital · Score 94.2 → 97.8 (+3.6 pts) · AI optimisation applied',
    time: 'Today 09:14', icon: '📈', action: 'View Report', value: '+3.6 pts', color: T.green,
  },
  {
    id: 'ac8', urgency: 'low',
    title: 'New market intelligence',
    subtitle: 'Dubai residential yields: +1.2% QoQ · AI: recommend 3 acquisitions',
    time: 'Today 08:00', icon: '🧠', action: 'Read Brief', value: '+1.2% yield', color: T.teal,
  },
]

const LISTINGS: Listing[] = [
  {
    id: 'L001', address: '47 Grosvenor Square, Mayfair, London W1K',
    type: 'Apartment', beds: 3, baths: 2, sqm: 185,
    price: '£8,500/mo', priceNum: 8500,
    status: 'For Rent', yield: '5.2%', agent: 'James Whitfield',
    days: 4, score: 96, image: '🏢', lat: 51.51, lng: -0.15, country: 'UK',
  },
  {
    id: 'L002', address: 'Dubai Marina Tower A, Unit 3204, Dubai',
    type: 'Apartment', beds: 2, baths: 2, sqm: 128,
    price: 'AED 180,000/yr', priceNum: 180000,
    status: 'For Rent', yield: '7.8%', agent: 'Aisha Al-Rashid',
    days: 12, score: 91, image: '🌆', lat: 25.08, lng: 55.14, country: 'AE',
  },
  {
    id: 'L003', address: 'Westlands Block LDN-247, Unit 5B, Nairobi',
    type: 'Apartment', beds: 2, baths: 1, sqm: 94,
    price: 'KES 120,000/mo', priceNum: 120000,
    status: 'Let Agreed', yield: '9.1%', agent: 'Grace Wanjiku',
    days: 2, score: 98, image: '🏬', lat: -1.27, lng: 36.81, country: 'KE',
  },
  {
    id: 'L004', address: 'Corniche Tower B, Unit 1102, Abu Dhabi',
    type: 'Villa', beds: 4, baths: 3, sqm: 310,
    price: 'AED 450,000/yr', priceNum: 450000,
    status: 'For Sale', yield: '6.4%', agent: 'Omar Hassan',
    days: 28, score: 78, image: '🏘️', lat: 24.46, lng: 54.37, country: 'AE',
  },
  {
    id: 'L005', address: '14 King Street, Manchester M2 6AZ',
    type: 'Commercial', beds: 0, baths: 2, sqm: 420,
    price: '£28,000/yr', priceNum: 28000,
    status: 'Under Offer', yield: '8.3%', agent: 'Claire Dobson',
    days: 7, score: 88, image: '🏛️', lat: 53.48, lng: -2.24, country: 'UK',
  },
  {
    id: 'L006', address: 'Kilimani Suites NBI-033, Unit 12D, Nairobi',
    type: 'Apartment', beds: 1, baths: 1, sqm: 62,
    price: 'KES 85,000/mo', priceNum: 85000,
    status: 'For Rent', yield: '10.2%', agent: 'Brian Ochieng',
    days: 18, score: 82, image: '🏗️', lat: -1.29, lng: 36.78, country: 'KE',
  },
  {
    id: 'L007', address: '22 Palm Jumeirah Frond M, Dubai',
    type: 'Villa', beds: 5, baths: 4, sqm: 680,
    price: 'AED 2,100,000/yr', priceNum: 2100000,
    status: 'For Sale', yield: '4.9%', agent: 'Fatima Al-Mansoori',
    days: 45, score: 73, image: '🌴', lat: 25.11, lng: 55.13, country: 'AE',
  },
  {
    id: 'L008', address: 'Mombasa Oceanfront MSA-011, Suite 3A',
    type: 'Apartment', beds: 3, baths: 2, sqm: 145,
    price: 'KES 220,000/mo', priceNum: 220000,
    status: 'For Rent', yield: '11.4%', agent: 'David Mutua',
    days: 9, score: 94, image: '🌊', lat: -4.04, lng: 39.67, country: 'KE',
  },
]

const PIPELINE_STAGES: PipelineStage[] = [
  'New Lead', 'Qualified', 'Viewing Scheduled', 'Under Offer',
  'Due Diligence', 'Exchanged', 'Completed',
]

const DEALS: Deal[] = [
  {
    id: 'D001', property: '47 Grosvenor Square, Mayfair',
    client: 'Sarah Chen', value: '£2.85M', valueNum: 2850000,
    stage: 'Under Offer', probability: 78, agentName: 'James Whitfield',
    daysInStage: 3, priority: 'hot', nextAction: 'Counter-offer review', flag: '🇨🇳',
  },
  {
    id: 'D002', property: 'Palm Jumeirah Frond M',
    client: 'Ahmed Al-Maktoum', value: 'AED 8.4M', valueNum: 8400000,
    stage: 'Due Diligence', probability: 91, agentName: 'Fatima Al-Mansoori',
    daysInStage: 7, priority: 'hot', nextAction: 'Title search complete', flag: '🇦🇪',
  },
  {
    id: 'D003', property: 'Westlands Block, Nairobi',
    client: 'Kwame Asante', value: 'KES 18M', valueNum: 18000000,
    stage: 'Exchanged', probability: 97, agentName: 'Grace Wanjiku',
    daysInStage: 1, priority: 'hot', nextAction: 'Completion in 14 days', flag: '🇬🇭',
  },
  {
    id: 'D004', property: 'Manchester City Quarter',
    client: 'TechCorp Ltd', value: '£1.2M', valueNum: 1200000,
    stage: 'Qualified', probability: 45, agentName: 'Claire Dobson',
    daysInStage: 9, priority: 'warm', nextAction: 'Book site visit', flag: '🇬🇧',
  },
  {
    id: 'D005', property: 'Dubai Marina Tower A',
    client: 'Priya Sharma', value: 'AED 1.8M', valueNum: 1800000,
    stage: 'Viewing Scheduled', probability: 62, agentName: 'Aisha Al-Rashid',
    daysInStage: 2, priority: 'warm', nextAction: 'Viewing Thu 14:00', flag: '🇮🇳',
  },
  {
    id: 'D006', property: 'Mombasa Oceanfront',
    client: 'Emma Svensson', value: 'KES 42M', valueNum: 42000000,
    stage: 'New Lead', probability: 28, agentName: 'David Mutua',
    daysInStage: 0, priority: 'warm', nextAction: 'Initial call today', flag: '🇸🇪',
  },
  {
    id: 'D007', property: 'Abu Dhabi Corniche',
    client: 'Marco Rossi', value: 'AED 3.2M', valueNum: 3200000,
    stage: 'Completed', probability: 100, agentName: 'Omar Hassan',
    daysInStage: 0, priority: 'cold', nextAction: 'Keys handover done ✓', flag: '🇮🇹',
  },
  {
    id: 'D008', property: 'Kilimani Suites',
    client: 'Akinwale Obi', value: 'KES 7.5M', valueNum: 7500000,
    stage: 'Qualified', probability: 38, agentName: 'Brian Ochieng',
    daysInStage: 14, priority: 'cold', nextAction: 'Re-engage after vacation', flag: '🇳🇬',
  },
]

const KPI_WIDGETS: KpiWidget[] = [
  { label: 'Portfolio AUM', value: '$2.14B', delta: '+4.8%', up: true, color: T.blueL, icon: <IcoBuilding size={18} /> },
  { label: 'Active Listings', value: '847', delta: '+23', up: true, color: T.teal, icon: <IcoHome size={18} /> },
  { label: 'Pipeline Value', value: '$48.2M', delta: '+12.1%', up: true, color: T.green, icon: <IcoDollar size={18} /> },
  { label: 'Avg Days on Market', value: '18.3', delta: '-2.4d', up: true, color: T.amber, icon: <IcoClock size={18} /> },
  { label: 'Occupancy Rate', value: '96.2%', delta: '+0.8%', up: true, color: T.cyan, icon: <IcoTrend size={18} /> },
  { label: 'Rent Collected', value: '£184K', delta: '98.7%', up: true, color: T.purple, icon: <IcoDollar size={18} /> },
  { label: 'Open Deals', value: '31', delta: '+5 this week', up: true, color: T.blueL, icon: <IcoKanban size={18} /> },
  { label: 'Compliance Score', value: '97/100', delta: '+3.6pts', up: true, color: T.green, icon: <IcoCheck size={18} /> },
]

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function urgencyColor(u: ActionCard['urgency']): string {
  return { critical: T.red, high: T.amber, medium: T.blueL, low: T.green }[u]
}
function statusColor(s: Listing['status']): string {
  return { 'For Sale': T.blueL, 'For Rent': T.teal, 'Under Offer': T.amber, 'Let Agreed': T.green }[s]
}
function priorityColor(p: Deal['priority']): string {
  return { hot: T.red, warm: T.amber, cold: T.blueL }[p]
}
function stageBg(s: PipelineStage): string {
  const map: Partial<Record<PipelineStage, string>> = {
    'New Lead':          'rgba(42,157,232,0.08)',
    'Qualified':         'rgba(167,139,250,0.08)',
    'Viewing Scheduled': 'rgba(245,158,11,0.08)',
    'Under Offer':       'rgba(239,68,68,0.08)',
    'Due Diligence':     'rgba(245,158,11,0.10)',
    'Exchanged':         'rgba(16,185,129,0.08)',
    'Completed':         'rgba(16,185,129,0.12)',
  }
  return map[s] ?? 'rgba(255,255,255,0.04)'
}
function stageBorder(s: PipelineStage): string {
  const map: Partial<Record<PipelineStage, string>> = {
    'New Lead':          'rgba(42,157,232,0.25)',
    'Qualified':         'rgba(167,139,250,0.25)',
    'Viewing Scheduled': 'rgba(245,158,11,0.25)',
    'Under Offer':       'rgba(239,68,68,0.25)',
    'Due Diligence':     'rgba(245,158,11,0.30)',
    'Exchanged':         'rgba(16,185,129,0.25)',
    'Completed':         'rgba(16,185,129,0.35)',
  }
  return map[s] ?? 'rgba(255,255,255,0.08)'
}
function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// ─────────────────────────────────────────────────────────────────────────────
//  useMediaQuery — SSR-safe viewport hook
// ─────────────────────────────────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE BOTTOM NAV  (glassmorphism, 4 tabs, 48px touch targets)
// ─────────────────────────────────────────────────────────────────────────────
interface MobileBottomNavProps {
  active: NavTab
  onSelect: (tab: NavTab) => void
  unread: number
}
function MobileBottomNav({ active, onSelect, unread }: MobileBottomNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IcoHome size={22} /> },
    { id: 'leads',     label: 'Leads',     icon: <IcoUsers size={22} /> },
    { id: 'map',       label: 'Map',       icon: <IcoMap size={22} /> },
    { id: 'pipeline',  label: 'Pipeline',  icon: <IcoKanban size={22} /> },
  ]

  return (
    <nav
      aria-label="Primary mobile navigation"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
        height: 72,
        background: 'rgba(9,13,26,0.92)',
        backdropFilter: T.glassBlur,
        WebkitBackdropFilter: T.glassBlur,
        borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
      }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              minHeight: 48, minWidth: 48,
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? T.blueL : T.text2,
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.2s',
            }}
          >
            {/* Active indicator pill */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32, height: 3, borderRadius: '0 0 4px 4px',
                    background: T.grad,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Notification badge on 'leads' */}
            <div style={{ position: 'relative' }}>
              {tab.id === 'leads' && unread > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -8,
                  background: T.red, color: '#fff',
                  fontSize: 9, fontWeight: 800, lineHeight: 1,
                  padding: '2px 4px', borderRadius: 99,
                  minWidth: 16, textAlign: 'center',
                }}>{unread > 9 ? '9+' : unread}</span>
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {tab.icon}
              </motion.div>
            </div>

            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DESKTOP / TABLET SIDEBAR  (collapsible, with user profile)
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarProps {
  active: NavTab
  onSelect: (tab: NavTab) => void
  collapsed: boolean
  onToggle: () => void
  unread: number
}
function DesktopSidebar({ active, onSelect, collapsed, onToggle, unread }: SidebarProps) {
  const w = collapsed ? T.sidebarCollapsed : T.sidebar

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',    icon: <IcoHome size={19} /> },
    { id: 'leads',     label: 'Leads & CRM',  icon: <IcoUsers size={19} />, badge: unread },
    { id: 'map',       label: 'Portfolio Map', icon: <IcoMap size={19} /> },
    { id: 'pipeline',  label: 'Deal Pipeline', icon: <IcoKanban size={19} /> },
  ]

  const secondaryItems = [
    { icon: <IcoTrend size={19} />,    label: 'Analytics' },
    { icon: <IcoBell size={19} />,     label: 'Alerts', badge: 3 },
    { icon: <IcoSettings size={19} />, label: 'Settings' },
  ]

  return (
    <motion.aside
      aria-label="Primary navigation sidebar"
      animate={{ width: w }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 800,
        background: T.bg2,
        borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '4px 0 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── Logo + Toggle ───────────────────────────────────────── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 20px',
        borderBottom: `1px solid ${T.border}`,
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: T.grad, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(26,109,181,0.45)',
            }}>
              <IcoBuilding size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                easyTenancy
              </div>
              <div style={{ fontSize: 10, color: T.text2, fontWeight: 500, letterSpacing: '0.04em' }}>
                REAL ESTATE OS
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: T.grad, display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(26,109,181,0.45)',
          }}>
            <IcoBuilding size={16} color="#fff" />
          </div>
        )}

        {!collapsed && (
          <button onClick={onToggle} aria-label="Collapse sidebar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.text2, padding: 6, borderRadius: 8,
              minWidth: 32, minHeight: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <IcoChevL size={16} />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {collapsed && (
        <button onClick={onToggle} aria-label="Expand sidebar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.text2, padding: 8, marginTop: 8, marginLeft: 8, marginRight: 8,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 40,
          }}>
          <IcoBars size={18} />
        </button>
      )}

      {/* ── Primary Nav ─────────────────────────────────────────── */}
      <nav aria-label="Main menu" style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 4 }}>
          {!collapsed && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '4px 12px', marginBottom: 4,
            }}>
              Main Menu
            </div>
          )}
          {navItems.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 12, justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: 10, marginBottom: 2,
                  background: isActive ? 'rgba(26,109,181,0.14)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(26,109,181,0.28)' : 'transparent'}`,
                  color: isActive ? T.blueL : T.text2,
                  cursor: 'pointer', position: 'relative',
                  minHeight: 44, transition: 'all 0.18s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: '0 2px 2px 0',
                      background: T.grad,
                    }}
                  />
                )}
                {item.icon}
                {!collapsed && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1, textAlign: 'left' }}>
                      {item.label}
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span style={{
                        background: T.red, color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        padding: '1px 6px', borderRadius: 99,
                        minWidth: 18, textAlign: 'center',
                      }}>{item.badge}</span>
                    )}
                  </>
                )}
                {collapsed && item.badge != null && item.badge > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: T.red,
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Secondary items */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {!collapsed && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '4px 12px', marginBottom: 4,
            }}>
              Tools
            </div>
          )}
          {secondaryItems.map(item => (
            <button
              key={item.label}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12, justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: 10, marginBottom: 2,
                background: 'transparent', border: '1px solid transparent',
                color: T.text2, cursor: 'pointer', minHeight: 44,
                transition: 'all 0.18s', position: 'relative',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {item.icon}
              {!collapsed && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span style={{
                      background: 'rgba(245,158,11,0.15)', color: T.amber,
                      border: `1px solid rgba(245,158,11,0.3)`,
                      fontSize: 10, fontWeight: 800,
                      padding: '1px 6px', borderRadius: 99,
                    }}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── User profile (desktop) ──────────────────────────────── */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: T.grad, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, fontSize: 16,
            boxShadow: '0 4px 12px rgba(26,109,181,0.35)',
          }}>🧑‍💼</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Alex Morgan
            </div>
            <div style={{ fontSize: 11, color: T.text2 }}>Senior Agent · UK</div>
          </div>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.text2, padding: 4, borderRadius: 6,
          }}>
            <IcoSettings size={15} />
          </button>
        </div>
      )}
      {collapsed && (
        <div style={{
          padding: '12px 14px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: T.grad, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16,
          }}>🧑‍💼</div>
        </div>
      )}
    </motion.aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SWIPEABLE CARD  (mobile — swipe left / right with drag hint)
// ─────────────────────────────────────────────────────────────────────────────
interface SwipeCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftLabel?: string
  rightLabel?: string
  leftColor?: string
  rightColor?: string
}
function SwipeCard({
  children, onSwipeLeft, onSwipeRight,
  leftLabel = 'Call', rightLabel = 'Share',
  leftColor = T.blueL, rightColor = T.teal,
}: SwipeCardProps) {
  const x = useMotionValue(0)
  const bg = useTransform(
    x,
    [-120, 0, 120],
    [`rgba(26,109,181,0.12)`, 'transparent', `rgba(42,157,110,0.12)`],
  )
  const leftOpacity  = useTransform(x, [-120, -60, 0], [1, 0.6, 0])
  const rightOpacity = useTransform(x, [0, 60, 120], [0, 0.6, 1])

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) { onSwipeLeft?.() }
    else if (info.offset.x > 80) { onSwipeRight?.() }
  }, [onSwipeLeft, onSwipeRight])

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Left action reveal */}
      <motion.div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        display: 'flex', alignItems: 'center', paddingLeft: 24, gap: 8,
        opacity: leftOpacity,
        background: `linear-gradient(90deg, rgba(26,109,181,0.18), transparent)`,
      }}>
        <IcoPhone size={20} color={leftColor} />
        <span style={{ fontSize: 13, fontWeight: 700, color: leftColor }}>{leftLabel}</span>
      </motion.div>

      {/* Right action reveal */}
      <motion.div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 24, gap: 8,
        opacity: rightOpacity,
        background: `linear-gradient(270deg, rgba(42,157,110,0.18), transparent)`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: rightColor }}>{rightLabel}</span>
        <IcoShare size={20} color={rightColor} />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 130 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x, background: bg, borderRadius: 16 }}
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTION STREAM CARD  (Daily Action Stream items)
// ─────────────────────────────────────────────────────────────────────────────
function ActionStreamCard({ card, isMobile }: { card: ActionCard; isMobile: boolean }) {
  const [acted, setActed] = useState(false)
  const color = urgencyColor(card.urgency)

  const inner = (
    <motion.div
      whileTap={isMobile ? { scale: 0.97 } : undefined}
      whileHover={!isMobile ? { y: -3, boxShadow: `0 12px 36px rgba(0,0,0,0.35)` } : undefined}
      onClick={() => setActed(true)}
      style={{
        background: T.card,
        border: `1px solid ${acted ? 'rgba(16,185,129,0.3)' : T.border}`,
        borderLeft: `3px solid ${acted ? T.green : color}`,
        borderRadius: 16, padding: '14px 16px',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 12, cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Icon + urgency */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {card.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{card.title}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color, background: `${color}15`,
            border: `1px solid ${color}30`, padding: '1px 7px', borderRadius: 99,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{card.urgency}</span>
        </div>
        <p style={{ fontSize: 12, color: T.text2, margin: 0, lineHeight: 1.5 }}>
          {card.subtitle}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IcoClock size={11} /> {card.time}
          </span>
          {card.value && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.cyan }}>{card.value}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        whileHover={{ scale: 1.04 }}
        onClick={e => { e.stopPropagation(); setActed(true) }}
        style={{
          padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: acted ? T.green : T.grad,
          color: '#fff', fontSize: 12, fontWeight: 700,
          flexShrink: 0, minWidth: 100, minHeight: 36,
          boxShadow: acted ? `0 4px 14px rgba(16,185,129,0.35)` : `0 4px 14px rgba(26,109,181,0.35)`,
          transition: 'background 0.2s, box-shadow 0.2s',
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >
        {acted ? <><IcoCheck size={13} /> Done</> : card.action}
      </motion.button>
    </motion.div>
  )

  if (!isMobile) return inner

  return (
    <SwipeCard
      onSwipeLeft={() => setActed(true)}
      onSwipeRight={() => setActed(true)}
      leftLabel="Dismiss"
      rightLabel="Done"
    >
      {inner}
    </SwipeCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MINI SPARK LINE  (pure SVG sparkline for KPI widgets)
// ─────────────────────────────────────────────────────────────────────────────
function SparkLine({ data, color, w = 80, h = 32 }: {
  data: number[]; color: string; w?: number; h?: number
}) {
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const px = (i / (data.length - 1)) * w
    const py = h - ((v - min) / range) * (h - 4) - 2
    return `${px},${py}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth={1.5} fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`}
        fill={`${color}18`} stroke="none" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MINI DOUGHNUT  (SVG doughnut for occupancy / completion)
// ─────────────────────────────────────────────────────────────────────────────
function MiniDoughnut({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={8} fill="none" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={8} fill="none"
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1.2, ease: 'easeOut' as const, delay: 0.3 }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardViewProps { isMobile: boolean; isTablet: boolean }

function DashboardView({ isMobile, isTablet }: DashboardViewProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [search, setSearch] = useState('')
  const sparkData = useMemo(() => [18, 24, 19, 31, 27, 38, 41, 35, 44, 52, 47, 58], [])

  const filteredCards = useMemo(() =>
    ACTION_CARDS.filter(c =>
      (filter === 'all' || c.urgency === filter) &&
      (search === '' ||
       c.title.toLowerCase().includes(search.toLowerCase()) ||
       c.subtitle.toLowerCase().includes(search.toLowerCase()))
    ), [filter, search])

  return (
    <section aria-label="Dashboard" style={{ padding: isMobile ? '16px 16px 88px' : '24px' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? 22 : 28, fontWeight: 900,
              color: T.text, letterSpacing: '-0.8px', margin: 0,
              fontFamily: "'Geologica', 'Syne', sans-serif",
            }}>
              Good morning, Alex 👋
            </h1>
            <p style={{ fontSize: 13, color: T.text2, margin: '4px 0 0' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              <span style={{ color: T.red, fontWeight: 700 }}>3 urgent actions</span> require your attention
            </p>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 12, border: `1px solid ${T.border}`,
                  background: 'rgba(255,255,255,0.04)', color: T.text2,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                }}>
                <IcoBell size={15} />
                <span>Alerts</span>
                <span style={{
                  background: T.red, color: '#fff', fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 99,
                }}>3</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 12, border: 'none',
                  background: T.grad, color: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 18px rgba(26,109,181,0.4)',
                }}>
                <IcoPlus size={15} />
                New Listing
              </motion.button>
            </div>
          )}
        </div>
      </header>

      {/* ── KPI Widgets Grid (desktop multi-column, mobile 2-col) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(2, 1fr)'
          : isTablet
          ? 'repeat(4, 1fr)'
          : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
        marginBottom: 24,
      }}>
        {KPI_WIDGETS.slice(0, isMobile ? 4 : 8).map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={!isMobile ? { y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.3)' } : undefined}
            whileTap={isMobile ? { scale: 0.97 } : undefined}
            style={{
              background: T.card, borderRadius: 14,
              border: `1px solid ${T.border}`,
              padding: isMobile ? '12px' : '16px',
              cursor: 'default', transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ color: kpi.color, opacity: 0.8 }}>{kpi.icon}</div>
              <SparkLine data={sparkData.map(d => d + i * 3)} color={kpi.color} w={60} h={24} />
            </div>
            <div style={{
              fontSize: isMobile ? 20 : 24, fontWeight: 900, color: T.text,
              letterSpacing: '-0.8px', lineHeight: 1.1,
              fontFamily: "'Geologica', 'Syne', sans-serif",
            }}>
              {kpi.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: T.text2 }}>{kpi.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: kpi.up ? T.green : T.red }}>
                {kpi.up ? '↑' : '↓'} {kpi.delta}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Analytics panels (desktop only — canvas-style) ─────── */}
      {!isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr 1fr',
          gap: 14, marginBottom: 24,
        }}>
          {/* Occupancy ring */}
          <div style={{
            background: T.card, borderRadius: 16,
            border: `1px solid ${T.border}`, padding: '20px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{ position: 'relative' }}>
              <MiniDoughnut pct={96.2} color={T.teal} size={72} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: T.text,
              }}>96.2%</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Occupancy</div>
              <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>Across 847 units</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ l: 'Occupied', v: '815', c: T.green }, { l: 'Vacant', v: '32', c: T.amber }].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: r.c }}>{r.v}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>{r.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue chart */}
          <div style={{
            background: T.card, borderRadius: 16,
            border: `1px solid ${T.border}`, padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Monthly Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.6px', marginTop: 2 }}>
                  £184,320
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 99 }}>
                ↑ 8.4%
              </span>
            </div>
            <SparkLine data={[92, 105, 98, 118, 127, 134, 141, 151, 168, 175, 180, 184]} color={T.blueL} w={280} h={54} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                <span key={m} style={{ fontSize: 9, color: T.text3 }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Pipeline funnel */}
          <div style={{
            background: T.card, borderRadius: 16,
            border: `1px solid ${T.border}`, padding: '20px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              Pipeline Funnel
            </div>
            {[
              { s: 'New Leads', n: 47, pct: 100, c: T.blueL },
              { s: 'Qualified', n: 31, pct: 66, c: T.purple },
              { s: 'Viewing', n: 18, pct: 38, c: T.amber },
              { s: 'Under Offer', n: 9, pct: 19, c: T.red },
              { s: 'Completed', n: 6, pct: 13, c: T.green },
            ].map(row => (
              <div key={row.s} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.text2 }}>{row.s}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{row.n}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' as const }}
                    style={{ height: '100%', background: row.c, borderRadius: 3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Daily Action Stream ──────────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, flexWrap: 'wrap', gap: 10,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>
            Daily Action Stream
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700, color: T.red,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              padding: '2px 8px', borderRadius: 99,
            }}>2 CRITICAL</span>
          </h2>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: filter === f ? T.grad : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#fff' : T.text2,
                  fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                  minHeight: 30, fontFamily: 'inherit',
                  boxShadow: filter === f ? '0 4px 14px rgba(26,109,181,0.35)' : 'none',
                  transition: 'all 0.18s',
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Search (desktop) */}
        {!isMobile && (
          <div style={{
            position: 'relative', marginBottom: 14,
          }}>
            <IcoSearch size={15} color={T.text3}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actions…"
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, color: T.text, fontSize: 13,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filteredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ActionStreamCard card={card} isMobile={isMobile} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isMobile && (
          <p style={{ fontSize: 11, color: T.text3, textAlign: 'center', marginTop: 14 }}>
            Swipe left to dismiss · Swipe right to mark done
          </p>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  LISTING CARD  (mobile vertical card with instant action swipe)
// ─────────────────────────────────────────────────────────────────────────────
function ListingCard({ listing, isMobile }: { listing: Listing; isMobile: boolean }) {
  const [called, setCalled]   = useState(false)
  const [shared, setShared]   = useState(false)
  const sColor = statusColor(listing.status)

  const inner = (
    <motion.article
      whileTap={isMobile ? { scale: 0.98 } : undefined}
      whileHover={!isMobile ? { y: -3, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : undefined}
      style={{
        background: T.card, borderRadius: 16,
        border: `1px solid ${called ? 'rgba(26,109,181,0.3)' : shared ? 'rgba(42,157,110,0.3)' : T.border}`,
        overflow: 'hidden', transition: 'border-color 0.2s',
      }}
    >
      {/* Property image placeholder */}
      <div style={{
        height: isMobile ? 120 : 160,
        background: `linear-gradient(135deg, ${T.card2}, ${T.bg2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 52, position: 'relative',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {listing.image}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: sColor + '20', color: sColor,
          border: `1px solid ${sColor}40`,
          fontSize: 10, fontWeight: 700, padding: '3px 10px',
          borderRadius: 99, backdropFilter: 'blur(8px)',
        }}>
          {listing.status}
        </div>
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(9,13,26,0.8)', color: T.cyan,
          border: `1px solid rgba(57,191,246,0.25)`,
          fontSize: 10, fontWeight: 700, padding: '3px 10px',
          borderRadius: 99, backdropFilter: 'blur(8px)',
        }}>
          Score {listing.score}
        </div>
      </div>

      <div style={{ padding: isMobile ? '12px' : '16px' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 2 }}>
            {listing.address}
          </div>
          <div style={{ fontSize: 11, color: T.text2 }}>
            {listing.type} · {listing.beds > 0 ? `${listing.beds}bd ` : ''}{listing.baths}ba · {listing.sqm}m²
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 10,
        }}>
          <div style={{
            fontSize: isMobile ? 16 : 18, fontWeight: 900, color: T.text,
            letterSpacing: '-0.4px',
          }}>
            {listing.price}
          </div>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700 }}>
            Yield {listing.yield}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: T.text3 }}>
            {listing.agent} · {listing.days}d listed
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => setCalled(true)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: called ? T.blueL : 'rgba(42,157,232,0.1)',
                  border: `1px solid ${T.blueL}30`,
                  color: called ? '#fff' : T.blueL,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'inherit', minHeight: 32,
                }}>
                <IcoPhone size={12} /> Call
              </motion.button>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => setShared(true)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: shared ? T.teal : 'rgba(42,157,110,0.1)',
                  border: `1px solid ${T.teal}30`,
                  color: shared ? '#fff' : T.teal,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'inherit', minHeight: 32,
                }}>
                <IcoShare size={12} /> Share
              </motion.button>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${T.border}`,
                  color: T.text2, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'inherit', minHeight: 32,
                }}>
                <IcoEdit size={12} /> Edit
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )

  if (!isMobile) return inner

  return (
    <SwipeCard
      onSwipeLeft={() => setCalled(true)}
      onSwipeRight={() => setShared(true)}
      leftLabel="Call Agent"
      rightLabel="Share"
      leftColor={T.blueL}
      rightColor={T.teal}
    >
      {inner}
    </SwipeCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  LISTINGS VIEW  (mobile swipe cards → desktop server-side data table)
// ─────────────────────────────────────────────────────────────────────────────
interface ListingsViewProps { isMobile: boolean; isTablet: boolean }

function ListingsView({ isMobile, isTablet }: ListingsViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [sortKey, setSortKey] = useState<'price' | 'days' | 'score' | 'yield'>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const PER_PAGE = isMobile ? 4 : 6

  const statuses = ['All', 'For Sale', 'For Rent', 'Under Offer', 'Let Agreed']
  const types    = ['All', 'Apartment', 'House', 'Commercial', 'Villa']

  const filtered = useMemo(() => {
    let r = LISTINGS.filter(l =>
      (statusFilter === 'All' || l.status === statusFilter) &&
      (typeFilter   === 'All' || l.type   === typeFilter) &&
      (search === '' || l.address.toLowerCase().includes(search.toLowerCase()) ||
       l.agent.toLowerCase().includes(search.toLowerCase()))
    )
    r = [...r].sort((a, b) => {
      const va = sortKey === 'price' ? a.priceNum : sortKey === 'days' ? a.days : sortKey === 'yield' ? parseFloat(a.yield) : a.score
      const vb = sortKey === 'price' ? b.priceNum : sortKey === 'days' ? b.days : sortKey === 'yield' ? parseFloat(b.yield) : b.score
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return r
  }, [search, statusFilter, typeFilter, sortKey, sortDir])

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button onClick={() => toggleSort(k)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', color: T.text2,
        fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3,
        textTransform: 'uppercase', letterSpacing: '0.06em', padding: 0,
        fontFamily: 'inherit',
      }}>
      {label}
      {sortKey === k && <span style={{ color: T.blueL }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  )

  const handleExportListingsCSV = () => {
    const listToExport = selected.size > 0 ? LISTINGS.filter(l => selected.has(l.id)) : filtered
    exportToCSV(
      'property-listings-export',
      listToExport,
      [
        { key: 'id', label: 'Listing ID' },
        { key: 'address', label: 'Property Address' },
        { key: 'type', label: 'Property Type' },
        { key: 'status', label: 'Status' },
        { key: 'price', label: 'Price' },
        { key: 'beds', label: 'Bedrooms' },
        { key: 'baths', label: 'Bathrooms' },
        { key: 'sqm', label: 'Area (sq m)' },
        { key: 'yield', label: 'Yield (%)' },
        { key: 'score', label: 'AI Score' },
        { key: 'country', label: 'Country' },
        { key: 'agent', label: 'Agent' },
      ]
    )
  }

  return (
    <section aria-label="Listings inventory" style={{ padding: isMobile ? '16px 16px 88px' : '24px' }}>

      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.6px', fontFamily: "'Geologica', 'Syne', sans-serif" }}>
              Inventory
            </h1>
            <p style={{ fontSize: 13, color: T.text2, margin: '4px 0 0' }}>
              {filtered.length} listings · {selected.size > 0 && `${selected.size} selected · `}
              Portfolio across 4 markets
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleExportListingsCSV}
              id="export-listings-csv-btn"
              style={{
                padding: '9px 18px', borderRadius: 12,
                background: 'rgba(57,191,246,0.12)', border: '1px solid rgba(57,191,246,0.3)',
                color: '#39bff6', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'inherit',
              }}>
              📥 Export CSV {selected.size > 0 ? `(${selected.size})` : ''}
            </motion.button>
            {!isMobile && (
              <>
                {selected.size > 0 && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '9px 18px', borderRadius: 12,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: T.red, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    Bulk Action ({selected.size})
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '9px 18px', borderRadius: 12, border: 'none',
                    background: T.grad, color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 18px rgba(26,109,181,0.4)', fontFamily: 'inherit',
                  }}>
                  <IcoPlus size={15} /> Add Listing
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 0 240px' }}>
            <IcoSearch size={14} color={T.text3}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search address, agent…"
              style={{
                width: '100%', padding: '9px 14px 9px 34px',
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, color: T.text, fontSize: 13,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: statusFilter === s ? T.grad : 'rgba(255,255,255,0.05)',
                  color: statusFilter === s ? '#fff' : T.text2,
                  fontSize: 12, fontWeight: 600, minHeight: 34,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  boxShadow: statusFilter === s ? '0 4px 14px rgba(26,109,181,0.3)' : 'none',
                }}>{s}</button>
            ))}
          </div>

          {!isMobile && (
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: 10, background: T.card,
                border: `1px solid ${T.border}`, color: T.text2, fontSize: 12,
                cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}>
              {types.map(t => <option key={t} value={t} style={{ background: T.bg2 }}>{t}</option>)}
            </select>
          )}
        </div>
      </header>

      {/* ── MOBILE: Swipeable vertical card deck ──────────────── */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {paged.map((listing, i) => (
            <motion.div key={listing.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <ListingCard listing={listing} isMobile={true} />
            </motion.div>
          ))}
          <p style={{ fontSize: 11, color: T.text3, textAlign: 'center', marginTop: 4 }}>
            ← Swipe left to Call · Swipe right to Share →
          </p>
        </div>
      )}

      {/* ── DESKTOP: High-density server-side data table ──────── */}
      {!isMobile && (
        <div style={{
          background: T.card, borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}>
          {/* Advanced filter row */}
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.size === paged.length && paged.length > 0}
                onChange={() => {
                  if (selected.size === paged.length) setSelected(new Set())
                  else setSelected(new Set(paged.map(l => l.id)))
                }}
                style={{ accentColor: T.blueL, width: 15, height: 15 }}
              />
              <span style={{ fontSize: 11, color: T.text2 }}>Select all</span>
            </label>

            <div style={{ height: 16, width: 1, background: T.border }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: T.text3, alignSelf: 'center' }}>Sort by:</span>
              {(['score','price','days','yield'] as const).map(k => (
                <SortBtn key={k} k={k} label={k} />
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: T.text3 }}>
                {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                  borderRadius: 7, padding: '4px 8px', cursor: page === 0 ? 'not-allowed' : 'pointer',
                  color: T.text2, opacity: page === 0 ? 0.4 : 1,
                }}>
                <IcoChevL size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                  borderRadius: 7, padding: '4px 8px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  color: T.text2, opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}>
                <IcoChevR size={14} />
              </button>
            </div>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 32px 3fr 1fr 1.2fr 1fr 1fr 1fr 140px',
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            background: 'rgba(255,255,255,0.02)',
          }}>
            {['', '', 'Property', 'Type', 'Price', 'Yield', 'Status', 'Score', 'Actions'].map((h, i) => (
              <div key={i} style={{
                fontSize: 10, fontWeight: 700, color: T.text3,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                textAlign: h === 'Actions' || h === 'Score' ? 'center' : 'left',
              }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {paged.map((l, i) => {
                const isSelected = selected.has(l.id)
                const sColor = statusColor(l.status)
                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 32px 3fr 1fr 1.2fr 1fr 1fr 1fr 140px',
                      padding: '12px 16px',
                      borderBottom: i < paged.length - 1 ? `1px solid ${T.border}` : 'none',
                      alignItems: 'center',
                      background: isSelected ? 'rgba(26,109,181,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected)(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if (!isSelected)(e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {/* Checkbox */}
                    <div>
                      <input type="checkbox" checked={isSelected}
                        onChange={() => toggleSelect(l.id)}
                        style={{ accentColor: T.blueL, width: 14, height: 14 }} />
                    </div>

                    {/* Flag/image */}
                    <div style={{ fontSize: 20 }}>{l.image}</div>

                    {/* Address */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>
                        {l.address.length > 38 ? l.address.slice(0, 38) + '…' : l.address}
                      </div>
                      <div style={{ fontSize: 11, color: T.text3 }}>
                        {l.beds > 0 ? `${l.beds}bd ` : ''}{l.baths}ba · {l.sqm}m² · {l.days}d
                      </div>
                    </div>

                    {/* Type */}
                    <div style={{ fontSize: 12, color: T.text2 }}>{l.type}</div>

                    {/* Price */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{l.price}</div>

                    {/* Yield */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>{l.yield}</div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: sColor,
                        background: `${sColor}15`, border: `1px solid ${sColor}30`,
                        padding: '3px 9px', borderRadius: 99,
                      }}>{l.status}</span>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: '50%',
                        background: l.score >= 90 ? 'rgba(16,185,129,0.1)' : l.score >= 75 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${l.score >= 90 ? T.green : l.score >= 75 ? T.amber : T.red}30`,
                        fontSize: 11, fontWeight: 800,
                        color: l.score >= 90 ? T.green : l.score >= 75 ? T.amber : T.red,
                      }}>
                        {l.score}
                      </div>
                    </div>

                    {/* Inline actions */}
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                      {[
                        { icon: <IcoPhone size={12} />, color: T.blueL, bg: 'rgba(42,157,232,0.1)', label: 'Call' },
                        { icon: <IcoShare size={12} />, color: T.teal, bg: 'rgba(42,157,110,0.1)', label: 'Share' },
                        { icon: <IcoEdit size={12} />, color: T.text2, bg: 'rgba(255,255,255,0.04)', label: 'Edit' },
                      ].map(btn => (
                        <motion.button key={btn.label}
                          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                          title={btn.label}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: 'none',
                            background: btn.bg, color: btn.color,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'inherit',
                          }}>
                          {btn.icon}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Mobile card grid (tablet: 2-col) ──────────────────── */}
      {isTablet && !isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 14 }}>
          {paged.map((listing, i) => (
            <motion.div key={listing.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}>
              <ListingCard listing={listing} isMobile={false} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination (mobile) */}
      {isMobile && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{
              padding: '9px 20px', borderRadius: 10, minHeight: 44,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
              color: T.text2, cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              opacity: page === 0 ? 0.4 : 1,
            }}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: T.text2 }}>
            {page + 1} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{
              padding: '9px 20px', borderRadius: 10, minHeight: 44,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
              color: T.text2, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              opacity: page >= totalPages - 1 ? 0.4 : 1,
            }}>Next →</button>
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAP VIEW  (Spatial portfolio map — responsive SVG canvas with property pins)
// ─────────────────────────────────────────────────────────────────────────────
function MapView({ isMobile }: { isMobile: boolean }) {
  const [selected, setSelected] = useState<Listing | null>(null)
  const [filter, setFilter]     = useState<string>('All')

  // Map pseudo-coordinate space: lat [-10, 60] lng [-20, 65]
  function project(lat: number, lng: number, w: number, h: number) {
    const x = ((lng + 20) / 85) * w
    const y = ((60 - lat) / 70) * h
    return { x, y }
  }

  const filtered = filter === 'All' ? LISTINGS : LISTINGS.filter(l => l.country === filter)

  return (
    <section aria-label="Portfolio map" style={{
      padding: isMobile ? '16px 16px 88px' : '24px',
      height: isMobile ? 'auto' : '100%',
    }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.6px', fontFamily: "'Geologica', 'Syne', sans-serif" }}>
            Portfolio Map
          </h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'UK', 'AE', 'KE'].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{
                  padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: filter === c ? T.grad : 'rgba(255,255,255,0.06)',
                  color: filter === c ? '#fff' : T.text2, fontSize: 11, fontWeight: 700,
                  transition: 'all 0.15s', minHeight: isMobile ? 36 : 30, fontFamily: 'inherit',
                  boxShadow: filter === c ? '0 4px 14px rgba(26,109,181,0.3)' : 'none',
                }}>{c}</button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>
          {filtered.length} properties across {new Set(filtered.map(l => l.country)).size} markets
        </p>
      </header>

      {/* Split-pane on desktop: map left + detail right */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        flexDirection: 'column',
        gridTemplateColumns: selected && !isMobile ? '1fr 360px' : '1fr',
        gap: 14, height: isMobile ? 'auto' : 'calc(100vh - 200px)',
      }}>
        {/* Map canvas */}
        <div style={{
          background: T.card, borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: 'hidden', position: 'relative',
          minHeight: isMobile ? 340 : 400,
        }}>
          {/* Spatial mesh background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(26,109,181,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(26,109,181,0.04) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* Gradient overlay edges */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at center, transparent 40%, ${T.card}90 100%)`,
            pointerEvents: 'none',
          }} />

          {/* Map label */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(9,13,26,0.8)', backdropFilter: 'blur(8px)',
            border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '7px 13px', fontSize: 11, fontWeight: 600, color: T.text2,
          }}>
            🌍 Global Portfolio — EMEA Focus
          </div>

          <svg
            width="100%" height="100%"
            viewBox="0 0 800 480"
            style={{ display: 'block' }}
            aria-label="Portfolio map with property pins"
          >
            {/* Continental outlines (simplified decorative polygons) */}
            <g opacity="0.08" fill="none" stroke={T.blueL} strokeWidth="0.6">
              {/* UK */}
              <polyline points="350,80 345,95 350,115 360,125 355,140 350,150 345,155 348,165 355,160 360,155 365,145 362,130 365,120 360,100 355,85 350,80" />
              {/* Africa */}
              <polyline points="390,200 380,220 375,250 380,290 390,320 400,340 415,350 420,340 430,310 425,280 430,250 425,220 420,205 410,198 390,200" />
              {/* UAE / Middle East */}
              <polyline points="540,180 530,175 520,182 515,195 520,205 530,210 545,205 555,195 550,182 540,180" />
            </g>

            {/* Connection lines between hubs */}
            {filtered.filter((_, i) => i < 4).map((l, i) => {
              const { x: x1, y: y1 } = project(l.lat, l.lng, 800, 480)
              const { x: x2, y: y2 } = project(51.5, -0.12, 800, 480) // London hub
              if (i === 0) return null
              return (
                <line key={l.id}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={T.blueL} strokeWidth="0.5" strokeDasharray="4 4"
                  opacity="0.15"
                />
              )
            })}

            {/* Property pins */}
            {filtered.map(l => {
              const { x, y } = project(l.lat, l.lng, 800, 480)
              const isSelected = selected?.id === l.id
              const color = statusColor(l.status)
              return (
                <g key={l.id}
                  onClick={() => setSelected(isSelected ? null : l)}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${l.address} — ${l.price}`}
                >
                  {/* Pulse ring on selected */}
                  {isSelected && (
                    <motion.circle
                      cx={x} cy={y} r={22}
                      fill="none" stroke={color} strokeWidth="1"
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  {/* Pin shadow */}
                  <circle cx={x + 2} cy={y + 2} r={12} fill="rgba(0,0,0,0.3)" />

                  {/* Pin body */}
                  <motion.circle
                    cx={x} cy={y} r={isSelected ? 14 : 10}
                    fill={color}
                    stroke={isSelected ? '#fff' : T.bg2}
                    strokeWidth={isSelected ? 2 : 1.5}
                    animate={{ r: isSelected ? 14 : 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  />

                  {/* Property icon */}
                  <text x={x} y={y + 4} textAnchor="middle"
                    style={{ fontSize: isSelected ? 11 : 9, pointerEvents: 'none' }}>
                    {l.image}
                  </text>

                  {/* Price label (visible on selected) */}
                  {isSelected && (
                    <foreignObject x={x - 60} y={y - 46} width={120} height={30}>
                      <div style={{
                        background: 'rgba(9,13,26,0.92)',
                        border: `1px solid ${color}50`,
                        borderRadius: 8, padding: '3px 8px',
                        fontSize: 11, fontWeight: 700, color: T.text,
                        textAlign: 'center', whiteSpace: 'nowrap',
                        backdropFilter: 'blur(8px)',
                      }}>
                        {l.price}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            display: 'flex', gap: 10, flexWrap: 'wrap',
          }}>
            {(['For Sale', 'For Rent', 'Under Offer', 'Let Agreed'] as const).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(9,13,26,0.8)', backdropFilter: 'blur(6px)',
                padding: '4px 10px', borderRadius: 99, border: `1px solid ${T.border}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(s) }} />
                <span style={{ fontSize: 10, color: T.text2 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property detail side-sheet (desktop split-pane) */}
        <AnimatePresence>
          {selected && !isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: T.card, borderRadius: 16,
                border: `1px solid ${T.border}`,
                overflowY: 'auto', padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Property Detail</span>
                <button onClick={() => setSelected(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: 'none',
                    borderRadius: 8, cursor: 'pointer', color: T.text2,
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <IcoX size={15} />
                </button>
              </div>

              <div style={{
                height: 140, background: `linear-gradient(135deg, ${T.card2}, ${T.bg2})`,
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 56, marginBottom: 16, border: `1px solid ${T.border}`,
              }}>
                {selected.image}
              </div>

              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 8px', lineHeight: 1.4 }}>
                {selected.address}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { l: 'Price', v: selected.price },
                  { l: 'Yield', v: selected.yield },
                  { l: 'Size', v: `${selected.sqm}m²` },
                  { l: 'Agent', v: selected.agent },
                  { l: 'Status', v: selected.status },
                  { l: 'Listed', v: `${selected.days} days` },
                ].map(row => (
                  <div key={row.l} style={{
                    background: T.card2, borderRadius: 10,
                    padding: '10px 12px', border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>{row.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{row.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Call Agent', color: T.blueL, bg: 'rgba(42,157,232,0.12)', icon: <IcoPhone size={14} /> },
                  { label: 'Share', color: T.teal, bg: 'rgba(42,157,110,0.12)', icon: <IcoShare size={14} /> },
                ].map(btn => (
                  <motion.button key={btn.label}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: btn.bg, color: btn.color, cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'inherit', minHeight: 40,
                    }}>
                    {btn.icon} {btn.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile detail card */}
        <AnimatePresence>
          {selected && isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                background: T.card, borderRadius: 16,
                border: `1px solid ${T.border}`, padding: '16px',
                marginTop: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selected.type}</div>
                  <div style={{ fontSize: 11, color: T.text2 }}>Score {selected.score}</div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: 'none',
                    borderRadius: 8, cursor: 'pointer', color: T.text2,
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <IcoX size={16} />
                </button>
              </div>
              <div style={{ fontSize: 12, color: T.text, marginBottom: 8, lineHeight: 1.4 }}>{selected.address}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: '-0.4px', marginBottom: 12 }}>
                {selected.price}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Call', icon: <IcoPhone size={14} />, color: T.blueL },
                  { label: 'Share', icon: <IcoShare size={14} />, color: T.teal },
                ].map(btn => (
                  <motion.button key={btn.label} whileTap={{ scale: 0.93 }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: `${btn.color}15`, color: btn.color,
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'inherit', minHeight: 44,
                    }}>
                    {btn.icon} {btn.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEAL CARD  (Kanban card, draggable on desktop)
// ─────────────────────────────────────────────────────────────────────────────
function DealCard({ deal, compact = false }: { deal: Deal; compact?: boolean }) {
  const pColor = priorityColor(deal.priority)
  return (
    <motion.article
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: T.card2, borderRadius: 12,
        border: `1px solid ${T.border}`,
        borderTop: `3px solid ${pColor}`,
        padding: compact ? '10px 12px' : '14px',
        cursor: 'grab', transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>{deal.flag}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: pColor,
              background: `${pColor}15`, border: `1px solid ${pColor}25`,
              padding: '1px 7px', borderRadius: 99, textTransform: 'uppercase',
            }}>{deal.priority}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
            {deal.property}
          </div>
          <div style={{ fontSize: 11, color: T.text2, marginTop: 2 }}>{deal.client}</div>
        </div>
      </div>

      {/* Value + probability */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: T.text, letterSpacing: '-0.4px' }}>
          {deal.value}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 36, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${deal.probability}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                height: '100%', borderRadius: 3,
                background: deal.probability >= 80 ? T.green : deal.probability >= 50 ? T.amber : T.blueL,
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text2 }}>{deal.probability}%</span>
        </div>
      </div>

      {/* Next action */}
      <div style={{
        padding: '7px 10px', borderRadius: 8,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${T.border}`,
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>Next action</div>
        <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.4 }}>{deal.nextAction}</div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, color: T.text3 }}>
          {deal.agentName}
          {deal.daysInStage > 0 && ` · ${deal.daysInStage}d in stage`}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { icon: <IcoPhone size={11} />, color: T.blueL },
            { icon: <IcoEdit size={11} />, color: T.text2 },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              style={{
                width: 26, height: 26, borderRadius: 6, border: 'none',
                background: 'rgba(255,255,255,0.05)',
                color: btn.color, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit',
              }}>
              {btn.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PIPELINE / CRM KANBAN  (mobile: single-stage swipe ↔  desktop: full multi-col)
// ─────────────────────────────────────────────────────────────────────────────
interface PipelineViewProps { isMobile: boolean; isTablet: boolean }

function PipelineView({ isMobile }: PipelineViewProps) {
  const [mobileStageIdx, setMobileStageIdx] = useState(0)
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null)

  const grouped = useMemo(() =>
    PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage] = DEALS.filter(d => d.stage === stage)
      return acc
    }, {} as Record<PipelineStage, Deal[]>),
  [])

  const totalValue = useMemo(() =>
    DEALS.reduce((s, d) => s + (d.probability / 100) * d.valueNum, 0),
  [])

  const currentStage = PIPELINE_STAGES[mobileStageIdx]
  const currentDeals = grouped[currentStage] ?? []

  // Mobile: swipe between stages
  const dx = useMotionValue(0)

  function handleStageDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 && mobileStageIdx < PIPELINE_STAGES.length - 1) {
      setMobileStageIdx(i => i + 1)
    } else if (info.offset.x > 60 && mobileStageIdx > 0) {
      setMobileStageIdx(i => i - 1)
    }
  }

  return (
    <section aria-label="Deal pipeline" style={{ padding: isMobile ? '16px 16px 88px' : '24px' }}>

      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.6px', fontFamily: "'Geologica', 'Syne', sans-serif" }}>
              Deal Pipeline
            </h1>
            <p style={{ fontSize: 13, color: T.text2, margin: '4px 0 0' }}>
              {DEALS.length} deals ·{' '}
              <span style={{ color: T.green, fontWeight: 700 }}>
                ${formatK(totalValue)} weighted
              </span>
            </p>
          </div>
          {!isMobile && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 18px', borderRadius: 12, border: 'none',
                background: T.grad, color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 18px rgba(26,109,181,0.4)', fontFamily: 'inherit',
              }}>
              <IcoPlus size={15} /> Add Deal
            </motion.button>
          )}
        </div>

        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10 }}>
          {[
            { l: 'Total Deals', v: String(DEALS.length), color: T.blueL },
            { l: 'Hot Leads', v: String(DEALS.filter(d => d.priority === 'hot').length), color: T.red },
            { l: 'Weighted Value', v: `$${formatK(totalValue)}`, color: T.green },
            { l: 'Avg Probability', v: `${Math.round(DEALS.reduce((s, d) => s + d.probability, 0) / DEALS.length)}%`, color: T.amber },
          ].map(kpi => (
            <div key={kpi.l} style={{
              background: T.card, borderRadius: 12,
              border: `1px solid ${T.border}`, padding: '12px 14px',
            }}>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: kpi.color, letterSpacing: '-0.4px' }}>
                {kpi.v}
              </div>
              <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>{kpi.l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── MOBILE: Single-stage swipeable viewport ─────────── */}
      {isMobile && (
        <div>
          {/* Stage tab row */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: 6,
            paddingBottom: 12, marginBottom: 16,
            scrollbarWidth: 'none',
          }}>
            {PIPELINE_STAGES.map((stage, i) => {
              const count = grouped[stage]?.length ?? 0
              const isActive = i === mobileStageIdx
              return (
                <button key={stage} onClick={() => setMobileStageIdx(i)}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 99,
                    cursor: 'pointer', minHeight: 36, fontFamily: 'inherit',
                    background: isActive ? T.grad : stageBg(stage),
                    color: isActive ? '#fff' : T.text2,
                    fontSize: 11, fontWeight: 700,
                    boxShadow: isActive ? '0 4px 14px rgba(26,109,181,0.3)' : 'none',
                    border: `1px solid ${isActive ? 'transparent' : stageBorder(stage)}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.18s',
                  }}>
                  {stage}
                  {count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 99, fontSize: 10, fontWeight: 800,
                      padding: '1px 6px', minWidth: 18, textAlign: 'center',
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Current stage panel + swipe gesture */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleStageDragEnd}
            style={{ x: dx }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.22 }}
              >
                {/* Stage header */}
                <div style={{
                  background: stageBg(currentStage),
                  border: `1px solid ${stageBorder(currentStage)}`,
                  borderRadius: 14, padding: '12px 16px', marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{currentStage}</div>
                    <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>
                      {currentDeals.length} deal{currentDeals.length !== 1 ? 's' : ''}
                      {currentDeals.length > 0 && ` · ${currentDeals.reduce((s, d) => s + d.valueNum, 0).toLocaleString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.text3 }}>
                      {mobileStageIdx + 1}/{PIPELINE_STAGES.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {PIPELINE_STAGES.map((_, i) => (
                        <div key={i} style={{
                          width: i === mobileStageIdx ? 16 : 6, height: 6, borderRadius: 99,
                          background: i === mobileStageIdx ? T.blueL : 'rgba(255,255,255,0.15)',
                          transition: 'width 0.2s, background 0.2s',
                        }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deals */}
                {currentDeals.length === 0 ? (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center',
                    background: T.card, borderRadius: 14, border: `1px dashed ${T.border}`,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontSize: 13, color: T.text2 }}>No deals in this stage</div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>Swipe to navigate stages</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {currentDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <p style={{ fontSize: 11, color: T.text3, textAlign: 'center', marginTop: 14 }}>
            ← Swipe to navigate between stages →
          </p>
        </div>
      )}

      {/* ── DESKTOP: Full multi-column Kanban board ──────────── */}
      {!isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(200px, 1fr))`,
          gap: 12, overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {PIPELINE_STAGES.map(stage => {
            const stageDeals = grouped[stage] ?? []
            const stageValue = stageDeals.reduce((s, d) => s + d.valueNum, 0)
            const isDragTarget = dragOver === stage

            return (
              <div
                key={stage}
                onDragOver={e => { e.preventDefault(); setDragOver(stage) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => setDragOver(null)}
                style={{
                  background: isDragTarget ? `${stageBg(stage)}` : T.card,
                  border: `1px solid ${isDragTarget ? stageBorder(stage) : T.border}`,
                  borderRadius: 14, overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                  minHeight: 300,
                }}
              >
                {/* Column header */}
                <div style={{
                  padding: '12px 14px',
                  background: stageBg(stage),
                  borderBottom: `1px solid ${stageBorder(stage)}`,
                  position: 'sticky', top: 0, zIndex: 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{stage}</span>
                    <span style={{
                      background: stageBorder(stage),
                      border: `1px solid ${stageBorder(stage)}`,
                      borderRadius: 99, fontSize: 10, fontWeight: 800,
                      padding: '1px 8px', color: T.text2,
                    }}>{stageDeals.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text2 }}>
                      ${formatK(stageValue)}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragOver(stage)}
                    >
                      <DealCard deal={deal} compact />
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div style={{
                      padding: '24px 12px', textAlign: 'center',
                      border: `1px dashed ${T.border}`, borderRadius: 10,
                      color: T.text3, fontSize: 11,
                    }}>
                      Drop deal here
                    </div>
                  )}

                  <motion.button whileHover={{ backgroundColor: 'rgba(42,157,232,0.08)' }}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 8,
                      border: `1px dashed ${T.border}`,
                      background: 'transparent', color: T.text3,
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                    <IcoPlus size={12} /> Add deal
                  </motion.button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOP APP BAR  (mobile only — contextual title + search + notifications)
// ─────────────────────────────────────────────────────────────────────────────
function MobileTopBar({ tab, unread }: { tab: NavTab; unread: number }) {
  const titles: Record<NavTab, string> = {
    dashboard: 'Dashboard',
    leads: 'Leads & CRM',
    map: 'Portfolio Map',
    pipeline: 'Deal Pipeline',
  }
  const icons: Record<NavTab, React.ReactNode> = {
    dashboard: <IcoHome size={18} />,
    leads:     <IcoUsers size={18} />,
    map:       <IcoMap size={18} />,
    pipeline:  <IcoKanban size={18} />,
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 700,
      height: 56,
      background: 'rgba(9,13,26,0.94)',
      backdropFilter: 'blur(20px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: T.grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 3px 10px rgba(26,109,181,0.4)',
      }}>
        <IcoBuilding size={14} color="#fff" />
      </div>

      {/* Tab icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
        <span style={{ color: T.blueL }}>{icons[tab]}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
          {titles[tab]}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button aria-label="Search" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.text2, padding: 6, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 36, minHeight: 36,
        }}>
          <IcoSearch size={18} />
        </button>
        <button aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: unread > 0 ? T.red : T.text2,
            padding: 6, borderRadius: 8, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 36, minHeight: 36,
          }}>
          <IcoBell size={18} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 8, height: 8, borderRadius: '50%',
              background: T.red, border: `2px solid ${T.bg2}`,
            }} />
          )}
        </button>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DESKTOP TOP BAR  (persistent, above content area)
// ─────────────────────────────────────────────────────────────────────────────
function DesktopTopBar({ tab, sidebarW, unread }: { tab: NavTab; sidebarW: number; unread: number }) {
  const tabLabels: Record<NavTab, string> = {
    dashboard: 'Executive Dashboard',
    leads:     'Global Inventory',
    map:       'Portfolio Map',
    pipeline:  'Transaction Pipeline',
  }
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 700,
      height: 64,
      background: 'rgba(9,13,26,0.96)',
      backdropFilter: 'blur(28px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
      borderBottom: `1px solid ${T.border}`,
      marginLeft: sidebarW,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
          {tabLabels[tab]}
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
          easyTenancy Real Estate OS · {new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <IcoSearch size={14} color={T.text3}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input placeholder="Search anything…"
          style={{
            width: 220, padding: '8px 14px 8px 34px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, fontSize: 13,
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.borderHi }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border }}
        />
      </div>

      {/* Notification bell */}
      <button aria-label={`Notifications (${unread} unread)`}
        style={{
          position: 'relative', background: unread > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unread > 0 ? 'rgba(239,68,68,0.25)' : T.border}`,
          borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: unread > 0 ? T.red : T.text2, transition: 'all 0.18s',
        }}>
        <IcoBell size={17} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 9, height: 9, borderRadius: '50%',
            background: T.red, border: `2px solid ${T.bg2}`,
          }} />
        )}
      </button>

      {/* User avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: T.grad, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(26,109,181,0.35)',
        flexShrink: 0,
      }}>🧑‍💼</div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT — RealEstateOS
// ─────────────────────────────────────────────────────────────────────────────
export default function RealEstateOS() {
  const [activeTab, setActiveTab]     = useState<NavTab>('dashboard')
  const [collapsed, setCollapsed]     = useState(false)
  const [unreadCount]                 = useState(5) // demo

  const isMobile  = useMediaQuery('(max-width: 767px)')
  const isTablet  = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Read hash on mount for deep-linking (e.g. #tab=pipeline)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#tab=')) {
      const t = hash.replace('#tab=', '') as NavTab
      if (['dashboard', 'leads', 'map', 'pipeline'].includes(t)) setActiveTab(t)
    }
  }, [])

  // Update URL hash on tab change
  const selectTab = useCallback((tab: NavTab) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#tab=${tab}`)
  }, [])

  const sidebarW = isDesktop
    ? (collapsed ? T.sidebarCollapsed : T.sidebar)
    : isTablet
    ? (collapsed ? T.sidebarCollapsed : T.sidebar)
    : 0

  const contentStyle: React.CSSProperties = {
    marginLeft: isMobile ? 0 : sidebarW,
    minHeight: '100vh',
    background: T.bg,
    transition: 'margin-left 0.3s cubic-bezier(0.32, 1, 0.56, 1)',
  }

  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
  }

  return (
    <motion.div initial="initial" animate="enter" exit="exit" variants={PAGE_VARIANTS} style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <SEO title="Real Estate OS" description="Mobile-First Progressive Enhancement Real Estate Operating System." url="/realestate-os" />
      {/* ── Mobile top bar ──────────────────────────────────── */}
      {isMobile && <MobileTopBar tab={activeTab} unread={unreadCount} />}

      {/* ── Tablet / Desktop sidebar ─────────────────────────── */}
      {!isMobile && (
        <DesktopSidebar
          active={activeTab}
          onSelect={selectTab}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          unread={unreadCount}
        />
      )}

      {/* ── Desktop top bar ──────────────────────────────────── */}
      {!isMobile && (
        <DesktopTopBar tab={activeTab} sidebarW={sidebarW} unread={unreadCount} />
      )}

      {/* ── Main content area ─────────────────────────────────── */}
      <main aria-label="Main content" style={contentStyle}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView isMobile={isMobile} isTablet={isTablet} />
            )}
            {activeTab === 'leads' && (
              <ListingsView isMobile={isMobile} isTablet={isTablet} />
            )}
            {activeTab === 'map' && (
              <MapView isMobile={isMobile} />
            )}
            {activeTab === 'pipeline' && (
              <PipelineView isMobile={isMobile} isTablet={isTablet} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom navigation ──────────────────────────── */}
      {isMobile && (
        <MobileBottomNav
          active={activeTab}
          onSelect={selectTab}
          unread={unreadCount}
        />
      )}
    </motion.div>
  )
}
