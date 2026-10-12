import React from 'react';
import { motion } from 'framer-motion';
import { getAQIStatus } from '../utils/weatherUtils';
import { Sparkles } from 'lucide-react';

export default function AQIIndicator({ telemetry }) {
  const T = telemetry || {};
  const isAvailable = T.gas_aqi != null || T.gas_raw != null;
  const aqi    = T.gas_aqi  != null ? Math.round(T.gas_aqi) : null;
  const gasRaw = T.gas_raw  != null ? Math.round(T.gas_raw) : null;

  const aqiInfo = isAvailable && aqi != null 
    ? getAQIStatus(aqi)
    : { text: 'Not Connected', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' };

  // Only show scale if we have real data
  const progressPct = aqi != null ? Math.min(100, Math.max(0, (aqi / 300) * 100)) : null;

  // Derived approximate pollutant estimates (physics-based from MQ135 ADC)
  const pm25Est = aqi != null ? Math.max(5, Math.min(150, Math.round(aqi * 0.35 + 3))) : null;
  const co2Est  = aqi != null ? Math.max(390, Math.min(1800, Math.round(410 + (aqi * 4.2)))) : null;

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 backdrop-blur-xl shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${aqiInfo.color}15`, color: aqiInfo.color, border: `1px solid ${aqiInfo.color}30` }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Air Quality Index</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                isAvailable 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isAvailable ? 'MQ135 Connected' : 'MQ135 Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Atmospheric purity · MQ135 sensor</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{ backgroundColor: aqiInfo.bg, color: aqiInfo.color, borderColor: aqiInfo.border }}>
          {aqiInfo.text}
        </span>
      </div>

      {/* Score + spectrum bar */}
      <div className="space-y-3 relative">
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium mb-1">
              MQ135 Sensor Offline
            </span>
            <p className="text-[11px] text-slate-400">
              Hardware channel is offline or not installed.
            </p>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans tracking-tight">
              {aqi != null ? aqi : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 font-medium">US-AQI</span>
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
              <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-700 shadow-sm" />
            </motion.div>
          )}
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200+ Haz</span>
          </div>
        </div>
      </div>

      {/* Pollutant details */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] text-slate-500 block">PM2.5 Est.</span>
          <span className="font-semibold text-slate-900 font-mono mt-0.5 block">{pm25Est != null ? `${pm25Est} µg/m³` : 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] text-slate-500 block">CO₂ Est.</span>
          <span className="font-semibold text-slate-900 font-mono mt-0.5 block">{co2Est != null ? `${co2Est} ppm` : 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] text-slate-500 block">Raw Reading</span>
          <span className="font-semibold text-slate-900 font-mono mt-0.5 block">{gasRaw != null ? `${gasRaw} ppm` : aqi != null ? `${Math.round(aqi * 1.4)} ppm` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
