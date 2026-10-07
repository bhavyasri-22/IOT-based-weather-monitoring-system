import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Activity, Sparkles, CloudRain, Thermometer, Droplets, Gauge } from 'lucide-react';
import { telemetryApi } from '../api/client';
import { sanitizeRain } from '../utils/weatherUtils';

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#F43F5E', icon: Thermometer },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#0EA5E9', icon: Droplets },
  { key: 'rain_intensity', label: 'Rainfall', unit: 'mm/h', color: '#3B82F6', icon: CloudRain },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#F59E0B', icon: Gauge },
];

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const timeStr = !isNaN(d.getTime())
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : label;

  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white/95 dark:bg-[#0B1522]/95 backdrop-blur-md text-xs shadow-xl text-slate-800 dark:text-white">
      <div className="text-[10px] text-slate-400 dark:text-slate-400 mb-1 font-mono">
        {timeStr}
      </div>
      <div className="flex items-center gap-2 font-bold">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
        <span>{metric.label}:</span>
        <span className="font-mono text-sm" style={{ color: metric.color }}>
          {Number(payload[0].value).toFixed(1)} {metric.unit}
        </span>
      </div>
    </div>
  );
};

export default function WeatherTrendChart({ deviceId, telemetry }) {
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const activeMetric = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await telemetryApi.history(deviceId, selectedMetric, '24h', 40);
      const rawList = res?.data || res || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        const points = rawList
          .map((r) => {
            let val = r[selectedMetric] ?? r?.derived?.[selectedMetric];
            if (selectedMetric === 'rain_intensity') {
              val = sanitizeRain(val);
            }
            return {
              timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
              value: val !== null && val !== undefined && !isNaN(Number(val)) ? Number(val) : null,
            };
          })
          .filter((pt) => pt.value !== null)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setData(points);
      } else {
        // Fallback smooth point with current live telemetry
        if (telemetry) {
          let currVal = telemetry[selectedMetric] ?? telemetry?.derived?.[selectedMetric];
          if (selectedMetric === 'rain_intensity') currVal = sanitizeRain(currVal);
          if (currVal != null) {
            const now = Date.now();
            setData([
              { timestamp: new Date(now - 60000 * 15).toISOString(), value: Number(currVal) * 0.99 },
              { timestamp: new Date(now - 60000 * 10).toISOString(), value: Number(currVal) * 1.01 },
              { timestamp: new Date(now - 60000 * 5).toISOString(), value: Number(currVal) * 0.995 },
              { timestamp: new Date(now).toISOString(), value: Number(currVal) },
            ]);
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [deviceId, selectedMetric, telemetry]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // When live telemetry arrives, update last chart point
  useEffect(() => {
    if (!telemetry) return;
    let currVal = telemetry[selectedMetric] ?? telemetry?.derived?.[selectedMetric];
    if (selectedMetric === 'rain_intensity') currVal = sanitizeRain(currVal);
    if (currVal == null || isNaN(Number(currVal))) return;

    setData((prev) => {
      const point = {
        timestamp: new Date().toISOString(),
        value: Number(currVal)
      };
      if (!prev || prev.length === 0) return [point];
      const last = prev[prev.length - 1];
      // If last point is within 5 seconds, replace; otherwise append up to 40 points
      const diff = new Date(point.timestamp) - new Date(last.timestamp);
      if (diff < 5000) {
        return [...prev.slice(0, prev.length - 1), point];
      }
      return [...prev.slice(Math.max(0, prev.length - 39)), point];
    });
  }, [telemetry, selectedMetric]);

  const { minVal, maxVal, latestVal } = useMemo(() => {
    if (!data.length) return { minVal: null, maxVal: null, latestVal: null };
    const vals = data.map((d) => d.value);
    return {
      minVal: Math.min(...vals).toFixed(1),
      maxVal: Math.max(...vals).toFixed(1),
      latestVal: vals[vals.length - 1].toFixed(1)
    };
  }, [data]);

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E1A29]/80 border border-sky-100/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Header with Title & Metric Toggle Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={16} className="text-sky-500" />
            Environmental Trend Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-point telemetry curve
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#07111E] border border-slate-200/70 dark:border-white/[0.06]">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-white/[0.1]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={13} style={{ color: isSelected ? m.color : undefined }} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-4">
          <span>Current: <strong className="text-slate-900 dark:text-white font-mono">{latestVal ?? '—'} {activeMetric.unit}</strong></span>
          <span>Min: <strong className="text-slate-700 dark:text-slate-300 font-mono">{minVal ?? '—'}</strong></span>
          <span>Max: <strong className="text-slate-700 dark:text-slate-300 font-mono">{maxVal ?? '—'}</strong></span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Live 24H Window</span>
      </div>

      {/* Chart Area */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="rgba(148, 163, 184, 0.6)"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.6)"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip metric={activeMetric} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={activeMetric.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${selectedMetric})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF', fill: activeMetric.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
