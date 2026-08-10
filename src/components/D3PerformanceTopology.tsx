// ════════════════════════════════════════════════════════════════════════
//  D3PerformanceTopology.tsx — D3 Interactive Real-Time Portfolio Topology
//  ─────────────────────────────────────────────────────────────────────
//  Renders a force-directed network diagram using d3-force to visualize:
//   • Regional Property Hub Nodes
//   • Real-time Rent Collection Velocity Streams
//   • Maintenance Ticket Dispatch & Occupancy Health Statuses
// ════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from 'd3-force'
import { motion } from 'framer-motion'

export interface HubNode {
  id: string
  name: string
  region: 'EMEA' | 'AMER' | 'APAC' | 'MEA'
  flag: string
  occupancy: number // %
  rentCollectionRate: number // %
  maintEfficiencyHours: number // avg resolution time in hrs
  activeTickets: number
  tier: 0 | 1 | 2
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface HubLink {
  source: string | HubNode
  target: string | HubNode
  flowRate: number // Mbps or transactions/sec equivalent
}

const MASTER_NODES: HubNode[] = [
  // Tier 0: Central Core
  {
    id: 'global-core',
    name: 'Global OS Core',
    region: 'EMEA',
    flag: '🌍',
    occupancy: 95.3,
    rentCollectionRate: 98.4,
    maintEfficiencyHours: 2.4,
    activeTickets: 14,
    tier: 0,
  },

  // Tier 1: Primary Regional Gateways
  {
    id: 'emea-gateway',
    name: 'EMEA HQ (London)',
    region: 'EMEA',
    flag: '🇬🇧',
    occupancy: 96.4,
    rentCollectionRate: 99.1,
    maintEfficiencyHours: 2.1,
    activeTickets: 8,
    tier: 1,
  },
  {
    id: 'amer-gateway',
    name: 'AMER HQ (New York)',
    region: 'AMER',
    flag: '🇺🇸',
    occupancy: 94.8,
    rentCollectionRate: 97.8,
    maintEfficiencyHours: 2.6,
    activeTickets: 12,
    tier: 1,
  },
  {
    id: 'apac-gateway',
    name: 'APAC HQ (Singapore)',
    region: 'APAC',
    flag: '🇸🇬',
    occupancy: 97.2,
    rentCollectionRate: 99.5,
    maintEfficiencyHours: 1.8,
    activeTickets: 5,
    tier: 1,
  },
  {
    id: 'mea-gateway',
    name: 'MEA HQ (Dubai)',
    region: 'MEA',
    flag: '🇦🇪',
    occupancy: 92.1,
    rentCollectionRate: 96.2,
    maintEfficiencyHours: 3.1,
    activeTickets: 9,
    tier: 1,
  },

  // Tier 2: Metro Clusters
  {
    id: 'paris',
    name: 'Paris Hub',
    region: 'EMEA',
    flag: '🇫🇷',
    occupancy: 95.8,
    rentCollectionRate: 98.2,
    maintEfficiencyHours: 2.3,
    activeTickets: 4,
    tier: 2,
  },
  {
    id: 'berlin',
    name: 'Berlin Hub',
    region: 'EMEA',
    flag: '🇩🇪',
    occupancy: 96.1,
    rentCollectionRate: 98.7,
    maintEfficiencyHours: 2.0,
    activeTickets: 3,
    tier: 2,
  },
  {
    id: 'sf',
    name: 'San Francisco Hub',
    region: 'AMER',
    flag: '🇺🇸',
    occupancy: 93.9,
    rentCollectionRate: 97.1,
    maintEfficiencyHours: 2.8,
    activeTickets: 6,
    tier: 2,
  },
  {
    id: 'tokyo',
    name: 'Tokyo Hub',
    region: 'APAC',
    flag: '🇯🇵',
    occupancy: 98.1,
    rentCollectionRate: 99.8,
    maintEfficiencyHours: 1.5,
    activeTickets: 2,
    tier: 2,
  },
  {
    id: 'sydney',
    name: 'Sydney Hub',
    region: 'APAC',
    flag: '🇦🇺',
    occupancy: 96.5,
    rentCollectionRate: 98.9,
    maintEfficiencyHours: 2.2,
    activeTickets: 4,
    tier: 2,
  },
  {
    id: 'riyadh',
    name: 'Riyadh Hub',
    region: 'MEA',
    flag: '🇸🇦',
    occupancy: 91.5,
    rentCollectionRate: 95.8,
    maintEfficiencyHours: 3.4,
    activeTickets: 7,
    tier: 2,
  },
]

const MASTER_LINKS: HubLink[] = [
  { source: 'global-core', target: 'emea-gateway', flowRate: 98.2 },
  { source: 'global-core', target: 'amer-gateway', flowRate: 97.5 },
  { source: 'global-core', target: 'apac-gateway', flowRate: 99.1 },
  { source: 'global-core', target: 'mea-gateway', flowRate: 95.8 },

  { source: 'emea-gateway', target: 'paris', flowRate: 98.5 },
  { source: 'emea-gateway', target: 'berlin', flowRate: 98.9 },

  { source: 'amer-gateway', target: 'sf', flowRate: 96.8 },

  { source: 'apac-gateway', target: 'tokyo', flowRate: 99.4 },
  { source: 'apac-gateway', target: 'sydney', flowRate: 98.2 },

  { source: 'mea-gateway', target: 'riyadh', flowRate: 95.2 },
]

export function D3PerformanceTopology() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<HubNode | null>(MASTER_NODES[0])
  const [metricMode, setMetricMode] = useState<'occupancy' | 'rent' | 'maintenance'>('occupancy')
  const [nodes, setNodes] = useState<HubNode[]>(MASTER_NODES)
  const [links] = useState<HubLink[]>(MASTER_LINKS)
  const [dimensions, setDimensions] = useState({ width: 680, height: 420 })

