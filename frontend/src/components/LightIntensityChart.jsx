import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sun, Moon } from 'lucide-react';

export default function LightIntensityChart({ telemetry }) {
  const T = telemetry || {};
  const isAvailable = T.light_lux != null;
  const currentLux = isAvailable ? Math.round(T.light_lux) : null;

  // Build 24-hour model seeded with the live reading at 'Now'
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

  const data = currentLux != null
    ? [...modelData, { time: 'Now', lux: currentLux }]
    : modelData;

  const peakLux = Math.max(...data.map((d) => d.lux));

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 backdrop-blur-xl shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <Sun size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Ambient Light Intensity</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                isAvailable 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isAvailable ? 'BH1750 Connected' : 'BH1750 Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500">BH1750 I²C sensor · diurnal solar curve</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-amber-600 font-semibold">
            {currentLux != null ? `${currentLux} lx` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 block">{isAvailable ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 w-full pt-2 relative">
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium mb-1">
              BH1750 Sensor Not Available
            </span>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Hardware channel is offline or not installed. Live illuminance cannot be recorded.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit=" lx" width={55} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const isLive = label === 'Now';
                return (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xl text-xs">
                    <p className="text-slate-500 font-mono">{label}{isLive ? ' (Live)' : ' (Model)'}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-amber-600 font-semibold">
                      <Sun size={13} /><span>{payload[0].value} lx</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="lux" stroke="#F59E0B" strokeWidth={2} fill="url(#solarGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Phase legend */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[10px]">
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col items-center">
          <Moon size={12} className="text-slate-400 mb-1" />
          <span className="text-slate-500">Dawn ~06:00</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col items-center">
          <Sun size={12} className="text-amber-500 mb-1" />
          <span className="text-slate-500">Peak Solar</span>
          <span className="text-slate-800 font-semibold">{peakLux > 0 ? `${peakLux} lx` : '—'}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col items-center">
          <Moon size={12} className="text-indigo-500 mb-1" />
          <span className="text-slate-500">Now</span>
          <span className="text-amber-600 font-semibold">{currentLux != null ? `${currentLux} lx` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
