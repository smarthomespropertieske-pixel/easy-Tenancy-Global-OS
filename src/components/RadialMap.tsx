import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type Simulation
} from 'd3-force'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'
import { useIsMobile } from '../hooks'

interface Node {
  id: string
  label: string
  sublabel?: string
  tier: 0 | 1 | 2 | 3
  color: string
  icon: string
  stat?: string
  link?: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: string | Node
  target: string | Node
}

const NODES: Node[] = [
  // Tier 0: Center
  { id: 'center', label: 'easyTenancy', sublabel: 'Global OS', tier: 0, color: '#39bff6', icon: '⚡', stat: '#1 PropTech 2025' },
  // Tier 1: Feature modules
  { id: 'compliance', label: 'Compliance', sublabel: 'Engine', tier: 1, color: '#a78bfa', icon: '⚖️', stat: '100% zero fines', link: '#platform' },
  { id: 'ai', label: 'AI Copilot', sublabel: 'Assistant', tier: 1, color: '#39bff6', icon: '🤖', stat: '48 actions/day', link: '#ai-copilot' },
  { id: 'collections', label: 'Collections', sublabel: 'Engine', tier: 1, color: '#10b981', icon: '💰', stat: '98% on-time', link: '#platform' },
  { id: 'leasing', label: 'Smart', sublabel: 'Leasing', tier: 1, color: '#f59e0b', icon: '📋', stat: '+31% renewals', link: '#platform' },
  { id: 'maintenance', label: 'Maintenance', sublabel: 'AI Dispatch', tier: 1, color: '#ef4444', icon: '🔧', stat: '–62% time', link: '#platform' },
  // Tier 2/3: Usage metrics
  { id: 'managers', label: '50,000+', sublabel: 'Managers', tier: 2, color: '#64748b', icon: '👥', stat: 'Across 120 countries' },
  { id: 'leases', label: '2.4M', sublabel: 'Leases', tier: 2, color: '#64748b', icon: '📄', stat: 'AI-trained dataset' },
  { id: 'countries', label: '120', sublabel: 'Countries', tier: 2, color: '#64748b', icon: '🌍', stat: 'Live jurisdictions' },
  { id: 'roi', label: '400×', sublabel: 'Avg ROI', tier: 3, color: '#334155', icon: '📈', stat: 'Year-1 verified' },
  { id: 'uptime', label: '99.97%', sublabel: 'Uptime', tier: 3, color: '#334155', icon: '🔒', stat: '<100ms latency' },
  { id: 'noi', label: '+23%', sublabel: 'NOI Uplift', tier: 3, color: '#334155', icon: '💹', stat: 'Median improvement' },
]

const LINKS: Link[] = [
  { source: 'center', target: 'compliance' },
  { source: 'center', target: 'ai' },
  { source: 'center', target: 'collections' },
  { source: 'center', target: 'leasing' },
  { source: 'center', target: 'maintenance' },
  { source: 'compliance', target: 'managers' },
  { source: 'ai', target: 'leases' },
  { source: 'collections', target: 'countries' },
  { source: 'managers', target: 'roi' },
  { source: 'leases', target: 'uptime' },
  { source: 'countries', target: 'noi' },
  { source: 'leasing', target: 'managers' },
  { source: 'maintenance', target: 'leases' },
]

