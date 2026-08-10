// ════════════════════════════════════════════════════════════════════════
//  GlobalSearch.tsx — Global Search & Command Palette Engine
//  ─────────────────────────────────────────────────────────────────────
//  Searches across Properties, Tenants, Documents, OS Pages, and Actions.
//  Includes rich metadata previews, category filtering, tag chips,
//  recent search query persistence (localStorage), and keyboard-navigable
//  command palette launcher integration.
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Icon, type IconName, Search, ArrowRight, Command, X, Clock,
} from '../lib/icons'
import { trackEvent } from '../lib/analytics'

export type SearchCategory = 'all' | 'properties' | 'tenants' | 'documents' | 'pages' | 'actions'

export interface PropertyMeta {
  units: number
  occupancy: number
  status: 'compliant' | 'warning' | 'critical'
  rent: string
  location: string
  noi: string
}

export interface TenantMeta {
  property: string
  unit: string
  email: string
  phone: string
  rent: string
  leaseEnd: string
  status: 'Active' | 'Renewing' | 'Arrears' | 'Onboarding'
  churnRisk?: string
}

export interface DocumentMeta {
  property: string
  docCategory: 'Lease' | 'Compliance' | 'Financial' | 'ID & KYC' | 'Maintenance' | 'ESG'
  size: string
  format: 'PDF' | 'XLSX' | 'DOCX'
  uploadDate: string
  driveUrl: string
}

export interface PageMeta {
  route: string
  badge?: string
  description?: string
}

export interface SearchItem {
  id: string
  category: 'properties' | 'tenants' | 'documents' | 'pages' | 'actions'
  title: string
  subtitle: string
  icon: IconName
  tags: string[]
  keywords: string
  to?: string
  href?: string
  external?: boolean
  propertyMeta?: PropertyMeta
  tenantMeta?: TenantMeta
  documentMeta?: DocumentMeta
  pageMeta?: PageMeta
}

