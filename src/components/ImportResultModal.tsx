import React from 'react';
import { CSVValidationResult } from '../lib/csvUtils';

interface ImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CSVValidationResult | null;
  onProceed?: () => void;
}

export const ImportResultModal: React.FC<ImportResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onProceed
}) => {
  if (!isOpen || !result) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.98)',
        border: `1px solid ${result.isValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        borderRadius: 18,
        width: '100%',
        maxWidth: 500,
        padding: 28,
        color: '#f1f5f9',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 24 }}>
            {result.isValid ? '✅' : '❌'}
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: 20, 
            fontWeight: 700, 
            color: result.isValid ? '#22c55e' : '#ef4444' 
          }}>
            {result.isValid ? 'Validation Successful' : 'Validation Failed'}
          </h3>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8,
          padding: '16px',
          maxHeight: 250,
          overflowY: 'auto',
          marginBottom: 24,
          fontSize: 14,
          lineHeight: 1.6,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {result.isValid ? (
            <div style={{ color: '#94a3b8' }}>
              The CSV file has passed all validation checks. Required headers and data formats are correct. You can proceed with processing the data.
            </div>
          ) : (
            <div>
              <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 8 }}>
                Found {result.errors.length} error(s):
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#fca5a5' }}>
                {result.errors.map((error, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            {result.isValid ? 'Cancel' : 'Close'}
          </button>
          
          {result.isValid && onProceed && (
            <button
              onClick={onProceed}
              style={{
                background: '#22c55e',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#16a34a'}
              onMouseOut={e => e.currentTarget.style.background = '#22c55e'}
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