export default function RadialMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<Simulation<Node, Link> | null>(null)
  const nodesRef = useRef<Node[]>([])
  const [selected, setSelected] = useState<Node | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [carouselIdx, setCarouselIdx] = useState(0)
  const animFrameRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const dpr = window.devicePixelRatio || 1

    ctx.clearRect(0, 0, width, height)

    // Draw links
    nodesRef.current.forEach(n => {
      LINKS.forEach(link => {
        const src = nodesRef.current.find(x => x.id === (typeof link.source === 'string' ? link.source : (link.source as Node).id))
        const tgt = nodesRef.current.find(x => x.id === (typeof link.target === 'string' ? link.target : (link.target as Node).id))
        if (!src || !tgt || src !== n) return
        ctx.save()
        ctx.beginPath()
        ctx.moveTo((src.x ?? 0) * dpr, (src.y ?? 0) * dpr)
        ctx.lineTo((tgt.x ?? 0) * dpr, (tgt.y ?? 0) * dpr)
        const alpha = hovered === src.id || hovered === tgt.id ? 0.35 : 0.12
        ctx.strokeStyle = `rgba(57,191,246,${alpha})`
        ctx.lineWidth = hovered === src.id || hovered === tgt.id ? 1.5 * dpr : 0.8 * dpr
        ctx.stroke()
        ctx.restore()
      })
    })

    // Draw nodes
    nodesRef.current.forEach(node => {
      const x = (node.x ?? 0) * dpr
      const y = (node.y ?? 0) * dpr
      const isHovered = hovered === node.id
      const isSelected = selected?.id === node.id

      const radius = node.tier === 0 ? 36 * dpr
        : node.tier === 1 ? 28 * dpr
        : node.tier === 2 ? 22 * dpr
        : 16 * dpr

      const scale = isHovered || isSelected ? 1.18 : 1
      const r = radius * scale

      // Glow
      if (isHovered || isSelected || node.tier === 0) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, r * 1.6, 0, Math.PI * 2)
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6)
        grd.addColorStop(0, node.color + '33')
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fill()
        ctx.restore()
      }

      // Circle fill
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      if (node.tier === 0) {
        const grd = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
        grd.addColorStop(0, '#2563eb')
        grd.addColorStop(0.5, '#39bff6')
        grd.addColorStop(1, '#7c3aed')
        ctx.fillStyle = grd
      } else {
        ctx.fillStyle = `${node.color}22`
      }
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#fff' : isHovered ? node.color : `${node.color}66`
      ctx.lineWidth = isSelected ? 2.5 * dpr : 1.5 * dpr
      ctx.stroke()
      ctx.restore()

      // Icon
      ctx.save()
      ctx.font = `${(node.tier === 0 ? 18 : node.tier === 1 ? 14 : 11) * dpr}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.icon, x, y - (node.tier <= 1 ? 4 * dpr : 3 * dpr))
      ctx.restore()

      // Label
      if (node.tier <= 2) {
        ctx.save()
        ctx.font = `${600}  ${(node.tier === 0 ? 10 : node.tier === 1 ? 9 : 8) * dpr}px Inter,sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = node.tier === 0 ? '#fff' : isHovered ? node.color : 'rgba(240,244,255,0.75)'
        ctx.fillText(node.label, x, y + (node.tier === 0 ? 8 : 7) * dpr)
        ctx.restore()
      }
    })
  }, [hovered, selected])

  useEffect(() => {
    if (isMobile) return
    const container = containerRef.current
    if (!container) return
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth
    const H = container.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'

    const nodes: Node[] = NODES.map(n => ({ ...n }))
    nodesRef.current = nodes

    const sim = forceSimulation<Node>(nodes)
      .force('link', forceLink<Node, Link>(LINKS.map(l => ({ ...l })))
        .id(d => d.id)
        .distance(d => {
          const src = d.source as Node
          const tgt = d.target as Node
          if (src.tier === 0 || tgt.tier === 0) return 130
          if (src.tier === 1 || tgt.tier === 1) return 100
          return 80
        })
        .strength(0.6))
      .force('charge', forceManyBody().strength(d => d.tier === 0 ? -400 : d.tier === 1 ? -200 : -120))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collision', forceCollide<Node>(d => d.tier === 0 ? 55 : d.tier === 1 ? 42 : d.tier === 2 ? 34 : 26))
      .on('tick', () => {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = requestAnimationFrame(draw)
      })

    simRef.current = sim
    return () => {
      sim.stop()
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [isMobile, draw])

  const getNodeAtPoint = (x: number, y: number): Node | null => {
    for (const node of nodesRef.current) {
      const dx = x - (node.x ?? 0)
      const dy = y - (node.y ?? 0)
      const r = node.tier === 0 ? 36 : node.tier === 1 ? 28 : node.tier === 2 ? 22 : 16
      if (Math.sqrt(dx * dx + dy * dy) < r * 1.2) return node
    }
    return null
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const node = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top)
    if (node) {
      setSelected(node === selected ? null : node)
      trackEvent('radial_node_clicked', { node: node.id, tier: node.tier })
      if (node.link) {
        const el = document.querySelector(node.link)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const node = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top)
    setHovered(node?.id ?? null)
    e.currentTarget.style.cursor = node ? 'pointer' : 'default'
  }

  // Mobile carousel
  const tier1Nodes = NODES.filter(n => n.tier === 1)
  const metricNodes = NODES.filter(n => n.tier === 2 || n.tier === 3)

  if (isMobile) {
    return (
      <div style={{ padding: '0 18px' }}>
        {/* Center node */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>easyTenancy</div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>#1 PropTech 2025</div>
        </div>

        {/* Swipe carousel for feature modules */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: 12,
            transform: `translateX(calc(-${carouselIdx * 100}% - ${carouselIdx * 12}px))`,
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)'
          }}>
            {tier1Nodes.map(node => (
              <div key={node.id}
                className="glass-card"
                style={{ minWidth: '100%', padding: '24px 20px', borderRadius: 16, textAlign: 'center', position: 'relative' }}
                onClick={() => { setSelected(node); trackEvent('radial_node_clicked', { node: node.id, tier: 1 }) }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{node.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: node.color }}>{node.label}</div>
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>{node.sublabel}</div>
                <div style={{ marginTop: 12, padding: '8px 14px', background: `${node.color}15`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: node.color }}>{node.stat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {tier1Nodes.map((_, i) => (
            <button key={i} onClick={() => setCarouselIdx(i)} style={{
              width: i === carouselIdx ? 20 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === carouselIdx ? 'var(--blue)' : 'var(--border)',
              transition: 'all 0.3s', padding: 0
            }} />
          ))}
        </div>

        {/* Touch swipe */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <button onClick={() => setCarouselIdx(i => Math.max(0, i - 1))}
            style={{ minHeight: 48, minWidth: 48, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>‹</button>
          <button onClick={() => setCarouselIdx(i => Math.min(tier1Nodes.length - 1, i + 1))}
            style={{ minHeight: 48, minWidth: 48, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>›</button>
        </div>

        {/* Metric chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {metricNodes.map(n => (
            <div key={n.id} style={{ padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>{n.label}</span>
              <span style={{ color: 'var(--text3)', marginLeft: 5 }}>{n.sublabel}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: 520, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHovered(null)}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Node detail tooltip */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(11,18,34,0.95)', backdropFilter: 'blur(12px)',
              border: `1px solid ${selected.color}44`,
              borderRadius: 16, padding: '16px 24px',
              textAlign: 'center', minWidth: 220,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${selected.color}22`
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{selected.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: selected.color }}>{selected.label} {selected.sublabel}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{selected.stat}</div>
            {selected.link && (
              <a href={selected.link} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                Explore feature →
              </a>
            )}
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
        Click any node to explore · {NODES.length} entities connected
      </p>
    </div>
  )
}
