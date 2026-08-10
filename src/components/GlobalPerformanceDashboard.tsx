// ════════════════════════════════════════════════════════════════════════
//  GlobalPerformanceDashboard.tsx — Global Real Estate Performance Analytics
//  ─────────────────────────────────────────────────────────────────────
//  Provides multi-region property telemetry using Recharts:
//   • NOI Growth, Occupancy & Retention Trends
//   • Asset Allocation across EMEA, AMER, APAC, and MEA/LATAM
//   • Regional ESG, Maintenance & Yield Benchmarks
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import D3PerformanceTopology from './D3PerformanceTopology'
import D3GeographicalHeatmap from './D3GeographicalHeatmap'
import { exportToCSV } from '../lib/exportCsv'
import {
  useCurrencyConversion,
  UseCurrencyConversionReturn,
  SUPPORTED_CURRENCIES,
  CurrencyCode,
} from '../hooks/useCurrencyConversion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts'

export type RegionKey = 'ALL' | 'EMEA' | 'AMER' | 'APAC' | 'MEA'

export interface GlobalPerformanceDashboardProps {
  currencyHook?: UseCurrencyConversionReturn
  selectedRegion?: RegionKey
  onRegionChange?: (region: RegionKey) => void
}

interface RegionSummary {
  id: RegionKey
  name: string
  flag: string
  hubs: string[]
  properties: number
  occupancy: number // %
  noi: number // $M
  noiGrowth: number // %
  avgRentSqm: number // $
  esgScore: number // /100
  tenantRetention: number // %
  maintenanceSla: number // %
  rentCollectionRate: number // %
}

// ── Master Regional Metadata ──────────────────────────────────────
export const REGIONS: Record<RegionKey, RegionSummary> = {
  ALL: {
    id: 'ALL',
    name: 'Global Portfolio',
    flag: '🌍',
    hubs: ['London', 'New York', 'Singapore', 'Tokyo', 'Paris', 'Dubai'],
    properties: 1550,
    occupancy: 95.3,
    noi: 525.9,
    noiGrowth: 11.8,
    avgRentSqm: 48.8,
    esgScore: 90,
    tenantRetention: 92.8,
    maintenanceSla: 98.2,
    rentCollectionRate: 98.1,
  },
  EMEA: {
    id: 'EMEA',
    name: 'Europe, Middle East & Africa',
    flag: '🇪🇺',
    hubs: ['London', 'Paris', 'Berlin', 'Amsterdam', 'Frankfurt'],
    properties: 420,
    occupancy: 96.4,
    noi: 142.8,
    noiGrowth: 8.4,
    avgRentSqm: 48.5,
    esgScore: 92,
    tenantRetention: 94.1,
    maintenanceSla: 98.5,
    rentCollectionRate: 98.5,
  },
  AMER: {
    id: 'AMER',
    name: 'Americas (AMER)',
    flag: '🇺🇸',
    hubs: ['New York', 'San Francisco', 'Toronto', 'Miami', 'Austin'],
    properties: 510,
    occupancy: 94.8,
    noi: 188.5,
    noiGrowth: 11.2,
    avgRentSqm: 56.2,
    esgScore: 88,
    tenantRetention: 91.5,
    maintenanceSla: 97.8,
    rentCollectionRate: 97.8,
  },
  APAC: {
    id: 'APAC',
    name: 'Asia-Pacific (APAC)',
    flag: '🇸🇬',
    hubs: ['Singapore', 'Tokyo', 'Sydney', 'Hong Kong', 'Seoul'],
    properties: 380,
    occupancy: 97.2,
    noi: 126.4,
    noiGrowth: 14.6,
    avgRentSqm: 52.0,
    esgScore: 95,
    tenantRetention: 96.0,
    maintenanceSla: 99.1,
    rentCollectionRate: 99.1,
  },
  MEA: {
    id: 'MEA',
    name: 'Middle East & LATAM',
    flag: '🇦🇪',
    hubs: ['Riyadh', 'Dubai', 'Nairobi', 'São Paulo', 'Mexico City'],
    properties: 240,
    occupancy: 92.1,
    noi: 68.2,
    noiGrowth: 18.5,
    avgRentSqm: 34.8,
    esgScore: 84,
    tenantRetention: 89.2,
    maintenanceSla: 96.4,
    rentCollectionRate: 96.4,
  },
}

// ── Monthly Performance Telemetry Data ──────────────────────────────
const MONTHLY_TRENDS = [
  { month: 'Jan', EMEA_NOI: 11.2, AMER_NOI: 14.8, APAC_NOI: 9.8, MEA_NOI: 5.1, Occupancy: 93.8, Retention: 91.2, RentCollected: 95.8, RentPending: 4.2, MaintenanceTimeHours: 4.2 },
  { month: 'Feb', EMEA_NOI: 11.5, AMER_NOI: 15.1, APAC_NOI: 10.1, MEA_NOI: 5.2, Occupancy: 94.1, Retention: 91.5, RentCollected: 96.2, RentPending: 3.8, MaintenanceTimeHours: 4.0 },
  { month: 'Mar', EMEA_NOI: 11.8, AMER_NOI: 15.4, APAC_NOI: 10.3, MEA_NOI: 5.4, Occupancy: 94.5, Retention: 91.8, RentCollected: 96.8, RentPending: 3.2, MaintenanceTimeHours: 3.8 },
  { month: 'Apr', EMEA_NOI: 12.0, AMER_NOI: 15.7, APAC_NOI: 10.5, MEA_NOI: 5.6, Occupancy: 94.9, Retention: 92.1, RentCollected: 97.1, RentPending: 2.9, MaintenanceTimeHours: 3.6 },
  { month: 'May', EMEA_NOI: 12.1, AMER_NOI: 16.0, APAC_NOI: 10.7, MEA_NOI: 5.8, Occupancy: 95.2, Retention: 92.4, RentCollected: 97.5, RentPending: 2.5, MaintenanceTimeHours: 3.5 },
  { month: 'Jun', EMEA_NOI: 12.3, AMER_NOI: 16.2, APAC_NOI: 10.9, MEA_NOI: 5.9, Occupancy: 95.5, Retention: 92.7, RentCollected: 97.9, RentPending: 2.1, MaintenanceTimeHours: 3.2 },
  { month: 'Jul', EMEA_NOI: 12.4, AMER_NOI: 16.5, APAC_NOI: 11.1, MEA_NOI: 6.1, Occupancy: 95.8, Retention: 93.0, RentCollected: 98.2, RentPending: 1.8, MaintenanceTimeHours: 3.1 },
  { month: 'Aug', EMEA_NOI: 12.6, AMER_NOI: 16.7, APAC_NOI: 11.3, MEA_NOI: 6.2, Occupancy: 96.0, Retention: 93.2, RentCollected: 98.4, RentPending: 1.6, MaintenanceTimeHours: 3.0 },
  { month: 'Sep', EMEA_NOI: 12.7, AMER_NOI: 17.0, APAC_NOI: 11.5, MEA_NOI: 6.4, Occupancy: 96.2, Retention: 93.5, RentCollected: 98.6, RentPending: 1.4, MaintenanceTimeHours: 2.8 },
  { month: 'Oct', EMEA_NOI: 12.9, AMER_NOI: 17.2, APAC_NOI: 11.7, MEA_NOI: 6.5, Occupancy: 96.5, Retention: 93.8, RentCollected: 98.9, RentPending: 1.1, MaintenanceTimeHours: 2.7 },
  { month: 'Nov', EMEA_NOI: 13.0, AMER_NOI: 17.5, APAC_NOI: 11.9, MEA_NOI: 6.7, Occupancy: 96.7, Retention: 94.0, RentCollected: 99.1, RentPending: 0.9, MaintenanceTimeHours: 2.5 },
  { month: 'Dec', EMEA_NOI: 13.2, AMER_NOI: 17.8, APAC_NOI: 12.1, MEA_NOI: 6.9, Occupancy: 97.0, Retention: 94.2, RentCollected: 99.4, RentPending: 0.6, MaintenanceTimeHours: 2.4 },
]

// ── Multi-Year Historical Performance Data ────────────────────────
export interface AnnualTrendData {
  year: string
  EMEA_Growth: number // % YoY
  AMER_Growth: number // % YoY
  APAC_Growth: number // % YoY
  MEA_Growth: number  // % YoY
  Global_Avg: number  // % YoY
  EMEA_NOI: number    // $M
  AMER_NOI: number    // $M
  APAC_NOI: number    // $M
  MEA_NOI: number     // $M
  Global_NOI: number  // $M
  TotalOccupancy: number // %
  EMEA_Occupancy: number
  AMER_Occupancy: number
  APAC_Occupancy: number
  MEA_Occupancy: number
}

export const ANNUAL_PERFORMANCE_TRENDS: AnnualTrendData[] = [
  { year: '2020', EMEA_Growth: 3.2, AMER_Growth: 4.1, APAC_Growth: 5.8, MEA_Growth: 6.2, Global_Avg: 4.6, EMEA_NOI: 108.5, AMER_NOI: 142.0, APAC_NOI: 88.4, MEA_NOI: 42.1, Global_NOI: 381.0, TotalOccupancy: 91.2, EMEA_Occupancy: 92.1, AMER_Occupancy: 90.8, APAC_Occupancy: 93.4, MEA_Occupancy: 87.5 },
  { year: '2021', EMEA_Growth: 4.8, AMER_Growth: 6.2, APAC_Growth: 8.4, MEA_Growth: 9.1, Global_Avg: 6.8, EMEA_NOI: 113.7, AMER_NOI: 150.8, APAC_NOI: 95.8, MEA_NOI: 45.9, Global_NOI: 406.2, TotalOccupancy: 92.5, EMEA_Occupancy: 93.2, AMER_Occupancy: 91.9, APAC_Occupancy: 94.6, MEA_Occupancy: 88.9 },
  { year: '2022', EMEA_Growth: 6.1, AMER_Growth: 8.5, APAC_Growth: 10.2, MEA_Growth: 12.4, Global_Avg: 8.9, EMEA_NOI: 120.6, AMER_NOI: 163.6, APAC_NOI: 105.6, MEA_NOI: 51.6, Global_NOI: 441.4, TotalOccupancy: 93.8, EMEA_Occupancy: 94.5, AMER_Occupancy: 93.0, APAC_Occupancy: 95.8, MEA_Occupancy: 90.2 },
  { year: '2023', EMEA_Growth: 7.2, AMER_Growth: 9.8, APAC_Growth: 12.1, MEA_Growth: 15.0, Global_Avg: 10.3, EMEA_NOI: 129.3, AMER_NOI: 179.6, APAC_NOI: 118.4, MEA_NOI: 59.3, Global_NOI: 486.6, TotalOccupancy: 94.6, EMEA_Occupancy: 95.4, AMER_Occupancy: 93.9, APAC_Occupancy: 96.5, MEA_Occupancy: 91.1 },
  { year: '2024', EMEA_Growth: 8.1, AMER_Growth: 10.6, APAC_Growth: 13.8, MEA_Growth: 16.8, Global_Avg: 11.2, EMEA_NOI: 139.8, AMER_NOI: 198.6, APAC_NOI: 134.7, MEA_NOI: 69.3, Global_NOI: 542.4, TotalOccupancy: 95.1, EMEA_Occupancy: 96.0, AMER_Occupancy: 94.5, APAC_Occupancy: 97.0, MEA_Occupancy: 91.8 },
  { year: '2025', EMEA_Growth: 8.4, AMER_Growth: 11.2, APAC_Growth: 14.6, MEA_Growth: 18.5, Global_Avg: 11.8, EMEA_NOI: 142.8, AMER_NOI: 188.5, APAC_NOI: 126.4, MEA_NOI: 68.2, Global_NOI: 525.9, TotalOccupancy: 95.3, EMEA_Occupancy: 96.4, AMER_Occupancy: 94.8, APAC_Occupancy: 97.2, MEA_Occupancy: 92.1 },
  { year: '2026 (Proj)', EMEA_Growth: 9.2, AMER_Growth: 12.0, APAC_Growth: 15.8, MEA_Growth: 20.1, Global_Avg: 12.9, EMEA_NOI: 156.2, AMER_NOI: 211.1, APAC_NOI: 146.4, MEA_NOI: 81.9, Global_NOI: 595.6, TotalOccupancy: 96.0, EMEA_Occupancy: 97.1, AMER_Occupancy: 95.5, APAC_Occupancy: 98.1, MEA_Occupancy: 93.2 },
]

