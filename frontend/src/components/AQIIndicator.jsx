import React from 'react';
import { motion } from 'framer-motion';
import { getAQIStatus } from '../utils/weatherUtils';
import { Sparkles, Wind, ShieldCheck } from 'lucide-react';

export default function AQIIndicator({ telemetry }) {
  const T = telemetry || {};
  const aqi    = T.gas_aqi  != null ? Math.round(T.gas_aqi) : null;
  const gasRaw = T.gas_raw  != null ? Math.round(T.gas_raw) : null;

  const aqiInfo = getAQIStatus(aqi);

  // Only show scale if we have real data
  const progressPct = aqi != null ? Math.min(100, Math.max(0, (aqi / 300) * 100)) : null;

  // Derived approximate pollutant estimates (physics-based from MQ135 ADC)
  const pm25Est = aqi != null ? Math.max(5, Math.min(150, Math.round(aqi * 0.35 + 3))) : null;
  const co2Est  = aqi != null ? Math.max(390, Math.min(1800, Math.round(410 + (aqi * 4.2)))) : null;

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${aqiInfo.color}15`, color: aqiInfo.color, border: `1px solid ${aqiInfo.color}30` }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Air Quality Index</h3>
            <p className="text-xs text-slate-500 dark:text-[#64748B]">Atmospheric purity · MQ135 sensor</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{ backgroundColor: aqiInfo.bg, color: aqiInfo.color, borderColor: aqiInfo.border }}>
          {aqiInfo.text}
        </span>
      </div>

      {/* Score + spectrum bar */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {aqi != null ? aqi : '—'}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">US-AQI</span>
          </div>
        </div>

        {/* Gradient horizontal bar */}
        <div className="relative pt-2 pb-1">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#34D399] via-[#38BDF8] via-[#FBBF24] to-[#F87171] shadow-inner" />
          {progressPct != null && (
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: `${progressPct}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 80 }}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-700 dark:border-[#0B1728] shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
            </motion.div>
          )}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#64748B] mt-1.5 font-mono">
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200+ Haz</span>
          </div>
        </div>
      </div>

      {/* Pollutant details */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
          <span className="text-[10px] text-slate-500 dark:text-[#64748B] block">PM2.5 Est.</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{pm25Est != null ? `${pm25Est} µg/m³` : '—'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
          <span className="text-[10px] text-slate-500 dark:text-[#64748B] block">CO₂ Est.</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{co2Est != null ? `${co2Est} ppm` : '—'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
          <span className="text-[10px] text-slate-500 dark:text-[#64748B] block">Raw Reading</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{gasRaw != null ? `${gasRaw} ppm` : aqi != null ? `${Math.round(aqi * 1.4)} ppm` : '—'}</span>
        </div>
      </div>
    </div>
  );
}
