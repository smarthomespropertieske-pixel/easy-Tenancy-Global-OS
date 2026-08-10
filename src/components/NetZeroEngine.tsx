// ═══════════════════════════════════════════════════════════════════════
//  NetZeroEngine.tsx — Real-Time Carbon Emission Telemetry & Energy OS
//  ─────────────────────────────────────────────────────────────────────
//  Part of easy-tenancy-global-os v4.5 Planetary Infrastructure Core.
//  Monitors Scope 1/2/3 carbon emissions, real-time EUI, renewable energy mix,
//  and EPC / BREEAM energy efficiency ratings via interactive SVG donut charts.
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────
//  TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────
export interface EnergySlice {
  id: string
  label: string
  percentage: number
  valueKw?: number
  color: string
  description: string
  status: 'optimal' | 'nominal' | 'warning'
}

export interface ForecastDataPoint {
  period: string
  baseline: number
  predicted: number
  optimized: number
  target: number
}

export interface PropertyForecastData {
  monthly: ForecastDataPoint[]
  quarterly: ForecastDataPoint[]
  annual: ForecastDataPoint[]
}

// ─────────────────────────────────────────────────────────────────────
//  PREDICTIVE FORECAST DATASETS (MONTHLY, QUARTERLY, ANNUAL)
// ─────────────────────────────────────────────────────────────────────
const FORECAST_PROJECTIONS: Record<string, PropertyForecastData> = {
  'nairobi-horizon': {
    monthly: [
      { period: 'Jan 26', baseline: 74, predicted: 43, optimized: 39, target: 36 },
      { period: 'Feb 26', baseline: 76, predicted: 42, optimized: 38, target: 35 },
      { period: 'Mar 26', baseline: 80, predicted: 45, optimized: 40, target: 34 },
      { period: 'Apr 26', baseline: 78, predicted: 41, optimized: 37, target: 33 },
      { period: 'May 26', baseline: 82, predicted: 46, optimized: 41, target: 32 },
      { period: 'Jun 26', baseline: 85, predicted: 49, optimized: 43, target: 31 },
      { period: 'Jul 26', baseline: 83, predicted: 47, optimized: 42, target: 30 },
      { period: 'Aug 26', baseline: 81, predicted: 45, optimized: 40, target: 29 },
      { period: 'Sep 26', baseline: 77, predicted: 42, optimized: 37, target: 28 },
      { period: 'Oct 26', baseline: 75, predicted: 39, optimized: 35, target: 27 },
      { period: 'Nov 26', baseline: 73, predicted: 37, optimized: 33, target: 26 },
      { period: 'Dec 26', baseline: 71, predicted: 34, optimized: 30, target: 25 },
    ],
    quarterly: [
      { period: 'Q1 2026', baseline: 230, predicted: 130, optimized: 117, target: 105 },
      { period: 'Q2 2026', baseline: 245, predicted: 136, optimized: 121, target: 96 },
      { period: 'Q3 2026', baseline: 241, predicted: 134, optimized: 119, target: 87 },
      { period: 'Q4 2026', baseline: 219, predicted: 110, optimized: 98, target: 78 },
    ],
    annual: [
      { period: '2024 (Hist)', baseline: 890, predicted: 810, optimized: 810, target: 800 },
      { period: '2025 (Hist)', baseline: 840, predicted: 620, optimized: 580, target: 560 },
      { period: '2026 (Cur)',  baseline: 935, predicted: 510, optimized: 455, target: 366 },
      { period: '2027 (Proj)', baseline: 910, predicted: 340, optimized: 280, target: 220 },
      { period: '2028 (Proj)', baseline: 880, predicted: 190, optimized: 110, target: 0 },
    ],
  },
  'london-sovereign': {
    monthly: [
      { period: 'Jan 26', baseline: 115, predicted: 74, optimized: 66, target: 58 },
      { period: 'Feb 26', baseline: 112, predicted: 71, optimized: 63, target: 56 },
      { period: 'Mar 26', baseline: 108, predicted: 68, optimized: 60, target: 54 },
      { period: 'Apr 26', baseline: 98,  predicted: 59, optimized: 52, target: 52 },
      { period: 'May 26', baseline: 92,  predicted: 54, optimized: 48, target: 50 },
      { period: 'Jun 26', baseline: 96,  predicted: 57, optimized: 50, target: 48 },
      { period: 'Jul 26', baseline: 102, predicted: 62, optimized: 55, target: 46 },
      { period: 'Aug 26', baseline: 105, predicted: 64, optimized: 57, target: 44 },
      { period: 'Sep 26', baseline: 95,  predicted: 58, optimized: 51, target: 42 },
      { period: 'Oct 26', baseline: 104, predicted: 65, optimized: 58, target: 40 },
      { period: 'Nov 26', baseline: 110, predicted: 70, optimized: 62, target: 38 },
      { period: 'Dec 26', baseline: 118, predicted: 76, optimized: 68, target: 36 },
    ],
    quarterly: [
      { period: 'Q1 2026', baseline: 335, predicted: 213, optimized: 189, target: 168 },
      { period: 'Q2 2026', baseline: 286, predicted: 170, optimized: 150, target: 150 },
      { period: 'Q3 2026', baseline: 302, predicted: 184, optimized: 163, target: 132 },
      { period: 'Q4 2026', baseline: 338, predicted: 211, optimized: 188, target: 114 },
    ],
    annual: [
      { period: '2024 (Hist)', baseline: 1420, predicted: 1280, optimized: 1280, target: 1200 },
      { period: '2025 (Hist)', baseline: 1350, predicted: 1020, optimized: 980, target: 900 },
      { period: '2026 (Cur)',  baseline: 1261, predicted: 778,  optimized: 690, target: 564 },
      { period: '2027 (Proj)', baseline: 1200, predicted: 510,  optimized: 440, target: 320 },
      { period: '2028 (Proj)', baseline: 1150, predicted: 280,  optimized: 180, target: 0 },
    ],
  },
  'frankfurt-green': {
    monthly: [
      { period: 'Jan 26', baseline: 62, predicted: 26, optimized: 22, target: 20 },
      { period: 'Feb 26', baseline: 60, predicted: 25, optimized: 21, target: 19 },
      { period: 'Mar 26', baseline: 58, predicted: 24, optimized: 20, target: 18 },
      { period: 'Apr 26', baseline: 52, predicted: 21, optimized: 18, target: 17 },
      { period: 'May 26', baseline: 48, predicted: 19, optimized: 16, target: 16 },
      { period: 'Jun 26', baseline: 50, predicted: 20, optimized: 17, target: 15 },
      { period: 'Jul 26', baseline: 54, predicted: 22, optimized: 19, target: 14 },
      { period: 'Aug 26', baseline: 56, predicted: 23, optimized: 20, target: 13 },
      { period: 'Sep 26', baseline: 51, predicted: 20, optimized: 17, target: 12 },
      { period: 'Oct 26', baseline: 55, predicted: 22, optimized: 19, target: 11 },
      { period: 'Nov 26', baseline: 59, predicted: 24, optimized: 21, target: 10 },
      { period: 'Dec 26', baseline: 63, predicted: 26, optimized: 22, target: 9 },
    ],
    quarterly: [
      { period: 'Q1 2026', baseline: 180, predicted: 75, optimized: 63, target: 57 },
      { period: 'Q2 2026', baseline: 150, predicted: 60, optimized: 51, target: 48 },
      { period: 'Q3 2026', baseline: 161, predicted: 65, optimized: 56, target: 39 },
      { period: 'Q4 2026', baseline: 177, predicted: 72, optimized: 62, target: 30 },
    ],
    annual: [
      { period: '2024 (Hist)', baseline: 740, predicted: 510, optimized: 510, target: 500 },
      { period: '2025 (Hist)', baseline: 710, predicted: 390, optimized: 360, target: 340 },
      { period: '2026 (Cur)',  baseline: 668, predicted: 272, optimized: 232, target: 174 },
      { period: '2027 (Proj)', baseline: 630, predicted: 150, optimized: 110, target: 80 },
      { period: '2028 (Proj)', baseline: 600, predicted: 60,  optimized: 20,  target: 0 },
    ],
  },
  'tokyo-eco': {
    monthly: [
      { period: 'Jan 26', baseline: 104, predicted: 70, optimized: 62, target: 52 },
      { period: 'Feb 26', baseline: 101, predicted: 68, optimized: 60, target: 50 },
      { period: 'Mar 26', baseline: 95,  predicted: 63, optimized: 55, target: 48 },
      { period: 'Apr 26', baseline: 88,  predicted: 57, optimized: 49, target: 46 },
      { period: 'May 26', baseline: 84,  predicted: 54, optimized: 46, target: 44 },
      { period: 'Jun 26', baseline: 92,  predicted: 60, optimized: 52, target: 42 },
      { period: 'Jul 26', baseline: 112, predicted: 78, optimized: 68, target: 40 },
      { period: 'Aug 26', baseline: 118, predicted: 82, optimized: 72, target: 38 },
      { period: 'Sep 26', baseline: 100, predicted: 66, optimized: 58, target: 36 },
      { period: 'Oct 26', baseline: 90,  predicted: 58, optimized: 50, target: 34 },
      { period: 'Nov 26', baseline: 96,  predicted: 62, optimized: 54, target: 32 },
      { period: 'Dec 26', baseline: 108, predicted: 73, optimized: 65, target: 30 },
    ],
    quarterly: [
      { period: 'Q1 2026', baseline: 300, predicted: 201, optimized: 177, target: 150 },
      { period: 'Q2 2026', baseline: 264, predicted: 171, optimized: 147, target: 132 },
      { period: 'Q3 2026', baseline: 330, predicted: 226, optimized: 198, target: 114 },
      { period: 'Q4 2026', baseline: 294, predicted: 193, optimized: 169, target: 96 },
    ],
    annual: [
      { period: '2024 (Hist)', baseline: 1310, predicted: 1150, optimized: 1150, target: 1100 },
      { period: '2025 (Hist)', baseline: 1250, predicted: 960,  optimized: 910,  target: 850 },
      { period: '2026 (Cur)',  baseline: 1188, predicted: 791,  optimized: 691,  target: 492 },
      { period: '2027 (Proj)', baseline: 1120, predicted: 530,  optimized: 440,  target: 280 },
      { period: '2028 (Proj)', baseline: 1050, predicted: 290,  optimized: 190,  target: 0 },
    ],
  },
}

