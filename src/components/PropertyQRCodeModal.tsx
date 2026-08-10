import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { type DemoProperty } from '../lib/demoData';

interface PropertyQRCodeModalProps {
  property: DemoProperty | null;
  tenantId: string;
  onClose: () => void;
}

export default function PropertyQRCodeModal({ property, tenantId, onClose }: PropertyQRCodeModalProps) {
  if (!property) return null;

  const [selectedUnit, setSelectedUnit] = useState<string>('All Units');
  const [copied, setCopied] = useState(false);

  // Generate public URL for property / unit
  const baseUrl = window.location.origin;
  const unitQuery = selectedUnit !== 'All Units' ? `?unit=${encodeURIComponent(selectedUnit)}` : '';
  const publicUrl = `${baseUrl}/public/property/${tenantId}/${property.id}${unitQuery}`;

  // Unit list for quick selection
  const unitsList = ['All Units', ...Array.from({ length: Math.min(property.units, 6) }, (_, i) => `Unit ${i + 1}A`)];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPublicView = () => {
    window.open(publicUrl, '_blank');
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById('property-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${property.id}-${selectedUnit.replace(/\s+/g, '_')}-QR.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card"
          style={{
            maxWidth: 480,
            width: '100%',
            borderRadius: 20,
            padding: '24px 28px',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              width: 32,
              height: 32,
              borderRadius: '50%',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              <span>📱</span> Mobile QR Code Passport
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
              {property.name}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>
              Scan with camera to open mobile-optimized tenant portal & details
            </p>
          </div>

          {/* Unit selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
              SELECT UNIT / PASSPORT SCOPE
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {unitsList.map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: selectedUnit === unit ? 700 : 500,
                    background: selectedUnit === unit ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedUnit === unit ? '#38bdf8' : '#94a3b8',
                    border: `1px solid ${selectedUnit === unit ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <QRCodeSVG
              id="property-qr-svg"
              value={publicUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              marginSize={2}
            />
            <div style={{ marginTop: 12, fontSize: 11, color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
              {property.id} • {selectedUnit}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                  color: copied ? '#34d399' : '#f1f5f9',
                  border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Link'}
              </button>

              <button
                onClick={handleDownloadSVG}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer',
                }}
              >
                📥 Download SVG
              </button>
            </div>

            <button
              onClick={handleOpenPublicView}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
              }}
            >
              🌐 Open Mobile Public View →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