// ── Regional KPI Granular Property Category Dataset ───────────────
export interface RegionalCategoryKPI {
  id: string
  region: 'EMEA' | 'AMER' | 'APAC' | 'MEA'
  regionName: string
  category: 'Commercial Office' | 'Industrial Logistics' | 'Multi-Family Residential' | 'Retail Plaza' | 'Data Center'
  avgVacancyDays: number
  maintenanceResponseHours: number
  noiMillions: number
  grossIncomeMillions: number
  occupancyRatePct: number
  totalUnits: number
  rentCollectionRatePct: number
  tenantRetentionPct: number
}

export const REGIONAL_CATEGORY_KPIS: RegionalCategoryKPI[] = [
  // EMEA
  { id: 'EMEA-COMM', region: 'EMEA', regionName: 'Europe, Middle East & Africa', category: 'Commercial Office', avgVacancyDays: 18, maintenanceResponseHours: 2.2, noiMillions: 42.5, grossIncomeMillions: 55.0, occupancyRatePct: 96.2, totalUnits: 120, rentCollectionRatePct: 99.1, tenantRetentionPct: 94.5 },
  { id: 'EMEA-IND', region: 'EMEA', regionName: 'Europe, Middle East & Africa', category: 'Industrial Logistics', avgVacancyDays: 12, maintenanceResponseHours: 1.8, noiMillions: 38.2, grossIncomeMillions: 46.0, occupancyRatePct: 98.1, totalUnits: 145, rentCollectionRatePct: 99.5, tenantRetentionPct: 96.2 },
  { id: 'EMEA-RES', region: 'EMEA', regionName: 'Europe, Middle East & Africa', category: 'Multi-Family Residential', avgVacancyDays: 14, maintenanceResponseHours: 2.5, noiMillions: 28.4, grossIncomeMillions: 36.0, occupancyRatePct: 97.4, totalUnits: 85, rentCollectionRatePct: 98.8, tenantRetentionPct: 93.8 },
  { id: 'EMEA-RET', region: 'EMEA', regionName: 'Europe, Middle East & Africa', category: 'Retail Plaza', avgVacancyDays: 24, maintenanceResponseHours: 3.1, noiMillions: 18.5, grossIncomeMillions: 25.0, occupancyRatePct: 92.5, totalUnits: 40, rentCollectionRatePct: 97.2, tenantRetentionPct: 89.5 },
  { id: 'EMEA-DC', region: 'EMEA', regionName: 'Europe, Middle East & Africa', category: 'Data Center', avgVacancyDays: 8, maintenanceResponseHours: 1.1, noiMillions: 15.2, grossIncomeMillions: 18.5, occupancyRatePct: 99.2, totalUnits: 30, rentCollectionRatePct: 99.8, tenantRetentionPct: 98.4 },

  // AMER
  { id: 'AMER-COMM', region: 'AMER', regionName: 'Americas (US & Canada)', category: 'Commercial Office', avgVacancyDays: 22, maintenanceResponseHours: 2.8, noiMillions: 58.4, grossIncomeMillions: 78.0, occupancyRatePct: 94.1, totalUnits: 160, rentCollectionRatePct: 98.5, tenantRetentionPct: 91.2 },
  { id: 'AMER-IND', region: 'AMER', regionName: 'Americas (US & Canada)', category: 'Industrial Logistics', avgVacancyDays: 10, maintenanceResponseHours: 1.5, noiMillions: 52.1, grossIncomeMillions: 64.0, occupancyRatePct: 98.5, totalUnits: 180, rentCollectionRatePct: 99.6, tenantRetentionPct: 97.1 },
  { id: 'AMER-RES', region: 'AMER', regionName: 'Americas (US & Canada)', category: 'Multi-Family Residential', avgVacancyDays: 15, maintenanceResponseHours: 2.2, noiMillions: 41.8, grossIncomeMillions: 54.0, occupancyRatePct: 96.8, totalUnits: 110, rentCollectionRatePct: 99.0, tenantRetentionPct: 94.0 },
  { id: 'AMER-RET', region: 'AMER', regionName: 'Americas (US & Canada)', category: 'Retail Plaza', avgVacancyDays: 28, maintenanceResponseHours: 3.4, noiMillions: 21.2, grossIncomeMillions: 29.0, occupancyRatePct: 91.8, totalUnits: 38, rentCollectionRatePct: 96.8, tenantRetentionPct: 88.0 },
  { id: 'AMER-DC', region: 'AMER', regionName: 'Americas (US & Canada)', category: 'Data Center', avgVacancyDays: 6, maintenanceResponseHours: 0.9, noiMillions: 25.0, grossIncomeMillions: 29.8, occupancyRatePct: 99.5, totalUnits: 22, rentCollectionRatePct: 99.9, tenantRetentionPct: 99.1 },

  // APAC
  { id: 'APAC-COMM', region: 'APAC', regionName: 'Asia-Pacific Financial Hubs', category: 'Commercial Office', avgVacancyDays: 16, maintenanceResponseHours: 2.0, noiMillions: 36.2, grossIncomeMillions: 46.0, occupancyRatePct: 97.2, totalUnits: 115, rentCollectionRatePct: 99.3, tenantRetentionPct: 95.8 },
  { id: 'APAC-IND', region: 'APAC', regionName: 'Asia-Pacific Financial Hubs', category: 'Industrial Logistics', avgVacancyDays: 9, maintenanceResponseHours: 1.4, noiMillions: 38.5, grossIncomeMillions: 46.5, occupancyRatePct: 98.8, totalUnits: 130, rentCollectionRatePct: 99.7, tenantRetentionPct: 97.5 },
  { id: 'APAC-RES', region: 'APAC', regionName: 'Asia-Pacific Financial Hubs', category: 'Multi-Family Residential', avgVacancyDays: 11, maintenanceResponseHours: 1.9, noiMillions: 22.6, grossIncomeMillions: 28.5, occupancyRatePct: 98.0, totalUnits: 70, rentCollectionRatePct: 99.1, tenantRetentionPct: 96.0 },
  { id: 'APAC-RET', region: 'APAC', regionName: 'Asia-Pacific Financial Hubs', category: 'Retail Plaza', avgVacancyDays: 21, maintenanceResponseHours: 2.6, noiMillions: 15.8, grossIncomeMillions: 20.8, occupancyRatePct: 94.5, totalUnits: 35, rentCollectionRatePct: 98.0, tenantRetentionPct: 92.4 },
  { id: 'APAC-DC', region: 'APAC', regionName: 'Asia-Pacific Financial Hubs', category: 'Data Center', avgVacancyDays: 5, maintenanceResponseHours: 0.8, noiMillions: 13.3, grossIncomeMillions: 15.8, occupancyRatePct: 99.6, totalUnits: 30, rentCollectionRatePct: 99.9, tenantRetentionPct: 99.2 },

  // MEA / LATAM
  { id: 'MEA-COMM', region: 'MEA', regionName: 'Middle East & LATAM Markets', category: 'Commercial Office', avgVacancyDays: 29, maintenanceResponseHours: 3.8, noiMillions: 18.2, grossIncomeMillions: 24.5, occupancyRatePct: 91.5, totalUnits: 70, rentCollectionRatePct: 96.2, tenantRetentionPct: 87.5 },
  { id: 'MEA-IND', region: 'MEA', regionName: 'Middle East & LATAM Markets', category: 'Industrial Logistics', avgVacancyDays: 15, maintenanceResponseHours: 2.4, noiMillions: 22.5, grossIncomeMillions: 28.0, occupancyRatePct: 95.8, totalUnits: 85, rentCollectionRatePct: 98.1, tenantRetentionPct: 93.2 },
  { id: 'MEA-RES', region: 'MEA', regionName: 'Middle East & LATAM Markets', category: 'Multi-Family Residential', avgVacancyDays: 19, maintenanceResponseHours: 3.0, noiMillions: 12.4, grossIncomeMillions: 16.2, occupancyRatePct: 93.2, totalUnits: 45, rentCollectionRatePct: 97.0, tenantRetentionPct: 90.1 },
  { id: 'MEA-RET', region: 'MEA', regionName: 'Middle East & LATAM Markets', category: 'Retail Plaza', avgVacancyDays: 34, maintenanceResponseHours: 4.2, noiMillions: 8.6, grossIncomeMillions: 12.0, occupancyRatePct: 89.4, totalUnits: 25, rentCollectionRatePct: 95.5, tenantRetentionPct: 84.8 },
  { id: 'MEA-DC', region: 'MEA', regionName: 'Middle East & LATAM Markets', category: 'Data Center', avgVacancyDays: 9, maintenanceResponseHours: 1.3, noiMillions: 6.5, grossIncomeMillions: 8.0, occupancyRatePct: 98.5, totalUnits: 15, rentCollectionRatePct: 99.4, tenantRetentionPct: 97.8 },
]

// ── Asset Allocation Breakdown ────────────────────────────────────
const REGIONAL_ALLOCATION = [
  { name: 'AMER', value: 188.5, color: '#38bdf8', properties: 510, percent: '35.8%' },
  { name: 'EMEA', value: 142.8, color: '#10b981', properties: 420, percent: '27.1%' },
  { name: 'APAC', value: 126.4, color: '#a855f7', properties: 380, percent: '24.0%' },
  { name: 'MEA / LATAM', value: 68.2, color: '#f59e0b', properties: 240, percent: '13.1%' },
]

// ── ESG & Operational Radar Metrics ────────────────────────────────
const RADAR_METRICS = [
  { subject: 'ESG Telemetry', EMEA: 92, AMER: 88, APAC: 95, MEA: 84 },
  { subject: 'Occupancy %', EMEA: 96, AMER: 95, APAC: 97, MEA: 92 },
  { subject: 'NOI Growth %', EMEA: 84, AMER: 88, APAC: 94, MEA: 98 },
  { subject: 'Tenant NPS', EMEA: 94, AMER: 91, APAC: 96, MEA: 89 },
  { subject: 'Maintenance SLA', EMEA: 98, AMER: 97, APAC: 99, MEA: 96 },
  { subject: 'Digital Leases', EMEA: 95, AMER: 96, APAC: 98, MEA: 88 },
]

// ── Predictive Occupancy Insights ──────────────────────────────────
export interface PredictiveInsight {
  regionKey: RegionKey
  forecastOccupancy90D: number
  occupancyDelta: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIMAL'
  confidenceScore: number
  primaryDriver: string
  rootCauseDetails: string[]
  recommendedActions: string[]
  simulatedRecoveryPct: number
}

