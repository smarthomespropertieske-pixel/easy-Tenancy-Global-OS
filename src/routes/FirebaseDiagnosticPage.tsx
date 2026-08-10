import React from 'react';
import FirebaseDiagnostic from '../components/FirebaseDiagnostic';
import { useNavigate } from 'react-router-dom';

function IconArrowLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconShieldCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconCpu({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

export default function FirebaseDiagnosticPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg">
            <IconShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>SDK Environment Status: Configured</span>
          </div>
        </div>

        {/* Page Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <IconCpu className="w-3.5 h-3.5" />
            Firestore Integration Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Firebase Database Diagnostic Terminal
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            This diagnostic tool attempts to issue real-time writes and readback verification against the{' '}
            <code className="text-cyan-300 font-mono">properties</code> collection in your provisioned Firestore database using{' '}
            <code className="text-slate-200 font-mono">firebase-applet-config.json</code>.
          </p>
        </div>

        {/* Diagnostic Component */}
        <FirebaseDiagnostic autoRun={true} />
      </div>
    </div>
  );
}
