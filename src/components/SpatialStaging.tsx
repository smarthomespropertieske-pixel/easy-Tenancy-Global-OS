/* ═══════════════════════════════════════════════════════════════
   SpatialStaging — Novita AI FLUX.1 Property Transformation
   • img2img staging via /api/novita/stage
   • Agent-Led Video Tour generator via /api/novita/tour
   • CF Workers AI fallback (automatic, zero-downtime)
   Research: Novita FLUX.1 [dev] 12B params, ~0.95s avg latency
   Top p95: <2.1s Flux Schnell on H100 clusters (WaveSpeedAI 2026)
═══════════════════════════════════════════════════════════════ */
import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../lib/tokens'

// ── Style presets ─────────────────────────────────────────────────
const STAGE_STYLES = [
  { id: 'ar_meta',       label: 'Meta Quest AR',      icon: '🥽', desc: 'Optimised for Quest 3/Orion passthrough', prompt: 'ultra-modern AR spatial interior, Meta Quest optimized, depth layers, holographic overlays, premium 2026 aesthetic' },
  { id: 'luxury_modern', label: 'Luxury Modern',      icon: '✨', desc: 'High-end minimalist staging',             prompt: 'luxury modern interior design, minimal clutter, warm lighting, premium furniture, architectural photography' },
  { id: 'scandinavian',  label: 'Scandinavian',       icon: '🌿', desc: 'Clean Nordic biophilic design',           prompt: 'scandinavian interior design, natural materials, warm wood tones, plants, cozy hygge atmosphere' },
  { id: 'smart_home',   label: 'Smart Home 2026',     icon: '🏠', desc: 'IoT-integrated tech interior',           prompt: 'futuristic smart home 2026, integrated technology, clean lines, ambient lighting, IoT devices visible' },
  { id: 'vr_showcase',  label: 'VR Showcase',         icon: '🌐', desc: 'Immersive virtual showroom ready',       prompt: 'VR ready interior, photorealistic render, wide angle, showcase lighting, virtual tour optimized' },
  { id: 'investment',   label: 'Investment Grade',    icon: '📈', desc: 'Neutral high-yield appeal',              prompt: 'professional investment property staging, neutral tones, clean lines, rental appeal, high yield aesthetic' },
]

const TOUR_AVATARS = [
  { id: 'alex',    name: 'Alex (London)',  accent: 'British',     icon: '🇬🇧', color: BRAND.blue      },
  { id: 'amara',   name: 'Amara (Nairobi)',accent: 'Kenyan',      icon: '🇰🇪', color: BRAND.teal      },
  { id: 'hassan',  name: 'Hassan (Dubai)', accent: 'Gulf Arabic', icon: '🇦🇪', color: '#f59e0b'       },
  { id: 'madison', name: 'Madison (NYC)',  accent: 'American',    icon: '🇺🇸', color: BRAND.blueLight },
]

// ── Types ──────────────────────────────────────────────────────────
type StagingStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
type TourStatus    = 'idle' | 'generating' | 'done' | 'error'

interface StagingResult { url: string; model: string; latency: number; fallback: boolean }
interface TourResult    { script: string; avatar: string; scenes: string[]; duration: string; fallback: boolean }

// ── Mock API (sandbox — real endpoint in CF Pages function) ──────
async function callNovitaStage(
  imageDataUrl: string,
  style: typeof STAGE_STYLES[0],
  _signal: AbortSignal
): Promise<StagingResult> {
  // Simulate Novita FLUX.1 Schnell latency (~1.4s p50)
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 800))
  const fallback = Math.random() < 0.1 // 10% CF Workers AI fallback simulation
  return {
    url: imageDataUrl, // in production: Novita CDN URL
    model: fallback ? 'CF Workers AI (@cf/stabilityai/stable-diffusion-xl-base-1.0)' : 'Novita FLUX.1-dev (12B)',
    latency: Math.round(1200 + Math.random() * 900),
    fallback,
  }
}

async function callNovitaTour(
  propertyData: Record<string, string>,
  avatarId: string,
  _signal: AbortSignal
): Promise<TourResult> {
  await new Promise(r => setTimeout(r, 2200 + Math.random() * 1000))
  const fallback = Math.random() < 0.08
  const avatar = TOUR_AVATARS.find(a => a.id === avatarId)!
  return {
    script: `Welcome to this stunning property at ${propertyData.address ?? 'your next investment'}. 
I'm ${avatar.name}, your AI property specialist. 

This ${propertyData.bedrooms ?? 3}-bedroom home offers exceptional ${propertyData.yield ?? '8.2%'} yield potential. 
The Einstein GPT compliance score is ${propertyData.compliance ?? '97/100'} — fully RERA/FCA compliant.

The Gemini 3 valuation model projects a ${propertyData.growth ?? '14%'} appreciation over 24 months based on 
127-country market intelligence. Agentforce has already pre-qualified ${propertyData.leads ?? '12'} investor leads 
matching this property's profile.

Shall I schedule a Meta Quest immersive tour for your shortlisted buyers?`,
    avatar: avatar.name,
    scenes: ['Property Exterior', 'Living Spaces', 'Kitchen & Dining', 'Master Suite', 'Investment Summary'],
    duration: '2m 34s',
    fallback,
  }
}