export const PREDICTIVE_INSIGHTS: Record<RegionKey, PredictiveInsight> = {
  ALL: {
    regionKey: 'ALL',
    forecastOccupancy90D: 94.6,
    occupancyDelta: -0.7,
    riskLevel: 'MEDIUM',
    confidenceScore: 94.5,
    primaryDriver: 'Q3 lease expiration wave in MEA commercial hubs & AMER secondary tech corridors',
    rootCauseDetails: [
      '14.2% of overall portfolio lease agreements expiring within the next 90 days',
      'Rent collection delays in MEA region (+2.4 days) correlating with tenant churn friction',
      'Sublease inventory expansion in urban office sectors (New York, Austin)',
    ],
    recommendedActions: [
      'Launch automated 90-day pre-emptive lease renewal campaigns with 1.5% rate caps',
      'Fast-track tenant maintenance SLA dispatch to achieve <3h resolution times',
      'Reallocate leasing incentives toward APAC expansion hubs (+97.4% forecasted stability)',
    ],
    simulatedRecoveryPct: 1.5,
  },
  EMEA: {
    regionKey: 'EMEA',
    forecastOccupancy90D: 96.2,
    occupancyDelta: 0.4,
    riskLevel: 'OPTIMAL',
    confidenceScore: 96.1,
    primaryDriver: 'High tenant retention (+94.1%) driven by green building retrofits in London & Frankfurt',
    rootCauseDetails: [
      'Strong ESG compliance attracting prime corporate long-term lease renewals',
      'Maintenance SLA resolution time optimized to 3.2 hours across main assets',
      'Minor vacancy risk limited to 2 suburban commercial units in Paris',
    ],
    recommendedActions: [
      'Maintain premium rental pricing tier (+4.2% yield uplift on contract signups)',
      'Execute planned solar canopy installation to maintain BREEAM Excellent rating',
    ],
    simulatedRecoveryPct: 0.6,
  },
  AMER: {
    regionKey: 'AMER',
    forecastOccupancy90D: 93.8,
    occupancyDelta: -1.2,
    riskLevel: 'MEDIUM',
    confidenceScore: 92.8,
    primaryDriver: 'Tech office downsizing in Austin & San Francisco corridors combined with lease expirations',
    rootCauseDetails: [
      '3 large corporate tenants transitioning to hybrid remote office footprints',
      'Tenant retention in secondary tech hubs dropped from 93.5% to 89.2%',
      'Competitive supply surge in urban multi-family residential sectors',
    ],
    recommendedActions: [
      'Offer flexible floorplate co-working conversions for high-churn office floors',
      'Launch targeted tenant amenity upgrades (wellness centers, EV charging)',
    ],
    simulatedRecoveryPct: 1.8,
  },
  APAC: {
    regionKey: 'APAC',
    forecastOccupancy90D: 97.4,
    occupancyDelta: 0.8,
    riskLevel: 'OPTIMAL',
    confidenceScore: 97.5,
    primaryDriver: 'Surging logistics & premium commercial demand in Tokyo, Singapore, and Sydney',
    rootCauseDetails: [
      'Zero default rate on rent collection (99.1% on-time payment rate)',
      'High pre-leasing commitment on upcoming property completions (88% pre-leased)',
      'Stable long-term lease structures (avg 5.4 year remaining term)',
    ],
    recommendedActions: [
      'Explore selective rent escalation adjustments (+3.0%) at next contract review',
      'Expand regional acquisitions in high-density logistics nodes',
    ],
    simulatedRecoveryPct: 0.5,
  },
  MEA: {
    regionKey: 'MEA',
    forecastOccupancy90D: 90.2,
    occupancyDelta: -1.9,
    riskLevel: 'HIGH',
    confidenceScore: 91.4,
    primaryDriver: 'Heavy lease rollover cluster in Dubai Tech Quarter combined with payment processing bottlenecks',
    rootCauseDetails: [
      '18.5% of regional lease inventory expiring in the next quarter',
      'Rent collection delay rate increased by 3.2% in LATAM residential assets',
      'Maintenance resolution SLA backlog in Nairobi hub (5.2 hours avg)',
    ],
    recommendedActions: [
      'Trigger AI-powered automated renewal offers with custom payment terms 90 days early',
      'Fast-track local vendor dispatch to lower maintenance SLA down to <3 hours',
      'Implement direct bank API auto-pay incentives for tenants',
    ],
    simulatedRecoveryPct: 2.3,
  },
}

// ── Property Alerts Types & Mock Data ─────────────────────────────
export interface PropertyAlert {
  id: string
  region: 'EMEA' | 'AMER' | 'APAC' | 'MEA'
  propertyName: string
  unitOrTenant: string
  type: 'OVERDUE_RENT' | 'URGENT_MAINTENANCE' | 'LEASE_EXPIRE_RISK' | 'FACILITY_EMERGENCY'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  metricBadge: string
  timestamp: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  contactPerson?: string
}

export const MOCK_PROPERTY_ALERTS: PropertyAlert[] = [
  {
    id: 'ALT-8091',
    region: 'EMEA',
    propertyName: 'Canary Wharf Tower B',
    unitOrTenant: 'Suite 1402 · Apex Global Trading',
    type: 'OVERDUE_RENT',
    severity: 'CRITICAL',
    title: 'Severe Rent Arrears > 45 Days',
    description: 'Q2 commercial rent payment of £24,500 overdue despite 2 automated dunning notices.',
    metricBadge: '£24,500 Overdue (48 Days)',
    timestamp: 'Today, 08:15 AM',
    status: 'OPEN',
    contactPerson: 'Finance Ops London',
  },
  {
    id: 'ALT-8092',
    region: 'MEA',
    propertyName: 'Dubai Business Bay Heights',
    unitOrTenant: 'Floor 8 · AI Tech Ventures',
    type: 'FACILITY_EMERGENCY',
    severity: 'CRITICAL',
    title: 'Main HVAC Compressor Failure',
    description: 'Chiller loop failure in server room section. Internal ambient temp exceeding 28°C.',
    metricBadge: 'SLA Breached (+4h Overdue)',
    timestamp: 'Today, 06:30 AM',
    status: 'IN_PROGRESS',
    contactPerson: 'Facility Dispatch Dubai',
  },
  {
    id: 'ALT-8093',
    region: 'AMER',
    propertyName: 'Austin Silicon Hills Campus',
    unitOrTenant: 'Building 3 · NextGen Software Corp',
    type: 'LEASE_EXPIRE_RISK',
    severity: 'HIGH',
    title: 'Upcoming Lease Expiration Without Renewal',
    description: '35,000 sq ft anchor lease expiring in 45 days. Tenant requested downsizing terms.',
    metricBadge: '45 Days to Expiry ($120k/mo)',
    timestamp: 'Yesterday, 04:20 PM',
    status: 'OPEN',
    contactPerson: 'Leasing Mgr Austin',
  },
  {
    id: 'ALT-8094',
    region: 'APAC',
    propertyName: 'Marina Bay Financial Centre T2',
    unitOrTenant: 'Suite 2104 · Quantum Logistics',
    type: 'URGENT_MAINTENANCE',
    severity: 'HIGH',
    title: 'Emergency Water Pipe Leak in Elevator Lobby',
    description: 'Secondary feeder pipe leaking onto high-speed lift shaft 3. Water main shutoff initiated.',
    metricBadge: 'Urgent SLA (1.5h Remaining)',
    timestamp: 'Today, 09:10 AM',
    status: 'IN_PROGRESS',
    contactPerson: 'Engineering Team SG',
  },
  {
    id: 'ALT-8095',
    region: 'AMER',
    propertyName: 'Manhattan Midtown Tower',
    unitOrTenant: 'Apt 14B · Residential Tenant',
    type: 'OVERDUE_RENT',
    severity: 'MEDIUM',
    title: 'Monthly Rent Payment Declined',
    description: 'ACH transfer failed due to insufficient funds. Tenant notified via tenant portal.',
    metricBadge: '$4,200 Pending (12 Days)',
    timestamp: '2 days ago',
    status: 'OPEN',
    contactPerson: 'Billing Desk NYC',
  },
  {
    id: 'ALT-8096',
    region: 'EMEA',
    propertyName: 'Frankfurt Eurotower Plaza',
    unitOrTenant: 'Concourse Level 1 · Retail Bistro',
    type: 'URGENT_MAINTENANCE',
    severity: 'MEDIUM',
    title: 'Fire Alarm Panel Fault Indicator',
    description: 'Zone 4 optical smoke detector reporting intermittent offline status during self-test.',
    metricBadge: 'Maintenance Ticket #4410',
    timestamp: '3 days ago',
    status: 'RESOLVED',
    contactPerson: 'Safety Inspector DE',
  },
  {
    id: 'ALT-8097',
    region: 'MEA',
    propertyName: 'Riyadh Digital City Tower',
    unitOrTenant: 'Suite 501 · Oasis Energy Partners',
    type: 'OVERDUE_RENT',
    severity: 'HIGH',
    title: 'Quarterly Lease Installment Unpaid',
    description: 'SAR 185,000 lease payment overdue by 28 days following corporate restructuring.',
    metricBadge: 'SAR 185,000 Overdue',
    timestamp: 'Today, 07:45 AM',
    status: 'OPEN',
    contactPerson: 'Accounts Receivable KSA',
  },
]