  // Handle Container Resize
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        const h = Math.max(360, Math.min(480, Math.round(width * 0.58)))
        setDimensions({ width: Math.round(width), height: h })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Run D3 Force Simulation
  useEffect(() => {
    const { width, height } = dimensions
    const simNodes: HubNode[] = MASTER_NODES.map((n) => ({ ...n }))
    const simLinks: HubLink[] = MASTER_LINKS.map((l) => ({ ...l }))

    // Fix core node at center
    const core = simNodes.find((n) => n.id === 'global-core')
    if (core) {
      core.fx = width / 2
      core.fy = height / 2
    }

    const sim: Simulation<HubNode, HubLink> = forceSimulation<HubNode, HubLink>(simNodes)
      .force(
        'link',
        forceLink<HubNode, HubLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            const src = typeof d.source === 'object' ? (d.source as HubNode).tier : 0
            return src === 0 ? 110 : 75
          })
      )
      .force('charge', forceManyBody<HubNode>().strength(-260))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<HubNode>().radius(38))

    sim.on('tick', () => {
      // Keep nodes bounded inside container canvas
      simNodes.forEach((node) => {
        if (node.tier !== 0) {
          node.x = Math.max(40, Math.min(width - 40, node.x || width / 2))
          node.y = Math.max(40, Math.min(height - 40, node.y || height / 2))
        }
      })
      setNodes([...simNodes])
    })

    return () => {
      sim.stop()
    }
  }, [dimensions])

  const getNodeColor = useCallback(
    (node: HubNode) => {
      if (metricMode === 'occupancy') {
        if (node.occupancy >= 96) return '#10b981' // emerald
        if (node.occupancy >= 94) return '#38bdf8' // sky
        return '#f59e0b' // amber
      }
      if (metricMode === 'rent') {
        if (node.rentCollectionRate >= 98.5) return '#10b981'
        if (node.rentCollectionRate >= 97) return '#a855f7'
        return '#f43f5e'
      }
      // maintenance
      if (node.maintEfficiencyHours <= 2.0) return '#10b981'
      if (node.maintEfficiencyHours <= 2.8) return '#38bdf8'
      return '#f59e0b'
    },
    [metricMode]
  )

  const getMetricBadge = useCallback(
    (node: HubNode) => {
      if (metricMode === 'occupancy') return `${node.occupancy}%`
      if (metricMode === 'rent') return `${node.rentCollectionRate}%`
      return `${node.maintEfficiencyHours}h`
    },
    [metricMode]
  )

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              D3.js Force Network Engine v7
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Hub Telemetry</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🌐 Real-Time Portfolio Topology &amp; Dispatch Streams</span>
          </h3>
          <p className="text-xs text-slate-400">
            Interactive D3 force topology depicting rent collection velocity, occupancy health, and maintenance SLA response.
          </p>
        </div>

        {/* Metric Selector Pills */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMetricMode('occupancy')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metricMode === 'occupancy'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏢 Occupancy %
          </button>
          <button
            onClick={() => setMetricMode('rent')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metricMode === 'rent'
                ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💳 Rent Yield %
          </button>
          <button
            onClick={() => setMetricMode('maintenance')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metricMode === 'maintenance'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔧 Maint. Hours
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* D3 Simulation SVG Canvas */}
        <div
          ref={containerRef}
          className="lg:col-span-2 relative w-full bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center min-h-[360px]"
        >
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-auto select-none"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          >
            {/* Background Grid Accent */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Links */}
            {links.map((link, idx) => {
              const src = typeof link.source === 'object' ? (link.source as HubNode) : null
              const tgt = typeof link.target === 'object' ? (link.target as HubNode) : null
              if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null) return null

              return (
                <g key={`link-${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="#334155"
                    strokeWidth={src.tier === 0 ? 2.5 : 1.5}
                    strokeDasharray={src.tier === 0 ? 'none' : '4 4'}
                    opacity={0.8}
                  />
                  {/* Animated Stream Particle */}
                  <circle r="3" fill="#38bdf8">
                    <animateMotion
                      path={`M ${src.x},${src.y} L ${tgt.x},${tgt.y}`}
                      dur={`${3 - (link.flowRate % 1)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              if (node.x == null || node.y == null) return null
              const color = getNodeColor(node)
              const isSelected = selectedNode?.id === node.id
              const radius = node.tier === 0 ? 28 : node.tier === 1 ? 22 : 18

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer Glow Halo */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Circle Body */}
                  <circle
                    r={radius}
                    fill="#0f172a"
                    stroke={isSelected ? '#ffffff' : color}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Flag / Icon */}
                  <text
                    textAnchor="middle"
                    dy="-2"
                    fontSize={node.tier === 0 ? 16 : 13}
                    className="pointer-events-none"
                  >
                    {node.flag}
                  </text>

                  {/* Metric Value Label */}
                  <text
                    textAnchor="middle"
                    dy="12"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#e2e8f0"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {getMetricBadge(node)}
                  </text>

                  {/* Node Name Label Underneath */}
                  <text
                    textAnchor="middle"
                    dy={radius + 14}
                    fontSize="10"
                    fontWeight="600"
                    fill="#94a3b8"
                    className="pointer-events-none"
                  >
                    {node.name.replace(' Gateway', '').replace(' Hub', '')}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* D3 Canvas Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-3 shadow-lg">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Attention</span>
            </div>
          </div>
        </div>

        {/* Node Inspector Details Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Selected Hub Node
            </span>
            <h4 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <span>{selectedNode?.flag}</span>
              <span>{selectedNode?.name}</span>
            </h4>
            <p className="text-xs text-slate-400">Region: {selectedNode?.region} Jurisdiction</p>
          </div>

          {selectedNode && (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 font-mono text-xs"
            >
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Occupancy Rate</span>
                <span className="font-bold text-emerald-400">{selectedNode.occupancy}%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Rent Collection</span>
                <span className="font-bold text-purple-400">{selectedNode.rentCollectionRate}%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Avg Maint. Time</span>
                <span className="font-bold text-amber-400">{selectedNode.maintEfficiencyHours} Hours</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Active Work Orders</span>
                <span className="font-bold text-cyan-400">{selectedNode.activeTickets} Dispatch Tickets</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 text-[11px] text-slate-400 font-sans leading-relaxed">
                <span className="text-slate-200 font-semibold block mb-1">🤖 AI Dispatch Optimization:</span>
                Routing maintenance requests through local vendors automatically with an average response time of {selectedNode.maintEfficiencyHours} hours.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default D3PerformanceTopology
