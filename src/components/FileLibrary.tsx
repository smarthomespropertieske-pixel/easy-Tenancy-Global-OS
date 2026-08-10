import React, { useState, useEffect } from 'react';
import { googlePickerService, type GooglePickerFile, formatBytes, getFriendlyFileType } from '../lib/GooglePickerService';
import { exportToCSV } from '../lib/exportCsv';
import PdfAnnotationViewer from './PdfAnnotationViewer';

interface FileLibraryProps {
  tenantName?: string;
  onFileAdded?: (file: GooglePickerFile) => void;
}

// Initial mock dataset for a realistic property management portfolio
const INITIAL_DEMO_FILES: GooglePickerFile[] = [
  {
    id: 'gdrive-doc-101',
    name: 'Master_Lease_Agreement_2026_Sovereign_Tower.pdf',
    url: 'https://drive.google.com',
    mimeType: 'application/pdf',
    sizeBytes: 3458000, // 3.3 MB
    uploadDate: 'Aug 2, 2026',
    importedAt: '10:15 AM',
    propertyName: 'Sovereign Tower A',
    category: 'Lease',
  },
  {
    id: 'gdrive-doc-102',
    name: 'Fire_Safety_Compliance_Audit_Q3.pdf',
    url: 'https://drive.google.com',
    mimeType: 'application/pdf',
    sizeBytes: 1820000, // 1.7 MB
    uploadDate: 'Aug 5, 2026',
    importedAt: '02:40 PM',
    propertyName: 'Apex Commercial Plaza',
    category: 'Compliance',
  },
  {
    id: 'gdrive-doc-103',
    name: 'Tenant_Rent_Roll_Statement_July_2026.xlsx',
    url: 'https://drive.google.com',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 840000, // 820 KB
    uploadDate: 'Aug 6, 2026',
    importedAt: '09:05 AM',
    propertyName: 'Grandview Residences',
    category: 'Financial',
  },
  {
    id: 'gdrive-doc-104',
    name: 'HVAC_System_Inspection_Report.docx',
    url: 'https://drive.google.com',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 1250000, // 1.2 MB
    uploadDate: 'Aug 7, 2026',
    importedAt: '11:20 AM',
    propertyName: 'Sovereign Tower A',
    category: 'Maintenance',
  },
  {
    id: 'gdrive-doc-105',
    name: 'Tenant_Identity_Verification_Passports.pdf',
    url: 'https://drive.google.com',
    mimeType: 'application/pdf',
    sizeBytes: 2400000, // 2.3 MB
    uploadDate: 'Aug 7, 2026',
    importedAt: '11:45 AM',
    propertyName: 'Apex Commercial Plaza',
    category: 'ID & KYC',
  },
];

const STORAGE_KEY = 'easytenancy_file_library_docs';

