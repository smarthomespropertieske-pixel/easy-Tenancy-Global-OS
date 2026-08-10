import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion, AnimatePresence } from 'framer-motion'

interface GeoFeature {
  type: 'Feature'
  properties: {
    name: string
  }
  geometry: any
}

interface TooltipData {
  name: string
  density: number
  yield: number
  x: number
  y: number
}

export default function D3GeographicalHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        const data = await response.json()
        if (!active) return

        // Generate synthetic metrics for the countries (approx 120+ supported countries)
        const metrics = new Map<string, { density: number; yield: number }>()
        const seed = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
          return Math.abs(h);
        }

        data.features.forEach((f: GeoFeature) => {
          const s = seed(f.properties.name)
          // 80% chance of having data to simulate "supported countries"
          if (s % 100 > 20) {
            metrics.set(f.properties.name, {
              density: Math.floor((s % 500) + 10), // properties count
              yield: 3 + ((s % 80) / 10) // 3% to 11%
            })
          }
        })

        drawMap(data.features, metrics)
        setLoading(false)
      } catch (err) {
        console.error("Failed to load map data", err)
      }
    }

    const drawMap = (features: GeoFeature[], metrics: Map<string, { density: number; yield: number }>) => {
      if (!svgRef.current || !containerRef.current) return
      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      const width = containerRef.current.clientWidth
      const height = 450

      const projection = d3.geoMercator()
        .scale(120)
        .translate([width / 2, height / 1.5])

      const path = d3.geoPath().projection(projection)

      // Color scale for yield
      const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([3, 11])

      const g = svg.append("g")

      // Add zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
        })
      
      svg.call(zoom)

      // Draw countries
      g.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", path as any)
        .attr("fill", d => {
          const m = metrics.get(d.properties.name)
          return m ? colorScale(m.yield) : "#1e293b" // slate-800 for empty
        })
        .attr("stroke", "#0f172a") // slate-950
        .attr("stroke-width", 0.5)
        .attr("class", "transition-colors duration-200 cursor-pointer")
        .on("mouseover", function(event, d: any) {
          d3.select(this)
            .attr("stroke", "#38bdf8")
            .attr("stroke-width", 1.5)
            .raise()
          
          const m = metrics.get(d.properties.name)
          if (m) {
            setTooltip({
              name: d.properties.name,
              density: m.density,
              yield: m.yield,
              x: event.clientX,
              y: event.clientY
            })
          }
        })
        .on("mousemove", (event) => {
          setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null)
        })
        .on("mouseout", function(event, d: any) {
          d3.select(this)
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 0.5)
            
          setTooltip(null)
        })
    }

    loadData()

    const handleResize = () => {
      // Very basic resize re-trigger handling could go here
    }
    window.addEventListener("resize", handleResize)
    
    return () => {
      active = false
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
          <div className="text-emerald-400 font-mono text-sm flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading Topography...
          </div>
        </div>
      )}

      {/* Map Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-slate-100 font-bold text-sm">Global Property Density & Yield</h3>
        <p className="text-xs text-slate-400 max-w-xs font-mono mt-1">
          Interactive heatmap displaying asset allocation density and aggregate ROI yield across 120+ active countries.
        </p>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md pointer-events-none">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider font-bold">Yield Heatmap</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">3%</span>
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-[#ffffd9] via-[#41b6c4] to-[#081d58]" />
          <span className="text-xs text-slate-500 font-mono">11%+</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700" />
          <span className="text-[10px] text-slate-500 font-mono">No Active Assets</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-[450px]" style={{ outline: 'none' }} />

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-xl"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y + 15,
            }}
          >
            <div className="font-bold text-slate-100 text-sm mb-2">{tooltip.name}</div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Total Properties</span>
                <span className="font-bold text-sky-400">{tooltip.density.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Avg NOI Yield</span>
                <span className="font-bold text-emerald-400">{tooltip.yield.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
