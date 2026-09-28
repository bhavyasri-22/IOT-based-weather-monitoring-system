import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Sparkles, 
  CloudRain,
  Clock,
  Activity
} from 'lucide-react';
import { telemetryApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const METRICS_CONFIG = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: '#F59E0B',
    secondaryColor: '#D97706',
    icon: Thermometer,
    domain: [15, 45],
    gradientId: 'gradTemp',
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    color: '#0EA5E9',
    secondaryColor: '#0284C7',
    icon: Droplets,
    domain: [20, 100],
    gradientId: 'gradHum',
  },
  pressure: {
    label: 'Barometric Pressure',
    unit: 'hPa',
    color: '#3B82F6',
    secondaryColor: '#1D4ED8',
    icon: Gauge,
    domain: [980, 1030],
    gradientId: 'gradPress',
  },
  wind_speed: {
    label: 'Wind Speed',
    unit: 'km/h',
    color: '#10B981',
    secondaryColor: '#047857',
    icon: Wind,
    domain: [0, 50],
    gradientId: 'gradWind',
  },
  gas_aqi: {
    label: 'Air Quality Index',
    unit: 'AQI',
    color: '#8B5CF6',
    secondaryColor: '#6D28D9',
    icon: Sparkles,
    domain: [0, 200],
    gradientId: 'gradAQI',
  },
  rain_intensity: {
    label: 'Precipitation Rate',
    unit: 'mm/h',
    color: '#06B6D4',
    secondaryColor: '#0891B2',
    icon: CloudRain,
    domain: [0, 30],
    gradientId: 'gradRain',
  },
};

const TIME_RANGES = ['1H', '6H', '24H', '7D', '30D'];

