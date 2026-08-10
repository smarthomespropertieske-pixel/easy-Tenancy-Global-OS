// ═══════════════════════════════════════════════════════════════════════
//  NetZeroPage.tsx — Net-Zero Planetary Carbon Engine Route
//  ─────────────────────────────────────────────────────────────────────
//  Full-page view for easy-tenancy-global-os v4.5 NetZeroEngine.
// ═══════════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { SEO } from '../components/SEO'
import SovereignPageHeader from '../components/SovereignPageHeader'
import { NetZeroEngine } from '../components/NetZeroEngine'

export function NetZeroPage() {
  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' as const } }
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
        title="Net-Zero Carbon Telemetry Engine"
        description="Real-time building carbon emission telemetry, energy efficiency donut charts, and CSRD ESG compliance for global real estate portfolios."
        url="/netzero"
      />

      <SovereignPageHeader
        badge="Planetary Infrastructure v4.5 · SDG 7 & 13 Net-Zero Core"
        badgeColor="#10b981"
        title={
          <>
            <span className="text-slate-100">Net-Zero Carbon</span>{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Telemetry Engine
            </span>
          </>
        }
        subtitle="Continuous building carbon emissions tracking adhering to CSRD, BREEAM & LEED standards. Machine-learning HVAC optimization, solar PV mix, and real-time energy efficiency ratings."
        stats={[
          { label: 'CO₂ Reduction', value: '-42%', icon: '🌱', color: '#10b981' },
          { label: 'Green Energy Mix', value: '88%', icon: '⚡', color: '#06b6d4' },
          { label: 'Annual Savings', value: '1,700 T', icon: '🍃', color: '#a78bfa' },
          { label: 'CSRD Audit', value: 'Verified', icon: '📜', color: '#f59e0b' },
        ]}
        actions={[
          { label: '← Home', href: '/' },
          { label: '🌍 Global OS', href: '/global-dominance' },
          { label: '🏢 Real Estate OS', href: '/realestate-os' },
          { label: '🤖 AI Copilot', href: '/app/demo', primary: true },
        ]}
        compact
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <NetZeroEngine variant="full" />
      </main>
    </motion.div>
  )
}

export default NetZeroPage
