import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';
import SovereignPageHeader from '../components/SovereignPageHeader';
import UserProfile from '../components/UserProfile';
import { initAuth, googleSignIn, logoutGoogle, getGoogleAccessToken } from '../lib/googleAuth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthDashboard() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [sheetsData, setSheetsData] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [sheetIdInput, setSheetIdInput] = useState('');
  
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
      },
      () => {
        setNeedsAuth(true);
        setUser(auth.currentUser);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setNeedsAuth(true);
    setToken(null);
    setUser(null);
    setFiles([]);
    setSheetsData([]);
  };

  const loadDriveFiles = async () => {
    if (!token) return;
    setLoadingDocs(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadSheetData = async (spreadsheetId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:F20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.values) {
        setSheetsData(data.values);
      } else {
        alert("No data found or sheet is empty.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load sheet. Ensure it exists and has permissions.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <SEO title="Auth & Integrations Dashboard" description="Manage authentication and Google Workspace connections." url="/auth-dashboard" />
      <SovereignPageHeader
        badge="Security & Access"
        title="Authentication Dashboard"
        subtitle="Manage secure Firebase authentication and external Google Workspace API connections."
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Identity & Access Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Identity Profile</h3>
            <UserProfile variant="card" showDetails={true} />
            {token && (
              <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
                <p className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Google Workspace Token Active
                </p>
              </div>
            )}
          </div>

          {/* Google Sheets Integration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Google Sheets Sync</h3>
            {!token ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Connect to Workspace to manage Sheets.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadDriveFiles}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl transition"
                    >
                      {loadingDocs ? 'Loading...' : 'List Recent Spreadsheets'}
                    </button>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                      {files.map(f => (
                        <li key={f.id} className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex justify-between items-center">
                          <span className="truncate text-sm text-slate-300">{f.name}</span>
                          <button onClick={() => { setSheetIdInput(f.id); loadSheetData(f.id); }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded">
                            Load
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-sm text-slate-400 mb-2">Or paste a Spreadsheet ID:</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={sheetIdInput}
                      onChange={e => setSheetIdInput(e.target.value)}
                      placeholder="e.g. 1BxiMVs0XRY..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => loadSheetData(sheetIdInput)}
                      disabled={!sheetIdInput}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
                    >
                      Fetch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render Extracted Sheet Data */}
        {sheetsData.length > 0 && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
             <h3 className="text-lg font-bold text-slate-100 mb-4">Sheet Preview</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-300">
                 <thead className="text-xs uppercase bg-slate-950 text-slate-400">
                   <tr>
                     {sheetsData[0].map((h: string, i: number) => (
                       <th key={i} className="px-4 py-3">{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {sheetsData.slice(1).map((row: string[], i: number) => (
                     <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                       {row.map((cell: string, j: number) => (
                         <td key={j} className="px-4 py-3">{cell}</td>
                       ))}
                       {/* Fill empty cells if row is shorter than header */}
                       {Array.from({ length: sheetsData[0].length - row.length }).map((_, j) => (
                         <td key={`empty-${j}`} className="px-4 py-3"></td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