// ── Recharts Custom Dark Tooltip Component ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-100">
              {typeof entry.value === 'number'
                ? entry.value > 1000
                  ? `$${(entry.value / 1000).toFixed(1)}k`
                  : entry.value % 1 !== 0
                  ? entry.value.toFixed(1)
                  : entry.value
                : entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function GlobalPerformanceDashboard(props: GlobalPerformanceDashboardProps) {
  const defaultCurrency = useCurrencyConversion()
  const currency = props.currencyHook || defaultCurrency
  const [internalSelectedRegion, setInternalSelectedRegion] = useState<RegionKey>('ALL')
  const selectedRegion = props.selectedRegion !== undefined ? props.selectedRegion : internalSelectedRegion
  const setSelectedRegion = props.onRegionChange || setInternalSelectedRegion
  const [activeTab, setActiveTab] = useState<'financials' | 'annual_trend' | 'regional_kpi' | 'occupancy' | 'rent_maintenance' | 'alerts' | 'roi_calculator' | 'comparison' | 'topology' | 'heatmap' | 'allocation' | 'esg'>('financials')
  const [timeframe, setTimeframe] = useState<'12M' | '3Y' | '5Y'>('12M')
  const [exporting, setExporting] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  // Regional KPI Breakdown State
  const [kpiCategoryFilter, setKpiCategoryFilter] = useState<string>('ALL')
  const [kpiSortField, setKpiSortField] = useState<'category' | 'region' | 'avgVacancyDays' | 'maintenanceResponseHours' | 'noiMillions' | 'occupancyRatePct'>('noiMillions')
  const [kpiSortAsc, setKpiSortAsc] = useState<boolean>(false)
  const [kpiSearchQuery, setKpiSearchQuery] = useState<string>('')

  // Annual Performance Trend State
  const [annualTrendMetricMode, setAnnualTrendMetricMode] = useState<'growth' | 'noi' | 'occupancy'>('growth')

  // Comparative Region State
  const [selectedCompareRegions, setSelectedCompareRegions] = useState<('EMEA' | 'AMER' | 'APAC' | 'MEA')[]>(['EMEA', 'AMER', 'APAC'])
  const [compareMetricMode, setCompareMetricMode] = useState<'kpi' | 'noi'>('kpi')

  // Predictive Insights State
  const [simulatedMitigations, setSimulatedMitigations] = useState<Record<string, boolean>>({})
  const [showPredictiveDetails, setShowPredictiveDetails] = useState(true)

  // Property Alerts State
  const [alerts, setAlerts] = useState<PropertyAlert[]>(MOCK_PROPERTY_ALERTS)
  const [alertFilterSeverity, setAlertFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [alertFilterType, setAlertFilterType] = useState<'ALL' | 'OVERDUE_RENT' | 'URGENT_MAINTENANCE' | 'FACILITY_EMERGENCY' | 'LEASE_EXPIRE_RISK'>('ALL')
  const [alertSearchQuery, setAlertSearchQuery] = useState('')
  const [alertActionNotification, setAlertActionNotification] = useState<string | null>(null)

  // ROI Yield Calculator State
  const [roiPurchasePrice, setRoiPurchasePrice] = useState<number>(15000000)
  const [roiRenovationCost, setRoiRenovationCost] = useState<number>(1500000)
  const [roiGrossIncome, setRoiGrossIncome] = useState<number>(1800000)
  const [roiOperatingExpenses, setRoiOperatingExpenses] = useState<number>(450000)
  const [roiIncomeGrowthRate, setRoiIncomeGrowthRate] = useState<number>(3.5)
  const [roiAppreciationRate, setRoiAppreciationRate] = useState<number>(4.0)
  const [roiInvestmentYears, setRoiInvestmentYears] = useState<number>(5)
  const [roiFinancingLtv, setRoiFinancingLtv] = useState<number>(60)
  const [roiInterestRate, setRoiInterestRate] = useState<number>(5.0)
  const [roiChartViewMode, setRoiChartViewMode] = useState<'equity' | 'cashflow'>('equity')

  const handleApplyRoiPreset = (preset: 'COMMERCIAL' | 'INDUSTRIAL' | 'MULTIFAMILY' | 'RESET') => {
    if (preset === 'COMMERCIAL') {
      setRoiPurchasePrice(25000000)
      setRoiRenovationCost(2500000)
      setRoiGrossIncome(2800000)
      setRoiOperatingExpenses(700000)
      setRoiIncomeGrowthRate(4.0)
      setRoiAppreciationRate(4.5)
      setRoiInvestmentYears(7)
      setRoiFinancingLtv(65)
      setRoiInterestRate(5.2)
    } else if (preset === 'INDUSTRIAL') {
      setRoiPurchasePrice(12000000)
      setRoiRenovationCost(800000)
      setRoiGrossIncome(1350000)
      setRoiOperatingExpenses(270000)
      setRoiIncomeGrowthRate(4.2)
      setRoiAppreciationRate(5.0)
      setRoiInvestmentYears(10)
      setRoiFinancingLtv(55)
      setRoiInterestRate(4.8)
    } else if (preset === 'MULTIFAMILY') {
      setRoiPurchasePrice(8000000)
      setRoiRenovationCost(600000)
      setRoiGrossIncome(920000)
      setRoiOperatingExpenses(230000)
      setRoiIncomeGrowthRate(3.5)
      setRoiAppreciationRate(3.8)
      setRoiInvestmentYears(5)
      setRoiFinancingLtv(70)
      setRoiInterestRate(5.5)
    } else {
      setRoiPurchasePrice(15000000)
      setRoiRenovationCost(1500000)
      setRoiGrossIncome(1800000)
      setRoiOperatingExpenses(450000)
      setRoiIncomeGrowthRate(3.5)
      setRoiAppreciationRate(4.0)
      setRoiInvestmentYears(5)
      setRoiFinancingLtv(60)
      setRoiInterestRate(5.0)
    }
  }

  const roiProjections = useMemo(() => {
    const totalCapRequired = roiPurchasePrice + roiRenovationCost
    const loanAmount = roiPurchasePrice * (roiFinancingLtv / 100)
    const initialEquityInvested = Math.max(1, (roiPurchasePrice * (1 - roiFinancingLtv / 100)) + roiRenovationCost)
    const annualDebtService = loanAmount * (roiInterestRate / 100)

    let cumulativeCashFlow = 0
    const yearlyBreakdown: Array<{
      year: number
      yearLabel: string
      grossIncome: number
      operatingExpenses: number
      noi: number
      debtService: number
      netCashFlow: number
      assetValue: number
      equityValue: number
      cumulativeCashFlow: number
      totalReturnWithEquity: number
    }> = []

    for (let yr = 1; yr <= roiInvestmentYears; yr++) {
      const yrGross = roiGrossIncome * Math.pow(1 + roiIncomeGrowthRate / 100, yr - 1)
      const yrOpex = roiOperatingExpenses * Math.pow(1 + 0.02, yr - 1)
      const yrNoi = Math.max(0, yrGross - yrOpex)
      const yrNetCash = yrNoi - annualDebtService
      cumulativeCashFlow += yrNetCash

      const yrAssetValue = totalCapRequired * Math.pow(1 + roiAppreciationRate / 100, yr)
      const yrEquityValue = Math.max(0, yrAssetValue - loanAmount)
      const totalReturn = cumulativeCashFlow + (yrEquityValue - initialEquityInvested)

      yearlyBreakdown.push({
        year: yr,
        yearLabel: `Year ${yr}`,
        grossIncome: Math.round(yrGross),
        operatingExpenses: Math.round(yrOpex),
        noi: Math.round(yrNoi),
        debtService: Math.round(annualDebtService),
        netCashFlow: Math.round(yrNetCash),
        assetValue: Math.round(yrAssetValue),
        equityValue: Math.round(yrEquityValue),
        cumulativeCashFlow: Math.round(cumulativeCashFlow),
        totalReturnWithEquity: Math.round(totalReturn),
      })
    }

    const endYear = yearlyBreakdown[yearlyBreakdown.length - 1]
    const exitEquity = endYear ? endYear.equityValue : 0
    const totalCashInflows = cumulativeCashFlow + exitEquity
    const netProfit = totalCashInflows - initialEquityInvested
    const totalRoiPct = (netProfit / initialEquityInvested) * 100
    const equityMultiple = totalCashInflows / initialEquityInvested
    const annualizedRoiPct = roiInvestmentYears > 0 ? (Math.pow(Math.max(0.01, 1 + totalRoiPct / 100), 1 / roiInvestmentYears) - 1) * 100 : 0
    const initialCapRate = totalCapRequired > 0 ? ((roiGrossIncome - roiOperatingExpenses) / totalCapRequired) * 100 : 0
    const exitCapRate = endYear && endYear.assetValue > 0 ? (endYear.noi / endYear.assetValue) * 100 : 0

    return {
      initialEquityInvested: Math.round(initialEquityInvested),
      loanAmount: Math.round(loanAmount),
      annualDebtService: Math.round(annualDebtService),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      exitEquity: Math.round(exitEquity),
      totalCashInflows: Math.round(totalCashInflows),
      netProfit: Math.round(netProfit),
      totalRoiPct: Number(totalRoiPct.toFixed(1)),
      equityMultiple: Number(equityMultiple.toFixed(2)),
      annualizedRoiPct: Number(annualizedRoiPct.toFixed(1)),
      initialCapRate: Number(initialCapRate.toFixed(2)),
      exitCapRate: Number(exitCapRate.toFixed(2)),
      yearlyBreakdown,
    }
  }, [
    roiPurchasePrice,
    roiRenovationCost,
    roiGrossIncome,
    roiOperatingExpenses,
    roiIncomeGrowthRate,
    roiAppreciationRate,
    roiInvestmentYears,
    roiFinancingLtv,
    roiInterestRate,
  ])

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedRegion !== 'ALL' && alert.region !== selectedRegion) return false
      if (alertFilterSeverity !== 'ALL' && alert.severity !== alertFilterSeverity) return false
      if (alertFilterType !== 'ALL' && alert.type !== alertFilterType) return false
      if (alertSearchQuery.trim()) {
        const q = alertSearchQuery.toLowerCase()
        const matches =
          alert.propertyName.toLowerCase().includes(q) ||
          alert.unitOrTenant.toLowerCase().includes(q) ||
          alert.id.toLowerCase().includes(q) ||
          alert.title.toLowerCase().includes(q) ||
          alert.description.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [alerts, selectedRegion, alertFilterSeverity, alertFilterType, alertSearchQuery])

  const handleToggleAlertStatus = (id: string) => {
    setAlerts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED'
          return { ...item, status: nextStatus }
        }
        return item
      })
    )
  }

  const handleDispatchAlertAction = (alert: PropertyAlert) => {
    let msg = `Action dispatched for ${alert.id}`
    if (alert.type === 'OVERDUE_RENT') {
      msg = `⚡ Automated rent reminder & payment link dispatched to ${alert.unitOrTenant}`
    } else if (alert.type === 'URGENT_MAINTENANCE' || alert.type === 'FACILITY_EMERGENCY') {
      msg = `🛠️ High-priority vendor dispatched for ${alert.propertyName} (${alert.contactPerson})`
    } else if (alert.type === 'LEASE_EXPIRE_RISK') {
      msg = `🏢 AI Pre-emptive renewal offer sent to ${alert.unitOrTenant}`
    }
    setAlertActionNotification(msg)
    setTimeout(() => {
      setAlertActionNotification(null)
    }, 4500)
  }

  const toggleCompareRegion = (region: 'EMEA' | 'AMER' | 'APAC' | 'MEA') => {
    if (selectedCompareRegions.includes(region)) {
      if (selectedCompareRegions.length <= 2) return // Maintain at least 2 for side-by-side comparison
      setSelectedCompareRegions(selectedCompareRegions.filter((r) => r !== region))
    } else {
      setSelectedCompareRegions([...selectedCompareRegions, region])
    }
  }

  const regionInfo = REGIONS[selectedRegion]

  const filteredTrends = useMemo(() => {
    let multiplier = 1
    if (timeframe === '3Y') multiplier = 1.15
    if (timeframe === '5Y') multiplier = 1.32

    return MONTHLY_TRENDS.map((item) => ({
      ...item,
      EMEA_NOI: Number((item.EMEA_NOI * multiplier).toFixed(1)),
      AMER_NOI: Number((item.AMER_NOI * multiplier).toFixed(1)),
      APAC_NOI: Number((item.APAC_NOI * multiplier).toFixed(1)),
      MEA_NOI: Number((item.MEA_NOI * multiplier).toFixed(1)),
      ActiveRegionNOI:
        selectedRegion === 'EMEA'
          ? Number((item.EMEA_NOI * multiplier).toFixed(1))
          : selectedRegion === 'AMER'
          ? Number((item.AMER_NOI * multiplier).toFixed(1))
          : selectedRegion === 'APAC'
          ? Number((item.APAC_NOI * multiplier).toFixed(1))
          : selectedRegion === 'MEA'
          ? Number((item.MEA_NOI * multiplier).toFixed(1))
          : Number(((item.EMEA_NOI + item.AMER_NOI + item.APAC_NOI + item.MEA_NOI) * multiplier).toFixed(1)),
    }))
  }, [selectedRegion, timeframe])

  // Regional Category KPI Filtered & Sorted Memoization
  const filteredRegionalKpis = useMemo(() => {
    return REGIONAL_CATEGORY_KPIS.filter((item) => {
      if (selectedRegion !== 'ALL' && item.region !== selectedRegion) return false
      if (kpiCategoryFilter !== 'ALL' && item.category !== kpiCategoryFilter) return false
      if (kpiSearchQuery.trim()) {
        const q = kpiSearchQuery.toLowerCase()
        const matchCat = item.category.toLowerCase().includes(q)
        const matchReg = item.regionName.toLowerCase().includes(q) || item.region.toLowerCase().includes(q)
        if (!matchCat && !matchReg) return false
      }
      return true
    }).sort((a, b) => {
      const valA = a[kpiSortField]
      const valB = b[kpiSortField]
      if (typeof valA === 'string' && typeof valB === 'string') {
        return kpiSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return kpiSortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    }).map((item) => {
      // Generate stable deterministic pseudo-random trends based on item.id
      const hashString = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return hash;
      }
      const seed = Math.abs(hashString(item.id));
      const getStableRand = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
      }
      
      const vacancyTrend = Array.from({ length: 12 }).map((_, i) => ({
        val: item.avgVacancyDays * (1 + (getStableRand(i) * 0.4 - 0.2))
      }))
      const noiTrend = Array.from({ length: 12 }).map((_, i) => ({
        val: item.noiMillions * (1 + (getStableRand(i + 20) * 0.2 - 0.1))
      }))
      
      return { ...item, vacancyTrend, noiTrend }
    })
  }, [selectedRegion, kpiCategoryFilter, kpiSearchQuery, kpiSortField, kpiSortAsc])

  // Comparative Datasets for Grouped Bar Charts
  const KPI_METRICS_DATA = useMemo(() => {
    return [
      {
        metric: 'Occupancy %',
        EMEA: REGIONS.EMEA.occupancy,
        AMER: REGIONS.AMER.occupancy,
        APAC: REGIONS.APAC.occupancy,
        MEA: REGIONS.MEA.occupancy,
      },
      {
        metric: 'Rent Collection %',
        EMEA: REGIONS.EMEA.rentCollectionRate ?? 98.5,
        AMER: REGIONS.AMER.rentCollectionRate ?? 97.8,
        APAC: REGIONS.APAC.rentCollectionRate ?? 99.1,
        MEA: REGIONS.MEA.rentCollectionRate ?? 96.4,
      },
      {
        metric: 'NOI Growth %',
        EMEA: REGIONS.EMEA.noiGrowth,
        AMER: REGIONS.AMER.noiGrowth,
        APAC: REGIONS.APAC.noiGrowth,
        MEA: REGIONS.MEA.noiGrowth,
      },
      {
        metric: 'Retention %',
        EMEA: REGIONS.EMEA.tenantRetention,
        AMER: REGIONS.AMER.tenantRetention,
        APAC: REGIONS.APAC.tenantRetention,
        MEA: REGIONS.MEA.tenantRetention,
      },
      {
        metric: 'ESG Score',
        EMEA: REGIONS.EMEA.esgScore,
        AMER: REGIONS.AMER.esgScore,
        APAC: REGIONS.APAC.esgScore,
        MEA: REGIONS.MEA.esgScore,
      },
      {
        metric: 'Maint SLA %',
        EMEA: REGIONS.EMEA.maintenanceSla,
        AMER: REGIONS.AMER.maintenanceSla,
        APAC: REGIONS.APAC.maintenanceSla,
        MEA: REGIONS.MEA.maintenanceSla,
      },
    ]
  }, [])

  const MONTHLY_COMPARE_DATA = useMemo(() => {
    return filteredTrends.map((t) => ({
      month: t.month,
      EMEA: t.EMEA_NOI,
      AMER: t.AMER_NOI,
      APAC: t.APAC_NOI,
      MEA: t.MEA_NOI,
    }))
  }, [filteredTrends])

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(REGIONS[selectedRegion], null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `Global_Performance_${selectedRegion}_${timeframe}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    }, 600)
  }

  const handleExportCSV = () => {
    setExportingCsv(true)
    setTimeout(() => {
      setExportingCsv(false)
      const filename = `Global_Performance_${selectedRegion}_${activeTab}_${timeframe}`
      
      let csvData: Record<string, any>[] = []
      
      if (activeTab === 'comparison') {
        csvData = selectedCompareRegions.map((regKey) => {
          const r = REGIONS[regKey]
          return {
            Region_ID: r.id,
            Region_Name: r.name,
            Properties_Count: r.properties,
            Occupancy_Pct: r.occupancy,
            Rent_Collection_Pct: r.rentCollectionRate,
            NOI_Millions_USD: r.noi,
            NOI_Growth_Pct: r.noiGrowth,
            Maintenance_SLA_Pct: r.maintenanceSla,
            ESG_Score: r.esgScore,
            Key_Hubs: r.hubs.join('; '),
          }
        })
      } else if (activeTab === 'regional_kpi') {
        csvData = filteredRegionalKpis.map((k) => ({
          Region_ID: k.region,
          Region_Name: k.regionName,
          Property_Category: k.category,
          Avg_Vacancy_Duration_Days: k.avgVacancyDays,
          Maintenance_Response_Time_Hours: k.maintenanceResponseHours,
          NOI_Millions_USD: k.noiMillions,
          Gross_Income_Millions_USD: k.grossIncomeMillions,
          Occupancy_Rate_Pct: k.occupancyRatePct,
          Total_Units: k.totalUnits,
          Rent_Collection_Pct: k.rentCollectionRatePct,
          Tenant_Retention_Pct: k.tenantRetentionPct,
        }))
      } else if (activeTab === 'rent_maintenance') {
        csvData = filteredTrends.map((t) => ({
          Month: t.month,
          Region: REGIONS[selectedRegion].name,
          Rent_Collected_Pct: t.RentCollected,
          Rent_Pending_Pct: t.RentPending,
          Avg_Maintenance_Resolution_Hours: t.MaintenanceTimeHours,
        }))
      } else if (activeTab === 'annual_trend') {
        csvData = ANNUAL_PERFORMANCE_TRENDS.map((a) => ({
          Year: a.year,
          EMEA_YoY_Growth_Pct: a.EMEA_Growth,
          AMER_YoY_Growth_Pct: a.AMER_Growth,
          APAC_YoY_Growth_Pct: a.APAC_Growth,
          MEA_YoY_Growth_Pct: a.MEA_Growth,
          Global_Avg_YoY_Growth_Pct: a.Global_Avg,
          EMEA_NOI_Millions: a.EMEA_NOI,
          AMER_NOI_Millions: a.AMER_NOI,
          APAC_NOI_Millions: a.APAC_NOI,
          MEA_NOI_Millions: a.MEA_NOI,
          Global_NOI_Millions: a.Global_NOI,
          Total_Occupancy_Pct: a.TotalOccupancy,
        }))
      } else if (activeTab === 'occupancy') {
        csvData = filteredTrends.map((t) => ({
          Month: t.month,
          Region: REGIONS[selectedRegion].name,
          Occupancy_Pct: t.Occupancy,
          Tenant_Retention_Pct: t.Retention,
        }))
      } else if (activeTab === 'alerts') {
        csvData = filteredAlerts.map((a) => ({
          Alert_ID: a.id,
          Region: a.region,
          Property: a.propertyName,
          Unit_or_Tenant: a.unitOrTenant,
          Type: a.type,
          Severity: a.severity,
          Title: a.title,
          Metric: a.metricBadge,
          Status: a.status,
          Timestamp: a.timestamp,
          Contact: a.contactPerson ?? '',
        }))
      } else if (activeTab === 'roi_calculator') {
        csvData = roiProjections.yearlyBreakdown.map((y) => ({
          Year: y.yearLabel,
          Gross_Income_USD: y.grossIncome,
          Operating_Expenses_USD: y.operatingExpenses,
          NOI_USD: y.noi,
          Debt_Service_USD: y.debtService,
          Net_Cash_Flow_USD: y.netCashFlow,
          Asset_Value_USD: y.assetValue,
          Equity_Value_USD: y.equityValue,
          Cumulative_Cash_Flow_USD: y.cumulativeCashFlow,
        }))
      } else {
        csvData = filteredTrends.map((t) => ({
          Month: t.month,
          Selected_Region: REGIONS[selectedRegion].name,
          Occupancy_Pct: t.Occupancy,
          EMEA_NOI_Millions: t.EMEA_NOI,
          AMER_NOI_Millions: t.AMER_NOI,
          APAC_NOI_Millions: t.APAC_NOI,
          MEA_NOI_Millions: t.MEA_NOI,
          Rent_Collected_Pct: t.RentCollected,
          Maintenance_Resolution_Hours: t.MaintenanceTimeHours,
        }))
      }

      exportToCSV(filename, csvData)
    }, 400)
  }

  return (
    <div className="w-full space-y-8 text-slate-100">
      {/* ── Dashboard Header Bar & Currency Selector ─────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Regional Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">Updated: Just now</span>

            {/* Live FX Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border ${
              currency.rateSource === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currency.rateSource === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{currency.rateSource === 'LIVE' ? 'Live FX API' : 'Cached FX'}</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{regionInfo.flag}</span>
            <span>{regionInfo.name}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Key property hubs: <span className="text-slate-200 font-medium">{regionInfo.hubs.join(', ')}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Switcher Dropdown */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
            <span className="text-slate-400 font-mono pl-2 text-[11px] font-semibold flex items-center gap-1">
              💱 Currency:
            </span>
            <select
              value={currency.selectedCurrency}
              onChange={(e) => currency.setSelectedCurrency(e.target.value as CurrencyCode)}
              aria-label="Select Preferred Currency"
              className="bg-slate-900 text-emerald-400 font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              {SUPPORTED_CURRENCIES.map((curr) => {
                const rateVal = currency.rates[curr.code] || curr.defaultRate
                return (
                  <option key={curr.code} value={curr.code} className="bg-slate-900 text-slate-100">
                    {curr.flag} {curr.code} ({curr.symbol}) — {curr.code === 'USD' ? '1.00' : rateVal.toFixed(2)}
                  </option>
                )
              })}
            </select>
            <button
              onClick={() => currency.fetchRates()}
              disabled={currency.isLoadingRates}
              title="Refresh Real-Time Exchange Rates"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${currency.isLoadingRates ? 'animate-spin text-emerald-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Timeframe Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
            {(['12M', '3Y', '5Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{exportingCsv ? 'Exporting CSV...' : 'Export CSV'}</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{exporting ? 'Generating Report...' : 'Export Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* ── Region Selector Tabs ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {(Object.keys(REGIONS) as RegionKey[]).map((key) => {
          const item = REGIONS[key]
          const isSelected = selectedRegion === key
          return (
            <button
              key={key}
              onClick={() => setSelectedRegion(key)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{item.flag}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    item.noiGrowth >= 12
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  +{item.noiGrowth}% NOI
                </span>
              </div>
              <div className="font-bold text-sm text-slate-100 truncate">{item.name}</div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>{item.properties} Units</span>
                <span className="text-slate-300 font-semibold">{item.occupancy}% Occ.</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── KPI Metric Highlights Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Annual NOI */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Net Operating Income (NOI)</span>
            <span className="text-emerald-400 font-mono font-medium">+{regionInfo.noiGrowth}% YoY</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {currency.formatMillions(regionInfo.noi)}
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (regionInfo.noi / 525) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>Target: {currency.formatMillions(regionInfo.noi * 1.1)}</span>
            <span>AUM Share</span>
          </div>
        </div>

        {/* KPI 2: Portfolio Occupancy */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Average Occupancy Rate</span>
            <span className="text-cyan-400 font-mono font-medium">Optimal &gt;95%</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {regionInfo.occupancy}%
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${regionInfo.occupancy}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>Tenant Retention: {regionInfo.tenantRetention}%</span>
            <span>Low Churn Risk</span>
          </div>
        </div>

        {/* KPI 3: Rent per Sq M */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg Rent Rate / m²</span>
            <span className="text-purple-400 font-mono font-medium">Market Benchmark</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {currency.formatRentSqm(regionInfo.avgRentSqm)}<span className="text-sm font-normal text-slate-400">/mo</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (regionInfo.avgRentSqm / 60) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>Portfolio Units: {regionInfo.properties}</span>
            <span>High Yield</span>
          </div>
        </div>

        {/* KPI 4: ESG Sustainability Rating */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ESG & Carbon Telemetry</span>
            <span className="text-amber-400 font-mono font-medium">LEED / CSRD</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>{regionInfo.esgScore}</span>
            <span className="text-xs text-slate-400 font-sans font-normal">/ 100 Index</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${regionInfo.esgScore}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>Maint. SLA: {regionInfo.maintenanceSla}%</span>
            <span>A+ Certified</span>
          </div>
        </div>
      </div>

      {/* ── AI Predictive Occupancy Insights & Risk Telemetry Card ─────── */}
      {(() => {
        const insight = PREDICTIVE_INSIGHTS[selectedRegion]
        const isSimulated = !!simulatedMitigations[selectedRegion]
        const displayOccupancy = isSimulated
          ? Math.min(99.8, Number((insight.forecastOccupancy90D + insight.simulatedRecoveryPct).toFixed(1)))
          : insight.forecastOccupancy90D
        const displayDelta = isSimulated
          ? Number((insight.occupancyDelta + insight.simulatedRecoveryPct).toFixed(1))
          : insight.occupancyDelta

        return (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800/90 shadow-2xl relative overflow-hidden space-y-5">
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-sky-400 to-emerald-400" />

            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xl font-bold shadow-sm">
                  🧠
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Predictive AI Telemetry · 90-Day Forecast
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {insight.confidenceScore}% Confidence
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Predictive Occupancy Insights: {regionInfo.name}</span>
                    <span>{regionInfo.flag}</span>
                  </h3>
                </div>
              </div>

              {/* Status Badge & Toggle Details */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                    insight.riskLevel === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : insight.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span>{insight.riskLevel === 'HIGH' ? '🔴' : insight.riskLevel === 'MEDIUM' ? '⚠️' : '🟢'}</span>
                  <span>{insight.riskLevel} OCCUPANCY RISK</span>
                </span>

                <button
                  onClick={() => setShowPredictiveDetails(!showPredictiveDetails)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
                >
                  {showPredictiveDetails ? 'Collapse Analysis' : 'Expand Analysis'}
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono">Current Occupancy</div>
                <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                  {regionInfo.occupancy}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono">90-Day Forecast</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5 flex items-center gap-1.5">
                  <span>{displayOccupancy}%</span>
                  <span className={`text-xs ${displayDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({displayDelta >= 0 ? `+${displayDelta}%` : `${displayDelta}%`})
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono">Mitigation Status</div>
                <div className="text-xs font-bold font-mono mt-1 text-slate-200">
                  {isSimulated ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span>✓ Pre-emptive AI Active</span>
                      <span className="text-[10px] text-emerald-300">(+{insight.simulatedRecoveryPct}% recovered)</span>
                    </span>
                  ) : (
                    <span className="text-amber-400">Action Pending</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">Simulate Outreach</div>
                  <div className="text-[10px] text-slate-500 font-mono">Pre-emptive AI Retention</div>
                </div>
                <button
                  onClick={() =>
                    setSimulatedMitigations((prev) => ({
                      ...prev,
                      [selectedRegion]: !prev[selectedRegion],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    isSimulated
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {isSimulated ? '✓ Applied' : 'Simulate AI Action'}
                </button>
              </div>
            </div>

            {/* Expanded Root Cause & Action Checklist */}
            <AnimatePresence>
              {showPredictiveDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 pt-2 border-t border-slate-800/80"
                >
                  {/* Primary Driver */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-xs font-mono font-bold text-slate-300 block mb-1">
                      📍 Primary Historical & Market Driver:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {insight.primaryDriver}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Root Cause Details */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🔍 Identified Vulnerability Drivers</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {insight.rootCauseDetails.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500/80 mt-0.5">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Mitigation Actions */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>⚡ Recommended AI Pre-emptive Actions</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {insight.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })()}

      {/* ── View Category Tabs ────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-2 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'financials', label: 'Financial NOI Telemetry', icon: '💰' },
          { id: 'annual_trend', label: 'Annual Performance Trend', icon: '📈' },
          { id: 'regional_kpi', label: 'Regional KPI Breakdown', icon: '📋' },
          { id: 'occupancy', label: 'Occupancy & Retention', icon: '📊' },
          { id: 'rent_maintenance', label: 'Rent Collection & Maintenance SLA', icon: '⚡' },
          { id: 'alerts', label: 'Critical Property Alerts', icon: '🚨' },
          { id: 'roi_calculator', label: 'ROI Yield Calculator', icon: '🧮' },
          { id: 'comparison', label: 'Side-by-Side Region Comparison', icon: '⚖️' },
          { id: 'topology', label: 'D3 Portfolio Topology', icon: '🌐' },
          { id: 'heatmap', label: 'D3 Global Yield Heatmap', icon: '🗺️' },
          { id: 'allocation', label: 'Asset Portfolio Allocation', icon: '🍩' },
          { id: 'esg', label: 'Regional ESG Radar', icon: '🛡️' },
        ].map((tab) => (
          <button
            key={tab.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Visualizations Section (Recharts) ─────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md min-h-[420px]">
        <AnimatePresence mode="wait">
          {/* TAB 1: Financial NOI Telemetry */}
          {activeTab === 'financials' && (
            <motion.div
              key="financials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {selectedRegion === 'ALL'
                      ? 'Global Revenue & NOI Growth across Regions ($M)'
                      : `${regionInfo.name} NOI Growth Trend ($M)`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monthly Net Operating Income performance tracking with predictive forecasts.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Active Region</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-400 inline-block" /> Benchmark</span>
                </div>
              </div>

              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedRegion === 'ALL' ? (
                    <BarChart data={filteredTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="M" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                      <Bar dataKey="AMER_NOI" name="AMER NOI" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="EMEA_NOI" name="EMEA NOI" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="APAC_NOI" name="APAC NOI" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MEA_NOI" name="MEA / LATAM" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={filteredTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNOI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="M" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="ActiveRegionNOI"
                        name={`${regionInfo.name} NOI ($M)`}
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorNOI)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* TAB: Annual Performance Trend */}
          {activeTab === 'annual_trend' && (
            <motion.div
              key="annual_trend"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      Historical & Projected Multi-Year Telemetry
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      2020 – 2026 Forecast
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Annual YoY Performance Trend Across Regions</span>
                    <span>📈</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Historical year-over-year growth trajectories, net operating income progression, and multi-year portfolio occupancy telemetry across all global operating regions.
                  </p>
                </div>

                {/* Metric Selector Toggles */}
                <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
                  <button
                    onClick={() => setAnnualTrendMetricMode('growth')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      annualTrendMetricMode === 'growth'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📈 YoY Growth %
                  </button>
                  <button
                    onClick={() => setAnnualTrendMetricMode('noi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      annualTrendMetricMode === 'noi'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💰 Total NOI ($M)
                  </button>
                  <button
                    onClick={() => setAnnualTrendMetricMode('occupancy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      annualTrendMetricMode === 'occupancy'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🏢 Occupancy Rate %
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Highest Growth Region
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono mt-1 flex items-center gap-1.5">
                    <span>MEA / LATAM</span>
                    <span className="text-xs text-emerald-400 font-normal">(+18.5%)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    2020: +6.2% → 2026: +20.1%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30">
                  <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                    Global Portfolio CAGR
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-sky-300 font-mono mt-1">
                    +11.8%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Compound Annual Growth Rate
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30">
                  <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    Multi-Year NOI Expansion
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-purple-300 font-mono mt-1">
                    {currency.formatMillions(381)} → {currency.formatMillions(595)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    +56.3% Total Capital Expansion
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Occupancy Baseline
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono mt-1">
                    95.3%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Multi-Year Global Average
                  </div>
                </div>
              </div>

              {/* Line Chart Visualizer */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      {annualTrendMetricMode === 'growth' && '📈 YoY Growth Trajectory Across Operating Regions (%)'}
                      {annualTrendMetricMode === 'noi' && '💰 Annual Net Operating Income Expansion Across Regions ($M)'}
                      {annualTrendMetricMode === 'occupancy' && '🏢 Multi-Year Occupancy Rate Progression (%)'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Historical records from 2020 through 2025 with AI-projected 2026 performance horizons
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> EMEA</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> AMER</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" /> APAC</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> MEA</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Global Avg</span>
                  </div>
                </div>

                <div className="h-[360px] w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ANNUAL_PERFORMANCE_TRENDS} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        unit={annualTrendMetricMode === 'noi' ? 'M' : '%'}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                      {annualTrendMetricMode === 'growth' && (
                        <>
                          <Line type="monotone" dataKey="EMEA_Growth" name="EMEA YoY Growth (%)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="AMER_Growth" name="AMER YoY Growth (%)" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="APAC_Growth" name="APAC YoY Growth (%)" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="MEA_Growth" name="MEA YoY Growth (%)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Global_Avg" name="Global Avg Growth (%)" stroke="#e2e8f0" strokeWidth={3} strokeDasharray="4 4" activeDot={{ r: 6 }} />
                        </>
                      )}

                      {annualTrendMetricMode === 'noi' && (
                        <>
                          <Line type="monotone" dataKey="EMEA_NOI" name="EMEA NOI ($M)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="AMER_NOI" name="AMER NOI ($M)" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="APAC_NOI" name="APAC NOI ($M)" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="MEA_NOI" name="MEA / LATAM NOI ($M)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Global_NOI" name="Global Total NOI ($M)" stroke="#e2e8f0" strokeWidth={3} strokeDasharray="3 3" activeDot={{ r: 6 }} />
                        </>
                      )}

                      {annualTrendMetricMode === 'occupancy' && (
                        <>
                          <Line type="monotone" dataKey="EMEA_Occupancy" name="EMEA Occupancy (%)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="AMER_Occupancy" name="AMER Occupancy (%)" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="APAC_Occupancy" name="APAC Occupancy (%)" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="MEA_Occupancy" name="MEA Occupancy (%)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="TotalOccupancy" name="Global Total Occupancy (%)" stroke="#e2e8f0" strokeWidth={3} strokeDasharray="4 4" activeDot={{ r: 6 }} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual Data Table */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 font-mono">
                    📋 Year-by-Year Multi-Region Performance Matrix
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    2020 – 2026 Historical Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3 text-right">EMEA YoY %</th>
                        <th className="py-2.5 px-3 text-right">AMER YoY %</th>
                        <th className="py-2.5 px-3 text-right">APAC YoY %</th>
                        <th className="py-2.5 px-3 text-right">MEA YoY %</th>
                        <th className="py-2.5 px-3 text-right">Global Avg YoY %</th>
                        <th className="py-2.5 px-3 text-right">Global Total NOI</th>
                        <th className="py-2.5 px-3 text-right">Occupancy %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ANNUAL_PERFORMANCE_TRENDS.map((row) => {
                        const isProjected = row.year.includes('Proj')
                        return (
                          <tr
                            key={row.year}
                            className={`hover:bg-slate-900/60 transition-colors ${
                              isProjected ? 'bg-sky-500/10 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-200">
                              {row.year} {isProjected && <span className="text-[10px] text-sky-400 ml-1">🔮 Forecast</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-300">
                              +{row.EMEA_Growth}%
                            </td>
                            <td className="py-2.5 px-3 text-right text-sky-300">
                              +{row.AMER_Growth}%
                            </td>
                            <td className="py-2.5 px-3 text-right text-purple-300">
                              +{row.APAC_Growth}%
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-300">
                              +{row.MEA_Growth}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                              +{row.Global_Avg}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                              {currency.formatMillions(row.Global_NOI)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              {row.TotalOccupancy}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: Regional KPI Breakdown */}
          {activeTab === 'regional_kpi' && (
            <motion.div
              key="regional_kpi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header & Description */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Granular Property Category Metrics
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {filteredRegionalKpis.length} Asset Categories Evaluated
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Regional KPI Breakdown by Property Category</span>
                    <span>📋</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Detailed operational performance matrix analyzing average vacancy duration, maintenance response times, net operating income (NOI), and tenant retention metrics across asset categories and global regions.
                  </p>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search category or region..."
                      value={kpiSearchQuery}
                      onChange={(e) => setKpiSearchQuery(e.target.value)}
                      className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52 font-mono"
                    />
                    {kpiSearchQuery && (
                      <button
                        onClick={() => setKpiSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Summary Header Cards */}
              {(() => {
                const totalNoi = filteredRegionalKpis.reduce((acc, k) => acc + k.noiMillions, 0)
                const avgVacancy = filteredRegionalKpis.length
                  ? (filteredRegionalKpis.reduce((acc, k) => acc + k.avgVacancyDays, 0) / filteredRegionalKpis.length).toFixed(1)
                  : '0.0'
                const avgMaintHours = filteredRegionalKpis.length
                  ? (filteredRegionalKpis.reduce((acc, k) => acc + k.maintenanceResponseHours, 0) / filteredRegionalKpis.length).toFixed(1)
                  : '0.0'
                const avgOccRate = filteredRegionalKpis.length
                  ? (filteredRegionalKpis.reduce((acc, k) => acc + k.occupancyRatePct, 0) / filteredRegionalKpis.length).toFixed(1)
                  : '0.0'

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                      <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        Avg Vacancy Duration
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono mt-1 flex items-baseline gap-1.5">
                        <span>{avgVacancy}</span>
                        <span className="text-xs text-slate-400 font-normal">days</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Target SLA: &lt; 20.0 days
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30">
                      <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                        Avg Maintenance Response
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-sky-300 font-mono mt-1 flex items-baseline gap-1.5">
                        <span>{avgMaintHours}</span>
                        <span className="text-xs text-slate-400 font-normal">hours</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        SLA Target: &lt; 2.5 hours
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30">
                      <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                        Category Total NOI
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-purple-300 font-mono mt-1">
                        {currency.formatMillions(totalNoi)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Net Operating Income
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                      <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                        Avg Occupancy Rate
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono mt-1">
                        {avgOccRate}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Across Selected Category Views
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Property Category Filter Toggles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-mono font-bold text-slate-400 mr-1 whitespace-nowrap">
                  Filter Category:
                </span>
                {['ALL', 'Commercial Office', 'Industrial Logistics', 'Multi-Family Residential', 'Retail Plaza', 'Data Center'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setKpiCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      kpiCategoryFilter === cat
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Granular KPI Table */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
                    <span>Granular Operational KPI Matrix</span>
                    <span className="text-xs text-slate-500 font-normal">
                      (Click column headers to sort)
                    </span>
                  </h4>
                  <div className="text-xs font-mono text-slate-400">
                    Showing <span className="text-slate-200 font-bold">{filteredRegionalKpis.length}</span> records
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'region') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('region'); setKpiSortAsc(true) }
                          }}
                        >
                          Region {kpiSortField === 'region' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th
                          className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'category') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('category'); setKpiSortAsc(true) }
                          }}
                        >
                          Property Category {kpiSortField === 'category' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th
                          className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'avgVacancyDays') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('avgVacancyDays'); setKpiSortAsc(true) }
                          }}
                        >
                          Avg Vacancy Duration {kpiSortField === 'avgVacancyDays' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th
                          className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'maintenanceResponseHours') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('maintenanceResponseHours'); setKpiSortAsc(true) }
                          }}
                        >
                          Maintenance Response Time {kpiSortField === 'maintenanceResponseHours' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th
                          className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'noiMillions') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('noiMillions'); setKpiSortAsc(false) }
                          }}
                        >
                          Net Operating Income (NOI) {kpiSortField === 'noiMillions' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th
                          className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => {
                            if (kpiSortField === 'occupancyRatePct') setKpiSortAsc(!kpiSortAsc)
                            else { setKpiSortField('occupancyRatePct'); setKpiSortAsc(false) }
                          }}
                        >
                          Occupancy % {kpiSortField === 'occupancyRatePct' && (kpiSortAsc ? '▲' : '▼')}
                        </th>
                        <th className="py-3 px-3 text-right">Rent Collection</th>
                        <th className="py-3 px-3 text-right">Tenant Retention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredRegionalKpis.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                            No regional KPI records matched your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRegionalKpis.map((row) => {
                          const regionColor =
                            row.region === 'EMEA'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : row.region === 'AMER'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                              : row.region === 'APAC'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'

                          const vacancyBadge =
                            row.avgVacancyDays <= 12
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : row.avgVacancyDays <= 22
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'

                          const maintBadge =
                            row.maintenanceResponseHours <= 1.5
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : row.maintenanceResponseHours <= 3.0
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'

                          return (
                            <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${regionColor}`}>
                                  {row.region}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-200">
                                {row.category}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-6 opacity-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={row.vacancyTrend}>
                                        <Line type="monotone" dataKey="val" stroke={row.avgVacancyDays <= 12 ? '#34d399' : row.avgVacancyDays <= 22 ? '#fbbf24' : '#fb7185'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${vacancyBadge}`}>
                                    {row.avgVacancyDays} days
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${maintBadge}`}>
                                  {row.maintenanceResponseHours} hrs
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-400">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-6 opacity-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={row.noiTrend}>
                                        <Line type="monotone" dataKey="val" stroke="#34d399" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div>
                                    {currency.formatMillions(row.noiMillions)}
                                    <span className="text-[10px] text-slate-500 block font-normal">
                                      Gross: {currency.formatMillions(row.grossIncomeMillions)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-slate-200">
                                {row.occupancyRatePct}%
                              </td>
                              <td className="py-3 px-3 text-right text-slate-300">
                                {row.rentCollectionRatePct}%
                              </td>
                              <td className="py-3 px-3 text-right text-slate-300">
                                {row.tenantRetentionPct}%
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bar Chart Visualizer for Vacancy vs Maintenance Response */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 font-mono">
                      📊 Property Category Operational Friction Comparison
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Vacancy Duration (Days) vs. Maintenance Response Time (Hours) per Category
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Vacancy Duration (Days)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Maintenance Response (Hrs)</span>
                  </div>
                </div>

                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredRegionalKpis} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgVacancyDays" name="Avg Vacancy Duration (Days)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="maintenanceResponseHours" name="Maintenance Response Time (Hrs)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Occupancy & Retention */}
          {activeTab === 'occupancy' && (
            <motion.div
              key="occupancy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Occupancy & Tenant Retention Trajectory (%)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Correlation between physical building occupancy and automated lease renewal rates.
                  </p>
                </div>
              </div>

              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[85, 100]} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="Occupancy"
                      name="Portfolio Occupancy %"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#38bdf8' }}
                      activeDot={{ r: 7 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Retention"
                      name="Tenant Retention %"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#a855f7' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Rent Collection & Maintenance SLA Efficiency */}
          {activeTab === 'rent_maintenance' && (
            <motion.div
              key="rent_maintenance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Rent Collection Rate (%) &amp; Maintenance Resolution Time (Hours)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated rent collection velocity paired with AI dispatch maintenance efficiency.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Rent Collected %</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Maint. Time (hrs)</span>
                </div>
              </div>

              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} domain={[90, 100]} unit="%" />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 6]} unit="h" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="RentCollected" name="Rent Collected %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="MaintenanceTimeHours" name="Avg Maintenance Resolution Time (Hrs)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* TAB: Critical Property Alerts */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Notification Banner */}
              <AnimatePresence>
                {alertActionNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">✅</span>
                      <span>{alertActionNotification}</span>
                    </div>
                    <button
                      onClick={() => setAlertActionNotification(null)}
                      className="text-emerald-400 hover:text-emerald-200 cursor-pointer font-bold px-2"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="text-[11px] font-mono text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Critical Severity</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Require Immediate Escalation</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>💰 Overdue Rent Items</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {alerts.filter((a) => a.type === 'OVERDUE_RENT' && a.status !== 'RESOLVED').length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Active Lease Arrears</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30">
                  <div className="text-[11px] font-mono text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡ SLA / Facility Issues</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {alerts.filter((a) => (a.type === 'URGENT_MAINTENANCE' || a.type === 'FACILITY_EMERGENCY') && a.status !== 'RESOLVED').length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Urgent Work Orders</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>✓ Resolved Issues</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {alerts.filter((a) => a.status === 'RESOLVED').length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Actioned &amp; Closed</div>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="text"
                    placeholder="Search property, tenant, ticket ID..."
                    value={alertSearchQuery}
                    onChange={(e) => setAlertSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Severity Filter */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                    <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Severity:</span>
                    {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setAlertFilterSeverity(sev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          alertFilterSeverity === sev
                            ? sev === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                              : sev === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                    <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Type:</span>
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'OVERDUE_RENT', label: 'Rent 💰' },
                      { id: 'URGENT_MAINTENANCE', label: 'Maint ⚡' },
                      { id: 'FACILITY_EMERGENCY', label: 'Facility 🛠️' },
                      { id: 'LEASE_EXPIRE_RISK', label: 'Lease 🏢' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setAlertFilterType(t.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          alertFilterType === t.id
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alerts List Header */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>
                  Showing <strong className="text-slate-200 font-bold">{filteredAlerts.length}</strong> property alerts
                  {selectedRegion !== 'ALL' && ` in ${REGIONS[selectedRegion].name}`}
                </span>
                <span className="text-[11px] text-slate-500">Sorted by urgency &amp; severity</span>
              </div>

              {/* Alerts List Container */}
              <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs font-mono">
                    No property alerts match the active search and filter criteria.
                  </div>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isCritical = alert.severity === 'CRITICAL'
                    const isHigh = alert.severity === 'HIGH'
                    const isResolved = alert.status === 'RESOLVED'

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-2xl bg-slate-950/80 border transition-all space-y-3 relative overflow-hidden ${
                          isResolved
                            ? 'opacity-65 border-slate-800/80 bg-slate-950/40 border-l-4 border-l-emerald-500'
                            : isCritical
                            ? 'border-slate-800/90 border-l-4 border-l-rose-500 hover:border-rose-500/40 shadow-md shadow-rose-950/20'
                            : isHigh
                            ? 'border-slate-800/90 border-l-4 border-l-amber-500 hover:border-amber-500/40 shadow-md shadow-amber-950/20'
                            : 'border-slate-800/90 border-l-4 border-l-sky-500 hover:border-sky-500/40'
                        }`}
                      >
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Severity Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : alert.severity === 'HIGH'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : alert.severity === 'MEDIUM'
                                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                                  : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              <span>
                                {alert.severity === 'CRITICAL'
                                  ? '🔴'
                                  : alert.severity === 'HIGH'
                                  ? '🟧'
                                  : alert.severity === 'MEDIUM'
                                  ? '🟨'
                                  : '🟦'}
                              </span>
                              <span>{alert.severity} SEVERITY</span>
                            </span>

                            {/* Type Badge */}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                              {alert.type === 'OVERDUE_RENT' && '💰 Overdue Rent'}
                              {alert.type === 'URGENT_MAINTENANCE' && '⚡ Urgent Maintenance'}
                              {alert.type === 'FACILITY_EMERGENCY' && '🛠️ Facility Emergency'}
                              {alert.type === 'LEASE_EXPIRE_RISK' && '🏢 Lease Expiration Risk'}
                            </span>

                            {/* Region Flag */}
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 font-mono">
                              <span>{REGIONS[alert.region].flag}</span>
                              <span>{alert.region}</span>
                            </span>
                          </div>

                          {/* ID & Status */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {alert.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                alert.status === 'RESOLVED'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : alert.status === 'IN_PROGRESS'
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {alert.status === 'RESOLVED' ? '✓ RESOLVED' : alert.status === 'IN_PROGRESS' ? '⏳ IN PROGRESS' : '🔴 OPEN'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Property Information */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <span>{alert.title}</span>
                            </h4>
                            <p className="text-xs text-emerald-400/90 font-mono font-semibold">
                              📍 {alert.propertyName} <span className="text-slate-400 font-sans">({alert.unitOrTenant})</span>
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                              {alert.description}
                            </p>
                          </div>

                          {/* Metric / SLA Pill */}
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 text-right min-w-[170px]">
                            <div className="text-[10px] font-mono text-slate-400 uppercase">Impact Metric</div>
                            <div
                              className={`text-xs font-bold font-mono mt-0.5 ${
                                isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-sky-400'
                              }`}
                            >
                              {alert.metricBadge}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action & Footer Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/50 text-xs">
                          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                            <span>🕒 {alert.timestamp}</span>
                            {alert.contactPerson && (
                              <span className="text-slate-400">
                                · Contact: <strong className="text-slate-300 font-medium">{alert.contactPerson}</strong>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDispatchAlertAction(alert)}
                              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>⚡</span>
                              <span>
                                {alert.type === 'OVERDUE_RENT'
                                  ? 'Send Rent Notice'
                                  : alert.type === 'LEASE_EXPIRE_RISK'
                                  ? 'Send Renewal Terms'
                                  : 'Dispatch Vendor'}
                              </span>
                            </button>

                            <button
                              onClick={() => handleToggleAlertStatus(alert.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                                isResolved
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              <span>{isResolved ? '↩ Reopen' : '✓ Resolve'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: ROI Yield Calculator */}
          {activeTab === 'roi_calculator' && (
            <motion.div
              key="roi_calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header & Preset Scenarios */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Asset Investment Yield Model
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      5 to 10 Year Horizon Projection
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Property Asset ROI &amp; Yield Projection Engine</span>
                    <span>🧮</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Input current property acquisition costs, capex upgrades, and operational expenses to simulate multi-year net cash flows, exit cap rates, and equity yields.
                  </p>
                </div>

                {/* Preset Scenario Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 w-full sm:w-auto">Load Preset:</span>
                  <button
                    onClick={() => handleApplyRoiPreset('COMMERCIAL')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏢 Prime Office</span>
                  </button>
                  <button
                    onClick={() => handleApplyRoiPreset('INDUSTRIAL')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏭 Logistics Hub</span>
                  </button>
                  <button
                    onClick={() => handleApplyRoiPreset('MULTIFAMILY')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏘️ Multi-Family</span>
                  </button>
                  <button
                    onClick={() => handleApplyRoiPreset('RESET')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
                    title="Reset to default baseline model"
                  >
                    <span>🔄 Reset</span>
                  </button>
                </div>
              </div>

              {/* Top Output KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 relative overflow-hidden">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Total Projected ROI
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-300 font-mono mt-1">
                    +{roiProjections.totalRoiPct}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Multiple: <span className="text-slate-200 font-bold">{roiProjections.equityMultiple}x</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/30">
                  <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                    Projected Net Profit
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    ${(roiProjections.netProfit / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Over {roiInvestmentYears} Year Period</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-500/30">
                  <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    Annualized Yield (IRR)
                  </div>
                  <div className="text-2xl font-extrabold text-purple-300 font-mono mt-1">
                    {roiProjections.annualizedRoiPct}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Compound Annual Growth</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30">
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Cap Rate Spread
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {roiProjections.initialCapRate}% → {roiProjections.exitCapRate}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Entry vs Exit Cap Rate</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Initial Capital Invested
                  </div>
                  <div className="text-2xl font-extrabold text-slate-200 font-mono mt-1">
                    ${(roiProjections.initialEquityInvested / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Equity + Capex Required</div>
                </div>
              </div>

              {/* Calculator Inputs & Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs Column (5 cols) */}
                <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>⚡ Model Input Parameters</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">Real-time Recalculation</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Investment Horizon Slider */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-slate-200">Holding Period Horizon:</label>
                        <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {roiInvestmentYears} Years
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={10}
                        step={1}
                        value={roiInvestmentYears}
                        onChange={(e) => setRoiInvestmentYears(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>5 Years (Standard)</span>
                        <span>7 Years</span>
                        <span>10 Years (Long Term)</span>
                      </div>
                    </div>

                    {/* Acquisition Cost */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Purchase Price ($):
                        </label>
                        <input
                          type="number"
                          value={roiPurchasePrice}
                          onChange={(e) => setRoiPurchasePrice(Math.max(100000, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Renovation / Capex ($):
                        </label>
                        <input
                          type="number"
                          value={roiRenovationCost}
                          onChange={(e) => setRoiRenovationCost(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Gross Income & Opex */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Annual Gross Rent ($):
                        </label>
                        <input
                          type="number"
                          value={roiGrossIncome}
                          onChange={(e) => setRoiGrossIncome(Math.max(10000, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Annual Operating Exp ($):
                        </label>
                        <input
                          type="number"
                          value={roiOperatingExpenses}
                          onChange={(e) => setRoiOperatingExpenses(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Growth Rates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Rent Growth Rate (%/yr):
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={roiIncomeGrowthRate}
                          onChange={(e) => setRoiIncomeGrowthRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Property Appreciation (%/yr):
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={roiAppreciationRate}
                          onChange={(e) => setRoiAppreciationRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Debt & LTV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Financing LTV (%):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={roiFinancingLtv}
                          onChange={(e) => setRoiFinancingLtv(Math.min(95, Math.max(0, Number(e.target.value))))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-mono mb-1">
                          Debt Interest Rate (%):
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={roiInterestRate}
                          onChange={(e) => setRoiInterestRate(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Debt & Equity Summary Banner */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Mortgage Debt Loan:</span>
                        <span className="text-slate-200 font-semibold">${(roiProjections.loanAmount / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Annual Debt Service:</span>
                        <span className="text-amber-400 font-semibold">${(roiProjections.annualDebtService / 1000).toFixed(1)}k / yr</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                        <span>Exit Equity Value (Yr {roiInvestmentYears}):</span>
                        <span className="text-emerald-400 font-bold">${(roiProjections.exitEquity / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visualizer Column (7 cols) */}
                <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        {roiChartViewMode === 'equity' ? '📈 Multi-Year Equity & Asset Growth' : '💰 Projected Annual Net Cash Flow'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {roiChartViewMode === 'equity'
                          ? 'Asset valuation growth vs accumulated equity value over horizon'
                          : 'Net cash flow after debt service and cumulative cash yield'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        onClick={() => setRoiChartViewMode('equity')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                          roiChartViewMode === 'equity'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Equity Growth
                      </button>
                      <button
                        onClick={() => setRoiChartViewMode('cashflow')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                          roiChartViewMode === 'cashflow'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Cash Flow
                      </button>
                    </div>
                  </div>

                  {/* Recharts Chart View */}
                  <div className="h-[300px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {roiChartViewMode === 'equity' ? (
                        <ComposedChart data={roiProjections.yearlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="yearLabel" stroke="#64748b" fontSize={11} />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Area
                            type="monotone"
                            dataKey="equityValue"
                            name="Equity Value ($)"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.25}
                          />
                          <Line
                            type="monotone"
                            dataKey="assetValue"
                            name="Total Asset Value ($)"
                            stroke="#38bdf8"
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                        </ComposedChart>
                      ) : (
                        <BarChart data={roiProjections.yearlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="yearLabel" stroke="#64748b" fontSize={11} />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="noi" name="NOI ($)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="netCashFlow" name="Net Cash Flow ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Projection Table */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 font-mono">
                    📋 Year-by-Year Yield &amp; Cash Flow Schedule ({roiInvestmentYears} Years)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Amounts formatted in USD ($)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3 text-right">Gross Rent</th>
                        <th className="py-2.5 px-3 text-right">Opex</th>
                        <th className="py-2.5 px-3 text-right">NOI</th>
                        <th className="py-2.5 px-3 text-right">Debt Service</th>
                        <th className="py-2.5 px-3 text-right">Net Cash Flow</th>
                        <th className="py-2.5 px-3 text-right">Asset Equity</th>
                        <th className="py-2.5 px-3 text-right">Cumul. Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {roiProjections.yearlyBreakdown.map((row) => {
                        const isExitYear = row.year === roiInvestmentYears
                        return (
                          <tr
                            key={row.year}
                            className={`hover:bg-slate-900/60 transition-colors ${
                              isExitYear ? 'bg-emerald-500/10 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-200">
                              {row.yearLabel} {isExitYear && <span className="text-[10px] text-emerald-400 ml-1">★ Exit</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              ${row.grossIncome.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-300/80">
                              -${row.operatingExpenses.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-sky-300 font-semibold">
                              ${row.noi.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-300/80">
                              -${row.debtService.toLocaleString()}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${row.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ${row.netCashFlow.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-purple-300 font-semibold">
                              ${row.equityValue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                              ${row.totalReturnWithEquity.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Side-by-Side Multi-Region Comparison */}
          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>⚖️ Side-by-Side Multi-Region Comparative Analytics</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select two or more regions to evaluate relative KPI yields, rent collection rates, and monthly NOI trends side-by-side.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Metric Switcher */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
                    <button
                      onClick={() => setCompareMetricMode('kpi')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        compareMetricMode === 'kpi'
                          ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📊 Key Metrics (KPIs)
                    </button>
                    <button
                      onClick={() => setCompareMetricMode('noi')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        compareMetricMode === 'noi'
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📈 Monthly NOI ($M)
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparative Multi-Region Filter Pills */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    Select Regions to Compare (Min. 2):
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedCompareRegions.length} of 4 Regions Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'EMEA', name: 'Europe, Middle East & Africa', flag: '🇪🇺', color: '#38bdf8' },
                    { id: 'AMER', name: 'Americas (AMER)', flag: '🇺🇸', color: '#a855f7' },
                    { id: 'APAC', name: 'Asia-Pacific (APAC)', flag: '🇸🇬', color: '#10b981' },
                    { id: 'MEA', name: 'Middle East & LATAM', flag: '🇦🇪', color: '#f59e0b' },
                  ].map((r) => {
                    const isSelected = selectedCompareRegions.includes(r.id as any)
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleCompareRegion(r.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-slate-950/40 text-slate-500 border-slate-800/60 hover:text-slate-300'
                        }`}
                        style={{
                          borderColor: isSelected ? r.color : undefined,
                          boxShadow: isSelected ? `0 0 12px ${r.color}25` : undefined,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? r.color : '#64748b' }} />
                        <span>{r.flag}</span>
                        <span>{r.id}</span>
                        <span className="text-[10px] opacity-75 font-normal">({r.name})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grouped Bar Chart Visualization */}
              <div className="h-[360px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(compareMetricMode === 'kpi' ? KPI_METRICS_DATA : MONTHLY_COMPARE_DATA) as any[]}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey={compareMetricMode === 'kpi' ? 'metric' : 'month'}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

                    {selectedCompareRegions.includes('EMEA') && (
                      <Bar dataKey="EMEA" name="EMEA 🇪🇺" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    )}
                    {selectedCompareRegions.includes('AMER') && (
                      <Bar dataKey="AMER" name="AMER 🇺🇸" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    )}
                    {selectedCompareRegions.includes('APAC') && (
                      <Bar dataKey="APAC" name="APAC 🇸🇬" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                    {selectedCompareRegions.includes('MEA') && (
                      <Bar dataKey="MEA" name="MEA 🇦🇪" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparative Side-by-Side Summary Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
                  Side-by-Side Regional Metric Matrix
                </h4>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-semibold">Region / Hub</th>
                      <th className="pb-2 font-semibold text-right">Properties</th>
                      <th className="pb-2 font-semibold text-right">Occupancy</th>
                      <th className="pb-2 font-semibold text-right">Rent Yield %</th>
                      <th className="pb-2 font-semibold text-right">NOI ($M)</th>
                      <th className="pb-2 font-semibold text-right">NOI Growth</th>
                      <th className="pb-2 font-semibold text-right">Maint. SLA</th>
                      <th className="pb-2 font-semibold text-right">ESG Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedCompareRegions.map((regKey) => {
                      const reg = REGIONS[regKey]
                      return (
                        <tr key={regKey} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 font-bold text-slate-200 flex items-center gap-2">
                            <span>{reg.flag}</span>
                            <span>{reg.name}</span>
                          </td>
                          <td className="py-2.5 text-right text-slate-300">{reg.properties}</td>
                          <td className="py-2.5 text-right text-emerald-400 font-bold">{reg.occupancy}%</td>
                          <td className="py-2.5 text-right text-sky-400 font-bold">{reg.rentCollectionRate ?? 98.5}%</td>
                          <td className="py-2.5 text-right text-slate-100 font-bold">${reg.noi}M</td>
                          <td className="py-2.5 text-right text-purple-400">+{reg.noiGrowth}%</td>
                          <td className="py-2.5 text-right text-amber-400">{reg.maintenanceSla}%</td>
                          <td className="py-2.5 text-right text-teal-400">{reg.esgScore}/100</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 4: D3 Interactive Portfolio Topology */}
          {activeTab === 'topology' && (
            <motion.div
              key="topology"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <D3PerformanceTopology />
            </motion.div>
          )}

          {/* TAB 4b: D3 Geographical Heatmap */}
          {activeTab === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <D3GeographicalHeatmap />
            </motion.div>
          )}

          {/* TAB 3: Asset Portfolio Allocation */}
          {activeTab === 'allocation' && (
            <motion.div
              key="allocation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">
                  Global Portfolio Capital & Unit Distribution
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Distribution of $525.9M total AUM across primary global regional property nodes.
                </p>

                <div className="space-y-3">
                  {REGIONAL_ALLOCATION.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="text-xs font-bold text-slate-200">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.properties} Active Units</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-100">${item.value}M</div>
                        <div className="text-[10px] text-emerald-400">{item.percent}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[320px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={REGIONAL_ALLOCATION}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {REGIONAL_ALLOCATION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Regional ESG Radar */}
          {activeTab === 'esg' && (
            <motion.div
              key="esg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">
                  ESG, Operational & Digitization Radar
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Multi-axis comparison evaluating ESG Compliance, Digital Lease Adoption, and Maintenance SLAs.
                </p>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-slate-200">CSRD / BREEAM Audit Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      100% Compliant
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-slate-200">Solar PV &amp; Clean Energy Mix:</span>
                    <span className="font-mono text-cyan-400 font-bold">88.4% Average</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-slate-200">AI Ticket Resolution Time:</span>
                    <span className="font-mono text-amber-400 font-bold">&lt; 2.4 Hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Digital Smart Contracts:</span>
                    <span className="font-mono text-purple-400 font-bold">96.2% On-Chain</span>
                  </div>
                </div>
              </div>

              <div className="h-[320px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={90} data={RADAR_METRICS}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                    <Radar name="EMEA" dataKey="EMEA" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                    <Radar name="AMER" dataKey="AMER" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                    <Radar name="APAC" dataKey="APAC" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GlobalPerformanceDashboard
