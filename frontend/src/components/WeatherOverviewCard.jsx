import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
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
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/95 border border-sky-200/80 backdrop-blur-xl shadow-xs text-slate-800 transition-all">
      {/* Ambient background soft glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between space-y-6">
        {/* Top bar: Location & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600">
              <MapPin size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {userLoc.city || 'Detecting Location...'}
                </h2>
                {userLoc.coordsFormatted && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-mono">
                    {userLoc.coordsFormatted}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {userLoc.fullAddress || 'Environmental Station'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
              <span className={`w-2 h-2 rounded-full ${deviceStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{deviceStatus === 'online' ? 'ESP32 Live' : 'Reconnecting'}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-[11px] text-sky-600">
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
                className="absolute top-1 right-1 text-amber-500"
              >
                <Sun size={32} />
              </motion.div>

              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 text-slate-700 drop-shadow-xs"
              >
                {isRaining ? (
                  <CloudRain size={60} className="text-sky-500" />
                ) : (
                  <Cloud size={60} className="text-slate-300" />
                )}
              </motion.div>
            </div>

            {/* Large Temperature Display */}
            <div>
              {temp != null ? (
                <div className="flex items-baseline">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 font-sans">
                    {temp}
                  </span>
                  <span className="text-3xl sm:text-4xl text-sky-600 font-light ml-1.5">°C</span>
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-semibold text-slate-400">
                  {noData ? 'Awaiting Telemetry…' : 'Sensor Offline'}
                </div>
              )}

              <div className="mt-1">
                <div className="text-lg font-bold text-slate-800 tracking-tight">
                  {condition}
                </div>
                <div className="text-xs text-slate-500">
                  {description}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Compact Environmental Summaries */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Feels Like
              </span>
              <div className="text-lg font-bold text-slate-900 font-sans">
                {feelsLike != null ? `${feelsLike}°C` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">Heat index comfort</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Day Range
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                <span className="text-rose-500 flex items-center"><ArrowUp size={12} />{highTemp || '—'}°</span>
                <span className="text-slate-300">/</span>
                <span className="text-sky-500 flex items-center"><ArrowDown size={12} />{lowTemp || '—'}°</span>
              </div>
              <span className="text-[10px] text-slate-500">Estimated min / max</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Surface Rain
              </span>
              <div className="text-lg font-bold text-slate-900 font-sans">
                {rain != null ? `${rain} mm/h` : '0.0 mm/h'}
              </div>
              <span className="text-[10px] text-slate-500">
                {isRaining ? 'Active rain' : 'Dry surface'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Pressure
              </span>
              <div className="text-lg font-bold text-slate-900 font-sans">
                {pressure != null ? `${pressure} hPa` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">Atmospheric level</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
