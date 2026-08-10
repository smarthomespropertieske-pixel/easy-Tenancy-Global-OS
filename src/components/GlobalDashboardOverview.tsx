import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts'
import { Icon } from '../lib/icons'

const aumData = [
  { name: 'Jan', value: 18.2 },
  { name: 'Feb', value: 19.1 },
  { name: 'Mar', value: 19.8 },
  { name: 'Apr', value: 21.0 },
  { name: 'May', value: 22.4 },
  { name: 'Jun', value: 23.1 },
  { name: 'Jul', value: 24.5 },
]

const decarbonizationData = [
  { name: '2020', value: 45 },
  { name: '2021', value: 52 },
  { name: '2022', value: 61 },
  { name: '2023', value: 74 },
  { name: '2024', value: 85 },
]

const sdgData = [
  { name: 'SDG 7 (Energy)', value: 85 },
  { name: 'SDG 9 (Industry)', value: 65 },
  { name: 'SDG 11 (Cities)', value: 92 },
  { name: 'SDG 13 (Climate)', value: 78 },
]

export default function GlobalDashboardOverview() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AUM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-2">
          <div className="flex items-center text-slate-400 space-x-2">
            <Icon name="dollar" size={16} />
            <span className="text-sm font-medium uppercase tracking-wider">AUM</span>
          </div>
          <div className="text-3xl font-display font-semibold text-white">
            $24.5B
          </div>
          <div className="text-xs text-teal-400 font-medium">
            +18.2% vs last year
          </div>
        </div>

        {/* Global Decarbonization Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-2">
          <div className="flex items-center text-slate-400 space-x-2">
            <Icon name="zap" size={16} />
            <span className="text-sm font-medium uppercase tracking-wider">Decarb Index</span>
          </div>
          <div className="text-3xl font-display font-semibold text-white">
            85<span className="text-xl text-slate-500">/100</span>
          </div>
          <div className="text-xs text-teal-400 font-medium">
            Top 5% Globally
          </div>
        </div>

        {/* Active Leases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-2">
          <div className="flex items-center text-slate-400 space-x-2">
            <Icon name="file-text" size={16} />
            <span className="text-sm font-medium uppercase tracking-wider">Active Leases</span>
          </div>
          <div className="text-3xl font-display font-semibold text-white">
            2.4M
          </div>
          <div className="text-xs text-teal-400 font-medium">
            99.8% Occupancy
          </div>
        </div>

        {/* SDG Impact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-2">
          <div className="flex items-center text-slate-400 space-x-2">
            <Icon name="globe" size={16} />
            <span className="text-sm font-medium uppercase tracking-wider">SDG Impact</span>
          </div>
          <div className="text-3xl font-display font-semibold text-white">
            14.2M
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Tons CO₂e offset
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AUM Trend Area Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">AUM Growth (YTD)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aumData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39bff6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#39bff6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242938" vertical={false} />
                <XAxis dataKey="name" stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}B`} domain={[15, 25]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F121C', borderColor: '#242938', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#8892A4', marginBottom: '4px' }}
                  formatter={(value: any) => [`$${value}B`, 'AUM']}
                />
                <Area type="monotone" dataKey="value" stroke="#39bff6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decarbonization Line Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Decarbonization Progress</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decarbonizationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242938" vertical={false} />
                <XAxis dataKey="name" stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F121C', borderColor: '#242938', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#8892A4', marginBottom: '4px' }}
                  formatter={(value: any) => [`${value}/100`, 'Score']}
                />
                <Line type="monotone" dataKey="value" stroke="#2A9D6E" strokeWidth={3} dot={{ r: 4, fill: '#0F121C', stroke: '#2A9D6E', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SDG Bar Chart (Span 2 columns on lg) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">SDG Goal Achievement</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sdgData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#242938" horizontal={false} />
                <XAxis type="number" stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#8892A4" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F121C', borderColor: '#242938', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#8892A4', marginBottom: '4px' }}
                  cursor={{ fill: '#1A1F2E' }}
                  formatter={(value: any) => [`${value}%`, 'Target Met']}
                />
                <Bar dataKey="value" fill="#39bff6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
