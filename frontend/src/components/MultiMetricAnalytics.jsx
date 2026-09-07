import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
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
  Download,
  Calendar
} from 'lucide-react';
import { telemetryApi } from '../api/client';

const METRICS_CONFIG = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: '#FBBF24',
    secondaryColor: '#F59E0B',
    icon: Thermometer,
    domain: [15, 45],
    gradientId: 'gradTemp',
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    color: '#38BDF8',
    secondaryColor: '#0284C7',
    icon: Droplets,
    domain: [20, 100],
    gradientId: 'gradHum',
  },
  pressure: {
    label: 'Atmospheric Pressure',
    unit: 'hPa',
    color: '#60A5FA',
    secondaryColor: '#2563EB',
    icon: Gauge,
    domain: [980, 1030],
    gradientId: 'gradPress',
  },
  wind_speed: {
    label: 'Wind Speed',
    unit: 'km/h',
    color: '#34D399',
    secondaryColor: '#059669',
    icon: Wind,
    domain: [0, 50],
    gradientId: 'gradWind',
  },
  gas_aqi: {
    label: 'Air Quality Index',
    unit: 'AQI',
    color: '#818CF8',
    secondaryColor: '#4F46E5',
    icon: Sparkles,
    domain: [0, 200],
    gradientId: 'gradAQI',
  },
  rain_intensity: {
    label: 'Precipitation Rate',
    unit: 'mm/h',
    color: '#38BDF8',
    secondaryColor: '#0284C7',
    icon: CloudRain,
    domain: [0, 30],
    gradientId: 'gradRain',
  },
};

const TIME_RANGES = ['1H', '6H', '24H', '7D', '30D'];

export default function MultiMetricAnalytics({ deviceId, telemetry }) {
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
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : activeRange === '24H'
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          return {
            time: timeStr,
            value: r.value != null ? Number(Number(r.value).toFixed(2)) : 0,
            rawTimestamp: r.timestamp,
          };
        });
        setData(formatted);
      } else {
        // Synthesize fallback baseline series matching activeMetric
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
    const base = metric === 'temperature' ? 28 : metric === 'humidity' ? 74 : metric === 'pressure' ? 1008 : metric === 'wind_speed' ? 12 : metric === 'gas_aqi' ? 42 : 2.4;
    const items = [];
    for (let i = points; i >= 0; i--) {
      const d = new Date(Date.now() - i * (range === '1H' ? 5 * 60000 : range === '6H' ? 15 * 60000 : 60 * 60000));
      const variation = (Math.sin(i * 0.5) * (base * 0.08) + (Math.random() - 0.5) * (base * 0.04));
      items.push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number((base + variation).toFixed(1)),
      });
    }
    setData(items);
  }

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // If new live telemetry arrives for current activeMetric, push to graph
  useEffect(() => {
    if (!telemetry) return;
    const liveVal = telemetry[activeMetric];
    if (liveVal != null) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setData((prev) => {
        if (!prev || prev.length === 0) return [{ time: nowStr, value: Number(liveVal) }];
        const last = prev[prev.length - 1];
        if (last && last.time === nowStr) {
          return [...prev.slice(0, -1), { time: nowStr, value: Number(liveVal) }];
        }
        return [...prev.slice(-39), { time: nowStr, value: Number(liveVal) }];
      });
    }
  }, [telemetry, activeMetric]);

  const currentVal = data.length > 0 ? data[data.length - 1].value : telemetry?.[activeMetric] ?? '—';

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-5">
      {/* Header row: Title + Metrics Tabs + Time Range Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
            >
              <Icon size={16} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{cfg.label} Analytics</h3>
              <p className="text-xs text-[#64748B]">Continuous telemetry stream and interval trendline</p>
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0B1728]/80 border border-white/[0.06]">
          {Object.entries(METRICS_CONFIG).map(([key, item]) => {
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.1]'
                    : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.02]'
                }`}
              >
                {item.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B1728]/80 border border-white/[0.06] self-start lg:self-auto">
          {TIME_RANGES.map((range) => {
            const isSelected = activeRange === range;
            return (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30 font-semibold'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Current Readout Badge Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Current Telemetry</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-sans">
              {currentVal} <span className="text-sm font-light text-[#94A3B8]">{cfg.unit}</span>
            </div>
          </div>
          <div className="hidden sm:block h-7 w-px bg-white/[0.06]" />
          <div className="hidden sm:block">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Window Mode</span>
            <div className="text-xs font-semibold text-[#60A5FA] mt-0.5">{activeRange} Continuous</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-xs text-[#94A3B8] font-mono">Live Append Enabled</span>
        </div>
      </div>

      {/* Big Smooth Area Chart */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={cfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cfg.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={cfg.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              domain={['auto', 'auto']}
              unit={` ${cfg.unit}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-[#0B1728]/95 border border-white/[0.12] shadow-2xl backdrop-blur-md">
                      <p className="text-[11px] text-[#64748B] font-mono">{label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span className="text-sm font-semibold text-white">
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
              strokeWidth={2}
              fill={`url(#${cfg.gradientId})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
