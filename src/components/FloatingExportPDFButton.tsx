// ════════════════════════════════════════════════════════════════════════
//  FloatingExportPDFButton.tsx — Floating PDF Export & Report Generator
//  ─────────────────────────────────────────────────────────────────────
//  • Triggers client-side print and PDF report generation for AppDemo
//  • Formats current dashboard metrics into professional PDF reports using jsPDF & html2canvas
//  • Provides quick floating access with progress indicators & format options
// ════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Download, FileText, Check, RefreshCw, Sparkles, ChevronDown } from '../lib/icons'
import { type DemoTenant } from '../lib/demoData'
import { trackEvent } from '../lib/analytics'

export interface FloatingExportPDFButtonProps {
  tenant: DemoTenant
  targetElementId?: string
  onExportCSV?: () => void
}

export default function FloatingExportPDFButton({
  tenant,
  targetElementId = 'dashboard-export-area',
  onExportCSV,
}: FloatingExportPDFButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Vector PDF Report Generator using direct jsPDF API
  const generateVectorPDFReport = () => {
    trackEvent('export_pdf_vector_report', { tenantId: tenant.id })
    setIsExporting(true)
    setExportStep('Formatting vector report...')

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const primaryColor = [16, 185, 129] // Emerald green
      const darkBg = [10, 15, 30] // Slate dark
      const accentSky = [57, 191, 246]

      // Header Banner
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2])
      doc.rect(0, 0, pageWidth, 38, 'F')

      // Brand Title & Tagline
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('easyTenancy Global OS', 14, 16)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184)
      doc.text('Executive Portfolio & Asset Telemetry Report', 14, 24)

      doc.setFontSize(8)
      doc.setTextColor(57, 191, 246)
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 14, 16, { align: 'right' })
      doc.text(`Tenant ID: ${tenant.id.toUpperCase()}`, pageWidth - 14, 22, { align: 'right' })

      // Portfolio Overview Header Box
      let y = 46
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      doc.text(tenant.name, 20, y + 10)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`${tenant.units} Total Units · Country: ${tenant.country} · Currency: ${tenant.currency}`, 20, y + 17)

      // Key Metrics 4-Box Grid
      y += 30
      const boxWidth = (pageWidth - 28 - 9) / 4
      const metrics = [
        { label: 'Occupancy Rate', value: `${tenant.occupancy.toFixed(1)}%`, color: [16, 185, 129] },
        { label: 'Monthly Revenue', value: `${tenant.currency}${Math.round(tenant.monthlyRent / 1000)}K`, color: [57, 191, 246] },
        { label: 'NOI Margin', value: `${tenant.noi.toFixed(1)}%`, color: [167, 139, 250] },
        { label: 'Arrears Rate', value: `${tenant.arrears.toFixed(1)}%`, color: [245, 158, 11] },
      ]

      metrics.forEach((m, idx) => {
        const bx = 14 + idx * (boxWidth + 3)
        doc.setFillColor(241, 245, 249)
        doc.roundedRect(bx, y, boxWidth, 20, 2, 2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(m.color[0], m.color[1], m.color[2])
        doc.text(m.value, bx + 6, y + 9)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(m.label, bx + 6, y + 15)
      })

      // Section Title: Property Performance Breakdown
      y += 28
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text('Property Asset Breakdown', 14, y)

      // Table Header
      y += 5
      doc.setFillColor(30, 41, 59)
      doc.rect(14, y, pageWidth - 28, 8, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('Property Name', 18, y + 5.5)
      doc.text('Units', 90, y + 5.5)
      doc.text('Occupancy', 115, y + 5.5)
      doc.text('Collections', 145, y + 5.5)
      doc.text('Compliance Status', 172, y + 5.5)

      // Table Rows
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)

      tenant.properties.forEach((prop, i) => {
        const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2])
        doc.rect(14, y, pageWidth - 28, 8, 'F')

        doc.setTextColor(15, 23, 42)
        doc.text(prop.name, 18, y + 5.5)
        doc.text(String(prop.units), 90, y + 5.5)
        doc.text(`${prop.occupancy.toFixed(1)}%`, 115, y + 5.5)
        doc.text(`${prop.collections.toFixed(1)}%`, 145, y + 5.5)

        // Status badge
        if (prop.status === 'compliant') {
          doc.setTextColor(16, 185, 129)
        } else if (prop.status === 'warning') {
          doc.setTextColor(245, 158, 11)
        } else {
          doc.setTextColor(239, 68, 68)
        }
        doc.text(prop.status.toUpperCase(), 172, y + 5.5)

        y += 8
      })

      // Summary Footer
      y += 10
      doc.setDrawColor(203, 213, 225)
      doc.line(14, y, pageWidth - 14, y)

      y += 8
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text('easyTenancy Global Property OS — Confidentially prepared for portfolio management.', 14, y)
      doc.text('Page 1 of 1', pageWidth - 14, y, { align: 'right' })

      // Save PDF
      doc.save(`${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-executive-summary.pdf`)

      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3500)
    } catch (err) {
      console.error('Vector PDF generation error:', err)
    } finally {
      setIsExporting(false)
      setExportStep(null)
      setIsOpen(false)
    }
  }

  // 2. High-Res Visual Capture PDF using html2canvas & jsPDF
  const generateVisualCapturePDF = async (action: 'download' | 'print' = 'download') => {
    trackEvent(`export_pdf_visual_capture_${action}`, { tenantId: tenant.id })
    const element = document.getElementById(targetElementId)
    if (!element || isExporting) return

    setIsExporting(true)
    setExportStep('Capturing dashboard layout...')

    const originalStyle = element.getAttribute('style') || ''
    element.setAttribute('style', `${originalStyle} background: #0a0f1e;`)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0f1e',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      })

      setExportStep('Compiling PDF pages...')
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

      if (action === 'print') {
        pdf.autoPrint()
        const url = pdf.output('bloburl')
        if (typeof url === 'string') {
          window.open(url, '_blank')
        } else {
          const blobUrl = URL.createObjectURL(pdf.output('blob'))
          window.open(blobUrl, '_blank')
        }
      } else {
        pdf.save(`${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dashboard-report.pdf`)
      }

      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3500)
    } catch (err) {
      console.error('Visual capture PDF generation error:', err)
    } finally {
      element.setAttribute('style', originalStyle)
      setIsExporting(false)
      setExportStep(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={popoverRef}>
      {/* Toast notification on completed export */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 mb-2 w-72 p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-slate-100 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-semibold"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Check size={16} />
            </div>
            <div>
              <p className="text-emerald-400 font-bold">PDF Export Complete</p>
              <p className="text-[11px] text-slate-300 font-normal">Report generated and saved!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Options Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="absolute bottom-16 right-0 mb-2 w-72 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 space-y-1.5 text-slate-100 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">Export Dashboard</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {tenant.properties.length} Props
              </span>
            </div>

            {/* Option 1: Clean Vector Report */}
            <button
              onClick={generateVectorPDFReport}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                  Clean Executive Report (PDF)
                </p>
                <p className="text-[10px] text-slate-400">
                  Formatted vector layout with KPIs & table
                </p>
              </div>
            </button>

            {/* Option 2: Full Dashboard Visual Capture */}
            <button
              onClick={() => generateVisualCapturePDF('download')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-500/10 hover:border-sky-500/30 border border-transparent transition-all text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Download size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                  Visual Dashboard Capture (PDF)
                </p>
                <p className="text-[10px] text-slate-400">
                  High-res snapshot of active dashboard
                </p>
              </div>
            </button>

            {/* Option 3: Print View */}
            <button
              onClick={() => generateVisualCapturePDF('print')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent transition-all text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xs">🖨️</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                  Print / Save Dialog
                </p>
                <p className="text-[10px] text-slate-400">
                  Opens browser print stream
                </p>
              </div>
            </button>

            {/* Option 4: CSV Export shortcut */}
            {onExportCSV && (
              <button
                onClick={() => {
                  onExportCSV()
                  setIsOpen(false)
                }}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent text-left cursor-pointer text-slate-400 hover:text-slate-200"
              >
                <span className="text-xs ml-1">📥</span>
                <span className="text-xs font-medium">Export Properties CSV</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isExporting}
        whileHover={{ scale: 1.05, translateY: -2 }}
        whileTap={{ scale: 0.96 }}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl border backdrop-blur-xl text-xs font-bold transition-all cursor-pointer ${
          isExporting
            ? 'bg-slate-900/90 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20'
            : isOpen
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-4 ring-emerald-500/20 shadow-emerald-500/25'
            : 'bg-slate-900/95 text-slate-100 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/20'
        }`}
      >
        {isExporting ? (
          <>
            <RefreshCw size={16} className="animate-spin text-amber-400 shrink-0" />
            <span className="font-mono text-amber-300">{exportStep || 'Generating PDF...'}</span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Download size={12} />
            </div>
            <span>Export PDF</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </motion.button>
    </div>
  )
}
