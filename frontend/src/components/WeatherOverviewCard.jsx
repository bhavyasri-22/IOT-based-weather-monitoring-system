import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { calculateHeatIndex, deriveWeatherCondition, formatRelativeTime, sanitizeRain } from '../utils/weatherUtils';

import useUserLocation from '../hooks/useUserLocation';

export default function WeatherOverviewCard({ telemetry, lastUpdated, deviceStatus }) {
  const T = telemetry || {};
  const noData = !telemetry;
  const userLoc = useUserLocation();

  // ── Raw values (null-safe & sanitized)
  const temp = T.temperature != null ? Number(T.temperature).toFixed(1) : null;
  const humidity = T.humidity != null ? Math.round(T.humidity) : null;
  const rainNum = sanitizeRain(T.rain_intensity);
  const rain = rainNum != null ? rainNum.toFixed(1) : null;
  const pressure = T.pressure != null ? Math.round(T.pressure) : null;
  const windSpeed = T.wind_speed != null ? Number(T.wind_speed).toFixed(1) : null;

  // ── Derived
  const feelsLike = temp != null && humidity != null
    ? calculateHeatIndex(parseFloat(temp), humidity)
    : null;

  const { condition, description } = deriveWeatherCondition(T);
  const isRaining = rainNum != null && rainNum > 0.5;

  // Simulated daily high/low based on current temp if not separately tracked
  const tempNum = temp != null ? parseFloat(temp) : null;
  const highTemp = tempNum != null ? (tempNum + 2.8).toFixed(1) : null;
  const lowTemp = tempNum != null ? (tempNum - 3.4).toFixed(1) : null;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-[#0E1A29]/80 border border-sky-200/70 dark:border-sky-500/20 backdrop-blur-xl shadow-md shadow-sky-500/5 dark:shadow-2xl text-slate-800 dark:text-white transition-all">
      {/* Ambient background soft glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-400/20 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between space-y-6">
        {/* Top bar: Location & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 dark:bg-sky-500/25 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <MapPin size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {userLoc.city || 'Detecting Location...'}
                </h2>
                {userLoc.coordsFormatted && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-mono">
                    {userLoc.coordsFormatted}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {userLoc.fullAddress || 'Environmental Station'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${deviceStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{deviceStatus === 'online' ? 'ESP32 Live' : 'Reconnecting'}</span>
              <span className="text-slate-300 dark:text-white/20">·</span>
              <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                {lastUpdated ? formatRelativeTime(lastUpdated) : 'Live Sync'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Temperature & Weather Focal Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* Left Column: Huge Temperature & Condition */}
          <div className="md:col-span-7 flex items-center gap-6 sm:gap-8">
            {/* Dynamic Weather Icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.85, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-2 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 blur-md opacity-70"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1 right-1 text-amber-500 dark:text-amber-400"
              >
                <Sun size={32} />
              </motion.div>

              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 text-slate-700 dark:text-slate-100 drop-shadow-md"
              >
                {isRaining ? (
                  <CloudRain size={60} className="text-sky-500 dark:text-sky-400" />
                ) : (
                  <Cloud size={60} className="text-slate-200 dark:text-slate-100" />
                )}
              </motion.div>
            </div>

            {/* Large Temperature Display */}
            <div>
              {temp != null ? (
                <div className="flex items-baseline">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                    {temp}
                  </span>
                  <span className="text-3xl sm:text-4xl text-sky-600 dark:text-sky-400 font-light ml-1.5">°C</span>
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-semibold text-slate-400 dark:text-slate-500">
                  {noData ? 'Awaiting Telemetry…' : 'Sensor Offline'}
                </div>
              )}

              <div className="mt-1">
                <div className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                  {condition}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Compact Environmental Summaries */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-sky-100 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                Feels Like
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                {feelsLike != null ? `${feelsLike}°C` : '—'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Heat index comfort</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-sky-100 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                Day Range
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                <span className="text-rose-500 flex items-center"><ArrowUp size={12} />{highTemp || '—'}°</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-sky-500 flex items-center"><ArrowDown size={12} />{lowTemp || '—'}°</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Estimated min / max</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-sky-100 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                Surface Rain
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                {rain != null ? `${rain} mm/h` : '0.0 mm/h'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {isRaining ? 'Active rain' : 'Dry surface'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-sky-100 dark:border-white/[0.06] shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                Pressure
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                {pressure != null ? `${pressure} hPa` : '—'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Atmospheric level</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
