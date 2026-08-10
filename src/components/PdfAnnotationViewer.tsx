import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface PdfAnnotation {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'note' | 'text' | 'pen' | 'stamp';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width?: number; // percentage 0-100
  height?: number; // percentage 0-100
  color: string;
  text?: string;
  author?: string;
  createdAt: string;
  points?: { x: number; y: number }[]; // percentages 0-100
  stampText?: string;
}

interface PdfAnnotationViewerProps {
  fileId: string;
  fileName: string;
  fileUrl?: string;
  mimeType?: string;
  propertyName?: string;
  category?: string;
  onClose?: () => void;
}

export default function PdfAnnotationViewer({
  fileId,
  fileName,
  fileUrl,
  propertyName,
  category,
}: PdfAnnotationViewerProps) {
  // State
  const [numPages, setNumPages] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<'select' | 'highlight' | 'note' | 'pen' | 'text' | 'stamp'>('highlight');
  const [selectedColor, setSelectedColor] = useState<string>('#fef08a'); // Default highlight yellow
  const [selectedStamp, setSelectedStamp] = useState<string>('APPROVED');
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem(`easytenancy_pdf_ann_${fileId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved annotations:', e);
    }
    // Default initial annotation for demo
    return [
      {
        id: 'ann-init-1',
        pageNumber: 1,
        type: 'stamp',
        x: 65,
        y: 8,
        color: '#22c55e',
        stampText: 'VERIFIED COMPLIANT',
        author: 'Compliance Officer',
        createdAt: 'Today 09:30 AM',
      },
      {
        id: 'ann-init-2',
        pageNumber: 1,
        type: 'highlight',
        x: 12,
        y: 28,
        width: 76,
        height: 4,
        color: '#fef08a',
        createdAt: 'Today 10:15 AM',
        author: 'Asset Manager',
      },
      {
        id: 'ann-init-3',
        pageNumber: 1,
        type: 'note',
        x: 82,
        y: 28,
        color: '#38bdf8',
        text: 'Verified 2026 CPI rent escalation clause matches index schedule.',
        author: 'Legal Counsel',
        createdAt: 'Today 11:00 AM',
      },
    ];
  });

  const [activeNote, setActiveNote] = useState<PdfAnnotation | null>(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [textOverlayInput, setTextOverlayInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPenPoints, setCurrentPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentHighlightRect, setCurrentHighlightRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.getItem(`easytenancy_pdf_ann_${fileId}`);
      localStorage.setItem(`easytenancy_pdf_ann_${fileId}`, JSON.stringify(annotations));
    } catch (e) {
      console.warn('Could not save PDF annotations:', e);
    }
  }, [annotations, fileId]);

  // Attempt to render with PDF.js or render synthetic document
  useEffect(() => {
    let isMounted = true;
    const renderPdfPage = async () => {
      setPdfLoading(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        if (fileUrl && fileUrl.endsWith('.pdf')) {
          const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
          const pdfDoc = await loadingTask.promise;
          if (!isMounted) return;
          setNumPages(pdfDoc.numPages);

          const page = await pdfDoc.getPage(currentPage);
          const viewport = page.getViewport({ scale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          }
          setPdfLoading(false);
          return;
        }
      } catch (err) {
        console.warn('PDF.js loading fallback to synthetic vector document canvas:', err);
      }

      // Synthetic render fallback for mock PDF files
      if (isMounted) {
        renderSyntheticDocumentPage(canvas, currentPage, scale, fileName, propertyName, category);
        setPdfLoading(false);
      }
    };

    renderPdfPage();
    return () => { isMounted = false; };
  }, [currentPage, scale, fileUrl, fileName, propertyName, category]);

  // Draw overlay annotations canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match base canvas
    const baseCanvas = canvasRef.current;
    if (baseCanvas) {
      canvas.width = baseCanvas.width;
      canvas.height = baseCanvas.height;
    } else {
      canvas.width = 750 * scale;
      canvas.height = 980 * scale;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnns = annotations.filter(a => a.pageNumber === currentPage);

    pageAnns.forEach(ann => {
      const pxX = (ann.x / 100) * canvas.width;
      const pxY = (ann.y / 100) * canvas.height;

      if (ann.type === 'highlight' && ann.width && ann.height) {
        const pxW = (ann.width / 100) * canvas.width;
        const pxH = (ann.height / 100) * canvas.height;
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = 0.38;
        ctx.fillRect(pxX, pxY, pxW, pxH);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(pxX, pxY, pxW, pxH);
      } else if (ann.type === 'pen' && ann.points && ann.points.length > 0) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ann.points.forEach((pt, idx) => {
          const ptX = (pt.x / 100) * canvas.width;
          const ptY = (pt.y / 100) * canvas.height;
          if (idx === 0) ctx.moveTo(ptX, ptY);
          else ctx.lineTo(ptX, ptY);
        });
        ctx.stroke();
      } else if (ann.type === 'stamp' && ann.stampText) {
        ctx.save();
        ctx.translate(pxX, pxY);
        ctx.rotate(-0.08);
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 3;
        ctx.fillStyle = `${ann.color}15`;
        ctx.fillRect(-10, -18, 180, 36);
        ctx.strokeRect(-10, -18, 180, 36);
        ctx.fillStyle = ann.color;
        ctx.font = `bold ${Math.round(14 * scale)}px sans-serif`;
        ctx.fillText(ann.stampText, 0, 6);
        ctx.restore();
      } else if (ann.type === 'text' && ann.text) {
        ctx.fillStyle = ann.color;
        ctx.font = `600 ${Math.round(13 * scale)}px sans-serif`;
        ctx.fillText(ann.text, pxX, pxY);
      }
    });

    // Render active highlight box while dragging
    if (currentHighlightRect) {
      const pxX = (currentHighlightRect.x / 100) * canvas.width;
      const pxY = (currentHighlightRect.y / 100) * canvas.height;
      const pxW = (currentHighlightRect.w / 100) * canvas.width;
      const pxH = (currentHighlightRect.h / 100) * canvas.height;
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(pxX, pxY, pxW, pxH);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(pxX, pxY, pxW, pxH);
    }

    // Render active freehand pen line while drawing
    if (isDrawing && currentPenPoints.length > 0) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      currentPenPoints.forEach((pt, idx) => {
        const ptX = (pt.x / 100) * canvas.width;
        const ptY = (pt.y / 100) * canvas.height;
        if (idx === 0) ctx.moveTo(ptX, ptY);
        else ctx.lineTo(ptX, ptY);
      });
      ctx.stroke();
    }
  }, [annotations, currentPage, scale, currentHighlightRect, isDrawing, currentPenPoints, selectedColor]);

  // Handle Canvas Mouse Interaction
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);

    if (activeTool === 'highlight') {
      setDragStart(coords);
      setCurrentHighlightRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
    } else if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentPenPoints([coords]);
    } else if (activeTool === 'note') {
      const newNote: PdfAnnotation = {
        id: `note-${Date.now()}`,
        pageNumber: currentPage,
        type: 'note',
        x: coords.x,
        y: coords.y,
        color: selectedColor === '#fef08a' ? '#38bdf8' : selectedColor,
        text: '',
        author: 'Asset Manager',
        createdAt: 'Just now',
      };
      setAnnotations(prev => [...prev, newNote]);
      setActiveNote(newNote);
      setNoteInputText('');
    } else if (activeTool === 'stamp') {
      const newStamp: PdfAnnotation = {
        id: `stamp-${Date.now()}`,
        pageNumber: currentPage,
        type: 'stamp',
        x: coords.x,
        y: coords.y,
        color: selectedColor === '#fef08a' ? '#22c55e' : selectedColor,
        stampText: selectedStamp,
        author: 'Compliance Auditor',
        createdAt: 'Just now',
      };
      setAnnotations(prev => [...prev, newStamp]);
    } else if (activeTool === 'text') {
      const val = prompt('Enter document callout text:');
      if (val && val.trim()) {
        const newText: PdfAnnotation = {
          id: `text-${Date.now()}`,
          pageNumber: currentPage,
          type: 'text',
          x: coords.x,
          y: coords.y,
          color: selectedColor === '#fef08a' ? '#f87171' : selectedColor,
          text: val.trim(),
          author: 'Compliance Manager',
          createdAt: 'Just now',
        };
        setAnnotations(prev => [...prev, newText]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);

    if (activeTool === 'highlight' && dragStart) {
      const x = Math.min(dragStart.x, coords.x);
      const y = Math.min(dragStart.y, coords.y);
      const w = Math.abs(coords.x - dragStart.x);
      const h = Math.abs(coords.y - dragStart.y);
      setCurrentHighlightRect({ x, y, w, h });
    } else if (activeTool === 'pen' && isDrawing) {
      setCurrentPenPoints(prev => [...prev, coords]);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'highlight' && currentHighlightRect && dragStart) {
      if (currentHighlightRect.w > 1 && currentHighlightRect.h > 1) {
        const newHighlight: PdfAnnotation = {
          id: `hl-${Date.now()}`,
          pageNumber: currentPage,
          type: 'highlight',
          x: currentHighlightRect.x,
          y: currentHighlightRect.y,
          width: currentHighlightRect.w,
          height: currentHighlightRect.h,
          color: selectedColor,
          author: 'Compliance Reviewer',
          createdAt: 'Just now',
        };
        setAnnotations(prev => [...prev, newHighlight]);
      }
      setDragStart(null);
      setCurrentHighlightRect(null);
    } else if (activeTool === 'pen' && isDrawing) {
      if (currentPenPoints.length > 2) {
        const newPen: PdfAnnotation = {
          id: `pen-${Date.now()}`,
          pageNumber: currentPage,
          type: 'pen',
          x: currentPenPoints[0].x,
          y: currentPenPoints[0].y,
          color: selectedColor,
          points: currentPenPoints,
          author: 'Auditor',
          createdAt: 'Just now',
        };
        setAnnotations(prev => [...prev, newPen]);
      }
      setIsDrawing(false);
      setCurrentPenPoints([]);
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const handleSaveNoteContent = () => {
    if (!activeNote) return;
    setAnnotations(prev =>
      prev.map(a => (a.id === activeNote.id ? { ...a, text: noteInputText } : a))
    );
    setActiveNote(null);
  };

  const handleSaveAll = () => {
    try {
      localStorage.setItem(`easytenancy_pdf_ann_${fileId}`, JSON.stringify(annotations));
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 2500);
    } catch (e) {
      console.warn('Failed to save annotations:', e);
    }
  };

  const handleClearPageAnnotations = () => {
    if (confirm(`Remove all notes and highlights on Page ${currentPage}?`)) {
      setAnnotations(prev => prev.filter(a => a.pageNumber !== currentPage));
    }
  };

  const currentPageAnns = annotations.filter(a => a.pageNumber === currentPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* ── PDF Toolbar Header ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: 12,
        padding: '10px 16px',
        color: '#f1f5f9',
      }}>
        {/* Page & Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                background: 'none', border: 'none', color: currentPage <= 1 ? '#475569' : '#38bdf8',
                padding: '4px 10px', borderRadius: 6, cursor: currentPage <= 1 ? 'default' : 'pointer', fontWeight: 700
              }}
            >
              ◄
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px', color: '#f1f5f9' }}>
              Page {currentPage} of {numPages}
            </span>
            <button
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              style={{
                background: 'none', border: 'none', color: currentPage >= numPages ? '#475569' : '#38bdf8',
                padding: '4px 10px', borderRadius: 6, cursor: currentPage >= numPages ? 'default' : 'pointer', fontWeight: 700
              }}
            >
              ►
            </button>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => setScale(s => Math.max(0.75, s - 0.15))}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}
            >
              ➖
            </button>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '0 6px', color: '#38bdf8' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(1.75, s + 0.15))}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}
            >
              ➕
            </button>
          </div>
        </div>

        {/* Tools Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'select', label: '👆 Select', desc: 'Inspect' },
            { id: 'highlight', label: '🟡 Highlight', desc: 'Text Marker' },
            { id: 'note', label: '📝 Note', desc: 'Sticky Comment' },
            { id: 'pen', label: '✏️ Pen', desc: 'Freehand' },
            { id: 'text', label: '🔤 Text', desc: 'Type Callout' },
            { id: 'stamp', label: '🔖 Stamp', desc: 'Compliance' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              title={t.desc}
              style={{
                background: activeTool === t.id ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)',
                color: activeTool === t.id ? '#38bdf8' : '#94a3b8',
                border: activeTool === t.id ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.1)',
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: activeTool === t.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Color Palette & Stamp Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeTool === 'stamp' ? (
            <select
              value={selectedStamp}
              onChange={e => setSelectedStamp(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(56,189,248,0.4)',
                color: '#38bdf8',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <option value="APPROVED">✓ APPROVED</option>
              <option value="VERIFIED COMPLIANT">🛡️ VERIFIED COMPLIANT</option>
              <option value="CONFIDENTIAL">🔒 CONFIDENTIAL</option>
              <option value="NEEDS REVISION">⚠️ NEEDS REVISION</option>
              <option value="AUDITED 2026">📋 AUDITED 2026</option>
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[
                { hex: '#fef08a', name: 'Yellow' },
                { hex: '#bbf7d0', name: 'Green' },
                { hex: '#bfdbfe', name: 'Blue' },
                { hex: '#fbcfe8', name: 'Pink' },
                { hex: '#fca5a5', name: 'Red' },
              ].map(c => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.name}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: c.hex,
                    border: selectedColor === c.hex ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    boxShadow: selectedColor === c.hex ? '0 0 8px ' + c.hex : 'none',
                  }}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSidebar(s => !s)}
            style={{
              background: showSidebar ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
              color: showSidebar ? '#a78bfa' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Notes ({annotations.length})
          </button>
        </div>
      </div>

      {/* ── Action & Save Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '0 4px' }}>
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Active Tool:</span>
          <strong style={{ color: '#38bdf8', textTransform: 'capitalize' }}>{activeTool}</strong>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            ({activeTool === 'highlight' ? 'Click & drag box over text' :
              activeTool === 'note' ? 'Click anywhere to drop sticky note' :
              activeTool === 'pen' ? 'Draw freehand markups' :
              activeTool === 'text' ? 'Click to insert custom text' :
              activeTool === 'stamp' ? 'Click to apply compliance seal' : 'Inspect annotations'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {savedSuccessMsg && (
            <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              ✓ Annotations Saved!
            </span>
          )}
          <button
            onClick={handleClearPageAnnotations}
            style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Clear Page
          </button>
          <button
            onClick={handleSaveAll}
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: '#0f172a',
              border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}
          >
            💾 Save Annotations
          </button>
        </div>
      </div>

      {/* ── Main Canvas & Sidebar Container ── */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 520, position: 'relative' }}>
        {/* PDF Page Viewport */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            background: '#090d16',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {pdfLoading && (
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 30, background: 'rgba(0,0,0,0.7)', color: '#38bdf8', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              Rendering Document Page...
            </div>
          )}

          <div
            style={{ position: 'relative', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Base Document Canvas */}
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 6 }} />

            {/* Overlay Interactive Annotations Canvas */}
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                cursor: activeTool === 'highlight' ? 'crosshair' : activeTool === 'pen' ? 'pencil' : activeTool === 'note' ? 'copy' : 'default',
                pointerEvents: 'auto',
              }}
            />

            {/* Render Interactive Sticky Note Pins & Badges */}
            {currentPageAnns.map(ann => {
              if (ann.type === 'note') {
                return (
                  <div
                    key={ann.id}
                    onClick={e => {
                      e.stopPropagation();
                      setActiveNote(ann);
                      setNoteInputText(ann.text || '');
                    }}
                    title={`${ann.author}: ${ann.text || 'Click to edit note'}`}
                    style={{
                      position: 'absolute',
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: 'translate(-50%, -50%)',
                      background: ann.color,
                      color: '#0f172a',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      cursor: 'pointer',
                      zIndex: 20,
                      border: '2px solid #ffffff',
                    }}
                  >
                    📝
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* ── Sticky Note Modal/Popover ── */}
        {activeNote && (
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              borderRadius: 14,
              padding: 18,
              width: 320,
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                📝 Note by {activeNote.author || 'User'}
              </strong>
              <button
                onClick={() => setActiveNote(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <textarea
              value={noteInputText}
              onChange={e => setNoteInputText(e.target.value)}
              placeholder="Type compliance note or audit comment..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '8px 10px',
                color: '#f1f5f9',
                fontSize: 12,
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button
                onClick={() => handleDeleteAnnotation(activeNote.id)}
                style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={handleSaveNoteContent}
                style={{
                  background: '#38bdf8', color: '#0f172a', border: 'none',
                  borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Save Comment
              </button>
            </div>
          </div>
        )}

        {/* ── Annotations List Sidebar ── */}
        {showSidebar && (
          <div
            style={{
              width: 260,
              background: 'rgba(15, 23, 42, 0.95)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
              maxHeight: 600,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                Document Annotations
              </h4>
              <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>
                {annotations.length} Total
              </span>
            </div>

            {annotations.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '30px 10px' }}>
                No annotations added yet. Select a tool above and click or drag on the document.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {annotations.map(ann => (
                  <div
                    key={ann.id}
                    onClick={() => setCurrentPage(ann.pageNumber)}
                    style={{
                      background: ann.pageNumber === currentPage ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                      border: ann.pageNumber === currentPage ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: ann.type === 'highlight' ? '#fef08a' : ann.type === 'note' ? '#38bdf8' : ann.type === 'stamp' ? '#4ade80' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {ann.type === 'highlight' ? '🟡 Highlight' : ann.type === 'note' ? '📝 Note' : ann.type === 'stamp' ? '🔖 Stamp' : '✏️ Markup'}
                      </span>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Pg {ann.pageNumber}</span>
                    </div>

                    {ann.text && (
                      <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 2, fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{ann.text}"
                      </div>
                    )}

                    {ann.stampText && (
                      <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                        [{ann.stampText}]
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 10, color: '#64748b' }}>
                      <span>{ann.author || 'User'}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteAnnotation(ann.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Synthetic Vector Document Page Generator ──────────────────
function renderSyntheticDocumentPage(
  canvas: HTMLCanvasElement,
  page: number,
  scale: number,
  title: string,
  property?: string,
  category?: string
) {
  const baseWidth = 720;
  const baseHeight = 940;

  canvas.width = baseWidth * scale;
  canvas.height = baseHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);

  // Background Paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Document Watermark / Header line
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, 40, baseWidth - 80, 4);

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(title || 'MASTER LEASE & COMPLIANCE DOCUMENT', 40, 85);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText(`PROPERTY: ${property || 'Sovereign Tower A'} | CATEGORY: ${category || 'LEASE'} | PAGE ${page} OF 3`, 40, 108);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 125);
  ctx.lineTo(baseWidth - 40, 125);
  ctx.stroke();

  // Page specific content
  if (page === 1) {
    drawSectionHeading(ctx, '1. PARTIES AND PREMISES', 40, 160);
    drawParagraph(ctx, [
      'This Master Agreement is entered into on this 1st day of August 2026, by and between EasyTenancy Sovereign Asset Management Ltd ("Landlord") and the registered commercial tenant ("Tenant").',
      'The Landlord hereby demises and leases unto the Tenant the real property located at Sovereign Tower Suite 400, consisting of 12,400 sq.ft. of prime Grade-A commercial office space.',
    ], 40, 185);

    drawSectionHeading(ctx, '2. RENT OBLIGATIONS AND INDEXATION', 40, 280);
    drawParagraph(ctx, [
      'The initial monthly base rent shall be $24,500.00 USD, payable in advance on the first day of each calendar month.',
      'Annual escalations shall strictly follow the Consumer Price Index (CPI) plus 2.5% minimum floor rate, evaluated annually on September 1st.',
    ], 40, 305);

    drawSectionHeading(ctx, '3. STATUTORY COMPLIANCE & SAFETY AUDIT', 40, 400);
    drawParagraph(ctx, [
      'The Tenant shall maintain full adherence to regional fire safety codes, environmental compliance standards, and quarterly HVAC inspection certifications.',
    ], 40, 425);

    // Mock Stamp Seal Box
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 520, baseWidth - 80, 120);
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(41, 521, baseWidth - 82, 118);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LEGAL & ASSET MANAGEMENT COMPLIANCE STAMP', 60, 550);
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText('Document ID: SHA256-88F9210C4B | Verified via Google Cloud Storage Encrypted Vault', 60, 575);
    ctx.fillText('Authorized Signatory: EasyTenancy Asset Governance Committee', 60, 600);
  } else if (page === 2) {
    drawSectionHeading(ctx, '4. MAINTENANCE RESPONSIBILITIES & SLA', 40, 160);
    drawParagraph(ctx, [
      'Emergency response response times for critical building infrastructure (HVAC failure, plumbing leakage, power disruption) are set at 2 hours maximum.',
    ], 40, 185);

    drawSectionHeading(ctx, '5. INSURANCE & INDEMNIFICATION', 40, 270);
    drawParagraph(ctx, [
      'Tenant shall maintain commercial general liability insurance with limits not less than $5,000,000 per occurrence, naming Landlord as additional insured.',
    ], 40, 295);
  } else {
    drawSectionHeading(ctx, '6. EXECUTION AND SIGNATURE PAGE', 40, 160);
    drawParagraph(ctx, [
      'IN WITNESS WHEREOF, the parties hereto have executed this Agreement under seal as of the date first written above.',
    ], 40, 185);

    // Signature line placeholders
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(60, 320);
    ctx.lineTo(300, 320);
    ctx.moveTo(380, 320);
    ctx.lineTo(620, 320);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '12px sans-serif';
    ctx.fillText('LANDLORD AUTHORIZED REPRESENTATIVE', 60, 340);
    ctx.fillText('TENANT AUTHORIZED SIGNATORY', 380, 340);
  }

  // Footer Page Number
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`EasyTenancy Portfolio Management System — Page ${page}`, 40, baseHeight - 30);

  ctx.restore();
}

function drawSectionHeading(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(text, x, y);
}

function drawParagraph(ctx: CanvasRenderingContext2D, lines: string[], x: number, startY: number) {
  ctx.fillStyle = '#334155';
  ctx.font = '13px/1.5 Georgia, serif';
  let curY = startY;
  lines.forEach(line => {
    ctx.fillText(line, x, curY);
    curY += 22;
  });
}