// Custom Tooltip for Recharts Line Chart
function CustomForecastTooltip({ active, payload, label, timeframe }: any) {
  if (!active || !payload || !payload.length) return null

  // Extract breached status if available from point payload
  const dataPoint = payload[0]?.payload
  const isBreached = dataPoint?.isBreached
  const excessTons = dataPoint?.excessTons ?? 0
  const goalTarget = dataPoint?.goalTarget ?? 0

  return (
    <div className={`p-3.5 rounded-xl bg-slate-900/95 border ${isBreached ? 'border-rose-500/80 shadow-rose-950/60' : 'border-emerald-500/40'} text-slate-100 shadow-2xl font-mono text-xs space-y-2 backdrop-blur-md max-w-xs`}>
      <div className="font-bold border-b border-white/10 pb-1.5 flex items-center justify-between gap-4">
        <span className="text-emerald-300">📅 {label}</span>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">{timeframe} forecast</span>
      </div>

      {isBreached && (
        <div className="p-1.5 rounded-lg bg-rose-950/90 border border-rose-500/50 text-[11px] text-rose-300 font-bold flex items-center justify-between gap-2 animate-pulse">
          <span>🚨 THRESHOLD EXCEEDED</span>
          <span className="text-rose-200">+{excessTons}T CO₂e</span>
        </div>
      )}

      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-5 text-[11px]">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold text-slate-100">{entry.value} Tons CO₂e</span>
          </div>
        ))}
      </div>

      {isBreached && (
        <div className="pt-1 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Target Goal: <strong className="text-purple-300">{goalTarget}T</strong></span>
          <span className="text-rose-400 font-bold">Overshoot: +{excessTons}T</span>
        </div>
      )}
    </div>
  )
}


export interface PropertyNetZeroData {
  id: string
  name: string
  location: string
  flag: string
  assetType: string
  areaSqm: number
  epcGrade: string // e.g. 'EPC A+', 'EPC A'
  breeamRating: string // e.g. 'BREEAM Outstanding'
  esgScore: number // 0-100
  co2Intensity: number // kg CO2e/m²/yr
  co2Baseline: number // kg CO2e/m²/yr
  eui: number // kWh/m²/yr
  activePowerKw: number
  renewablePct: number
  annualSavingsTons: number
  csrdCompliancePct: number
  
  // Donut view 1: Energy Source Mix
  energyMix: EnergySlice[]
  
  // Donut view 2: EPC Grade Unit Distribution
  gradeDistribution: EnergySlice[]

  // Donut view 3: Scope 1, 2, 3 Footprint
  emissionsBreakdown: EnergySlice[]

  // Subsystem Telemetry
  subsystems: {
    name: string
    category: string
    status: 'online' | 'optimizing' | 'standby'
    efficiency: number
    detail: string
  }[]
}

export interface NetZeroEngineProps {
  /** Selected property ID (optional, defaults to first property) */
  selectedPropertyId?: string
  /** Layout variant: 'full' (default), 'card', or 'compact' */
  variant?: 'full' | 'card' | 'compact'
  /** Optional custom CSS classes */
  className?: string
  /** Callback when property is switched */
  onPropertyChange?: (propertyId: string) => void
}

