import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  latencyMs?: number;
  docPath: string;
  message: string;
  errorDetails?: string;
  payload?: Record<string, any>;
}

// Custom SVG Icons
function IconDatabase({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconCheckCircle({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconXCircle({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconRefresh({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

function IconShield({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconActivity({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconTrash({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function FirebaseDiagnostic({
  autoRun = false,
  compact = false
}: {
  autoRun?: boolean;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [lastTestDocId, setLastTestDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  const projectId = firebaseConfig.projectId || 'unknown';

  const runWriteTest = async () => {
    setStatus('TESTING');
    const startTime = performance.now();
    const testId = `diag_test_${Date.now()}`;
    const docPath = `properties/${testId}`;

    const testPayload = {
      id: testId,
      title: 'Diagnostic System Test Property',
      location: 'Firestore Validation Suite',
      price: 2500000,
      yieldRate: 7.2,
      occupancy: 100,
      status: 'DIAGNOSTIC_VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedBy: auth.currentUser?.email || 'Anonymous/Diagnostic Engine',
      configVerification: {
        projectId,
        databaseId,
        timestamp: Date.now()
      }
    };

    try {
      // 1. Attempt write to 'properties' collection
      const propRef = doc(db, 'properties', testId);
      await setDoc(propRef, testPayload);

      // 2. Read back document to verify read-after-write consistency
      const snapshot = await getDoc(propRef);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!snapshot.exists()) {
        throw new Error('Write acknowledged by Firestore, but document readback failed.');
      }

      setLastTestDocId(testId);
      setStatus('SUCCESS');

      const successLog: DiagnosticLog = {
        id: testId,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
        latencyMs,
        docPath,
        message: `Successfully wrote & verified document to 'properties' collection in ${latencyMs}ms.`,
        payload: testPayload
      };

      setLogs((prev) => [successLog, ...prev.slice(0, 9)]);
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      setStatus('ERROR');
      const errorMessage = err?.message || String(err);

      const errorLog: DiagnosticLog = {
        id: testId,
        timestamp: new Date().toLocaleTimeString(),
        status: 'ERROR',
        latencyMs,
        docPath,
        message: 'Failed to write test document to properties collection.',
        errorDetails: errorMessage,
        payload: testPayload
      };

      setLogs((prev) => [errorLog, ...prev.slice(0, 9)]);
    }
  };

  const cleanupTestDocument = async () => {
    if (!lastTestDocId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'properties', lastTestDocId));
      setLogs((prev) => [
        {
          id: `del_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          docPath: `properties/${lastTestDocId}`,
          message: `Cleaned up diagnostic document '${lastTestDocId}' successfully.`
        },
        ...prev
      ]);
      setLastTestDocId(null);
    } catch (err: any) {
      setLogs((prev) => [
        {
          id: `del_err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'ERROR',
          docPath: `properties/${lastTestDocId}`,
          message: 'Failed to delete test document.',
          errorDetails: err?.message || String(err)
        },
        ...prev
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      runWriteTest();
    }
  }, [autoRun]);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 shadow-sm">
        <IconDatabase className="w-3.5 h-3.5 text-cyan-400" />
        <span>FS Config: <strong className="text-white">{projectId}</strong></span>
        {status === 'TESTING' && (
          <span className="flex items-center gap-1 text-amber-400 animate-pulse">
            <IconRefresh className="w-3 h-3 animate-spin" /> Testing...
          </span>
        )}
        {status === 'SUCCESS' && (
          <span className="flex items-center gap-1 text-emerald-400">
            <IconCheckCircle className="w-3 h-3" /> Verified
          </span>
        )}
        {status === 'ERROR' && (
          <span className="flex items-center gap-1 text-rose-400">
            <IconXCircle className="w-3 h-3" /> Error
          </span>
        )}
        <button
          onClick={runWriteTest}
          disabled={status === 'TESTING'}
          className="ml-2 px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 transition-colors disabled:opacity-50"
        >
          Test Write
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-slate-200 shadow-2xl backdrop-blur-md font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <IconDatabase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              Firestore Setup Diagnostic
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                properties Collection
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifying configuration target <code className="text-cyan-300 font-mono">{projectId}</code> ({databaseId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
          >
            <IconShield className="w-3.5 h-3.5 text-slate-400" />
            {showConfig ? 'Hide Config' : 'View Config'}
          </button>
          <button
            onClick={runWriteTest}
            disabled={status === 'TESTING'}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${status === 'TESTING' ? 'animate-spin' : ''}`} />
            {status === 'TESTING' ? 'Testing Write...' : 'Run Write Test'}
          </button>
        </div>
      </div>

      {/* Config Panel Dropdown */}
      {showConfig && (
        <div className="my-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-medium">
            <span>firebase-applet-config.json</span>
            <span className="text-emerald-400">Active Settings</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            {JSON.stringify(
              {
                apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'N/A',
                authDomain: firebaseConfig.authDomain,
                projectId: firebaseConfig.projectId,
                storageBucket: firebaseConfig.storageBucket,
                messagingSenderId: firebaseConfig.messagingSenderId,
                appId: firebaseConfig.appId,
                firestoreDatabaseId: (firebaseConfig as any).firestoreDatabaseId || '(default)'
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Main Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <IconActivity className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Target Collection</div>
            <div className="text-sm font-semibold text-white font-mono">/properties</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <IconShield className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Database ID</div>
            <div className="text-sm font-semibold text-white font-mono truncate max-w-[180px]">
              {databaseId}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          {status === 'IDLE' && <IconActivity className="w-5 h-5 text-slate-500" />}
          {status === 'TESTING' && <IconRefresh className="w-5 h-5 text-amber-400 animate-spin" />}
          {status === 'SUCCESS' && <IconCheckCircle className="w-5 h-5 text-emerald-400" />}
          {status === 'ERROR' && <IconXCircle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="text-xs text-slate-400 font-medium">Diagnostic Result</div>
            <div className="text-sm font-semibold">
              {status === 'IDLE' && <span className="text-slate-400">Ready to test</span>}
              {status === 'TESTING' && <span className="text-amber-400">Writing test document...</span>}
              {status === 'SUCCESS' && <span className="text-emerald-400">Write & Read Verified</span>}
              {status === 'ERROR' && <span className="text-rose-400">Write Operation Failed</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Write Result Banner */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Execution Logs</span>
            {lastTestDocId && (
              <button
                onClick={cleanupTestDocument}
                disabled={isDeleting}
                className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 font-sans capitalize font-normal text-xs"
              >
                <IconTrash className="w-3.5 h-3.5" />
                {isDeleting ? 'Cleaning up...' : `Remove test doc (${lastTestDocId})`}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all ${
                  log.status === 'SUCCESS'
                    ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {log.status === 'SUCCESS' ? (
                      <IconCheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <IconXCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-semibold font-mono flex items-center gap-2">
                        <span>{log.docPath}</span>
                        {log.latencyMs !== undefined && (
                          <span className="text-xs px-2 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-sans">
                            {log.latencyMs} ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 text-slate-300 font-sans">{log.message}</p>
                      {log.errorDetails && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-900/80 text-xs font-mono text-rose-300 overflow-x-auto">
                          <strong>Error:</strong> {log.errorDetails}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
                </div>

                {log.payload && (
                  <details className="mt-3 pt-3 border-t border-slate-800/60 text-xs font-mono">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-sans text-xs select-none">
                      View Written Document Payload
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-slate-950/90 border border-slate-800/90 text-slate-300 overflow-x-auto text-[11px]">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