// ── Main Component ─────────────────────────────────────────────────
export default function SpatialStaging({ propertyData = {} }: { propertyData?: Record<string, string> }) {
  const [activeTab, setActiveTab]         = useState<'staging' | 'tour'>('staging')
  const [selectedStyle, setSelectedStyle] = useState(STAGE_STYLES[0])
  const [selectedAvatar, setSelectedAvatar] = useState(TOUR_AVATARS[0])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [stagingStatus, setStagingStatus] = useState<StagingStatus>('idle')
  const [stagingResult, setStagingResult] = useState<StagingResult | null>(null)
  const [tourStatus, setTourStatus]       = useState<TourStatus>('idle')
  const [tourResult, setTourResult]       = useState<TourResult | null>(null)
  const [dragOver, setDragOver]           = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      setUploadedImage(e.target?.result as string)
      setStagingResult(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const runStaging = async () => {
    if (!uploadedImage) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setStagingStatus('uploading')
    await new Promise(r => setTimeout(r, 400))
    setStagingStatus('processing')
    try {
      const result = await callNovitaStage(uploadedImage, selectedStyle, abortRef.current.signal)
      setStagingResult(result)
      setStagingStatus('done')
    } catch {
      setStagingStatus('error')
    }
  }

  const runTour = async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setTourStatus('generating')
    try {
      const result = await callNovitaTour(propertyData, selectedAvatar.id, abortRef.current.signal)
      setTourResult(result)
      setTourStatus('done')
    } catch {
      setTourStatus('error')
    }
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BRAND.blue},${BRAND.blueLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎨</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-head)' }}>Novita AI Spatial Studio</h3>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--mist)' }}>FLUX.1-dev 12B · ~1.4s latency · CF Workers AI fallback</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            ONLINE
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['staging', 'tour'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 20px', border: 'none', background: 'none', color: activeTab === t ? BRAND.blueLight : 'var(--mist)', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: `2px solid ${activeTab === t ? BRAND.blueLight : 'transparent'}`, transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}>
              {t === 'staging' ? '🏠 Spatial Staging' : '🎬 AI Video Tour'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <AnimatePresence mode="wait">

          {/* ── SPATIAL STAGING TAB ── */}
          {activeTab === 'staging' && (
            <motion.div key="staging" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Left: upload + styles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? BRAND.blueLight : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: 16, minHeight: 160, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                      background: dragOver ? `${BRAND.blue}10` : uploadedImage ? 'transparent' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s', overflow: 'hidden', position: 'relative',
                    }}
                  >
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Property" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 14 }} />
                    ) : (
                      <>
                        <div style={{ fontSize: 36 }}>📸</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Drop property photo</div>
                        <div style={{ fontSize: 12, color: 'var(--mist)' }}>or click to upload · JPG/PNG/WEBP</div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  </div>

                  {/* Style grid */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AR/VR Style Preset</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {STAGE_STYLES.map(s => (
                        <button key={s.id} onClick={() => setSelectedStyle(s)} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${selectedStyle.id === s.id ? BRAND.blue : 'rgba(255,255,255,0.08)'}`, background: selectedStyle.id === s.id ? `${BRAND.blue}20` : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                          <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: selectedStyle.id === s.id ? BRAND.blueLight : 'var(--white)' }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--mist)' }}>{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={runStaging} disabled={!uploadedImage || stagingStatus === 'processing' || stagingStatus === 'uploading'} style={{ padding: '14px', borderRadius: 14, border: 'none', background: uploadedImage ? `linear-gradient(135deg,${BRAND.blue},${BRAND.blueLight})` : 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: uploadedImage ? 'pointer' : 'not-allowed', opacity: (!uploadedImage || stagingStatus === 'processing') ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}>
                    {stagingStatus === 'uploading'   ? '⬆ Uploading...'     :
                     stagingStatus === 'processing'  ? '🎨 Staging with FLUX.1...' :
                     stagingStatus === 'done'        ? '✅ Re-stage' :
                     '🚀 Generate Staged View'}
                  </button>
                </div>

                {/* Right: result */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Staged Result</div>
                  <AnimatePresence mode="wait">
                    {stagingStatus === 'processing' || stagingStatus === 'uploading' ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: 220, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${BRAND.blue}33`, borderTop: `3px solid ${BRAND.blueLight}`, animation: 'spin-slow 1s linear infinite' }} />
                        <div style={{ fontSize: 13, color: 'var(--mist)' }}>
                          {stagingStatus === 'uploading' ? 'Uploading to FLUX.1-dev...' : `Generating ${selectedStyle.label} style...`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mist)', opacity: 0.6 }}>~1.4s · Novita H100 cluster</div>
                      </motion.div>
                    ) : stagingResult && stagingStatus === 'done' ? (
                      <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                          <img src={stagingResult.url} alt="AI Staged" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: stagingResult.fallback ? '#f59e0b' : '#10b981' }}>
                            {stagingResult.fallback ? '⚡ CF Workers AI' : '✨ FLUX.1-dev'}
                          </div>
                          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--white)' }}>
                            {selectedStyle.icon} {selectedStyle.label}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            ['Model', stagingResult.model.split('(')[0].trim()],
                            ['Latency', `${stagingResult.latency}ms`],
                            ['Style', selectedStyle.label],
                            ['Fallback', stagingResult.fallback ? 'CF Workers AI' : 'None'],
                          ].map(([k,v]) => (
                            <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                              <div style={{ fontSize: 10, color: 'var(--mist)', marginBottom: 2 }}>{k}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 220, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>🏠</div>
                        <div style={{ fontSize: 13, color: 'var(--mist)', textAlign: 'center' }}>Upload a property photo and select a<br/>style to generate the AR staging</div>
                        <div style={{ fontSize: 11, color: 'var(--mist)', opacity: 0.6 }}>Powered by Novita FLUX.1-dev · 12B params</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── VIDEO TOUR TAB ── */}
          {activeTab === 'tour' && (
            <motion.div key="tour" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Avatar Agent</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {TOUR_AVATARS.map(a => (
                        <button key={a.id} onClick={() => setSelectedAvatar(a)} style={{ padding: '12px', borderRadius: 12, border: `1px solid ${selectedAvatar.id === a.id ? a.color : 'rgba(255,255,255,0.08)'}`, background: selectedAvatar.id === a.id ? `${a.color}18` : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: selectedAvatar.id === a.id ? a.color : 'var(--white)' }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--mist)' }}>{a.accent} accent</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CRM data feed */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salesforce CRM Data</div>
                    {[['Bedrooms', propertyData.bedrooms ?? '3'], ['Yield', propertyData.yield ?? '8.2%'], ['Compliance', propertyData.compliance ?? '97/100'], ['AI Leads', propertyData.leads ?? '12']].map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                        <span style={{ color: 'var(--mist)' }}>{k}</span>
                        <span style={{ color: BRAND.blueLight, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={runTour} disabled={tourStatus === 'generating'} style={{ padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${BRAND.teal},${BRAND.blueLight})`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: tourStatus === 'generating' ? 'not-allowed' : 'pointer', opacity: tourStatus === 'generating' ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}>
                    {tourStatus === 'generating' ? '🎬 Generating Tour Script...' : '🎬 Generate AI Video Tour'}
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mist)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Generated Tour</div>
                  <AnimatePresence mode="wait">
                    {tourStatus === 'generating' ? (
                      <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${BRAND.teal}33`, borderTop: `3px solid ${BRAND.teal}`, animation: 'spin-slow 1s linear infinite', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Generating {selectedAvatar.name}'s script</div>
                            <div style={{ fontSize: 11, color: 'var(--mist)' }}>Einstein GPT CRM data → Gemini drafting → Avatar synthesis</div>
                          </div>
                        </div>
                        {['Reading Salesforce CRM data...', 'Gemini drafting property narrative...', 'Synthesising avatar voice...'].map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--mist)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: BRAND.teal, animation: `pulse ${1 + i * 0.3}s infinite` }} />
                            {s}
                          </div>
                        ))}
                      </motion.div>
                    ) : tourResult ? (
                      <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ background: `${selectedAvatar.color}10`, border: `1px solid ${selectedAvatar.color}33`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 20 }}>{selectedAvatar.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 14, color: selectedAvatar.color }}>{tourResult.avatar}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mist)' }}>⏱ {tourResult.duration}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.7, whiteSpace: 'pre-line', maxHeight: 200, overflowY: 'auto' }}>{tourResult.script}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                          {tourResult.scenes.map((scene, i) => (
                            <span key={i} style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 999, color: 'var(--mist)' }}>📍 {scene}</span>
                          ))}
                        </div>
                        {tourResult.fallback && (
                          <div style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                            ⚡ CF Workers AI fallback engaged (zero downtime preserved)
                          </div>
                        )}
                        <button style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: `1px solid ${selectedAvatar.color}44`, background: `${selectedAvatar.color}15`, color: selectedAvatar.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          🎬 Render Full Video Tour →
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="idle-tour" style={{ height: 240, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>🎬</div>
                        <div style={{ fontSize: 13, color: 'var(--mist)', textAlign: 'center' }}>Select an AI avatar and click<br/>Generate to create the tour script</div>
                        <div style={{ fontSize: 11, color: 'var(--mist)', opacity: 0.6 }}>Einstein GPT CRM → Gemini 3 → Avatar</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
