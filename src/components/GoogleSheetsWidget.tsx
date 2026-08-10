import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { getGoogleAccessToken } from '../lib/googleAuth';

interface SheetData {
  label: string;
  value: number;
}

export function GoogleSheetsWidget() {
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState('');

  const fetchSheetData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getGoogleAccessToken();
      if (!token) {
        throw new Error('No Google Workspace token found. Please sign in via the Auth Dashboard.');
      }
      
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1:B20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch sheet: ${res.statusText}`);
      }
      
      const json = await res.json() as any;
      if (json.values && json.values.length > 1) {
        const parsedData = json.values.slice(1).map((row: string[]) => ({
          label: row[0] || 'Unknown',
          value: parseFloat(row[1]) || 0
        }));
        setData(parsedData);
      } else {
        throw new Error('Sheet is empty or missing data (needs at least 2 rows with Label and Value).');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: 12, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Google Sheets Data Sync (Real-Time)</h3>
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="Paste Spreadsheet ID..." 
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          style={{ 
            flex: 1, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            padding: '8px 12px', 
            borderRadius: 6, 
            color: '#f1f5f9',
            fontSize: 13
          }}
        />
        <button 
          onClick={() => fetchSheetData(sheetId)}
          disabled={!sheetId || loading}
          style={{
            background: 'rgba(57,191,246,0.15)',
            color: '#39bff6',
            border: '1px solid rgba(57,191,246,0.3)',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: !sheetId || loading ? 'not-allowed' : 'pointer',
            opacity: !sheetId || loading ? 0.5 : 1
          }}
        >
          {loading ? 'Fetching...' : 'Sync Data'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, padding: 8, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {data.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: '100%' }}
        >
          {data.length >= 2 && (() => {
            const current = data[data.length - 1].value;
            const previous = data[data.length - 2].value;
            const diff = current - previous;
            const isUp = diff > 0;
            const isDown = diff < 0;
            const diffPct = previous !== 0 ? (Math.abs(diff) / Math.abs(previous)) * 100 : 0;
            
            let color = '#94a3b8';
            let icon = '▬';
            if (isUp) { color = '#10b981'; icon = '▲'; }
            else if (isDown) { color = '#ef4444'; icon = '▼'; }

            return (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                  {current.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{icon}</span> 
                  <span>{Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({diffPct.toFixed(1)}%)</span>
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>vs previous</span>
              </div>
            );
          })()}
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(57,191,246,0.4)', borderRadius: 8, color: '#f1f5f9' }}
                  itemStyle={{ color: '#39bff6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#39bff6" strokeWidth={3} dot={{ fill: '#0f172a', r: 4, stroke: '#39bff6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ) : (
        !loading && (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
            No data synced yet. Paste a Spreadsheet ID (must have Label in Col A, Value in Col B).
          </div>
        )
      )}
    </div>
  );
}
