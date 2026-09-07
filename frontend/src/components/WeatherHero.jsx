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
} from 'lucide-react';
import { calculateHeatIndex, deriveWeatherCondition } from '../utils/weatherUtils';

/**
 * WeatherHero – all values sourced exclusively from backend telemetry prop.
 * Never renders hardcoded placeholder readings.
 */
export default function WeatherHero({ telemetry, lastUpdated, deviceStatus }) {
  const T = telemetry || {};
  const noData = !telemetry;

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
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-[#101D2E]/70 border border-white/[0.08] backdrop-blur-2xl shadow-2xl">
      {/* Ambient glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* ── LEFT: Location + Temp + Sub-metrics */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-6">

          {/* Location + condition badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/25 flex items-center justify-center">
                <MapPin size={16} className="text-[#60A5FA]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">NITK Surathkal</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8] border border-white/[0.08] font-mono">
                    13.01°N 74.79°E
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-medium">Coastal Sensor Station 01 · Karnataka, India</p>
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
                  <span className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white font-sans">
                    {temp}
                  </span>
                  <span className="text-3xl sm:text-4xl text-[#60A5FA] font-light ml-1">°C</span>
                </div>
              ) : (
                <div className="text-4xl font-semibold text-[#64748B]">Sensor offline</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {feelsLike != null ? (
                  <span className="text-sm font-medium text-[#94A3B8]">
                    Feels like <span className="text-[#FBBF24] font-semibold">{feelsLike}°C</span>
                  </span>
                ) : (
                  <span className="text-sm text-[#64748B]">Heat index: —</span>
                )}
                {description && <><span className="text-xs text-[#64748B]">·</span><span className="text-xs text-[#64748B]">{description}</span></>}
              </div>
            </div>
          </div>

          {/* Sub-metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
            {[
              { label: 'Humidity',   value: fmt(humidity, '%'),      icon: Droplets, color: '#38BDF8' },
              { label: 'Wind',       value: fmt(windSpeed, ' km/h'), icon: Wind,     color: '#60A5FA' },
              { label: 'Pressure',   value: fmt(pressure, ' hPa'),   icon: Gauge,    color: '#FBBF24' },
              { label: 'Visibility', value: fmt(visibilityKm, ' km'),icon: Eye,      color: '#34D399' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] text-[#64748B] font-medium">{label}</p>
                  <p className="text-sm font-semibold text-[#F1F5F9]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Concentric Atmospheric Radar */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] relative">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Atmospheric Balance</span>
            <span className="text-[10px] text-[#60A5FA] font-mono px-2 py-0.5 rounded bg-[#60A5FA]/10 border border-[#60A5FA]/20">
              RADAR ACTIVE
            </span>
          </div>

          {/* Rotating concentric rings */}
          <div className="relative w-52 h-52 flex items-center justify-center my-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-[#60A5FA]/20"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#60A5FA] shadow-[0_0_8px_#60A5FA]" />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-4 rounded-full border border-[#38BDF8]/25"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
            </motion.div>

            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-9 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/5"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]" />
            </motion.div>

            {/* Center core */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-[#0B1728]/90 border border-white/10 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">AQI</span>
              <span className="text-xl font-bold leading-tight" style={{
                color: aqi == null ? '#64748B' : aqi <= 50 ? '#34D399' : aqi <= 100 ? '#60A5FA' : aqi <= 150 ? '#FBBF24' : '#F87171'
              }}>
                {aqi != null ? aqi : '—'}
              </span>
              <span className="text-[9px] font-semibold text-[#94A3B8]">
                {aqi == null ? 'N/A' : aqi <= 50 ? 'GOOD' : aqi <= 100 ? 'MODERATE' : aqi <= 150 ? 'SENSITIVE' : 'POOR'}
              </span>
            </div>
          </div>

          {/* Micro legend */}
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/[0.06] text-center text-[10px]">
            <div>
              <span className="text-[#64748B] block">Thermal</span>
              <span className="text-[#FBBF24] font-semibold">{fmt(temp, '°C')}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Moisture</span>
              <span className="text-[#38BDF8] font-semibold">{fmt(humidity, '%')}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Air Index</span>
              <span className="font-semibold" style={{
                color: aqi == null ? '#64748B' : aqi <= 50 ? '#34D399' : '#F87171'
              }}>{aqi != null ? `${aqi} AQI` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