export default function FileLibrary({ tenantName = 'Portfolio', onFileAdded }: FileLibraryProps) {
  const [files, setFiles] = useState<GooglePickerFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved file library items:', e);
    }
    return INITIAL_DEMO_FILES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [previewFile, setPreviewFile] = useState<GooglePickerFile | null>(null);
  const [previewTab, setPreviewTab] = useState<'annotate' | 'metadata'>('annotate');
  const [previewCopied, setPreviewCopied] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Could not save files to localStorage:', e);
    }
  }, [files]);

  const handleLaunchPicker = async () => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      await googlePickerService.launchPicker({
        title: 'Select Document from Google Drive',
        onSelect: (newFile) => {
          setFiles((prev) => [newFile, ...prev]);
          setImportStatus({
            type: 'success',
            message: `Successfully imported "${newFile.name}" from Google Drive!`,
          });
          setIsImporting(false);
          if (onFileAdded) onFileAdded(newFile);
        },
        onCancel: () => {
          setIsImporting(false);
        },
        onError: (err) => {
          console.error('File Picker Error:', err);
          setImportStatus({
            type: 'error',
            message: err?.message || 'Failed to open Google Drive file picker.',
          });
          setIsImporting(false);
        },
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err?.message || 'Could not launch Google Drive picker.',
      });
      setIsImporting(false);
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedFileIds((prev) => prev.filter((fileId) => fileId !== id));
  };

  const handleResetDefaults = () => {
    setFiles(INITIAL_DEMO_FILES);
    setSelectedFileIds([]);
    setImportStatus({ type: 'success', message: 'Reset library to standard property document templates.' });
  };

  // Filtered list
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.propertyName && file.propertyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.category && file.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || file.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Bulk Selection Helpers
  const isAllFilteredSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.includes(f.id));
  const isSomeFilteredSelected = filteredFiles.some((f) => selectedFileIds.includes(f.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredFiles.map((f) => f.id));
      setSelectedFileIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedFileIds, ...filteredFiles.map((f) => f.id)]));
      setSelectedFileIds(newIds);
    }
  };

  const handleToggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    const count = selectedFileIds.length;
    if (count === 0) return;
    setFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
    setSelectedFileIds([]);
    setImportStatus({
      type: 'success',
      message: `Successfully deleted ${count} selected document${count > 1 ? 's' : ''} from vault.`,
    });
  };

  const handleBatchShare = () => {
    if (selectedFileIds.length === 0) return;
    setShareModalOpen(true);
    setShareCopied(false);
  };

  const handleCopyShareLink = () => {
    const selectedFilesList = files.filter((f) => selectedFileIds.includes(f.id));
    const links = selectedFilesList.map((f) => `${f.name}: ${f.url}`).join('\n');
    navigator.clipboard?.writeText(links);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExportCSV = (exportAll: boolean = false) => {
    const targetList = exportAll ? files : (filteredFiles.length > 0 ? filteredFiles : files);
    if (targetList.length === 0) {
      setImportStatus({ type: 'error', message: 'No documents available to export.' });
      setExportMenuOpen(false);
      return;
    }

    const exportData = targetList.map((file) => ({
      name: file.name,
      category: file.category || 'General',
      type: getFriendlyFileType(file.mimeType, file.name),
      size: formatBytes(file.sizeBytes),
      date: file.uploadDate || 'Aug 7, 2026',
      property: file.propertyName || 'Portfolio-wide',
      driveUrl: file.url,
      fileId: file.id,
    }));

    const cleanTenantName = tenantName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const modeTag = exportAll ? 'ALL_DOCUMENTS' : 'FILTERED_VIEW';
    const filename = `Document_Vault_${cleanTenantName}_${modeTag}_${dateStr}.csv`;

    exportToCSV(filename, exportData, [
      { key: 'name', label: 'Document Name' },
      { key: 'category', label: 'Category' },
      { key: 'type', label: 'Document Type' },
      { key: 'size', label: 'File Size' },
      { key: 'date', label: 'Upload / Import Date' },
      { key: 'property', label: 'Property Portfolio' },
      { key: 'driveUrl', label: 'Google Drive Link' },
      { key: 'fileId', label: 'File ID' },
    ]);

    setImportStatus({
      type: 'success',
      message: exportAll
        ? `Comprehensive Export Complete: Downloaded metadata for all ${exportData.length} indexed documents to ${filename}`
        : `View Export Complete: Exported ${exportData.length} document metadata record${exportData.length > 1 ? 's' : ''} to ${filename}`,
    });

    setExportMenuOpen(false);
  };

  const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));
  const selectedTotalBytes = selectedFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  const categories = ['All', 'Lease', 'Compliance', 'Financial', 'ID & KYC', 'Maintenance', 'Other'];

  const categoryBadgeColor = (cat?: string) => {
    switch (cat) {
      case 'Lease': return '#39bff6';
      case 'Compliance': return '#10b981';
      case 'Financial': return '#f59e0b';
      case 'ID & KYC': return '#a78bfa';
      case 'Maintenance': return '#ec4899';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* ── Top Header & KPI Banner ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Total Documents</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#39bff6', marginTop: 4 }}>{files.length} Files</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{tenantName} Cloud Storage</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Total Vault Storage</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{formatBytes(totalSizeBytes)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Synchronized via Google Drive</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Integration Status</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#a78bfa', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Google Picker API Ready
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>OAuth Client Connected</div>
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search documents, properties, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f1f5f9',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>🔍</span>
          </div>

          {/* Category Dropdown/Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#f1f5f9',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleLaunchPicker}
            disabled={isImporting}
            id="google-drive-import-btn"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: isImporting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              opacity: isImporting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <svg viewBox="0 0 48 48" width="18" height="18">
              <path fill="#FFC107" d="M17 7L8 22H27L36 7H17Z" />
              <path fill="#1976D2" d="M8 22L17.5 38.5L37 38.5L27.5 22H8Z" />
              <path fill="#4CAF50" d="M37 38.5L46.5 22L37 5.5L27.5 22L37 38.5Z" />
            </svg>
            {isImporting ? 'Connecting Drive...' : 'Import from Google Drive'}
          </button>

          {/* Export CSV Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportMenuOpen((prev) => !prev)}
              id="export-csv-btn"
              title="Export document metadata to CSV file"
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              📊 Export CSV <span style={{ fontSize: 10, opacity: 0.8 }}>▼</span>
            </button>

            {exportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 1000,
                  background: '#0f172a',
                  border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: 12,
                  padding: 8,
                  width: 250,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 15px rgba(16,185,129,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <button
                  onClick={() => handleExportCSV(false)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    color: '#f1f5f9',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <div style={{ fontWeight: 600, color: '#10b981' }}>Export Active View ({filteredFiles.length})</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Export currently filtered document list</div>
                </button>

                <button
                  onClick={() => handleExportCSV(true)}
                  id="export-all-csv-btn"
                  style={{
                    background: 'rgba(57,191,246,0.1)',
                    color: '#f1f5f9',
                    border: '1px solid rgba(57,191,246,0.25)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(57,191,246,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(57,191,246,0.1)')}
                >
                  <div style={{ fontWeight: 700, color: '#39bff6', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚡ Export All Documents ({files.length})
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Full portfolio report ignoring page filters</div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleResetDefaults}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* ── Status Banner ── */}
      {importStatus && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            background: importStatus.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${importStatus.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: importStatus.type === 'success' ? '#10b981' : '#f87171',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{importStatus.message}</span>
          <button
            onClick={() => setImportStatus(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Metadata File Table / List ── */}
      <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Document Vault Metadata</h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>Showing {filteredFiles.length} of {files.length} documents</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 6px 0' }}>No documents found</p>
            <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search criteria or import new documents from Google Drive.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 }}>
                  <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeFilteredSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#39bff6' }}
                      title="Select all filtered documents"
                    />
                  </th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Document Name</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>File Size</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Upload / Import Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Property</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => {
                  const categoryColor = categoryBadgeColor(file.category);
                  const friendlyType = getFriendlyFileType(file.mimeType, file.name);
                  const isSelected = selectedFileIds.includes(file.id);

                  return (
                    <tr
                      key={file.id + idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(57,191,246,0.08)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Checkbox Column */}
                      <td style={{ padding: '14px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectFile(file.id)}
                          style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#39bff6' }}
                        />
                      </td>

                      {/* Document Name */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: 'rgba(57,191,246,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0
                          }}>
                            {friendlyType.includes('PDF') ? '📄' : friendlyType.includes('Spreadsheet') ? '📊' : friendlyType.includes('Word') ? '📝' : '📁'}
                          </div>
                          <div>
                            <div 
                              onClick={() => setPreviewFile(file)}
                              title="Click to preview & view file details"
                              style={{ 
                                fontWeight: 600, 
                                color: '#f1f5f9', 
                                wordBreak: 'break-word', 
                                maxWidth: 280,
                                cursor: 'pointer',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#39bff6')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#f1f5f9')}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>ID: {file.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: `${categoryColor}18`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}40`,
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.category || 'General'}
                        </span>
                      </td>

                      {/* File Type */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {friendlyType}
                      </td>

                      {/* File Size */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: 600, color: '#39bff6', whiteSpace: 'nowrap' }}>
                        {formatBytes(file.sizeBytes)}
                      </td>

                      {/* Upload / Import Date */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        <div>{file.uploadDate || 'Aug 7, 2026'}</div>
                        {file.importedAt && <div style={{ fontSize: 11, color: '#64748b' }}>{file.importedAt}</div>}
                      </td>

                      {/* Property */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {file.propertyName || 'Portfolio-wide'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setPreviewFile(file)}
                            title="Expand and preview document details"
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.08)',
                              color: '#f1f5f9',
                              border: '1px solid rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            🔍 Expand
                          </button>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: 'rgba(57,191,246,0.12)',
                              color: '#39bff6',
                              border: '1px solid rgba(57,191,246,0.3)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            Open Drive ↗
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            title="Remove file from library"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              background: 'rgba(239,68,68,0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.25)',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Floating Batch Toolbar ── */}
      {selectedFileIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#0f172a',
          border: '1px solid rgba(57,191,246,0.4)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.7), 0 0 20px rgba(57,191,246,0.25)',
          borderRadius: 16,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          backdropFilter: 'blur(16px)',
          color: '#f1f5f9',
          animation: 'fadeInUp 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#39bff6',
              color: '#0f172a',
              fontWeight: 700,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}>
              {selectedFileIds.length}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Combined size: {formatBytes(selectedTotalBytes)}
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleBatchShare}
              style={{
                background: 'rgba(57,191,246,0.18)',
                color: '#39bff6',
                border: '1px solid rgba(57,191,246,0.4)',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              🔗 Share Package ({selectedFileIds.length})
            </button>

            <button
              onClick={handleBatchDelete}
              style={{
                background: 'rgba(239,68,68,0.18)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.4)',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              🗑️ Delete Selected ({selectedFileIds.length})
            </button>

            <button
              onClick={() => setSelectedFileIds([])}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Multi-File Share Modal ── */}
      {shareModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(57,191,246,0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            color: '#f1f5f9',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
                Share Document Package
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0' }}>
              Sharing <strong>{selectedFiles.length} documents</strong> ({formatBytes(selectedTotalBytes)}) from {tenantName} vault.
            </p>

            <div style={{
              maxHeight: 200,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {selectedFiles.map((file) => (
                <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                    {file.name}
                  </span>
                  <span style={{ color: '#39bff6' }}>{formatBytes(file.sizeBytes)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCopyShareLink}
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {shareCopied ? '✓ Drive Links Copied!' : 'Copy Share Links'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Expand / Preview Modal ── */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(57,191,246,0.4)',
            borderRadius: 20,
            padding: '24px 28px',
            maxWidth: 1040,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(57,191,246,0.2)',
            color: '#f1f5f9',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: `${categoryBadgeColor(previewFile.category)}20`,
                  color: categoryBadgeColor(previewFile.category),
                  border: `1px solid ${categoryBadgeColor(previewFile.category)}50`,
                  display: 'inline-block',
                  marginBottom: 8
                }}>
                  {previewFile.category || 'Document'}
                </span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {previewFile.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs: Annotate vs Metadata */}
            <div style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: 12,
              marginBottom: 20,
            }}>
              <button
                onClick={() => setPreviewTab('annotate')}
                style={{
                  background: previewTab === 'annotate' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                  color: previewTab === 'annotate' ? '#38bdf8' : '#94a3b8',
                  border: previewTab === 'annotate' ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>✏️</span> PDF Annotation & Markup Layer
              </button>
              <button
                onClick={() => setPreviewTab('metadata')}
                style={{
                  background: previewTab === 'metadata' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                  color: previewTab === 'metadata' ? '#38bdf8' : '#94a3b8',
                  border: previewTab === 'metadata' ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📊</span> File Metadata & Google Drive Details
              </button>
            </div>

            {/* TAB 1: PDF Annotation & Markup Layer */}
            {previewTab === 'annotate' && (
              <div style={{ marginBottom: 20 }}>
                <PdfAnnotationViewer
                  fileId={previewFile.id}
                  fileName={previewFile.name}
                  fileUrl={previewFile.url}
                  mimeType={previewFile.mimeType}
                  propertyName={previewFile.propertyName}
                  category={previewFile.category}
                  onClose={() => setPreviewFile(null)}
                />
              </div>
            )}

            {/* TAB 2: Metadata & Specifications */}
            {previewTab === 'metadata' && (
              <>
                {/* Document Graphic / Preview Area */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
                  border: '1px dashed rgba(57,191,246,0.3)',
                  borderRadius: 14,
                  padding: '24px 20px',
                  textAlign: 'center',
                  marginBottom: 24,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {getFriendlyFileType(previewFile.mimeType, previewFile.name).includes('PDF') ? '📄' :
                     getFriendlyFileType(previewFile.mimeType, previewFile.name).includes('Spreadsheet') ? '📊' :
                     getFriendlyFileType(previewFile.mimeType, previewFile.name).includes('Word') ? '📝' : '📁'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#39bff6', marginBottom: 4 }}>
                    {getFriendlyFileType(previewFile.mimeType, previewFile.name)} Preview
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 420, margin: '0 auto 16px auto' }}>
                    Encrypted property compliance document synced with Google Drive Cloud Storage.
                  </div>
                  
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
                    }}
                  >
                    Launch Drive Viewer ↗
                  </a>
                </div>

                {/* Metadata Table Grid */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '16px 20px',
                  marginBottom: 24
                }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', fontWeight: 700 }}>
                    File Metadata & Specifications
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px 20px', fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>File Size</span>
                      <strong style={{ color: '#39bff6', fontWeight: 600 }}>{formatBytes(previewFile.sizeBytes)}</strong>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>MIME Type</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{previewFile.mimeType}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>Google Drive ID</span>
                      <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: 12 }}>{previewFile.id}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>Upload / Modified Date</span>
                      <span style={{ color: '#cbd5e1' }}>{previewFile.uploadDate || 'Aug 7, 2026'} {previewFile.importedAt ? `(${previewFile.importedAt})` : ''}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>Property Portfolio</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{previewFile.propertyName || 'Portfolio-wide'}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, marginBottom: 2 }}>Category</span>
                      <span style={{ color: categoryBadgeColor(previewFile.category), fontWeight: 600 }}>{previewFile.category || 'General'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  handleDeleteFile(previewFile.id);
                  setPreviewFile(null);
                }}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🗑️ Remove File
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(previewFile.url);
                    setPreviewCopied(true);
                    setTimeout(() => setPreviewCopied(false), 2500);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#f1f5f9',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '9px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {previewCopied ? '✓ URL Copied!' : '📋 Copy URL'}
                </button>

                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
