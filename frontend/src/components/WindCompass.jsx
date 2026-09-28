import React from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';
import { degreesToCardinal } from '../utils/weatherUtils';

export default function WindCompass({ telemetry }) {
  const T = telemetry || {};
  const speed   = T.wind_speed     != null ? Number(T.wind_speed).toFixed(1) : null;
  const degrees = T.wind_direction != null ? Number(T.wind_direction)        : null;
  const gust    = speed != null ? (parseFloat(speed) * 1.35).toFixed(1)     : null;
  const cardinal = degreesToCardinal(degrees);

  // Beaufort scale label
  const beaufort = speed != null
    ? parseFloat(speed) < 1 ? 'Calm'
    : parseFloat(speed) < 6 ? 'Light Air'
    : parseFloat(speed) < 12 ? 'Light Breeze'
    : parseFloat(speed) < 20 ? 'Gentle Breeze'
    : parseFloat(speed) < 29 ? 'Moderate Breeze'
    : parseFloat(speed) < 39 ? 'Fresh Breeze'
    : 'Strong Wind'
    : '—';

  const cardinalPoints = [
    { label: 'N', deg: 0, isMajor: true },
    { label: 'NE', deg: 45, isMajor: false },
    { label: 'E', deg: 90, isMajor: true },
    { label: 'SE', deg: 135, isMajor: false },
    { label: 'S', deg: 180, isMajor: true },
    { label: 'SW', deg: 225, isMajor: false },
    { label: 'W', deg: 270, isMajor: true },
    { label: 'NW', deg: 315, isMajor: false },
  ];

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#34D399]">
            <Wind size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Wind Vector & Dynamics</h3>
            <p className="text-xs text-slate-500 dark:text-[#64748B]">Cup Anemometer · azimuth + velocity</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-emerald-600 dark:text-[#34D399] font-semibold">
          {degrees != null ? `${cardinal} · ${degrees}°` : '—'}
        </span>
      </div>

      {/* Compass dial */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent">
          {/* Degree ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div key={deg} className="absolute w-full h-full flex justify-center"
              style={{ transform: `rotate(${deg}deg)` }}>
              <div className={`w-0.5 ${deg % 90 === 0 ? 'h-2 bg-blue-500 dark:bg-[#60A5FA]' : 'h-1 bg-slate-300 dark:bg-white/20'}`} />
            </div>
          ))}

          {/* Cardinal labels */}
          {cardinalPoints.map((pt) => {
            const rad = (pt.deg - 90) * (Math.PI / 180);
            const r = 80;
            return (
              <span key={pt.label}
                className={`absolute text-[10px] font-bold ${pt.isMajor ? (pt.label === 'N' ? 'text-rose-500 dark:text-[#F87171]' : 'text-slate-800 dark:text-white') : 'text-slate-400 dark:text-[#64748B]'}`}
                style={{ transform: `translate(${(r * Math.cos(rad)).toFixed(0)}px, ${(r * Math.sin(rad)).toFixed(0)}px)` }}>
                {pt.label}
              </span>
            );
          })}
        </div>

        {/* Rotating needle – only if we have real direction */}
        {degrees != null && (
          <motion.div
            animate={{ rotate: degrees }}
            transition={{ type: 'spring', damping: 15, stiffness: 60 }}
            className="absolute w-36 h-36 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="flex flex-col items-center justify-between h-full py-1">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-500 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/40" />
            </div>
          </motion.div>
        )}

        {/* Center readout */}
        <div className="relative z-20 w-24 h-24 rounded-full bg-white dark:bg-[#0B1728]/90 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col items-center justify-center text-center backdrop-blur-md">
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            {speed != null ? speed : '—'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5">km/h</span>
          <span className="text-[9px] text-emerald-600 dark:text-[#34D399] font-mono mt-1 font-semibold">
            {degrees != null ? `${cardinal} ${degrees}°` : '—'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] grid grid-cols-2 gap-3 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
          <span className="text-slate-500 dark:text-[#64748B] block text-[11px]">Peak Gust Est.</span>
          <span className="text-slate-900 dark:text-white font-semibold font-mono">{gust != null ? `${gust} km/h` : '—'}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
          <span className="text-slate-500 dark:text-[#64748B] block text-[11px]">Beaufort Force</span>
          <span className="text-emerald-600 dark:text-[#34D399] font-semibold">{beaufort}</span>
        </div>
      </div>
    </div>
  );
}