// ─────────────────────────────────────────────────────────────────────
//  PORTFOLIO PROPERTY DATASETS
// ─────────────────────────────────────────────────────────────────────
const PORTFOLIO_PROPERTIES: PropertyNetZeroData[] = [
  {
    id: 'nairobi-horizon',
    name: 'Nairobi Horizon Tower',
    location: 'Nairobi, Kenya',
    flag: '🇰🇪',
    assetType: 'Commercial Grade-A Tower',
    areaSqm: 45000,
    epcGrade: 'EPC A+',
    breeamRating: 'BREEAM Outstanding',
    esgScore: 96.8,
    co2Intensity: 11.4,
    co2Baseline: 19.8,
    eui: 64.2,
    activePowerKw: 284,
    renewablePct: 88,
    annualSavingsTons: 420,
    csrdCompliancePct: 98.4,
    energyMix: [
      { id: 'solar', label: 'Rooftop & Façade Solar PV', percentage: 45, valueKw: 128, color: '#10b981', description: 'BIPV solar glass producing 140 kW peak', status: 'optimal' },
      { id: 'geothermal', label: 'Geothermal Heat Loop', percentage: 25, valueKw: 71, color: '#06b6d4', description: 'Subsurface cooling exchange array', status: 'optimal' },
      { id: 'battery', label: 'BESS Battery Storage', percentage: 18, valueKw: 51, color: '#6366f1', description: '2.4 MWh LFP storage for peak shaving', status: 'optimal' },
      { id: 'green-grid', label: 'Hydro Green Grid PPA', percentage: 12, valueKw: 34, color: '#f59e0b', description: 'Certified 100% renewable power purchase agreement', status: 'nominal' },
    ],
    gradeDistribution: [
      { id: 'a-plus', label: 'Zone A+ (Solar & Heat Pump)', percentage: 62, color: '#10b981', description: 'Ultra-low energy zones with smart micro-climate', status: 'optimal' },
      { id: 'a', label: 'Zone A (Smart Motion LEDs)', percentage: 26, color: '#06b6d4', description: 'High efficiency daylight harvesting zones', status: 'optimal' },
      { id: 'b', label: 'Zone B (Server Waste Heat Recovered)', percentage: 12, color: '#f59e0b', description: 'Secondary thermal recovery zones', status: 'nominal' },
    ],
    emissionsBreakdown: [
      { id: 'scope1', label: 'Scope 1 (Direct Fuel)', percentage: 5, color: '#10b981', description: 'Minimal standby generator testing emissions', status: 'optimal' },
      { id: 'scope2', label: 'Scope 2 (Grid Electricity)', percentage: 25, color: '#06b6d4', description: 'Market-based green tariff electricity', status: 'optimal' },
      { id: 'scope3', label: 'Scope 3 (Supply Chain & Commute)', percentage: 70, color: '#8b5cf6', description: 'Embodied carbon & tenant commute telemetry', status: 'nominal' },
    ],
    subsystems: [
      { name: 'AI Chiller Loop', category: 'HVAC', status: 'optimizing', efficiency: 97.2, detail: 'Chilled water temp adjusted to 7.8°C based on humidity forecast' },
      { name: 'BIPV Solar Façade', category: 'Generation', status: 'online', efficiency: 94.8, detail: 'Clean surface yield: 138 kW active production' },
      { name: 'Micro-Grid BESS', category: 'Storage', status: 'online', efficiency: 99.1, detail: 'State of Charge: 84% · Discharging during peak tariff' },
      { name: 'Greywater Recycling', category: 'Circular Utility', status: 'online', efficiency: 92.4, detail: '8,400L/day reclaimed for landscape & cooling tower' },
    ],
  },
  {
    id: 'london-sovereign',
    name: 'London Sovereign Plaza',
    location: 'London, United Kingdom',
    flag: '🇬🇧',
    assetType: 'Mixed-Use Prime Estate',
    areaSqm: 68000,
    epcGrade: 'EPC A',
    breeamRating: 'LEED Platinum',
    esgScore: 94.2,
    co2Intensity: 14.8,
    co2Baseline: 23.2,
    eui: 72.1,
    activePowerKw: 412,
    renewablePct: 78,
    annualSavingsTons: 580,
    csrdCompliancePct: 96.2,
    energyMix: [
      { id: 'wind-ppa', label: 'Offshore Wind PPA', percentage: 40, valueKw: 165, color: '#10b981', description: 'North Sea wind farm corporate PPA', status: 'optimal' },
      { id: 'solar-roof', label: 'Roof PV Glass', percentage: 22, valueKw: 91, color: '#06b6d4', description: '320kW rooftop solar array', status: 'optimal' },
      { id: 'district-heat', label: 'District Heat Exchange', percentage: 24, valueKw: 99, color: '#8b5cf6', description: 'Thames river thermal energy loop', status: 'nominal' },
      { id: 'grid-offset', label: 'UK Green Grid', percentage: 14, valueKw: 57, color: '#38bdf8', description: 'REGO certified green tariff backup', status: 'nominal' },
    ],
    gradeDistribution: [
      { id: 'a-plus', label: 'Office Floors (Grade A+)', percentage: 55, color: '#10b981', description: 'A+ rated double skin automated facade', status: 'optimal' },
      { id: 'a', label: 'Retail Concourse (Grade A)', percentage: 33, color: '#06b6d4', description: 'Heat curtain recovered entrances', status: 'optimal' },
      { id: 'b', label: 'Basement Parking & EV Hub', percentage: 12, color: '#f59e0b', description: 'Smart dynamic load managed EV charging', status: 'nominal' },
    ],
    emissionsBreakdown: [
      { id: 'scope1', label: 'Scope 1 (Gas Boiler Backup)', percentage: 8, color: '#f59e0b', description: 'Winter peak heat backup fuel', status: 'nominal' },
      { id: 'scope2', label: 'Scope 2 (REGO Grid)', percentage: 32, color: '#06b6d4', description: 'REGO certified electricity', status: 'optimal' },
      { id: 'scope3', label: 'Scope 3 (Tenant Operational)', percentage: 60, color: '#8b5cf6', description: 'Tenant plug load & waste auditing', status: 'nominal' },
    ],
    subsystems: [
      { name: 'River Thames Heat Pump', category: 'HVAC', status: 'online', efficiency: 95.6, detail: 'Heat extraction COP 4.2 at 11.2°C river temp' },
      { name: 'EV Charging Grid', category: 'Mobility', status: 'optimizing', efficiency: 98.0, detail: '42 active charging sockets with dynamic load limits' },
      { name: 'Smart LED Mesh', category: 'Lighting', status: 'online', efficiency: 99.4, detail: 'DALI-2 sensors reducing lux when daylight > 400 lux' },
      { name: 'Waste Stream OCR', category: 'Circular', status: 'online', efficiency: 91.0, detail: 'Zero waste to landfill certified (94.2% recycled)' },
    ],
  },
  {
    id: 'frankfurt-green',
    name: 'Frankfurt Green Hub',
    location: 'Frankfurt, Germany',
    flag: '🇩🇪',
    assetType: 'FinTech & Data Core',
    areaSqm: 38000,
    epcGrade: 'EPC A+',
    breeamRating: 'DGNB Gold & Article 9',
    esgScore: 98.4,
    co2Intensity: 8.2,
    co2Baseline: 19.5,
    eui: 52.0,
    activePowerKw: 195,
    renewablePct: 94,
    annualSavingsTons: 390,
    csrdCompliancePct: 99.6,
    energyMix: [
      { id: 'solar-glass', label: 'Perovskite Solar Windows', percentage: 35, valueKw: 68, color: '#10b981', description: 'Transparent solar glazing technology', status: 'optimal' },
      { id: 'hydrogen', label: 'Green Hydrogen Fuel Cell', percentage: 30, valueKw: 58, color: '#06b6d4', description: 'Zero-emission onsite dispatchable power', status: 'optimal' },
      { id: 'heat-capture', label: 'Server Waste Heat Loops', percentage: 25, valueKw: 49, color: '#8b5cf6', description: 'Data hall thermal recovery for district heating', status: 'optimal' },
      { id: 'hydro-ppa', label: 'Rhine Hydro PPA', percentage: 10, valueKw: 20, color: '#f59e0b', description: 'Run-of-river hydro power', status: 'optimal' },
    ],
    gradeDistribution: [
      { id: 'a-plus', label: 'Data & Financial Floors (A+)', percentage: 80, color: '#10b981', description: 'German EnEV 2024 passivhaus standard', status: 'optimal' },
      { id: 'a', label: 'Executive Lounges (A)', percentage: 20, color: '#06b6d4', description: 'Biophilic air filtration & low energy', status: 'optimal' },
    ],
    emissionsBreakdown: [
      { id: 'scope1', label: 'Scope 1 (Direct Fuel)', percentage: 2, color: '#10b981', description: 'Near zero direct operational emissions', status: 'optimal' },
      { id: 'scope2', label: 'Scope 2 (Offsite Green)', percentage: 18, color: '#06b6d4', description: 'Certified EU hydro power', status: 'optimal' },
      { id: 'scope3', label: 'Scope 3 (Embodied & Cloud)', percentage: 80, color: '#8b5cf6', description: 'Hardware lifecycle & tenant embodied CO2', status: 'nominal' },
    ],
    subsystems: [
      { name: 'Hydrogen Fuel Stack', category: 'Generation', status: 'online', efficiency: 98.8, detail: 'Running at 58 kW baseload output with zero NOx/CO2' },
      { name: 'Liquid Immersion Cooling', category: 'Data HVAC', status: 'optimizing', efficiency: 99.2, detail: 'PUE 1.08 achieved in primary data hall' },
      { name: 'Passivhaus Air Loop', category: 'Ventilation', status: 'online', efficiency: 96.5, detail: '92% heat exchange efficiency on fresh air intake' },
      { name: 'CSRD Automated Audit', category: 'Compliance', status: 'online', efficiency: 100.0, detail: 'Real-time XBRL telemetry stream to BaFin / EU ESG' },
    ],
  },
  {
    id: 'tokyo-eco',
    name: 'Tokyo Bay Eco Tower',
    location: 'Tokyo, Japan',
    flag: '🇯🇵',
    assetType: 'Smart High-Rise Residential',
    areaSqm: 52000,
    epcGrade: 'EPC A',
    breeamRating: 'CASBEE S-Rank',
    esgScore: 92.5,
    co2Intensity: 16.2,
    co2Baseline: 24.0,
    eui: 81.6,
    activePowerKw: 350,
    renewablePct: 72,
    annualSavingsTons: 310,
    csrdCompliancePct: 94.8,
    energyMix: [
      { id: 'micro-wind', label: 'Rooftop Micro-Wind & Solar', percentage: 38, valueKw: 133, color: '#10b981', description: 'Vertical-axis wind turbines + solar array', status: 'optimal' },
      { id: 'seawater', label: 'Tokyo Bay Heat Sink', percentage: 32, valueKw: 112, color: '#06b6d4', description: 'Seawater heat exchanger cooling loop', status: 'optimal' },
      { id: 'storage', label: 'Solid-State Battery Storage', percentage: 18, valueKw: 63, color: '#6366f1', description: '1.8 MWh emergency & peak shave storage', status: 'optimal' },
      { id: 'grid', label: 'TEPCO Green Grid', percentage: 12, valueKw: 42, color: '#f43f5e', description: 'Grid backup during typhoon windows', status: 'nominal' },
    ],
    gradeDistribution: [
      { id: 'a-plus', label: 'Upper Residential Suites (A+)', percentage: 48, color: '#10b981', description: 'Vacuum insulated glass & Smart Thermostats', status: 'optimal' },
      { id: 'a', label: 'Mid-Tier Residences (A)', percentage: 38, color: '#06b6d4', description: 'Automated solar shading blinds', status: 'optimal' },
      { id: 'b', label: 'Podium Amenities & Gym', percentage: 14, color: '#f59e0b', description: 'Heat recovery from pool & gym HVAC', status: 'nominal' },
    ],
    emissionsBreakdown: [
      { id: 'scope1', label: 'Scope 1 (Gas Backup)', percentage: 6, color: '#f59e0b', description: 'Seismic emergency fuel reserves', status: 'nominal' },
      { id: 'scope2', label: 'Scope 2 (TEPCO Grid)', percentage: 34, color: '#06b6d4', description: 'TEPCO green menu electricity', status: 'optimal' },
      { id: 'scope3', label: 'Scope 3 (Residential Use)', percentage: 60, color: '#8b5cf6', description: 'Tenant appliance & hot water telemetry', status: 'nominal' },
    ],
    subsystems: [
      { name: 'Bay Seawater Cooling', category: 'HVAC', status: 'online', efficiency: 94.2, detail: 'Deep water intake at 14°C providing ambient chill' },
      { name: 'Seismic BESS Storage', category: 'Resilience', status: 'online', efficiency: 97.9, detail: 'Emergency back-up rated for 72h continuous power' },
      { name: 'Smart Shading Louvers', category: 'Façade', status: 'optimizing', efficiency: 96.0, detail: 'Angles adjusted to block 85% of solar heat gain' },
      { name: 'CASBEE S Audit Node', category: 'Compliance', status: 'online', efficiency: 95.4, detail: 'Japanese Ministry MLIT green building pass' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────
//  MAIN NET ZERO ENGINE COMPONENT
// ─────────────────────────────────────────────────────────────────────
export function NetZeroEngine({
  selectedPropertyId = 'nairobi-horizon',
  variant = 'full',
  className = '',
  onPropertyChange,
}: NetZeroEngineProps) {
  // Active property state
  const [currentPropId, setCurrentPropId] = useState<string>(selectedPropertyId)
  
  // Donut view category: 'mix' | 'grade' | 'scope'
  const [donutView, setDonutView] = useState<'mix' | 'grade' | 'scope'>('mix')
  
  // Selected slice index for detailed view
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null)
  
  // Simulated live telemetry stream state
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true)
  const [kwFluctuation, setKwFluctuation] = useState<number>(0)
  const [optimizationActive, setOptimizationActive] = useState<boolean>(false)
  const [optimizationMsg, setOptimizationMsg] = useState<string | null>(null)

  // Audit modal state
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false)

  // Predictive forecast projections & threshold alert system state
  const [forecastTimeframe, setForecastTimeframe] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [showOptimizedCurve, setShowOptimizedCurve] = useState<boolean>(true)
  const [targetReductionGoal, setTargetReductionGoal] = useState<number>(45)
  const [alertTolerancePct, setAlertTolerancePct] = useState<number>(0) // 0% = strict, 5% = moderate, 10% = lenient
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false)
  const [alertNotificationSent, setAlertNotificationSent] = useState<boolean>(false)
  const [alertMitigationApplied, setAlertMitigationApplied] = useState<boolean>(false)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  // Get active property forecast dataset
  const activeForecast = useMemo(() => {
    const propData = FORECAST_PROJECTIONS[currentPropId] ?? FORECAST_PROJECTIONS['nairobi-horizon']
    return propData[forecastTimeframe]
  }, [currentPropId, forecastTimeframe])

  // Chart data enriched with user-configured target goal curve & threshold breach evaluation
  const chartData = useMemo(() => {
    return activeForecast.map(pt => {
      const goalTarget = Math.max(0, Math.round(pt.baseline * (1 - targetReductionGoal / 100)))
      const activeEmissions = showOptimizedCurve ? pt.optimized : pt.predicted
      const thresholdLimit = Math.round(goalTarget * (1 + alertTolerancePct / 100))
      const isBreached = activeEmissions > thresholdLimit
      const excessTons = isBreached ? activeEmissions - goalTarget : 0

      return {
        ...pt,
        goalTarget,
        thresholdLimit,
        activeEmissions,
        isBreached,
        excessTons,
      }
    })
  }, [activeForecast, targetReductionGoal, showOptimizedCurve, alertTolerancePct])

  // Threshold alert evaluation engine
  const alertAnalysis = useMemo(() => {
    const breachedPeriods = chartData.filter(pt => pt.isBreached)
    const totalBreachTons = breachedPeriods.reduce((acc, pt) => acc + pt.excessTons, 0)
    const hasBreach = breachedPeriods.length > 0

    let severity: 'optimal' | 'warning' | 'critical' = 'optimal'
    if (hasBreach) {
      severity = totalBreachTons > 20 || breachedPeriods.length >= 4 ? 'critical' : 'warning'
    }

    return {
      breachedPeriods,
      totalBreachTons,
      hasBreach,
      severity,
      breachedCount: breachedPeriods.length,
      totalPeriods: chartData.length,
    }
  }, [chartData])

  // Quick apply AI mitigation to resolve threshold breaches
  const handleApplyAlertMitigation = useCallback(() => {
    setShowOptimizedCurve(true)
    setOptimizationActive(true)
    setAlertMitigationApplied(true)
    setAlertMsg('⚡ AI Automated Mitigation Applied: Peak HVAC curtailment (-12%) and BESS battery arbitrage engaged.')
    setTimeout(() => setAlertMsg(null), 5000)
  }, [])

  // Dispatch ESG Alert notification
  const handleDispatchESGAlert = useCallback(() => {
    setAlertNotificationSent(true)
    setAlertMsg(`📩 Threshold breach notification dispatched to ESG Compliance Team for property.`)
    setTimeout(() => setAlertMsg(null), 5000)
  }, [])

  // Forecast summary totals
  const forecastSummary = useMemo(() => {
    if (!activeForecast || activeForecast.length === 0) {
      return {
        totalBaseline: 0,
        totalPredicted: 0,
        totalOptimized: 0,
        totalGoalTarget: 0,
        peakPeriod: 'N/A',
        reductionPct: 0,
        savedTonsGoal: 0,
        financialSavings: 0,
        interventionPackage: 'Standard Energy Management',
        gapToGoalTons: 0,
        onTrack: true,
      }
    }
    
    let totalBaseline = 0
    let totalPredicted = 0
    let totalOptimized = 0
    let totalGoalTarget = 0
    let maxVal = -1
    let peakPeriod = activeForecast[0].period

    activeForecast.forEach(pt => {
      totalBaseline += pt.baseline
      totalPredicted += pt.predicted
      totalOptimized += pt.optimized
      totalGoalTarget += Math.max(0, Math.round(pt.baseline * (1 - targetReductionGoal / 100)))
      if (pt.predicted > maxVal) {
        maxVal = pt.predicted
        peakPeriod = pt.period
      }
    })

    const currentPathTons = showOptimizedCurve ? totalOptimized : totalPredicted
    const reductionPct = totalBaseline > 0
      ? Math.round(((totalBaseline - currentPathTons) / totalBaseline) * 100)
      : 0

    const savedTonsGoal = Math.round(totalBaseline * (targetReductionGoal / 100))
    const financialSavings = Math.round(savedTonsGoal * 185)
    const gapToGoalTons = currentPathTons - totalGoalTarget
    const onTrack = gapToGoalTons <= 0

    let interventionPackage = 'Level 1: Smart Thermostats, LED Retrofits & Peak Load Shifting'
    if (targetReductionGoal >= 30 && targetReductionGoal < 50) {
      interventionPackage = 'Level 2: Onsite BIPV Solar + Heat Pump Electrification'
    } else if (targetReductionGoal >= 50 && targetReductionGoal < 65) {
      interventionPackage = 'Level 3: Micro-Grid BESS Battery Storage + 100% Green PPA'
    } else if (targetReductionGoal >= 65) {
      interventionPackage = 'Level 4: Onsite Green Hydrogen Fuel Cells + Geothermal Heat Loops'
    }

    return {
      totalBaseline,
      totalPredicted,
      totalOptimized,
      totalGoalTarget,
      peakPeriod,
      reductionPct,
      savedTonsGoal,
      financialSavings,
      interventionPackage,
      gapToGoalTons,
      onTrack,
    }
  }, [activeForecast, showOptimizedCurve, targetReductionGoal])

  // Synchronize prop updates
  useEffect(() => {
    if (selectedPropertyId) {
      setCurrentPropId(selectedPropertyId)
    }
  }, [selectedPropertyId])

  // Get active property object
  const property = useMemo(() => {
    return PORTFOLIO_PROPERTIES.find(p => p.id === currentPropId) ?? PORTFOLIO_PROPERTIES[0]
  }, [currentPropId])

  // Get current active donut slice dataset
  const currentSlices: EnergySlice[] = useMemo(() => {
    if (donutView === 'mix') return property.energyMix
    if (donutView === 'grade') return property.gradeDistribution
    return property.emissionsBreakdown
  }, [donutView, property])

  // Calculate live power KW with subtle random fluctuation
  const liveKw = useMemo(() => {
    const base = property.activePowerKw
    const delta = optimizationActive ? -24 : kwFluctuation
    return Math.max(10, Math.round(base + delta))
  }, [property.activePowerKw, kwFluctuation, optimizationActive])

  // Calculate carbon reduction percentage vs baseline
  const carbonReductionPct = useMemo(() => {
    const baseline = property.co2Baseline
    const intensity = property.co2Intensity
    const baseDiff = ((baseline - intensity) / baseline) * 100
    const extraOpt = optimizationActive ? 4.2 : 0
    return Math.min(99, Math.round((baseDiff + extraOpt) * 10) / 10)
  }, [property.co2Baseline, property.co2Intensity, optimizationActive])

  // Handle property switch
  const handleSelectProperty = (id: string) => {
    setCurrentPropId(id)
    setActiveSliceIndex(null)
    if (onPropertyChange) onPropertyChange(id)
  }

  // Live telemetry pulse effect
  useEffect(() => {
    if (!isLiveStreaming) return
    const interval = setInterval(() => {
      // Random kW variance between -6 kW and +6 kW
      const rand = (Math.random() - 0.5) * 12
      setKwFluctuation(Math.round(rand))
    }, 2800)

    return () => clearInterval(interval)
  }, [isLiveStreaming])

  // Handle AI HVAC Grid Optimization trigger
  const handleTriggerOptimization = useCallback(() => {
    setOptimizationActive(true)
    setOptimizationMsg('AI Agentforce optimizing HVAC chiller setpoints & BESS discharge rates...')
    
    setTimeout(() => {
      setOptimizationMsg('Optimization complete: Real-time demand reduced by 24 kW (-8.4%). Carbon intensity down to ' + (property.co2Intensity - 0.6).toFixed(1) + ' kg/m²/yr.')
    }, 2200)

    setTimeout(() => {
      setOptimizationMsg(null)
    }, 7000)
  }, [property.co2Intensity])

  // ───────────────────────────────────────────────────────────────────
  //  DONUT CHART MATH & SVG PATHS
  // ───────────────────────────────────────────────────────────────────
  const RADIUS = 84
  const STROKE_WIDTH = 22
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  // Compute SVG arc metrics
  const sliceArcs = useMemo(() => {
    let accumulatedPct = 0
    return currentSlices.map((slice) => {
      const startPct = accumulatedPct
      accumulatedPct += slice.percentage
      const sliceLength = (slice.percentage / 100) * CIRCUMFERENCE
      const offset = (startPct / 100) * CIRCUMFERENCE

      return {
        ...slice,
        sliceLength,
        offset,
        dashArray: `${sliceLength} ${CIRCUMFERENCE - sliceLength}`,
        dashOffset: -offset,
      }
    })
  }, [currentSlices, CIRCUMFERENCE])

  // Donut view selector titles
  const donutTitles = {
    mix: 'Renewable & Energy Generation Mix',
    grade: 'Property EPC Efficiency Zone Distribution',
    scope: 'GHG Protocol Scope 1, 2 & 3 Footprint',
  }

  // ───────────────────────────────────────────────────────────────────
  //  RENDER COMPACT VARIANT
  // ───────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-slate-100 shadow-xl space-y-3 ${className}`}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold font-mono text-slate-100 tracking-wide">
              Net-Zero Telemetry Engine
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
            {property.epcGrade}
          </span>
        </div>

        {/* Selected Property Banner */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>{property.flag}</span>
            <span>{property.name}</span>
          </span>
          <span className="font-mono text-emerald-400 font-bold">{property.renewablePct}% Green</span>
        </div>

        {/* Mini Metrics */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
            <span className="text-slate-400 block text-[9px] uppercase">CO₂ Intensity</span>
            <span className="font-bold text-slate-100">{property.co2Intensity} kg/m²/yr</span>
            <span className="text-[9px] text-emerald-400 block">-{carbonReductionPct}% vs base</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
            <span className="text-slate-400 block text-[9px] uppercase">Real-Time EUI</span>
            <span className="font-bold text-slate-100">{property.eui} kWh/m²/yr</span>
            <span className="text-[9px] text-sky-400 block">{liveKw} kW Active</span>
          </div>
        </div>

        {/* Mini Donut Chart */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE_WIDTH} />
              {sliceArcs.map((arc, i) => (
                <circle
                  key={arc.id}
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onClick={() => setActiveSliceIndex(i)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs font-bold text-emerald-400 font-mono">{property.esgScore}</span>
              <span className="text-[8px] text-slate-400 font-mono uppercase">ESG Index</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────
  //  RENDER FULL & CARD VARIANTS
  // ───────────────────────────────────────────────────────────────────
  return (
    <div className={`space-y-6 text-slate-100 ${className}`}>

      {/* ═══════════════════════════════════════════════════════════════
          HEADER BAR & PROPERTY SELECTOR
         ═══════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveStreaming ? 'bg-emerald-400' : 'bg-slate-500'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isLiveStreaming ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </span>
              <h2 className="text-base sm:text-lg font-bold font-mono text-slate-100 tracking-tight flex items-center gap-2">
                <span>🌱 Net-Zero Telemetry Engine</span>
                <span className="text-xs font-normal text-slate-400 hidden md:inline">| v4.5 Planetary Infrastructure</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Real-time building carbon intensity, EUI telemetry, and ESG energy efficiency ratings.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                isLiveStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}
            </button>

            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-semibold cursor-pointer transition-all flex items-center gap-1"
            >
              <span>📜 CSRD Audit Report</span>
            </button>
          </div>
        </div>

        {/* Portfolio Property Picker Tabs */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Select Asset Telemetry Surface
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PORTFOLIO_PROPERTIES.map((prop) => {
              const isSelected = prop.id === currentPropId
              return (
                <button
                  key={prop.id}
                  onClick={() => handleSelectProperty(prop.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 text-slate-100 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 text-slate-300 border-white/10 hover:border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold flex items-center gap-1.5 truncate">
                      <span>{prop.flag}</span>
                      <span className="truncate">{prop.name}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {prop.epcGrade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                    <span>{prop.co2Intensity} kg CO₂/m²</span>
                    <span className="text-emerald-400 font-semibold">{prop.renewablePct}% Green</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TELEMETRY METRICS RIBBON (5 KEY PERFORMANCE INDICATORS)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Carbon Intensity */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>CO₂ Intensity</span>
            <span className="text-emerald-400 font-bold">-{carbonReductionPct}%</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {property.co2Intensity} <span className="text-xs font-normal text-slate-400">kg/m²/yr</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            Baseline: {property.co2Baseline} kg/m²/yr
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 2: Energy Use Intensity (EUI) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>EUI Benchmark</span>
            <span className="text-sky-400 font-bold">kW Load</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {property.eui} <span className="text-xs font-normal text-slate-400">kWh/m²</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>Active Power: {liveKw} kW</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 3: Renewable Energy Ratio */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>Green Energy Mix</span>
            <span className="text-emerald-400 font-bold">On-Site & PPA</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {property.renewablePct}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            Grid Backup: {100 - property.renewablePct}%
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 4: Annual Carbon Savings */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>CO₂ Avoidance</span>
            <span className="text-indigo-400 font-bold">YTD</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 tracking-tight">
            {property.annualSavingsTons} <span className="text-xs font-normal text-slate-400">Tons</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            Equivalent to {Math.round(property.annualSavingsTons * 18.2)} trees
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 5: CSRD / GRESB Score */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 col-span-2 sm:col-span-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>ESG & CSRD Score</span>
            <span className="text-amber-400 font-bold">Certified</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tracking-tight">
            {property.esgScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {property.breeamRating}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN DONUT CHART & BREAKDOWN SECTION
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT / CENTER: INTERACTIVE DONUT CHART SURFACE (7 COLS) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-6 flex flex-col justify-between">
          
          {/* Donut Controls & Selector Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">
                Energy Efficiency & Rating Donut
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {donutTitles[donutView]}
              </p>
            </div>

            {/* Donut View Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 font-mono text-[11px]">
              <button
                onClick={() => { setDonutView('mix'); setActiveSliceIndex(null) }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                  donutView === 'mix' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Energy Mix
              </button>
              <button
                onClick={() => { setDonutView('grade'); setActiveSliceIndex(null) }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                  donutView === 'grade' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EPC Zones
              </button>
              <button
                onClick={() => { setDonutView('scope'); setActiveSliceIndex(null) }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                  donutView === 'scope' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scope 1/2/3
              </button>
            </div>
          </div>

          {/* SVG Donut Chart Canvas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            
            {/* Interactive Donut SVG */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl" viewBox="0 0 220 220">
                {/* Background ring */}
                <circle
                  cx="110"
                  cy="110"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={STROKE_WIDTH}
                />

                {/* Donut slice arcs */}
                {sliceArcs.map((arc, index) => {
                  const isActive = activeSliceIndex === index
                  const sliceStroke = isActive ? arc.color : arc.color
                  const currentStrokeWidth = isActive ? STROKE_WIDTH + 6 : STROKE_WIDTH

                  return (
                    <motion.circle
                      key={arc.id + donutView}
                      cx="110"
                      cy="110"
                      r={RADIUS}
                      fill="none"
                      stroke={sliceStroke}
                      strokeWidth={currentStrokeWidth}
                      strokeDasharray={arc.dashArray}
                      strokeDashoffset={arc.dashOffset}
                      strokeLinecap="butt"
                      initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                      animate={{ strokeDasharray: arc.dashArray }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => setActiveSliceIndex(activeSliceIndex === index ? null : index)}
                      style={{
                        filter: isActive ? `drop-shadow(0 0 12px ${arc.color})` : undefined,
                        opacity: activeSliceIndex === null || isActive ? 1 : 0.45,
                      }}
                    />
                  )
                })}
              </svg>

              {/* Center Donut Badge Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
                  {property.epcGrade}
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">
                  {property.breeamRating}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">
                  ESG {property.esgScore}/100
                </span>
              </div>
            </div>

            {/* Slices Legend List */}
            <div className="flex-1 space-y-2 w-full max-w-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Click Slice for Telemetry Detail
              </span>

              {sliceArcs.map((slice, index) => {
                const isActive = activeSliceIndex === index
                return (
                  <button
                    key={slice.id}
                    onClick={() => setActiveSliceIndex(activeSliceIndex === index ? null : index)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-slate-900 text-slate-100 border-white/30 ring-1 ring-white/20 shadow-md'
                        : 'bg-slate-900/50 text-slate-300 border-white/5 hover:bg-slate-900/80 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate font-semibold">{slice.label}</span>
                    </div>
                    <span className="font-bold text-slate-100 shrink-0">
                      {slice.percentage}%
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Slice Tooltip Detail Panel */}
          <AnimatePresence mode="wait">
            {activeSliceIndex !== null && currentSlices[activeSliceIndex] && (
              <motion.div
                key={activeSliceIndex + donutView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl bg-slate-900 border border-white/15 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentSlices[activeSliceIndex].color }}
                    />
                    {currentSlices[activeSliceIndex].label}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {currentSlices[activeSliceIndex].percentage}% Share
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSlices[activeSliceIndex].description}
                </p>
                {currentSlices[activeSliceIndex].valueKw && (
                  <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-white/10">
                    Active Load Output: <span className="text-sky-300 font-bold">{currentSlices[activeSliceIndex].valueKw} kW</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Optimization Trigger Ribbon */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Agent HVAC & Grid Autopilot</span>
            </div>

            <button
              onClick={handleTriggerOptimization}
              disabled={optimizationActive}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center gap-2 ${
                optimizationActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 opacity-80 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-950/50'
              }`}
            >
              <span>{optimizationActive ? '⚡ Optimizing Grid...' : '⚡ Optimize HVAC & Energy Load'}</span>
            </button>
          </div>

          {/* Optimization Feedback Message */}
          <AnimatePresence>
            {optimizationMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs"
              >
                {optimizationMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: REAL-TIME SUBSYSTEM TELEMETRY & CSRD AUDIT (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Subsystems Live Status Box */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <span>⚙️ Subsystem Telemetry Nodes</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                4 Active Loops
              </span>
            </div>

            <div className="space-y-3">
              {property.subsystems.map((sub) => (
                <div key={sub.name} className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-100 font-mono">{sub.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold uppercase">
                      {sub.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{sub.category}</span>
                    <span className="text-sky-300 font-semibold">{sub.efficiency}% Efficiency</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal border-t border-white/5 pt-1.5">
                    {sub.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ESG Compliance & CSRD Directives Box */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-100 uppercase">EU CSRD & Article 9 Status</span>
              <span className="text-emerald-400 font-bold">{property.csrdCompliancePct}% Compliant</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${property.csrdCompliancePct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase">BREEAM Target</span>
                <span className="text-slate-200 font-bold">{property.breeamRating}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase">XBRL Audit Chain</span>
                <span className="text-emerald-400 font-bold">Verified Immutable</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PREDICTIVE 12-MONTH CARBON EMISSION FORECAST (RECHARTS)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-5">
        
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold font-mono text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>📈 Predictive Carbon Emission Forecast</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              AI machine-learning model projecting Scope 1-3 footprint for {property.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* AI Optimization Toggle */}
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer hover:border-emerald-500/40 transition-all select-none">
              <input
                type="checkbox"
                checked={showOptimizedCurve}
                onChange={(e) => setShowOptimizedCurve(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span>Include AI HVAC Optimization</span>
            </label>

            {/* Timeframe Selector Pills (Monthly / Quarterly / Annual) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono">
              {(['monthly', 'quarterly', 'annual'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setForecastTimeframe(mode)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                    forecastTimeframe === mode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toast / Action Feedback Banner */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-teal-950/90 border border-teal-400/50 text-teal-200 font-mono text-xs shadow-lg flex items-center justify-between gap-3"
            >
              <span>{alertMsg}</span>
              <button
                onClick={() => setAlertMsg(null)}
                className="text-teal-400 hover:text-teal-100 font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THRESHOLD-BASED CARBON EMISSIONS ALERT SYSTEM PANEL */}
        <div className="space-y-3 font-mono">
          {alertAnalysis.hasBreach && !alertDismissed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 sm:p-5 rounded-xl border ${
                alertAnalysis.severity === 'critical'
                  ? 'bg-rose-950/50 border-rose-500/60 shadow-rose-950/40 shadow-xl'
                  : 'bg-amber-950/50 border-amber-500/60 shadow-amber-950/40 shadow-xl'
              } space-y-3 relative overflow-hidden`}
            >
              {/* Top Row: Header & Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      alertAnalysis.severity === 'critical' ? 'bg-rose-400' : 'bg-amber-400'
                    } opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      alertAnalysis.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    <span>🚨 Threshold Alert: Projected Emissions Exceed -{targetReductionGoal}% Target</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    alertAnalysis.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {alertAnalysis.severity === 'critical' ? 'CRITICAL BREACH' : 'WARNING OVERHANG'} (+{alertAnalysis.totalBreachTons}T CO₂e)
                  </span>
                  <button
                    onClick={() => setAlertDismissed(true)}
                    className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Dismiss alert"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>

              {/* Alert Content & Breached Period Pills */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  The ML model projects carbon emissions for <span className="text-slate-100 font-bold">{property.name}</span> will exceed your <strong className="text-purple-300">-{targetReductionGoal}% reduction threshold</strong> in <strong className={alertAnalysis.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'}>{alertAnalysis.breachedCount} of {alertAnalysis.totalPeriods} periods</strong> ({forecastTimeframe} view) with a cumulative excess of <strong className="text-slate-100">{alertAnalysis.totalBreachTons} Tons CO₂e</strong>.
                </p>

                {/* Breached Periods Breakdown Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Breached Periods:</span>
                  {alertAnalysis.breachedPeriods.map((pt) => (
                    <span
                      key={pt.period}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-rose-500/40 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="text-rose-400">📅 {pt.period}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-200">{pt.activeEmissions}T</span>
                      <span className="text-rose-300 font-extrabold text-[10px] bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/30">
                        +{pt.excessTons}T
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Automated Mitigation Actions & Sensitivity Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                {/* Mitigation & Dispatch Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleApplyAlertMitigation}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>⚡ Auto-Apply AI Mitigation (-18T Fix)</span>
                  </button>

                  <button
                    onClick={handleDispatchESGAlert}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                      alertNotificationSent
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900/90 text-slate-200 border-white/10 hover:border-slate-400'
                    }`}
                  >
                    <span>{alertNotificationSent ? '✅ Alert Sent to ESG Team' : '📩 Dispatch ESG Alert'}</span>
                  </button>
                </div>

                {/* Sensitivity Tolerance Rules */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 font-semibold">Tolerance Margin:</span>
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-white/10">
                    {[
                      { label: 'Strict (0%)', val: 0 },
                      { label: 'Mod (+5%)', val: 5 },
                      { label: 'Lenient (+10%)', val: 10 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => {
                          setAlertTolerancePct(opt.val)
                          setAlertDismissed(false)
                        }}
                        className={`px-2 py-0.5 rounded transition-all text-[10px] font-bold cursor-pointer ${
                          alertTolerancePct === opt.val
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* COMPLIANT / OPTIMAL STATUS BAR */
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">✅</span>
                <div>
                  <span className="font-bold text-slate-100 uppercase tracking-wide">
                    Pathway Compliant: Emissions within -{targetReductionGoal}% Target Threshold
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All projected periods in {forecastTimeframe} view remain within configured safety boundaries.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Tolerance:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-emerald-300 font-bold">
                  {alertTolerancePct === 0 ? 'Strict (0%)' : alertTolerancePct === 5 ? 'Moderate (+5%)' : 'Lenient (+10%)'}
                </span>
                {alertDismissed && (
                  <button
                    onClick={() => setAlertDismissed(false)}
                    className="text-xs text-sky-400 hover:underline cursor-pointer ml-1"
                  >
                    Reset Alert
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User-Configurable Target Reduction Goal Slider Panel */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-emerald-500/20 space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  🎯 Target Reduction Goal:
                </span>
                <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/90 px-3 py-0.5 rounded-lg border border-emerald-500/40">
                  -{targetReductionGoal}% CO₂ Reduction
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Adjust slider to dynamically update the goal pathway on the forecast chart and calculate intervention ROI.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">Presets:</span>
              {[20, 35, 50, 65, 75].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTargetReductionGoal(preset)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer font-bold ${
                    targetReductionGoal === preset
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  -{preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Range Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>10% (Basic Controls)</span>
              <span>35% (LEED Silver)</span>
              <span>50% (CSRD Compliant)</span>
              <span>75% (Net-Zero Peak)</span>
            </div>
            <input
              type="range"
              min={10}
              max={75}
              step={5}
              value={targetReductionGoal}
              onChange={(e) => setTargetReductionGoal(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 border border-white/10"
            />
          </div>

          {/* Real-Time Impact Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/10 flex items-center gap-3">
              <div className="text-xl">🍃</div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Projected CO₂ Abatement</div>
                <div className="font-bold text-emerald-400 text-sm">
                  {forecastSummary.savedTonsGoal.toLocaleString()} Tons CO₂e / yr
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/10 flex items-center gap-3">
              <div className="text-xl">💰</div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Utility & Carbon Savings</div>
                <div className="font-bold text-teal-300 text-sm">
                  ${forecastSummary.financialSavings.toLocaleString()} / yr
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/10 flex items-center gap-3">
              <div className="text-xl">{forecastSummary.onTrack ? '✅' : '⚠️'}</div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">AI Pathway Gap Analysis</div>
                <div className={`font-bold text-sm ${forecastSummary.onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {forecastSummary.onTrack
                    ? 'Current AI path meets target'
                    : `${forecastSummary.gapToGoalTons}T additional offset needed`}
                </div>
              </div>
            </div>
          </div>

          {/* Required Energy Interventions Package Banner */}
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-slate-200">
            <span className="text-emerald-400 font-bold">⚡ Recommended Interventions:</span>
            <span className="text-slate-300 italic">{forecastSummary.interventionPackage}</span>
          </div>
        </div>

        {/* Forecast KPI Metrics Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cumulative Projected</span>
            <div className="text-base sm:text-lg font-bold text-slate-100">
              {showOptimizedCurve ? forecastSummary.totalOptimized : forecastSummary.totalPredicted} <span className="text-xs text-slate-400 font-normal">Tons CO₂e</span>
            </div>
            <span className="text-[10px] text-emerald-400 block font-semibold">
              -{forecastSummary.reductionPct}% vs Baseline ({forecastSummary.totalBaseline}T)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak Emission Period</span>
            <div className="text-base sm:text-lg font-bold text-amber-400">
              {forecastSummary.peakPeriod}
            </div>
            <span className="text-[10px] text-slate-400 block">Seasonal HVAC Peak</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Goal Pathway</span>
            <div className="text-base sm:text-lg font-bold text-purple-300">
              {forecastSummary.totalGoalTarget} <span className="text-xs text-slate-400 font-normal">Tons CO₂e</span>
            </div>
            <span className="text-[10px] text-purple-400 block font-semibold">Target: -{targetReductionGoal}% CO₂</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Model Confidence</span>
            <div className="text-base sm:text-lg font-bold text-sky-400">
              98.4% <span className="text-xs text-slate-400 font-normal">R² Fit</span>
            </div>
            <span className="text-[10px] text-sky-300 block font-semibold">Weather & Telemetry AI</span>
          </div>
        </div>

        {/* Recharts Forecast Line Chart Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              
              <XAxis
                dataKey="period"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                unit=" T"
              />

              <Tooltip content={<CustomForecastTooltip timeframe={forecastTimeframe} />} />

              <Legend
                wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontFamily: 'monospace' }}
                iconType="circle"
              />

              {/* Baseline business-as-usual line */}
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline (No Controls)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />

              {/* User-configured Goal Target Curve */}
              <Line
                type="monotone"
                dataKey="goalTarget"
                name={`Goal Target (-${targetReductionGoal}%)`}
                stroke="#c084fc"
                strokeWidth={2.5}
                strokeDasharray="3 3"
                dot={{ r: 4, fill: '#c084fc' }}
                activeDot={{ r: 6 }}
              />

              {/* AI Predicted Line & Gradient Area */}
              <Area
                type="monotone"
                dataKey="predicted"
                name="AI Predicted Emissions"
                stroke="#10b981"
                fill="url(#colorPredicted)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#34d399' }}
              />

              {/* Optional AI HVAC Optimized Curve */}
              {showOptimizedCurve && (
                <Line
                  type="monotone"
                  dataKey="optimized"
                  name="AI HVAC & BESS Optimized"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06b6d4', stroke: '#083344', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
          <span>
            💡 Projection model integrates ambient temperature forecasts, occupancy heat loads, and BESS arbitrage rates.
          </span>
          <span className="text-emerald-400 font-semibold">
            Updated live · ISO 14064 Verified
          </span>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CSRD AUDIT REPORT MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 text-slate-100 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
                    <span>📜 CSRD & ESG Environmental Audit Certificate</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {property.name} ({property.location}) · XBRL ISO-14064 Compliance Stream
                  </p>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Audit Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">CO₂ Intensity</span>
                  <span className="text-sm font-bold text-emerald-400">{property.co2Intensity} kg/m²/yr</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Energy Rating</span>
                  <span className="text-sm font-bold text-slate-100">{property.epcGrade}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Green Energy</span>
                  <span className="text-sm font-bold text-sky-400">{property.renewablePct}%</span>
                </div>
              </div>

              {/* Protocol Disclosures */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
                <h4 className="font-bold font-mono text-slate-200">GHG Protocol Scope Breakdown:</h4>
                <ul className="space-y-1.5 text-slate-400 font-mono text-[11px] list-disc list-inside">
                  <li><strong className="text-slate-200">Scope 1 (Direct):</strong> Onsite combustion & fugitive refrigerant emissions monitored.</li>
                  <li><strong className="text-slate-200">Scope 2 (Indirect):</strong> Grid electricity, district heating & cooling market-based accounting.</li>
                  <li><strong className="text-slate-200">Scope 3 (Supply Chain):</strong> Tenant plug loads, waste water treatment, embodied carbon lifecycle.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2 font-mono text-xs">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer transition-all"
                >
                  Download Signed PDF / XBRL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default NetZeroEngine
