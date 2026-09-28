import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Droplets } from 'lucide-react';

const RAIN_THRESHOLDS = [
  { label: 'Dry',        max: 0.5,  color: '#34D399', bg: '#34D39915', bar: '#34D399' },
  { label: 'Light',      max: 5,    color: '#38BDF8', bg: '#38BDF815', bar: '#38BDF8' },
  { label: 'Moderate',   max: 15,   color: '#60A5FA', bg: '#60A5FA15', bar: '#60A5FA' },
  { label: 'Heavy',      max: 30,   color: '#FBBF24', bg: '#FBBF2415', bar: '#FBBF24' },
  { label: 'Extreme',    max: Infinity, color: '#F87171', bg: '#F8717115', bar: '#F87171' },
];

function classifyRain(value) {
  if (value == null) return { label: '—', color: '#64748B', bg: 'transparent', bar: '#64748B' };
  for (const t of RAIN_THRESHOLDS) {
    if (value < t.max) return t;
  }
  return RAIN_THRESHOLDS[RAIN_THRESHOLDS.length - 1];
}

export default function RainfallVisualization({ telemetry }) {
  const T = telemetry || {};
  const rain  = T.rain_intensity != null ? Number(T.rain_intensity) : null;
  const humid = T.humidity       != null ? Math.round(T.humidity)   : null;

  const cls = classifyRain(rain);

  // Visual rain bar (max at 50 mm/h)
  const barPct = rain != null ? Math.min(100, Math.max(0, (rain / 50) * 100)) : 0;

  // Drop animation speed inversely proportional to dryness
  const dropDuration = rain != null && rain > 0.5 ? Math.max(0.4, 1.5 - rain * 0.02) : 3;

  const intensity = rain != null ? `${rain.toFixed(1)} mm/h` : '—';

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: cls.bg, color: cls.color, border: `1px solid ${cls.bar}30` }}>
            <CloudRain size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Rainfall & Precipitation</h3>
            <p className="text-xs text-slate-500 dark:text-[#64748B]">FC-37 sensor · accumulation rate</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{ backgroundColor: cls.bg, color: cls.color, borderColor: `${cls.bar}40` }}>
          {cls.label}
        </span>
      </div>

      {/* Animated rain visualization */}
      <div className="relative w-full h-36 flex items-end justify-center rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0B1728]/50 border border-slate-200/80 dark:border-white/[0.04]">
        {/* Cloud silhouette */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-8 bg-slate-300/60 dark:bg-[#334155]/60 rounded-full blur-sm" />

        {/* Rain drops (only animated when it's actually raining) */}
        {rain != null && rain > 0.5 && (
          <div className="absolute inset-0 flex gap-5 justify-center items-start pt-8 pointer-events-none">
            {[0, 0.2, 0.5, 0.8, 1.0, 1.3, 1.6].map((delay, i) => (
              <motion.div key={i}
                className="w-0.5 rounded-full"
                style={{ height: rain > 15 ? 16 : rain > 5 ? 12 : 8, background: cls.bar }}
                animate={{ y: [0, 80, 0], opacity: [0, 1, 0] }}
                transition={{ duration: dropDuration, delay, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </div>
        )}

        {/* Accumulation pool */}
        <motion.div
          animate={{ height: `${Math.min(barPct, 80)}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 60 }}
          className="relative w-full rounded-b-xl"
          style={{ background: `linear-gradient(to top, ${cls.bar}22, transparent)`, minHeight: 4 }}
        />

        {/* Intensity readout */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <span className="text-lg font-bold font-sans" style={{ color: cls.color }}>{intensity}</span>
          <span className="block text-[10px] text-slate-500 dark:text-[#64748B]">Intensity</span>
        </div>
      </div>

      {/* Threshold scale */}
      <div className="space-y-1.5">
        {RAIN_THRESHOLDS.filter((t) => t.max !== Infinity).map((t) => {
          const isActive = rain != null && rain < t.max && classifyRain(rain) === t;
          return (
            <div key={t.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'scale-150 shadow-[0_0_6px]' : 'opacity-30'}`}
                style={{ background: t.color, boxShadow: isActive ? `0 0 6px ${t.color}` : 'none' }} />
              <span className={`text-xs flex-1 ${isActive ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-[#64748B]'}`}>{t.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-[#64748B] font-mono">&lt;{t.max} mm/h</span>
            </div>
          );
        })}
        {/* Extreme threshold */}
        {(() => {
          const t = RAIN_THRESHOLDS[RAIN_THRESHOLDS.length - 1];
          const isActive = rain != null && rain >= 30;
          return (
            <div key="extreme" className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'scale-150 shadow-[0_0_6px]' : 'opacity-30'}`}
                style={{ background: t.color, boxShadow: isActive ? `0 0 6px ${t.color}` : 'none' }} />
              <span className={`text-xs flex-1 ${isActive ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-[#64748B]'}`}>{t.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-[#64748B] font-mono">≥30 mm/h</span>
            </div>
          );
        })()}
      </div>

      {/* Humidity companion */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#64748B]">
          <Droplets size={13} className="text-sky-500 dark:text-[#38BDF8]" />
          <span>Relative Humidity</span>
        </div>
        <span className="font-semibold font-mono text-slate-900 dark:text-white">{humid != null ? `${humid}%` : '—'}</span>
      </div>
    </div>
  );
}