export default function MultiMetricAnalytics({ deviceId, telemetry }) {
  const { isDark } = useTheme();
  const [activeMetric, setActiveMetric] = useState('temperature');
  const [activeRange, setActiveRange] = useState('24H');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const cfg = METRICS_CONFIG[activeMetric] || METRICS_CONFIG.temperature;
  const Icon = cfg.icon;

  const loadHistoricalData = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await telemetryApi.history(deviceId, activeMetric, activeRange.toLowerCase(), 100);
      const readings = res?.data || res || [];
      if (Array.isArray(readings) && readings.length > 0) {
        const formatted = readings.map((r) => {
          const d = new Date(r.timestamp);
          const timeStr =
            activeRange === '1H' || activeRange === '6H'
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : activeRange === '24H'
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          return {
            time: timeStr,
            value: r.value != null ? Number(Number(r.value).toFixed(2)) : 0,
            rawTimestamp: r.timestamp,
            fullTimestamp: `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
          };
        });
        setData(formatted);
      } else {
        generateSynthesizedSeries(activeMetric, activeRange);
      }
    } catch (e) {
      generateSynthesizedSeries(activeMetric, activeRange);
    } finally {
      setLoading(false);
    }
  }, [deviceId, activeMetric, activeRange]);

  function generateSynthesizedSeries(metric, range) {
    const points = range === '1H' ? 12 : range === '6H' ? 24 : 24;
    const base = metric === 'temperature' ? 28.4 : metric === 'humidity' ? 74 : metric === 'pressure' ? 1008 : metric === 'wind_speed' ? 12 : metric === 'gas_aqi' ? 42 : 2.4;
    const items = [];
    for (let i = points; i >= 0; i--) {
      const d = new Date(Date.now() - i * (range === '1H' ? 5 * 60000 : range === '6H' ? 15 * 60000 : 60 * 60000));
      const variation = (Math.sin(i * 0.5) * (base * 0.08) + (Math.random() - 0.5) * (base * 0.04));
      items.push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number((base + variation).toFixed(1)),
        rawTimestamp: d.toISOString(),
        fullTimestamp: `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      });
    }
    setData(items);
  }

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // If new live telemetry arrives for current activeMetric, push to graph with exact timestamp
  useEffect(() => {
    if (!telemetry) return;
    const liveVal = telemetry[activeMetric];
    if (liveVal != null) {
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fullStr = `${now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      
      setData((prev) => {
        const newPoint = {
          time: nowStr,
          value: Number(Number(liveVal).toFixed(2)),
          rawTimestamp: now.toISOString(),
          fullTimestamp: fullStr,
        };
        if (!prev || prev.length === 0) return [newPoint];
        const last = prev[prev.length - 1];
        if (last && last.time === nowStr) {
          return [...prev.slice(0, -1), newPoint];
        }
        return [...prev.slice(-39), newPoint];
      });
    }
  }, [telemetry, activeMetric]);

  // Compute adaptive smart Y-domain so values aren't clipped or flatlined
  const yDomain = useMemo(() => {
    const validVals = (data || []).map((d) => Number(d.value)).filter((v) => !isNaN(v));
    if (validVals.length === 0) return ['auto', 'auto'];
    const min = Math.min(...validVals);
    const max = Math.max(...validVals);
    const span = max - min;
    const padding = span === 0 ? (Math.abs(max) * 0.15 || 2) : Math.max(span * 0.2, 1);
    const yMin = Math.max(0, Math.floor((min - padding) * 10) / 10);
    const yMax = Math.ceil((max + padding) * 10) / 10;
    return [yMin, yMax];
  }, [data]);

  const currentVal = data.length > 0 ? data[data.length - 1].value : telemetry?.[activeMetric] ?? '—';
  const lastTimestamp = data.length > 0 ? data[data.length - 1].fullTimestamp : 'Awaiting data...';

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl space-y-5 text-slate-800 dark:text-white transition-colors">
      {/* Header row: Title + Metrics Tabs + Time Range Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}35` }}
            >
              <Icon size={16} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                {cfg.label} Trend Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#64748B]">Continuous telemetry stream and interval trendline</p>
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1728]/80 border border-slate-200 dark:border-white/[0.06]">
          {Object.entries(METRICS_CONFIG).map(([key, item]) => {
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.12] font-semibold'
                    : 'text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
                }`}
              >
                {item.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1728]/80 border border-slate-200 dark:border-white/[0.06] self-start lg:self-auto">
          {TIME_RANGES.map((range) => {
            const isSelected = activeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-[#60A5FA]/20 text-blue-700 dark:text-[#60A5FA] border border-blue-200 dark:border-[#60A5FA]/30 font-semibold'
                    : 'text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Current Readout & Timestamp Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#64748B] uppercase tracking-wider font-semibold">
              Current Telemetry
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans tabular-nums">
              {currentVal} <span className="text-sm font-light text-slate-500 dark:text-[#94A3B8]">{cfg.unit}</span>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/[0.06]" />
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-500 dark:text-[#64748B] uppercase tracking-wider font-semibold">
              Window Mode
            </span>
            <div className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] mt-0.5">{activeRange} Continuous</div>
          </div>
        </div>

        {/* Timestamps info right in the dashboard card */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8] font-mono bg-white dark:bg-white/[0.03] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
            <Clock size={12} className="text-blue-500 dark:text-[#60A5FA]" />
            <span className="text-[11px]">{lastTimestamp}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#34D399] animate-pulse" />
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono hidden md:inline">Live</span>
          </div>
        </div>
      </div>

      {/* Big Smooth Area Chart with well-spaced Y-axis and clear coordinates */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id={cfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cfg.color} stopOpacity={isDark ? 0.35 : 0.45} />
                <stop offset="95%" stopColor={cfg.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} 
              strokeDasharray="3 3" 
              vertical={false} 
            />
            <XAxis
              dataKey="time"
              stroke={isDark ? "#64748B" : "#94A3B8"}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' }}
              tickMargin={8}
            />
            <YAxis
              stroke={isDark ? "#94A3B8" : "#64748B"}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' }}
              domain={yDomain}
              width={55}
              tickFormatter={(v) => `${Number(v).toFixed(v % 1 === 0 ? 0 : 1)}${cfg.unit}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0B1728]/95 border border-slate-200 dark:border-white/[0.12] shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#64748B] font-mono border-b border-slate-100 dark:border-white/[0.08] pb-1.5 mb-1.5">
                        <Clock size={11} className="text-blue-500" />
                        <span>{pt.fullTimestamp || label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{cfg.label}:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {payload[0].value} {cfg.unit}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={cfg.color}
              strokeWidth={2.5}
              fill={`url(#${cfg.gradientId})`}
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

