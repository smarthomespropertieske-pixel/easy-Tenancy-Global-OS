// ════════════════════════════════════════════════════════════════════════
//  GlobalPerformancePage.tsx — Global Real Estate Performance Route
//  ─────────────────────────────────────────────────────────────────────
//  Full-page view for easyTenancy easy-tenancy-global-os Global Performance.
// ════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '../components/SEO'
import SovereignPageHeader from '../components/SovereignPageHeader'
import GlobalPerformanceDashboard, { RegionKey, REGIONS } from '../components/GlobalPerformanceDashboard'
import { useCurrencyConversion } from '../hooks/useCurrencyConversion'
import { exportToCSV } from '../lib/exportCsv'

export function GlobalPerformancePage() {
  const currency = useCurrencyConversion()
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('ALL')

  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } },
  }

  const handleExportSummaryCSV = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const r = REGIONS[selectedRegion]
    exportToCSV(`Global_Performance_Summary_${selectedRegion}`, [
      {
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
    ])
  }

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={PAGE_VARIANTS}
      className="min-h-screen bg-slate-950 pt-16"
    >
      <SEO
        title="Global Performance Dashboard"
        description="Real-time multi-region property telemetry, NOI growth charts, occupancy trends, asset allocation, and ESG metrics across EMEA, AMER, APAC, and MEA/LATAM."
        url="/global-performance"
      />

      <SovereignPageHeader
        badge="Multi-Region Property Intelligence · Recharts v3.1"
        badgeColor="#38bdf8"
        title={
          <>
            <span className="text-slate-100">Global Performance</span>{' '}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </>
        }
        subtitle="Cross-border property analytics, regional NOI growth, tenant retention telemetry, and capital allocation metrics across 1,550+ premier real estate assets."
        stats={[
          { label: `Total Portfolio AUM (${currency.selectedCurrency})`, value: currency.formatMillions(525.9), icon: '💎', color: '#38bdf8' },
          { label: 'Avg Occupancy', value: '95.3%', icon: '🏢', color: '#10b981' },
          { label: 'Annual NOI Growth', value: '+11.8%', icon: '🚀', color: '#a855f7' },
          { label: 'Global Properties', value: '1,550', icon: '🌍', color: '#f59e0b' },
        ]}
        actions={[
          { label: '← Home', href: '/' },
          { label: '📊 Export CSV', href: '#', onClick: handleExportSummaryCSV },
          { label: '🤖 AI Copilot', href: '/app/demo', primary: true },
        ]}
        compact
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-8">
        {/* ── Glassmorphic Quick Stat Summary Row ──────────────────────── */}
        <section aria-label="Global Telemetry Quick Stats" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Global Vacancy */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 shadow-2xl hover:border-amber-500/40 transition-all duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Global Vacancy
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 text-lg">
                🚪
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">4.7%</span>
              <span className="text-xs font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                -0.4% MoM
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono">
              <strong className="text-slate-200">73 vacant units</strong> across 1,550 assets (95.3% occupancy)
            </p>
          </div>

          {/* Card 2: Total Rent Collected Today */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 shadow-2xl hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Rent Collected Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-lg">
                💳
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {currency.formatMillions(1.42)}
              </span>
              <span className="text-xs font-mono text-emerald-300/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                98.4% On-Time
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono">
              <strong className="text-slate-200">1,240 lease cycles</strong> processed via automated direct debit
            </p>
          </div>

          {/* Card 3: Active Maintenance Tickets */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 shadow-2xl hover:border-sky-500/40 transition-all duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Active Maintenance
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-300 text-lg">
                🔧
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">142</span>
              <span className="text-xs font-mono text-rose-300/90 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                18 Critical SLA
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono">
              <strong className="text-slate-200">3.2h avg dispatch</strong> · 94% tenant SLA satisfaction
            </p>
          </div>
        </section>

        <GlobalPerformanceDashboard 
          currencyHook={currency} 
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />
      </main>
    </motion.div>
  )
}

export default GlobalPerformancePage
