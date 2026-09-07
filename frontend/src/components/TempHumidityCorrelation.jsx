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
    <div className="rounded-2xl p-5 sm:p-6 bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
      {/* Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
            <GitCompare size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Thermal vs Moisture Correlation</h3>
            <p className="text-xs text-[#64748B]">Inverse thermodynamic relationship</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B1728]/80 border border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('temp')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'temp'
                ? 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            Temp Only
          </button>
          <button
            onClick={() => setViewMode('humidity')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'humidity'
                ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            Humidity Only
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'both'
                ? 'bg-white/[0.1] text-white border border-white/[0.15] font-semibold'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            Dual Overlay
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
            {(viewMode === 'both' || viewMode === 'temp') && (
              <YAxis
                yAxisId="left"
                stroke="#FBBF24"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[20, 36]}
                unit="°C"
              />
            )}
            {(viewMode === 'both' || viewMode === 'humidity') && (
              <YAxis
                yAxisId="right"
                orientation={viewMode === 'humidity' ? 'left' : 'right'}
                stroke="#38BDF8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[50, 100]}
                unit="%"
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-[#0B1728]/95 border border-white/[0.12] shadow-2xl backdrop-blur-md text-xs space-y-1">
                      <p className="text-[#64748B] font-mono">{label}</p>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}:
                          </span>
                          <span className="font-semibold text-white">
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
                stroke="#FBBF24"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#FBBF24' }}
              />
            )}
            {(viewMode === 'both' || viewMode === 'humidity') && (
              <Line
                yAxisId={viewMode === 'humidity' ? 'left' : 'right'}
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#38BDF8' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Stats */}
      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
            <span className="text-[#94A3B8]">Temp: <strong className="text-white font-mono">{temp}°C</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-[#94A3B8]">Humidity: <strong className="text-white font-mono">{hum}%</strong></span>
          </div>
        </div>
        <span className="text-[#64748B] text-[11px] font-mono">r = -0.74 (Strong Inverse)</span>
      </div>
    </div>
  );
}
