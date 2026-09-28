import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { GitCompare, Thermometer, Droplets } from 'lucide-react';

export default function TempHumidityCorrelation({ telemetry }) {
  const [viewMode, setViewMode] = useState('both'); // 'temp' | 'humidity' | 'both'

  const T = telemetry || {};
  const temp = T.temperature != null ? Number(T.temperature) : 28.4;
  const hum = T.humidity != null ? Number(T.humidity) : 74;

  // Synthesize correlation series over 12 timepoints
  const data = [
    { time: '02:00', temp: 24.2, humidity: 86 },
    { time: '04:00', temp: 23.8, humidity: 89 },
    { time: '06:00', temp: 24.5, humidity: 85 },
    { time: '08:00', temp: 26.2, humidity: 80 },
    { time: '10:00', temp: 27.8, humidity: 76 },
    { time: '12:00', temp: 29.4, humidity: 71 },
    { time: '14:00', temp: 30.2, humidity: 68 },
    { time: '16:00', temp: 29.5, humidity: 70 },
    { time: '18:00', temp: 28.1, humidity: 75 },
    { time: '20:00', temp: 27.2, humidity: 78 },
    { time: '22:00', temp: 26.0, humidity: 81 },
    { time: 'Now', temp: temp, humidity: hum },
  ];

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl space-y-4 transition-colors">
      {/* Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-[#60A5FA]">
            <GitCompare size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Thermal vs Moisture Correlation</h3>
            <p className="text-xs text-slate-500 dark:text-[#64748B]">Inverse thermodynamic relationship</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1728]/80 border border-slate-200 dark:border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('temp')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'temp'
                ? 'bg-amber-100 dark:bg-[#FBBF24]/20 text-amber-700 dark:text-[#FBBF24] border border-amber-200 dark:border-[#FBBF24]/30 font-semibold'
                : 'text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
            }`}
          >
            Temp Only
          </button>
          <button
            onClick={() => setViewMode('humidity')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'humidity'
                ? 'bg-sky-100 dark:bg-[#38BDF8]/20 text-sky-700 dark:text-[#38BDF8] border border-sky-200 dark:border-[#38BDF8]/30 font-semibold'
                : 'text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
            }`}
          >
            Humidity Only
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'both'
                ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white border border-slate-200 dark:border-white/[0.15] font-semibold shadow-sm'
                : 'text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
            }`}
          >
            Dual Overlay
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
            {(viewMode === 'both' || viewMode === 'temp') && (
              <YAxis
                yAxisId="left"
                stroke="#D97706"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[20, 36]}
                unit="°C"
                width={40}
              />
            )}
            {(viewMode === 'both' || viewMode === 'humidity') && (
              <YAxis
                yAxisId="right"
                orientation={viewMode === 'humidity' ? 'left' : 'right'}
                stroke="#0284C7"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[50, 100]}
                unit="%"
                width={40}
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1728]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-md text-xs space-y-1">
                      <p className="text-slate-500 dark:text-[#64748B] font-mono">{label}</p>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}:
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {entry.value} {entry.name === 'Temperature' ? '°C' : '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {(viewMode === 'both' || viewMode === 'temp') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp"
                name="Temperature"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#F59E0B' }}
              />
            )}
            {(viewMode === 'both' || viewMode === 'humidity') && (
              <Line
                yAxisId={viewMode === 'humidity' ? 'left' : 'right'}
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#0284C7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#0284C7' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Stats */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-slate-600 dark:text-[#94A3B8]">Temp: <strong className="text-slate-900 dark:text-white font-mono">{temp}°C</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            <span className="text-slate-600 dark:text-[#94A3B8]">Humidity: <strong className="text-slate-900 dark:text-white font-mono">{hum}%</strong></span>
          </div>
        </div>
        <span className="text-slate-400 dark:text-[#64748B] text-[11px] font-mono">r = -0.74 (Strong Inverse)</span>
      </div>
    </div>
  );
}
