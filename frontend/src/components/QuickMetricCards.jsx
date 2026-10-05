import React from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Droplets, Gauge, Wind, Sparkles, CloudRain, AlertTriangle
} from 'lucide-react';
import { getAQIStatus } from '../utils/weatherUtils';

/**
 * Mini SVG Sparkline – renders null-safe (needs at least 2 real points)
 */
function Sparkline({ data = [], color = '#60A5FA' }) {
  const valid = data.filter((v) => v != null);
  if (valid.length < 2) return <div className="w-16 h-6" />;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const W = 64, H = 24;
  const pts = valid
    .map((v, i) => {
      const x = (i / (valid.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} className="overflow-visible flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

import { sanitizeRain } from '../utils/weatherUtils';

export default function QuickMetricCards({ telemetry, activeAlerts = [] }) {
  const T = telemetry || {};

  // ── Read values from backend – null if not available
  const temp  = T.temperature    != null ? Number(T.temperature).toFixed(1)    : null;
  const hum   = T.humidity       != null ? Math.round(T.humidity)              : null;
  const pres  = T.pressure       != null ? Math.round(T.pressure)              : null;
  const wind  = T.wind_speed     != null ? Number(T.wind_speed).toFixed(1)     : null;
  const aqi   = T.gas_aqi        != null ? Math.round(T.gas_aqi)               : null;
  const cleanRainNum = sanitizeRain(T.rain_intensity);
  const rain  = cleanRainNum != null ? cleanRainNum.toFixed(1) : null;
  const dir   = T.wind_direction != null ? T.wind_direction                    : null;

  // Helper to check if any active alert matches a parameter
  const hasActiveAlert = (paramKey) => {
    return Array.isArray(activeAlerts) && activeAlerts.some(
      (a) => (a.parameter === paramKey || a.parameter?.toLowerCase() === paramKey.toLowerCase()) && 
             (a.status === 'active' || !a.resolved) &&
             !(paramKey === 'rain_intensity' && (a.trigger_value >= 100 || (a.message && a.message.includes('4095'))))
    );
  };

  // Compute compass direction label from degrees
  const degreesToCardinal = (d) => {
    if (d == null) return '—';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round((d % 360) / 22.5) % 16];
  };

  // Dynamic evaluation for Temperature (Exceeding threshold will NOT show normal)
  const evalTemp = () => {
    if (temp == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const num = parseFloat(temp);
    const alert = hasActiveAlert('temperature');
    if (alert || num >= 38) {
      return { status: '⚠ CRITICAL: HIGH', sub: `Exceeds 38°C limit (${num}°C)`, color: '#EF4444', isAlert: true };
    }
    if (num >= 32) {
      return { status: '⚠ WARNING: HIGH', sub: `Above 32°C threshold`, color: '#F59E0B', isAlert: true };
    }
    if (num <= 15) {
      return { status: '❄ LOW TEMP', sub: `Below 15°C cold limit`, color: '#38BDF8', isAlert: true };
    }
    return { status: 'Normal · Optimal', sub: 'Within 20–30°C comfort', color: '#10B981', isAlert: false };
  };

  // Dynamic evaluation for Humidity
  const evalHum = () => {
    if (hum == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const alert = hasActiveAlert('humidity');
    if (alert || hum >= 90) {
      return { status: '⚠ CRITICAL: HIGH', sub: `Extreme moisture (${hum}%)`, color: '#EF4444', isAlert: true };
    }
    if (hum >= 80) {
      return { status: '⚠ WARNING: HIGH', sub: `High moisture (${hum}%)`, color: '#F59E0B', isAlert: true };
    }
    if (hum <= 25) {
      return { status: '↓ LOW MOISTURE', sub: `Dry air limit (${hum}%)`, color: '#F59E0B', isAlert: true };
    }
    return { status: 'Normal · Optimal', sub: 'Target 40–75%', color: '#10B981', isAlert: false };
  };

  // Dynamic evaluation for Pressure
  const evalPres = () => {
    if (pres == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const alert = hasActiveAlert('pressure');
    if (alert || pres < 980) {
      return { status: '⚠ CRITICAL: LOW', sub: 'Depression / Storm breach', color: '#EF4444', isAlert: true };
    }
    if (pres < 995) {
      return { status: '⚠ WARNING: LOW', sub: 'Low barometric trend', color: '#F59E0B', isAlert: true };
    }
    if (pres > 1025) {
      return { status: '⚠ WARNING: HIGH', sub: 'Anticyclone high pressure', color: '#F59E0B', isAlert: true };
    }
    return { status: 'Normal', sub: 'Standard barometric', color: '#10B981', isAlert: false };
  };

  // Dynamic evaluation for Wind
  const evalWind = () => {
    if (wind == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const num = parseFloat(wind);
    const alert = hasActiveAlert('wind_speed');
    if (alert || num >= 35) {
      return { status: '⚠ GALE BREACH', sub: `Gale force (${num} km/h)`, color: '#EF4444', isAlert: true };
    }
    if (num >= 25) {
      return { status: '⚠ WARNING: HIGH', sub: `Strong wind (${num} km/h)`, color: '#F59E0B', isAlert: true };
    }
    return { 
      status: 'Normal', 
      sub: dir != null ? `${degreesToCardinal(dir)} · ${dir}° direction` : 'Breeze', 
      color: '#10B981', 
      isAlert: false 
    };
  };

  // Dynamic evaluation for AQI
  const evalAqi = () => {
    if (aqi == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const alert = hasActiveAlert('gas_aqi');
    if (alert || aqi >= 150) {
      return { status: '⚠ UNHEALTHY', sub: `Breached safety (${aqi} AQI)`, color: '#EF4444', isAlert: true };
    }
    if (aqi >= 100) {
      return { status: '⚠ MODERATE ALERT', sub: `Sensitive groups (${aqi} AQI)`, color: '#F59E0B', isAlert: true };
    }
    if (aqi <= 50) {
      return { status: 'Good · Clean', sub: 'MQ135 optimal air', color: '#10B981', isAlert: false };
    }
    return { status: 'Normal · Moderate', sub: 'Acceptable quality', color: '#3B82F6', isAlert: false };
  };

  // Dynamic evaluation for Rain
  const evalRain = () => {
    if (rain == null) return { status: '—', sub: 'Awaiting data', color: '#64748B', isAlert: false };
    const num = parseFloat(rain);
    const alert = hasActiveAlert('rain_intensity');
    if (alert || num >= 15) {
      return { status: '⚠ HEAVY FLOOD ALERT', sub: `Rain rate ${num} mm/h`, color: '#EF4444', isAlert: true };
    }
    if (num >= 5) {
      return { status: '⚠ RAIN ALERT', sub: `Moderate rain ${num} mm/h`, color: '#F59E0B', isAlert: true };
    }
    if (num > 0.5) {
      return { status: 'Light Rain', sub: `Precipitation ${num} mm/h`, color: '#0EA5E9', isAlert: false };
    }
    return { status: 'Normal · Dry', sub: 'Dry sensor surface', color: '#10B981', isAlert: false };
  };

  const tEval = evalTemp();
  const hEval = evalHum();
  const pEval = evalPres();
  const wEval = evalWind();
  const aEval = evalAqi();
  const rEval = evalRain();

  const mkSpark = (base) => base != null
    ? [base * 0.94, base * 0.96, base * 0.97, base * 0.99, base, base * 1.01, base * 1.02, base]
    : [];

  const cards = [
    {
      id: 'temp',
      title: 'Temperature',
      value: temp != null ? `${temp}°C` : '—',
      status: tEval.status,
      subText: tEval.sub,
      statusColor: tEval.color,
      isAlert: tEval.isAlert,
      themeColor: '#F59E0B',
      icon: Thermometer,
      spark: mkSpark(parseFloat(temp)),
    },
    {
      id: 'humidity',
      title: 'Humidity',
      value: hum != null ? `${hum}%` : '—',
      status: hEval.status,
      subText: hEval.sub,
      statusColor: hEval.color,
      isAlert: hEval.isAlert,
      themeColor: '#0EA5E9',
      icon: Droplets,
      spark: mkSpark(hum),
    },
    {
      id: 'pressure',
      title: 'Pressure',
      value: pres != null ? `${pres} hPa` : '—',
      status: pEval.status,
      subText: pEval.sub,
      statusColor: pEval.color,
      isAlert: pEval.isAlert,
      themeColor: '#3B82F6',
      icon: Gauge,
      spark: mkSpark(pres),
    },
    {
      id: 'wind',
      title: 'Wind Speed',
      value: wind != null ? `${wind} km/h` : '—',
      status: wEval.status,
      subText: wEval.sub,
      statusColor: wEval.color,
      isAlert: wEval.isAlert,
      themeColor: '#10B981',
      icon: Wind,
      spark: mkSpark(parseFloat(wind)),
    },
    {
      id: 'aqi',
      title: 'Air Quality',
      value: aqi != null ? `AQI ${aqi}` : '—',
      status: aEval.status,
      subText: aEval.sub,
      statusColor: aEval.color,
      isAlert: aEval.isAlert,
      themeColor: '#8B5CF6',
      icon: Sparkles,
      spark: mkSpark(aqi),
    },
    {
      id: 'rain',
      title: 'Rainfall',
      value: rain != null ? `${rain} mm/h` : '—',
      status: rEval.status,
      subText: rEval.sub,
      statusColor: rEval.color,
      isAlert: rEval.isAlert,
      themeColor: '#06B6D4',
      icon: CloudRain,
      spark: mkSpark(parseFloat(rain)),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((c, index) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            className={`group relative p-4 rounded-xl backdrop-blur-xl transition-all duration-200 shadow-sm dark:shadow-lg ${
              c.isAlert
                ? 'bg-rose-50/60 dark:bg-[#1C131D]/90 border border-rose-300/80 dark:border-rose-500/40 hover:border-rose-400'
                : 'bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-white/[0.18]'
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: `${c.statusColor}18`,
                  color: c.statusColor,
                  border: `1px solid ${c.statusColor}35`,
                }}
              >
                <Icon size={16} strokeWidth={2} />
              </div>
              <Sparkline data={c.spark} color={c.statusColor} />
            </div>

            {/* Label + Value */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
                  {c.title}
                </p>
                {c.isAlert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight mt-1 tabular-nums">
                {c.value}
              </p>
            </div>

            {/* Bottom status – dynamically reflects actual threshold state */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] gap-1">
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] truncate max-w-[130px] border ${
                  c.isAlert ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: `${c.statusColor}15`,
                  color: c.statusColor,
                  borderColor: `${c.statusColor}30`,
                }}
              >
                {c.status}
              </span>
              <span className="text-slate-400 dark:text-[#64748B] text-[10px] truncate text-right">
                {c.subText}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
