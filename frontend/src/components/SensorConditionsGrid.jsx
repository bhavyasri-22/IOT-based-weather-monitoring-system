import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Activity,
  Gauge,
  Sun,
  Wind
} from 'lucide-react';
import { sanitizeRain } from '../utils/weatherUtils';

export default function SensorConditionsGrid({ telemetry }) {
  const T = telemetry || {};

  // ── Raw values (null-safe and sanitized)
  const temp = T.temperature != null ? Number(T.temperature).toFixed(1) : null;
  const humidity = T.humidity != null ? Math.round(T.humidity) : null;
  const rainNum = sanitizeRain(T.rain_intensity);
  const rain = rainNum != null ? rainNum.toFixed(1) : '0.0';
  const aqi = T.gas_aqi != null ? Math.round(T.gas_aqi) : null;
  const pressure = T.pressure != null ? Math.round(T.pressure) : null;
  const lux = T.light_lux != null ? Math.round(T.light_lux) : null;
  const windSpeed = T.wind_speed != null ? Number(T.wind_speed).toFixed(1) : null;

  // Derive status texts
  const getTempStatus = (v) => {
    if (v == null) return { text: 'Sensor Offline', color: 'text-slate-400' };
    const n = parseFloat(v);
    if (n > 35) return { text: 'High Heat', color: 'text-rose-500' };
    if (n < 18) return { text: 'Cool Temp', color: 'text-sky-500' };
    return { text: 'Comfortable', color: 'text-emerald-500' };
  };

  const getHumStatus = (v) => {
    if (v == null) return { text: 'Sensor Offline', color: 'text-slate-400' };
    if (v > 80) return { text: 'High Humidity', color: 'text-amber-500' };
    if (v < 30) return { text: 'Dry Air', color: 'text-amber-500' };
    return { text: 'Optimal Moisture', color: 'text-emerald-500' };
  };

  const getRainStatus = (v) => {
    if (v == null || parseFloat(v) <= 0.5) return { text: 'Dry Surface', color: 'text-emerald-500' };
    const n = parseFloat(v);
    if (n > 15) return { text: 'Heavy Rain', color: 'text-rose-500' };
    if (n > 5) return { text: 'Moderate Rain', color: 'text-amber-500' };
    return { text: 'Light Showers', color: 'text-sky-500' };
  };

  const getAqiStatus = (v) => {
    if (v == null) return { text: 'Calibrating / Pending', color: 'text-slate-400' };
    if (v <= 50) return { text: 'Good · Clean Air', color: 'text-emerald-500' };
    if (v <= 100) return { text: 'Moderate Quality', color: 'text-sky-500' };
    if (v <= 150) return { text: 'Sensitive Groups', color: 'text-amber-500' };
    return { text: 'Unhealthy Proxy', color: 'text-rose-500' };
  };

  const tempStat = getTempStatus(temp);
  const humStat = getHumStatus(humidity);
  const rainStat = getRainStatus(rain);
  const aqiStat = getAqiStatus(aqi);

  const sensors = [
    {
      id: 'temperature',
      label: 'Temperature',
      sensor: 'BME280',
      value: temp != null ? temp : '—',
      unit: '°C',
      status: tempStat.text,
      statusColor: tempStat.color,
      icon: Thermometer,
      accent: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/15',
      borderAccent: 'border-rose-500/20'
    },
    {
      id: 'humidity',
      label: 'Relative Humidity',
      sensor: 'BME280',
      value: humidity != null ? humidity : '—',
      unit: '%',
      status: humStat.text,
      statusColor: humStat.color,
      icon: Droplets,
      accent: 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/15',
      borderAccent: 'border-sky-500/20'
    },
    {
      id: 'rainfall',
      label: 'Rainfall Intensity',
      sensor: 'FC-37',
      value: rain,
      unit: 'mm/h',
      status: rainStat.text,
      statusColor: rainStat.color,
      icon: CloudRain,
      accent: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15',
      borderAccent: 'border-blue-500/20'
    },
    {
      id: 'air_quality',
      label: 'Air Quality (MQ135)',
      sensor: 'MQ-135 Gas',
      value: aqi != null ? aqi : '—',
      unit: 'AQI Proxy',
      status: aqiStat.text,
      statusColor: aqiStat.color,
      icon: Activity,
      accent: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15',
      borderAccent: 'border-emerald-500/20'
    },
    {
      id: 'pressure',
      label: 'Barometric Pressure',
      sensor: 'BME280',
      value: pressure != null ? pressure : '—',
      unit: 'hPa',
      status: pressure != null && pressure < 1000 ? 'Low Pressure' : 'Normal Sea Level',
      statusColor: pressure != null && pressure < 1000 ? 'text-amber-500' : 'text-emerald-500',
      icon: Gauge,
      accent: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
      borderAccent: 'border-amber-500/20'
    },
    {
      id: 'lux',
      label: 'Ambient Light',
      sensor: 'BH1750',
      value: lux != null ? lux : '—',
      unit: 'lux',
      status: lux != null ? (lux > 500 ? 'Daylight Solar' : 'Shaded / Night') : 'Sensor Offline',
      statusColor: 'text-slate-400',
      icon: Sun,
      accent: 'bg-amber-400/10 text-amber-500 dark:bg-amber-400/15',
      borderAccent: 'border-amber-400/20'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          Current Sensor Telemetry
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Direct hardware readings
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {sensors.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="rounded-2xl p-4 bg-white dark:bg-[#0E1A29]/80 border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {s.label}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.accent}`}>
                  <Icon size={14} />
                </div>
              </div>

              <div className="my-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans tabular-nums">
                    {s.value}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {s.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className={`font-medium ${s.statusColor} truncate`}>
                  {s.status}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {s.sensor}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
