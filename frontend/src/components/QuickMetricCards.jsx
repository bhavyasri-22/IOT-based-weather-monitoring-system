import React from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Droplets, Gauge, Wind, Sparkles, CloudRain,
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

export default function QuickMetricCards({ telemetry }) {
  const T = telemetry || {};

  // ── Read values from backend – null if not available
  const temp  = T.temperature    != null ? Number(T.temperature).toFixed(1)    : null;
  const hum   = T.humidity       != null ? Math.round(T.humidity)              : null;
  const pres  = T.pressure       != null ? Math.round(T.pressure)              : null;
  const wind  = T.wind_speed     != null ? Number(T.wind_speed).toFixed(1)     : null;
  const aqi   = T.gas_aqi        != null ? Math.round(T.gas_aqi)               : null;
  const rain  = T.rain_intensity != null ? Number(T.rain_intensity).toFixed(1) : null;
  const dir   = T.wind_direction != null ? T.wind_direction                    : null;

  const aqiInfo = getAQIStatus(aqi);

  // Compute compass direction label from degrees
  const degreesToCardinal = (d) => {
    if (d == null) return '—';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round((d % 360) / 22.5) % 16];
  };

  // Sparkline placeholders – in production these would be pulled from history
  const mkSpark = (base) => base != null
    ? [base * 0.94, base * 0.96, base * 0.97, base * 0.99, base, base * 1.01, base * 1.02, base]
    : [];

  const cards = [
    {
      id: 'temp',
      title: 'Temperature',
      value: temp != null ? `${temp}°C` : '—',
      delta: temp != null ? (parseFloat(temp) > 35 ? '⚠ Hot' : parseFloat(temp) < 20 ? '❄ Cool' : 'Normal') : '—',
      deltaSub: 'Thermal band',
      color: '#FBBF24',
      icon: Thermometer,
      spark: mkSpark(parseFloat(temp)),
    },
    {
      id: 'humidity',
      title: 'Humidity',
      value: hum != null ? `${hum}%` : '—',
      delta: hum != null ? (hum > 85 ? '⚠ High' : hum < 35 ? '↓ Low' : 'Optimal') : '—',
      deltaSub: 'Target 40–75%',
      color: '#38BDF8',
      icon: Droplets,
      spark: mkSpark(hum),
    },
    {
      id: 'pressure',
      title: 'Pressure',
      value: pres != null ? `${pres} hPa` : '—',
      delta: pres != null ? (pres > 1015 ? 'High' : pres < 1000 ? 'Low' : 'Normal') : '—',
      deltaSub: 'Barometric',
      color: '#60A5FA',
      icon: Gauge,
      spark: mkSpark(pres),
    },
    {
      id: 'wind',
      title: 'Wind Speed',
      value: wind != null ? `${wind} km/h` : '—',
      delta: dir != null ? `${degreesToCardinal(dir)} · ${dir}°` : '—',
      deltaSub: wind != null ? (parseFloat(wind) > 30 ? '⚠ Gale' : 'Breeze') : 'No data',
      color: '#34D399',
      icon: Wind,
      spark: mkSpark(parseFloat(wind)),
    },
    {
      id: 'aqi',
      title: 'Air Quality',
      value: aqi != null ? `AQI ${aqi}` : '—',
      delta: aqiInfo.text,
      deltaSub: 'MQ135 sensor',
      color: aqiInfo.color,
      icon: Sparkles,
      spark: mkSpark(aqi),
    },
    {
      id: 'rain',
      title: 'Rainfall',
      value: rain != null ? `${rain} mm/h` : '—',
      delta: rain != null ? (parseFloat(rain) > 15 ? '⚠ Heavy' : parseFloat(rain) > 0.5 ? 'Light Rain' : 'Dry') : '—',
      deltaSub: 'FC-37 sensor',
      color: '#818CF8',
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
            className="group relative p-4 rounded-xl bg-[#101D2E]/80 border border-white/[0.08] hover:border-white/[0.18] backdrop-blur-xl shadow-lg transition-all duration-200"
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <Sparkline data={c.spark} color={c.color} />
            </div>

            {/* Label + Value */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">{c.title}</p>
              <p className="text-xl sm:text-2xl font-semibold text-white font-sans tracking-tight mt-1">
                {c.value}
              </p>
            </div>

            {/* Bottom status */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
              <span className="font-medium px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}>
                {c.delta}
              </span>
              <span className="text-[#64748B] text-[10px]">{c.deltaSub}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
