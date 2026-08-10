import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export interface MarketPerformanceChartProps {
  data: {
    label: string;
    occupancyRate: number;
    [key: string]: any;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(57,191,246,0.4)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        color: '#f1f5f9',
      }}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#cbd5e1' }}>Occupancy Rate:</span>
          <strong style={{ color: '#39bff6' }}>{Number(payload[0]?.value || 0).toFixed(1)}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const MarketPerformanceChart: React.FC<MarketPerformanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="label" 
            stroke="#64748b" 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="occupancyRate" 
            stroke="#39bff6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#0f172a', stroke: '#39bff6', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#39bff6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
