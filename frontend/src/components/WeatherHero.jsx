import React from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  Wind,
  Gauge,
  Eye,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Sparkles,
  Clock,
} from 'lucide-react';
import { calculateHeatIndex, deriveWeatherCondition, formatRelativeTime } from '../utils/weatherUtils';
import useUserLocation from '../hooks/useUserLocation';

/**
 * WeatherHero – all values sourced exclusively from backend telemetry prop.
 * Never renders hardcoded placeholder readings.
 */
export default function WeatherHero({ telemetry, lastUpdated, deviceStatus }) {
  const T = telemetry || {};
  const noData = !telemetry;
  const userLoc = useUserLocation();

  // ── Raw values (null-safe)
  const temp      = T.temperature  != null ? Number(T.temperature).toFixed(1)  : null;
  const humidity  = T.humidity     != null ? Math.round(T.humidity)             : null;
  const windSpeed = T.wind_speed   != null ? Number(T.wind_speed).toFixed(1)   : null;
  const pressure  = T.pressure     != null ? Math.round(T.pressure)             : null;
  const rain      = T.rain_intensity != null ? Number(T.rain_intensity).toFixed(1) : null;
  const aqi       = T.gas_aqi      != null ? Math.round(T.gas_aqi)             : null;
  const lux       = T.light_lux    != null ? Math.round(T.light_lux)           : null;

  // ── Derived
  const feelsLike  = temp != null && humidity != null
    ? calculateHeatIndex(parseFloat(temp), humidity)
    : null;

  const { condition, description } = deriveWeatherCondition(T);

  // Visibility approximation from humidity & lux
  const visibilityKm = (humidity != null && lux != null)
    ? Math.max(2.4, Math.min(12.0,
        10 - (humidity > 80 ? (humidity - 80) * 0.2 : 0) + (lux > 500 ? 1 : 0)
      )).toFixed(1)
    : null;

  const isRaining = rain != null && parseFloat(rain) > 0.5;

  // ── Display helpers
  const fmt = (val, suffix = '') => val != null ? `${val}${suffix}` : '—';

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#101D2E]/70 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-2xl shadow-sm dark:shadow-2xl transition-colors text-slate-800 dark:text-white">
      {/* Ambient glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 dark:bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400/10 dark:bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* ── Location + Temp + Sub-metrics */}
        <div className="flex flex-col justify-between space-y-6">

          {/* Location + condition badge + timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-[#60A5FA]/10 border border-blue-500/25 dark:border-[#60A5FA]/25 flex items-center justify-center">
                <MapPin size={17} className="text-blue-600 dark:text-[#60A5FA]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {userLoc.city || 'Detecting Location...'}
                  </h2>
                  {userLoc.coordsFormatted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.08] font-mono">
                      {userLoc.coordsFormatted}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-[#64748B]">
                  <span>{userLoc.fullAddress || 'Environmental Station'}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono text-blue-600 dark:text-[#60A5FA] font-medium bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/20">
                    <Clock size={11} />
                    {lastUpdated ? `${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${formatRelativeTime(lastUpdated)})` : 'Live Sync'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              {noData ? (
                <span className="text-xs text-[#64748B]">Awaiting telemetry…</span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="text-xs font-medium text-[#E2E8F0]">{condition}</span>
                </>
              )}
            </div>
          </div>

          {/* Animated icon + big temperature */}
          <div className="flex items-center gap-6 sm:gap-10">
            {/* Weather condition icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-2 right-2 w-14 h-14 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] blur-[6px] opacity-80"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1 right-1 text-[#FBBF24] opacity-90"
              >
                <Sun size={32} />
              </motion.div>

              <motion.div
                animate={{ y: [-3, 3, -3], x: [-1, 2, -1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 text-[#E2E8F0] drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              >
                {isRaining ? (
                  <CloudRain size={58} className="text-[#38BDF8]" />
                ) : (
                  <Cloud size={58} className="text-[#F1F5F9]" />
                )}
              </motion.div>

              {/* Rain drops */}
              {isRaining && (
                <div className="absolute bottom-2 left-6 flex gap-2">
                  {[0, 0.4, 0.8].map((delay) => (
                    <motion.span
                      key={delay}
                      animate={{ y: [0, 8, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'linear' }}
                      className="w-0.5 h-2 rounded bg-[#38BDF8]"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Temperature display */}
            <div>
              {temp != null ? (
                <div className="flex items-baseline">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    {temp}
                  </span>
                  <span className="text-3xl sm:text-4xl text-blue-600 dark:text-[#60A5FA] font-light ml-1">°C</span>
                </div>
              ) : (
                <div className="text-4xl font-semibold text-slate-400 dark:text-[#64748B]">Sensor offline</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {feelsLike != null ? (
                  <span className="text-sm font-medium text-slate-600 dark:text-[#94A3B8]">
                    Feels like <span className="text-amber-500 font-bold">{feelsLike}°C</span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 dark:text-[#64748B]">Heat index: —</span>
                )}
                {description && <><span className="text-xs text-slate-400 dark:text-[#64748B]">·</span><span className="text-xs text-slate-500 dark:text-[#64748B]">{description}</span></>}
              </div>
            </div>
          </div>

          {/* Sub-metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-white/[0.06]">
            {[
              { label: 'Humidity',   value: fmt(humidity, '%'),      icon: Droplets, color: '#0EA5E9' },
              { label: 'Wind',       value: fmt(windSpeed, ' km/h'), icon: Wind,     color: '#3B82F6' },
              { label: 'Pressure',   value: fmt(pressure, ' hPa'),   icon: Gauge,    color: '#F59E0B' },
              { label: 'Visibility', value: fmt(visibilityKm, ' km'),icon: Eye,      color: '#10B981' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-[#64748B] font-medium">{label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
