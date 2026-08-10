import React, { useState } from 'react';
import { googlePickerService, type GooglePickerFile } from '../lib/GooglePickerService';

export default function GooglePickerButton() {
  const [pickedFile, setPickedFile] = useState<GooglePickerFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenPicker = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await googlePickerService.launchPicker({
        title: 'Select Property Document or Lease',
        onSelect: (file) => {
          setPickedFile(file);
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
        onError: (err) => {
          console.error('Picker error:', err);
          setErrorMsg(err?.message || 'Failed to open Google Drive picker.');
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not launch Google Picker.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: 'rgba(57,191,246,0.1)', borderRadius: '12px', border: '1px solid rgba(57,191,246,0.3)', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '15px', color: '#f1f5f9', marginBottom: '10px', fontWeight: 600 }}>Import Property Documents</h3>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
        Securely import leases, IDs, title deeds, and compliance certificates directly from Google Drive.
      </p>
      
      <button 
        id="google-picker-btn"
        onClick={handleOpenPicker}
        disabled={isLoading}
        style={{
          background: '#fff',
          color: '#334155',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        <svg viewBox="0 0 48 48" width="16" height="16">
          <path fill="#FFC107" d="M17 7L8 22H27L36 7H17Z" />
          <path fill="#1976D2" d="M8 22L17.5 38.5L37 38.5L27.5 22H8Z" />
          <path fill="#4CAF50" d="M37 38.5L46.5 22L37 5.5L27.5 22L37 38.5Z" />
        </svg>
        {isLoading ? 'Opening Drive...' : 'Select from Google Drive'}
      </button>

      {errorMsg && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '10px' }}>{errorMsg}</p>
      )}

      {pickedFile && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>✓ Document Imported Successfully</p>
          <p style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>{pickedFile.name}</p>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>File ID: {pickedFile.id} · Type: {pickedFile.mimeType}</p>
          {pickedFile.url && (
            <a 
              href={pickedFile.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '11px', color: '#39bff6', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}
            >
              View Document in Google Drive →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
