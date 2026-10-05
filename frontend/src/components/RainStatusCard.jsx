import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Droplets, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sanitizeRain } from '../utils/weatherUtils';

export default function RainStatusCard({ telemetry }) {
  const T = telemetry || {};
  const rain = sanitizeRain(T.rain_intensity);
  const rainVal = rain != null ? rain : 0.0;
  const isRaining = rainVal > 0.5;

  const getRainDetails = (val) => {
    if (val <= 0.5) {
      return {
        label: 'No Rainfall Detected',
        state: 'Dry Surface',
        description: 'Sensor surface is currently dry. Optimal clear weather.',
        color: '#10B981',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        intensity: 'None (0.0 mm/h)',
        badge: 'Dry Baseline'
      };
    }
    if (val < 5.0) {
      return {
        label: 'Light Precipitation',
        state: 'Light Drops',
        description: 'Light drizzle detected on FC-37 precipitation sensor.',
        color: '#0EA5E9',
        bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        intensity: 'Light Rain',
        badge: 'Active Rain'
      };
    }
    if (val < 15.0) {
      return {
        label: 'Moderate Rain Detected',
        state: 'Moderate Showers',
        description: 'Steady rainfall accumulation occurring at station.',
        color: '#3B82F6',
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        intensity: 'Moderate Intensity',
        badge: 'Steady Rain'
      };
    }
    return {
      label: 'Heavy Rainfall Alert',
      state: 'Heavy Downpour',
      description: 'Precipitation exceeding 15 mm/h. Monitor drainage channels.',
      color: '#F59E0B',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      intensity: 'Heavy Precipitation',
      badge: 'Caution'
    };
  };

  const details = getRainDetails(rainVal);
  const barPct = Math.min(100, Math.max(0, (rainVal / 30) * 100));

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E1A29]/80 border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${details.bg}`}>
              {isRaining ? <CloudRain size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Precipitation & Surface Rain
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                FC-37 gold plate transducer
              </p>
            </div>
          </div>

          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${details.bg}`}>
            {details.badge}
          </span>
        </div>

        {/* Current State Highlight */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans tabular-nums">
                {rainVal.toFixed(1)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 ml-1 font-medium">mm/h</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {details.state}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: details.color }}
              animate={{ width: `${Math.max(4, barPct)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {details.description}
          </p>
        </div>
      </div>

      {/* Sensor status footer */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 text-[11px]">
          <ShieldCheck size={13} className="text-emerald-500" />
          Hardware calibrated baseline
        </span>
        <span className="font-mono text-[10px] text-slate-400">GPIO 34 ADC</span>
      </div>
    </div>
  );
}