export const GLOBAL_SEARCH_ITEMS: SearchItem[] = [
  // ── 🏢 PROPERTIES & PORTFOLIOS ──────────────────────────────────────────
  {
    id: 'prop-ldn247',
    category: 'properties',
    icon: 'building',
    title: 'LDN-247 Westlands Block',
    subtitle: 'Nairobi, Kenya · 48 units · $14,200/mo',
    tags: ['Nairobi', 'Active', 'Residential'],
    keywords: 'nairobi kenya westlands apartment residential ldn247 real estate actis',
    to: '/app/demo?property=LDN-247',
    propertyMeta: {
      units: 48,
      occupancy: 97.9,
      status: 'compliant',
      rent: '$14,200/mo',
      location: 'Westlands, Nairobi, Kenya',
      noi: '+11.8%'
    }
  },
  {
    id: 'prop-nbi033',
    category: 'properties',
    icon: 'building',
    title: 'NBI-033 Kilimani Suites',
    subtitle: 'Nairobi, Kenya · 72 units · $22,500/mo',
    tags: ['Nairobi', 'Warning', 'Suites'],
    keywords: 'nairobi kilimani residential suites kenya nbi033 warning arrears',
    to: '/app/demo?property=NBI-033',
    propertyMeta: {
      units: 72,
      occupancy: 95.8,
      status: 'warning',
      rent: '$22,500/mo',
      location: 'Kilimani, Nairobi, Kenya',
      noi: '+8.4%'
    }
  },
  {
    id: 'prop-msa011',
    category: 'properties',
    icon: 'building',
    title: 'MSA-011 Mombasa Oceanfront',
    subtitle: 'Mombasa, Kenya · 36 units · $9,800/mo',
    tags: ['Mombasa', 'Coastal', 'Resort'],
    keywords: 'mombasa oceanfront beach resort kenya coastal msa011',
    to: '/app/demo?property=MSA-011',
    propertyMeta: {
      units: 36,
      occupancy: 91.7,
      status: 'compliant',
      rent: '$9,800/mo',
      location: 'Nyali, Mombasa, Kenya',
      noi: '+6.2%'
    }
  },
  {
    id: 'prop-mayfair',
    category: 'properties',
    icon: 'building',
    title: 'Mayfair Premium Residences',
    subtitle: 'London W1, UK · 120 units · £85,000/mo',
    tags: ['London', 'Luxury', 'Prime'],
    keywords: 'london mayfair uk luxury apartment prime high yield lon-a01 knight frank',
    to: '/org/demo-002/properties/LON-A01/overview',
    propertyMeta: {
      units: 120,
      occupancy: 98.3,
      status: 'compliant',
      rent: '£85,000/mo',
      location: 'Mayfair, London W1, UK',
      noi: '+14.2%'
    }
  },
  {
    id: 'prop-manchester',
    category: 'properties',
    icon: 'building',
    title: 'Manchester City Quarter',
    subtitle: 'Manchester, UK · 200 units · £62,000/mo',
    tags: ['Manchester', 'Commercial', 'Mixed-Use'],
    keywords: 'manchester uk quarter commercial residential mcr-b02',
    to: '/org/demo-002/properties/MCR-B02/overview',
    propertyMeta: {
      units: 200,
      occupancy: 93.5,
      status: 'warning',
      rent: '£62,000/mo',
      location: 'Spinningfields, Manchester, UK',
      noi: '+7.1%'
    }
  },
  {
    id: 'prop-marina',
    category: 'properties',
    icon: 'building',
    title: 'Dubai Marina Tower A',
    subtitle: 'Dubai, UAE · 80 units · 140,000 AED/mo',
    tags: ['Dubai', 'Skyscraper', 'Waterfront'],
    keywords: 'dubai uae marina tower luxury skyscraper dxb-001 gulf properties',
    to: '/org/demo-003/properties/DXB-001/overview',
    propertyMeta: {
      units: 80,
      occupancy: 93.8,
      status: 'compliant',
      rent: '140,000 AED/mo',
      location: 'Dubai Marina, Dubai, UAE',
      noi: '+12.5%'
    }
  },
  {
    id: 'prop-corniche',
    category: 'properties',
    icon: 'building',
    title: 'Abu Dhabi Corniche View',
    subtitle: 'Abu Dhabi, UAE · 60 units · 95,000 AED/mo',
    tags: ['Abu Dhabi', 'Critical', 'Waterfront'],
    keywords: 'abu dhabi corniche view uae waterfront abu-002',
    to: '/org/demo-003/properties/ABU-002/overview',
    propertyMeta: {
      units: 60,
      occupancy: 89.2,
      status: 'critical',
      rent: '95,000 AED/mo',
      location: 'Corniche Road, Abu Dhabi, UAE',
      noi: '+3.8%'
    }
  },
  {
    id: 'prop-tokyo',
    category: 'properties',
    icon: 'building',
    title: 'Tokyo Midtown Heights',
    subtitle: 'Tokyo, Japan · 110 units · ¥18.5M/mo',
    tags: ['Tokyo', 'Asia-Pacific', 'High-Density'],
    keywords: 'tokyo japan midtown minato high-density japan residential',
    to: '/global-performance',
    propertyMeta: {
      units: 110,
      occupancy: 96.5,
      status: 'compliant',
      rent: '¥18.5M/mo',
      location: 'Minato-ku, Tokyo, Japan',
      noi: '+10.9%'
    }
  },
  {
    id: 'prop-sovereign',
    category: 'properties',
    icon: 'home',
    title: 'Sovereign Tower Penthouse Passport',
    subtitle: 'London Mayfair · Public QR Passport View',
    tags: ['Public Passport', 'QR Code', 'Penthouse'],
    keywords: 'sovereign tower penthouse luxury passport qr public view london',
    to: '/public/property/LON-A01',
    propertyMeta: {
      units: 1,
      occupancy: 100.0,
      status: 'compliant',
      rent: '£8,500/mo',
      location: 'Mayfair, London W1J 8AJ',
      noi: '+15.0%'
    }
  },

  // ── 👤 TENANTS & LESSEES ─────────────────────────────────────────────
  {
    id: 'tnt-marcus-vance',
    category: 'tenants',
    icon: 'users',
    title: 'Dr. Marcus Vance',
    subtitle: 'Sovereign Tower London · Apt 402 · £8,500/mo',
    tags: ['Active', 'London', 'Low Risk'],
    keywords: 'dr marcus vance tenant sovereign tower london apt 402 physician lease',
    to: '/app/demo?tab=tenants&id=TNT-104',
    tenantMeta: {
      property: 'Sovereign Tower London',
      unit: 'Apt 402',
      email: 'marcus.vance@mayfair.co.uk',
      phone: '+44 20 7946 0912',
      rent: '£8,500/mo',
      leaseEnd: 'Dec 31, 2026',
      status: 'Active',
      churnRisk: 'Low (4%)'
    }
  },
  {
    id: 'tnt-sarah-jenkins',
    category: 'tenants',
    icon: 'users',
    title: 'Sarah Jenkins & Partners (Apex Legal)',
    subtitle: 'Apex Plaza Nairobi · Suite 12B · $4,200/mo',
    tags: ['Renewing', 'Commercial', 'Nairobi'],
    keywords: 'sarah jenkins partners apex plaza nairobi suite 12b commercial tenant legal law firm',
    to: '/app/demo?tab=tenants&id=TNT-209',
    tenantMeta: {
      property: 'Apex Commercial Plaza',
      unit: 'Suite 12B',
      email: 's.jenkins@apexlegal.co.ke',
      phone: '+254 712 345678',
      rent: '$4,200/mo',
      leaseEnd: 'Aug 15, 2026',
      status: 'Renewing',
      churnRisk: 'Medium (18%)'
    }
  },
  {
    id: 'tnt-kwame-osei',
    category: 'tenants',
    icon: 'users',
    title: 'Kwame Osei',
    subtitle: 'LDN-247 Westlands Nairobi · Apt 3B · KES 120,000/mo',
    tags: ['Active', 'Nairobi', 'Tech'],
    keywords: 'kwame osei ldn247 westlands nairobi apt 3b tech engineer tenant',
    to: '/app/demo?tab=tenants&id=TNT-301',
    tenantMeta: {
      property: 'LDN-247 Westlands Block',
      unit: 'Apt 3B',
      email: 'kwame.osei@techhub.ke',
      phone: '+254 722 889900',
      rent: 'KES 120,000/mo',
      leaseEnd: 'Nov 30, 2026',
      status: 'Active',
      churnRisk: 'Low (6%)'
    }
  },
  {
    id: 'tnt-amara-mansoor',
    category: 'tenants',
    icon: 'users',
    title: 'Amara Al-Mansoor',
    subtitle: 'Dubai Marina Tower A · Penthouse 2 · 28,000 AED/mo',
    tags: ['Active', 'Dubai', 'Executive'],
    keywords: 'amara al-mansoor dubai marina tower penthouse 2 luxury executive',
    to: '/app/demo?tab=tenants&id=TNT-412',
    tenantMeta: {
      property: 'Dubai Marina Tower A',
      unit: 'Penthouse 2',
      email: 'amara.mansoor@gulfinv.ae',
      phone: '+971 50 123 4567',
      rent: '28,000 AED/mo',
      leaseEnd: 'Jan 14, 2027',
      status: 'Active',
      churnRisk: 'Low (3%)'
    }
  },
  {
    id: 'tnt-kenji-takahashi',
    category: 'tenants',
    icon: 'users',
    title: 'Kenji Takahashi',
    subtitle: 'Tokyo Midtown Heights · Apt 801 · ¥450,000/mo',
    tags: ['Active', 'Tokyo', 'Finance'],
    keywords: 'kenji takahashi tokyo midtown heights apt 801 finance japan',
    to: '/app/demo?tab=tenants&id=TNT-505',
    tenantMeta: {
      property: 'Tokyo Midtown Heights',
      unit: 'Apt 801',
      email: 'k.takahashi@tokyofinance.jp',
      phone: '+81 3 5555 0143',
      rent: '¥450,000/mo',
      leaseEnd: 'Sep 30, 2026',
      status: 'Active',
      churnRisk: 'Low (5%)'
    }
  },
  {
    id: 'tnt-amina-bello',
    category: 'tenants',
    icon: 'users',
    title: 'Amina Bello',
    subtitle: 'NBI-033 Kilimani Suites · Apt 2A · KES 85,000/mo',
    tags: ['Arrears', 'Nairobi', 'Warning'],
    keywords: 'amina bello nbi033 kilimani suites apt 2a arrears warning tenant late payment',
    to: '/app/demo?tab=tenants&id=TNT-118',
    tenantMeta: {
      property: 'NBI-033 Kilimani Suites',
      unit: 'Apt 2A',
      email: 'amina.bello@nbi.co.ke',
      phone: '+254 733 112233',
      rent: 'KES 85,000/mo',
      leaseEnd: 'May 31, 2026',
      status: 'Arrears',
      churnRisk: 'High (42%)'
    }
  },
  {
    id: 'tnt-liam-gallagher',
    category: 'tenants',
    icon: 'users',
    title: 'Liam Gallagher',
    subtitle: 'Manchester City Quarter · Flat 14 · £1,250/mo',
    tags: ['Active', 'Manchester', 'Residential'],
    keywords: 'liam gallagher manchester city quarter flat 14 uk tenant',
    to: '/app/demo?tab=tenants&id=TNT-607',
    tenantMeta: {
      property: 'Manchester City Quarter',
      unit: 'Flat 14',
      email: 'liam.g@mcr.co.uk',
      phone: '+44 161 496 0122',
      rent: '£1,250/mo',
      leaseEnd: 'Mar 15, 2027',
      status: 'Active',
      churnRisk: 'Low (8%)'
    }
  },

  // ── 📄 DOCUMENTS & FILES ───────────────────────────────────────────────
  {
    id: 'doc-lease-2026',
    category: 'documents',
    icon: 'file-text',
    title: 'Master Lease Agreement 2026',
    subtitle: 'Lease Contract · Sovereign Tower London · PDF (3.3MB)',
    tags: ['PDF', 'Lease', 'Sovereign Tower'],
    keywords: 'master lease agreement 2026 pdf contract tenant sovereign tower london verified signed',
    to: '/app/demo?tab=files&doc=gdrive-doc-101',
    documentMeta: {
      property: 'Sovereign Tower London',
      docCategory: 'Lease',
      size: '3.3 MB',
      format: 'PDF',
      uploadDate: 'Aug 2, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },
  {
    id: 'doc-fire-audit',
    category: 'documents',
    icon: 'file-text',
    title: 'Fire Safety Compliance Audit Q3',
    subtitle: 'Safety Audit · Apex Plaza Nairobi · PDF (1.7MB)',
    tags: ['PDF', 'Compliance', 'Apex Plaza'],
    keywords: 'fire safety audit compliance report apex plaza inspection nairobi certified',
    to: '/app/demo?tab=files&doc=gdrive-doc-102',
    documentMeta: {
      property: 'Apex Commercial Plaza',
      docCategory: 'Compliance',
      size: '1.7 MB',
      format: 'PDF',
      uploadDate: 'Aug 5, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },
  {
    id: 'doc-rent-roll',
    category: 'documents',
    icon: 'file-text',
    title: 'Tenant Rent Roll Statement July 2026',
    subtitle: 'Financial Ledger · Global Portfolio · XLSX (820KB)',
    tags: ['XLSX', 'Financial', 'Global'],
    keywords: 'rent roll statement financial excel spreadsheet grandview income global ledger',
    to: '/app/demo?tab=files&doc=gdrive-doc-103',
    documentMeta: {
      property: 'Global Portfolio',
      docCategory: 'Financial',
      size: '820 KB',
      format: 'XLSX',
      uploadDate: 'Aug 6, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },
  {
    id: 'doc-hvac-report',
    category: 'documents',
    icon: 'file-text',
    title: 'HVAC System Inspection & Warranty',
    subtitle: 'Maintenance Report · Sovereign Tower · DOCX (1.2MB)',
    tags: ['DOCX', 'Maintenance', 'HVAC'],
    keywords: 'hvac system inspection maintenance word report sovereign tower warranty airflow',
    to: '/app/demo?tab=files&doc=gdrive-doc-104',
    documentMeta: {
      property: 'Sovereign Tower London',
      docCategory: 'Maintenance',
      size: '1.2 MB',
      format: 'DOCX',
      uploadDate: 'Aug 7, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },
  {
    id: 'doc-kyc-passports',
    category: 'documents',
    icon: 'file-text',
    title: 'Tenant Identity & KYC Passports',
    subtitle: 'Verification · Apex Plaza & Kilimani · PDF (2.3MB)',
    tags: ['PDF', 'ID & KYC', 'Verification'],
    keywords: 'kyc identity passport verification tenant onboarding id pass proof of funds',
    to: '/app/demo?tab=files&doc=gdrive-doc-105',
    documentMeta: {
      property: 'Apex Plaza & Kilimani Suites',
      docCategory: 'ID & KYC',
      size: '2.3 MB',
      format: 'PDF',
      uploadDate: 'Aug 7, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },
  {
    id: 'doc-epc-rating',
    category: 'documents',
    icon: 'file-text',
    title: 'EPC Energy Performance Certificate Grade A',
    subtitle: 'Net-Zero ESG Rating · Sovereign Tower · PDF (950KB)',
    tags: ['PDF', 'ESG', 'Grade A'],
    keywords: 'epc energy performance certificate esg carbon net zero sustainability grade a breeam',
    to: '/netzero',
    documentMeta: {
      property: 'Sovereign Tower London',
      docCategory: 'ESG',
      size: '950 KB',
      format: 'PDF',
      uploadDate: 'Jul 28, 2026',
      driveUrl: 'https://drive.google.com'
    }
  },

  // ── 🧭 PAGES & ROUTING ──────────────────────────────────────────────────
  {
    id: 'pg-home',
    category: 'pages',
    icon: 'home',
    title: 'easyTenancy Global OS Home',
    subtitle: 'Main marketing landing and portfolio telemetry overview',
    tags: ['Home', 'Landing'],
    keywords: 'landing main homepage root global OS',
    to: '/',
    pageMeta: { route: '/', badge: 'Root', description: 'Primary platform overview and high-level portfolio telemetry.' }
  },
  {
    id: 'pg-demo',
    category: 'pages',
    icon: 'chart',
    title: 'App Product Dashboard',
    subtitle: 'Live portfolio metrics, unit manager, files & AI copilot',
    tags: ['Dashboard', 'Live Metrics'],
    keywords: 'try playground sandbox metrics units occupancy app demo portfolio',
    to: '/app/demo',
    pageMeta: { route: '/app/demo', badge: 'Interactive', description: 'Complete operating system dashboard with live property control.' }
  },
  {
    id: 'pg-performance',
    category: 'pages',
    icon: 'chart',
    title: 'Global Performance Dashboard',
    subtitle: 'Multi-region revenue, occupancy telemetry, ESG & capital radar',
    tags: ['Telemetry', 'Financials'],
    keywords: 'global performance regional revenue telemetry noi occupancy allocation esg',
    to: '/global-performance',
    pageMeta: { route: '/global-performance', badge: 'Analytics', description: 'Full executive breakdown of global portfolio capital & occupancy.' }
  },
  {
    id: 'pg-predictive',
    category: 'pages',
    icon: 'command',
    title: 'Predictive Life OS & Lead Scoring',
    subtitle: 'Einstein AI lead scoring, churn forecasting & Agentforce',
    tags: ['AI CRM', 'Predictive'],
    keywords: 'predictive life os einstein agentforce ai crm lead scoring churn',
    to: '/predictive-os',
    pageMeta: { route: '/predictive-os', badge: 'Einstein AI', description: 'Predictive lease renewal probabilities and automated tenant workflows.' }
  },
  {
    id: 'pg-realestate',
    category: 'pages',
    icon: 'building',
    title: 'Real Estate Mobile OS',
    subtitle: '$100B PropTech mobile-first property management suite',
    tags: ['Mobile OS', 'PropTech'],
    keywords: 'real estate os mobile proptech property management offline sync',
    to: '/realestate-os',
    pageMeta: { route: '/realestate-os', badge: 'Mobile-First', description: 'Full mobile-optimized operations suite with offline support.' }
  },
  {
    id: 'pg-netzero',
    category: 'pages',
    icon: 'sparkles',
    title: 'Net-Zero Carbon Telemetry Engine',
    subtitle: 'CSRD compliance, EPC energy ratings & carbon offset tracker',
    tags: ['Net-Zero', 'ESG'],
    keywords: 'net zero carbon emissions epc breeam esg sustainability energy mix csrd',
    to: '/netzero',
    pageMeta: { route: '/netzero', badge: 'ESG Telemetry', description: 'Real-time building carbon tracking and energy certificate audit.' }
  },
  {
    id: 'pg-spatial',
    category: 'pages',
    icon: 'vr',
    title: 'Spatial Staging Studio (Novita FLUX.1)',
    subtitle: 'AI 3D virtual staging, interior redesign & tour generation',
    tags: ['Novita AI', 'Virtual Staging'],
    keywords: 'spatial staging ar webxr quest novita flux.1 3d vr staging interior',
    to: '/spatial-staging',
    pageMeta: { route: '/spatial-staging', badge: 'FLUX.1 AI', description: 'Photorealistic virtual interior staging generated in 1.4s.' }
  },
  {
    id: 'pg-auth',
    category: 'pages',
    icon: 'lock',
    title: 'Auth & User Sync Dashboard',
    subtitle: 'Google Firebase auth, role permissions & profile manager',
    tags: ['Authentication', 'Firebase'],
    keywords: 'auth user sync profile login google firebase permissions role dashboard',
    to: '/auth-dashboard',
    pageMeta: { route: '/auth-dashboard', badge: 'Security', description: 'Manage authenticated sessions, roles, and profile synchronizations.' }
  },
  {
    id: 'pg-firebase-diag',
    category: 'pages',
    icon: 'layers',
    title: 'Database & Firebase Diagnostic',
    subtitle: 'Live Firestore collection status, ping test & connection debug',
    tags: ['Diagnostic', 'Firestore'],
    keywords: 'database firestore connection test diagnostic debug db status',
    to: '/firebase-diagnostic',
    pageMeta: { route: '/firebase-diagnostic', badge: 'Diagnostic', description: 'Verify database connectivity and security rules health.' }
  },

  // ── ⚡ ACTIONS & QUICK CONTROLS ─────────────────────────────────────────
  {
    id: 'act-export-csv',
    category: 'actions',
    icon: 'file-text',
    title: 'Export Portfolio CSV Data Report',
    subtitle: 'Download complete tenant, property, and rent collection records',
    tags: ['CSV Export', 'Download'],
    keywords: 'export csv download data spreadsheet portfolio records',
    to: '/app/demo?tab=overview&export=csv'
  },
  {
    id: 'act-copilot-chat',
    category: 'actions',
    icon: 'bot',
    title: 'Open AI Copilot Executive Assistant',
    subtitle: 'Query portfolio NOI, write lease notices, and simulate yields',
    tags: ['AI Copilot', 'Assistant'],
    keywords: 'ai copilot chat assistant bot query lease yields assistant',
    to: '/app/demo?tab=ai'
  },
  {
    id: 'act-tour',
    category: 'actions',
    icon: 'compass',
    title: 'Take Guided Interactive Tour',
    subtitle: 'Step-by-step walkthrough of key OS capabilities',
    tags: ['Guided Tour', 'Walkthrough'],
    keywords: 'tour guided walkthrough onboarding demo step by step',
    to: '/app/demo?tour=auto'
  }
]

const RECENT_SEARCHES_KEY = 'easytenancy_recent_searches'

function getSavedRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, 5)
    }
  } catch (err) {
    // ignore
  }
  return ['Nairobi', 'Marcus Vance', 'Lease', 'Net-Zero']
}

function saveRecentSearchQuery(q: string) {
  if (!q || q.trim().length < 2) return
  const clean = q.trim()
  try {
    const current = getSavedRecentSearches()
    const updated = [clean, ...current.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (err) {
    // ignore
  }
}

function fuzzyMatch(term: string, item: SearchItem): number {
  if (!term) return 1
  const query = term.toLowerCase().trim()
  const blob = `${item.title} ${item.subtitle} ${item.keywords} ${item.tags.join(' ')} ${item.category}`.toLowerCase()

  if (blob.includes(query)) {
    // Exact prefix match in title gets highest priority
    if (item.title.toLowerCase().startsWith(query)) return 100
    return 80 - blob.indexOf(query) * 0.1
  }

  // Token matching
  const tokens = query.split(/\s+/)
  let score = 0
  for (const token of tokens) {
    if (blob.includes(token)) score += 20
  }
  return score
}

interface GlobalSearchProps {
  onClose?: () => void
  isOpenInline?: boolean
}

export default function GlobalSearch({ onClose, isOpenInline = false }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>(getSavedRecentSearches)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpenInline && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpenInline])

  const filteredItems = useMemo(() => {
    return GLOBAL_SEARCH_ITEMS.filter((item) => {
      // Category filter
      if (category !== 'all' && item.category !== category) return false
      // Tag filter
      if (selectedTag && !item.tags.includes(selectedTag)) return false
      // Text matching
      if (query.trim().length > 0) {
        return fuzzyMatch(query, item) > 0
      }
      return true
    }).sort((a, b) => {
      if (!query.trim()) return 0
      return fuzzyMatch(query, b) - fuzzyMatch(query, a)
    })
  }, [query, category, selectedTag])

  const currentItem = filteredItems[activeIndex] || filteredItems[0]

  const handleSelect = useCallback((item: SearchItem) => {
    if (query.trim()) {
      saveRecentSearchQuery(query)
      setRecentSearches(getSavedRecentSearches())
    } else {
      saveRecentSearchQuery(item.title)
      setRecentSearches(getSavedRecentSearches())
    }
    trackEvent('global_search_select', { id: item.id, category: item.category })
    if (onClose) onClose()
    if (item.to) navigate(item.to)
    else if (item.href) window.location.assign(item.href)
  }, [navigate, onClose, query])

  const handleClearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && currentItem) {
      e.preventDefault()
      handleSelect(currentItem)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (onClose) onClose()
    }
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<SearchCategory, number> = {
      all: GLOBAL_SEARCH_ITEMS.length,
      properties: 0,
      tenants: 0,
      documents: 0,
      pages: 0,
      actions: 0
    }
    GLOBAL_SEARCH_ITEMS.forEach((it) => {
      counts[it.category]++
    })
    return counts
  }, [])

  const popularTags = ['Nairobi', 'London', 'Dubai', 'Active', 'Lease', 'PDF', 'ESG', 'Einstein AI']

  return (
    <div className="w-full flex flex-col bg-slate-950/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl text-slate-100">
      {/* ── Search Input Bar ── */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60">
        <Search className="w-5 h-5 text-cyan-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search properties, tenants, documents, pages, or actions... (⌘K)"
          className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:outline-none font-sans"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setActiveIndex(0)
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Clear search query"
          >
            <X size={14} />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded">
          ESC
        </kbd>
      </div>

      {/* ── Recent Searches Section (Persisted in localStorage) ── */}
      {recentSearches.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 bg-slate-950/90 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <span className="flex items-center gap-1 text-cyan-400 font-mono font-semibold shrink-0">
              <Clock size={12} />
              <span>Recent:</span>
            </span>
            {recentSearches.map((sq) => (
              <button
                key={sq}
                onClick={() => {
                  setQuery(sq)
                  setActiveIndex(0)
                }}
                className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-800/80 transition-colors whitespace-nowrap font-sans text-[11px] cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
          <button
            onClick={handleClearRecentSearches}
            className="text-[10px] font-mono text-slate-400 hover:text-rose-400 transition-colors shrink-0 ml-2 cursor-pointer"
            title="Clear saved search history"
          >
            Clear History
          </button>
        </div>
      )}

      {/* ── Category Tabs Filter ── */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/60 bg-slate-950/80 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'all', label: `All (${categoryCounts.all})` },
          { id: 'properties', label: `🏢 Properties (${categoryCounts.properties})` },
          { id: 'tenants', label: `👤 Tenants (${categoryCounts.tenants})` },
          { id: 'documents', label: `📄 Documents (${categoryCounts.documents})` },
          { id: 'pages', label: `🧭 Pages (${categoryCounts.pages})` },
          { id: 'actions', label: `⚡ Actions (${categoryCounts.actions})` },
        ].map((tab) => {
          const isSelected = category === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCategory(tab.id as SearchCategory)
                setActiveIndex(0)
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50 font-semibold'
                  : 'bg-slate-900/50 text-slate-400 border border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Quick Filter Tags Bar ── */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/40 bg-slate-900/30 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-slate-400 font-mono font-semibold shrink-0">Tags:</span>
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Clear ({selectedTag})</span>
            <X size={10} />
          </button>
        )}
        {popularTags.map((tag) => {
          const isTagActive = selectedTag === tag
          return (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(isTagActive ? null : tag)
                setActiveIndex(0)
              }}
              className={`px-2.5 py-0.5 rounded-full font-mono transition-colors whitespace-nowrap cursor-pointer ${
                isTagActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              #{tag}
            </button>
          )
        })}
      </div>

      {/* ── Search Results & Inspector Pane ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px] max-h-[520px] overflow-hidden">
        {/* Left Column: Results List */}
        <div className="lg:col-span-7 border-r border-slate-800/80 overflow-y-auto divide-y divide-slate-900/80 p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <Search className="w-10 h-10 text-slate-400 opacity-50" />
              <div className="text-sm font-medium text-slate-300">No records found matching "{query}"</div>
              <div className="text-xs text-slate-400 max-w-xs">
                Try searching for property hubs like "London", "Nairobi", tenant names like "Marcus", or documents like "Lease".
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isActive = idx === activeIndex
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isActive
                      ? 'bg-slate-800/90 border border-cyan-500/40 shadow-md shadow-cyan-950/30'
                      : 'hover:bg-slate-900/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${
                          isActive ? 'text-cyan-200' : 'text-slate-200'
                        }`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 capitalize shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-cyan-400 translate-x-1' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                  }`} />
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Live Inspector Pane */}
        <div className="hidden lg:flex lg:col-span-5 p-5 bg-slate-900/40 flex-col justify-between overflow-y-auto">
          {currentItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                  {currentItem.category} Inspector
                </span>
                <span className="text-[11px] text-slate-400 font-mono">ID: {currentItem.id}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{currentItem.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentItem.subtitle}</p>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentItem.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700/60">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="border-t border-slate-800/80 my-3" />

              {/* Category-Specific Metadata Display */}
              {currentItem.propertyMeta && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Location:</span>
                      <span className="text-slate-200 font-semibold">{currentItem.propertyMeta.location}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Units & Occupancy:</span>
                      <span className="text-emerald-400 font-semibold">{currentItem.propertyMeta.units} Units · {currentItem.propertyMeta.occupancy}% Occ</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Rent Roll:</span>
                      <span className="text-cyan-300 font-semibold">{currentItem.propertyMeta.rent}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>NOI Trajectory:</span>
                      <span className="text-emerald-400 font-semibold">{currentItem.propertyMeta.noi}</span>
                    </div>
                  </div>
                </div>
              )}

              {currentItem.tenantMeta && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Assigned Unit:</span>
                      <span className="text-slate-200 font-semibold">{currentItem.tenantMeta.unit} ({currentItem.tenantMeta.property})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Contact Email:</span>
                      <span className="text-cyan-300 truncate max-w-[180px]">{currentItem.tenantMeta.email}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Lease Rent:</span>
                      <span className="text-slate-200 font-semibold">{currentItem.tenantMeta.rent}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Lease Expiry:</span>
                      <span className="text-amber-400 font-semibold">{currentItem.tenantMeta.leaseEnd}</span>
                    </div>
                    {currentItem.tenantMeta.churnRisk && (
                      <div className="flex justify-between text-slate-400">
                        <span>Einstein Churn Risk:</span>
                        <span className="text-rose-400 font-semibold">{currentItem.tenantMeta.churnRisk}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentItem.documentMeta && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Document Category:</span>
                      <span className="text-cyan-300 font-semibold">{currentItem.documentMeta.docCategory}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>File Format & Size:</span>
                      <span className="text-slate-200 font-semibold">{currentItem.documentMeta.format} ({currentItem.documentMeta.size})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Associated Building:</span>
                      <span className="text-slate-200 font-semibold">{currentItem.documentMeta.property}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Upload Date:</span>
                      <span className="text-slate-400">{currentItem.documentMeta.uploadDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {currentItem.pageMeta && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="text-cyan-300 font-mono font-semibold">{currentItem.pageMeta.route}</div>
                  <p className="text-slate-400 leading-relaxed">{currentItem.pageMeta.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center justify-center h-full">
              Select an item to view detailed telemetry
            </div>
          )}

          {currentItem && (
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={() => handleSelect(currentItem)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open / Jump to Item</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Keyboard Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↵</kbd>
            Select
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-slate-400">
          <Command size={11} /> easyTenancy Global Search
        </div>
      </div>
    </div>
  )
}
