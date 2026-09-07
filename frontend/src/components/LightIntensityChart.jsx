import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sun, Moon, Sunset } from 'lucide-react';

export default function LightIntensityChart({ telemetry }) {
  const T = telemetry || {};
  const currentLux = T.light_lux != null ? Math.round(T.light_lux) : null;

  // Build 24-hour model seeded with the live reading at 'Now'
  // The diurnal curve is a model for context; only 'Now' is a real reading
  const modelData = [
    { time: '00:00', lux: 0 },
    { time: '03:00', lux: 0 },
    { time: '05:30', lux: 15 },
    { time: '07:00', lux: 350 },
    { time: '09:00', lux: 780 },
    { time: '11:00', lux: 1400 },
    { time: '13:00', lux: 1800 },
    { time: '15:00', lux: 1350 },
    { time: '17:00', lux: 680 },
    { time: '19:00', lux: 80 },
    { time: '21:00', lux: 0 },
    { time: '23:00', lux: 0 },
  ];

  // Append the real live reading at 'Now' if available
  const data = currentLux != null
    ? [...modelData, { time: 'Now', lux: currentLux }]
    : modelData;

  const peakLux = Math.max(...data.map((d) => d.lux));

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
            <Sun size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Ambient Light Intensity</h3>
            <p className="text-xs text-[#64748B]">BH1750 I²C sensor · diurnal solar curve</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#FBBF24] font-semibold">
            {currentLux != null ? `${currentLux} lx` : '—'}
          </span>
          <span className="text-[10px] text-[#64748B] block">Live</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FBBF24" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit=" lx" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const isLive = label === 'Now';
                return (
                  <div className="p-3 rounded-xl bg-[#0B1728]/95 border border-white/[0.12] shadow-2xl backdrop-blur-md text-xs">
                    <p className="text-[#64748B] font-mono">{label}{isLive ? ' (Live)' : ' (Model)'}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[#FBBF24] font-semibold">
                      <Sun size={13} /><span>{payload[0].value} lx</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="lux" stroke="#FBBF24" strokeWidth={2} fill="url(#solarGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Phase legend */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04] text-center text-[10px]">
        <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex flex-col items-center">
          <Moon size={12} className="text-[#64748B] mb-1" />
          <span className="text-[#64748B]">Dawn ~06:00</span>
        </div>
        <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex flex-col items-center">
          <Sun size={12} className="text-[#FBBF24] mb-1" />
          <span className="text-[#64748B]">Peak Solar</span>
          <span className="text-white font-semibold">{peakLux > 0 ? `${peakLux} lx` : '—'}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex flex-col items-center">
          <Moon size={12} className="text-[#818CF8] mb-1" />
          <span className="text-[#64748B]">Now</span>
          <span className="text-[#FBBF24] font-semibold">{currentLux != null ? `${currentLux} lx` : '—'}</span>
        </div>
      </div>
    </div>
  );
}
