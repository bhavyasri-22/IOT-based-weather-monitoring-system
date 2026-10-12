import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';

const METRIC_OPTS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#D97706', gradient: '#D97706' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#0284C7', gradient: '#0284C7' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#2563EB', gradient: '#2563EB' },
  { key: 'wind_speed', label: 'Wind Speed', unit: 'm/s', color: '#059669', gradient: '#059669' },
  { key: 'gas_aqi', label: 'AQI Proxy', unit: '', color: '#7C3AED', gradient: '#7C3AED' },
  { key: 'heat_index', label: 'Heat Index', unit: '°C', color: '#DB2777', gradient: '#DB2777' },
  { key: 'rain_intensity', label: 'Rain', unit: 'mm/h', color: '#0891B2', gradient: '#0891B2' },
  { key: 'light_lux', label: 'Light', unit: 'lux', color: '#D97706', gradient: '#D97706' },
];

const RANGE_OPTS = [
  { key: '1h', label: '1H' },
  { key: '6h', label: '6H' },
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
];

function formatXAxis(isoString, range) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  if (range === '7d') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const CustomTooltip = ({ active, payload, label, metricConf }) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const formattedTime = !isNaN(d.getTime())
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : label;
  const formattedDate = !isNaN(d.getTime())
    ? d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-1 border-b border-slate-100 pb-1">
        <span className="text-[10px] text-slate-500 font-mono">{formattedDate}</span>
        <span className="text-[11px] font-semibold text-blue-600 font-mono">{formattedTime}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricConf?.color }} />
        <span className="text-slate-600 font-medium">{metricConf?.label}:</span>
        <span className="font-bold text-slate-900 text-sm tabular-nums">
          {Number(payload[0].value).toFixed(1)} {metricConf?.unit}
        </span>
      </div>
    </div>
  );
};

export default function TrendChart({ deviceId, onFetchHistory, defaultMetric = 'temperature' }) {
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const [selectedRange, setSelectedRange] = useState('1h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const metricConf = METRIC_OPTS.find((m) => m.key === selectedMetric) || METRIC_OPTS[0];

  const load = useCallback(async () => {
    if (!deviceId || !onFetchHistory) return;
    setLoading(true);
    try {
      const readings = await onFetchHistory(selectedMetric, selectedRange);
      const points = (readings || [])
        .filter((r) => {
          const val = r[selectedMetric] ?? r?.derived?.[selectedMetric];
          return val !== null && val !== undefined && !isNaN(Number(val));
        })
        .map((r) => ({
          timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
          value: Number(r[selectedMetric] ?? r?.derived?.[selectedMetric]),
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setData(points);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, selectedMetric, selectedRange, onFetchHistory]);

  useEffect(() => {
    load();
  }, [load]);

  const { minVal, maxVal, currentVal, avgVal, yDomain } = useMemo(() => {
    if (!data.length) {
      return { minVal: null, maxVal: null, currentVal: null, avgVal: null, yDomain: ['auto', 'auto'] };
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const current = values[values.length - 1];
    const avg = sum / values.length;

    const range = max - min;
    const padding = range === 0 ? (max === 0 ? 1 : Math.abs(max) * 0.15) : range * 0.2;
    const yMin = Math.floor((min - padding) * 10) / 10;
    const yMax = Math.ceil((max + padding) * 10) / 10;

    return {
      minVal: min,
      maxVal: max,
      currentVal: current,
      avgVal: avg,
      yDomain: [yMin, yMax],
    };
  }, [data]);

  return (
    <div className="bg-white/95 border border-sky-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Activity size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">LIVE TELEMETRY TRENDS</span>
              {data.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {data.length} pts
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-base font-bold text-slate-900">{metricConf?.label}</h2>
              {currentVal !== null && (
                <span className="text-lg font-bold tabular-nums" style={{ color: metricConf?.color }}>
                  {currentVal.toFixed(1)} {metricConf?.unit}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric Quick-Pills & Time Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 overflow-x-auto max-w-full">
            {METRIC_OPTS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedMetric === m.key
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Range Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-1">
            {RANGE_OPTS.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRange(r.key)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md tracking-wider transition-colors cursor-pointer ${
                  selectedRange === r.key
                    ? 'bg-white text-blue-700 font-bold border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      {data.length > 0 && (
        <div className="flex items-center gap-4 mb-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <div>
            <span>MIN: </span>
            <span className="font-semibold text-slate-900">{minVal?.toFixed(1)}{metricConf?.unit}</span>
          </div>
          <span className="w-px h-3 bg-slate-200" />
          <div>
            <span>AVG: </span>
            <span className="font-semibold text-blue-600">{avgVal?.toFixed(1)}{metricConf?.unit}</span>
          </div>
          <span className="w-px h-3 bg-slate-200" />
          <div>
            <span>MAX: </span>
            <span className="font-semibold text-slate-900">{maxVal?.toFixed(1)}{metricConf?.unit}</span>
          </div>
          {data[0]?.timestamp && (
            <>
              <span className="w-px h-3 bg-slate-200 ml-auto" />
              <div className="text-[10px] text-slate-500 font-mono">
                From {new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-56 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-48 h-1.5 bg-slate-100 rounded overflow-hidden">
                <div className="h-full bg-blue-500 rounded animate-pulse w-3/4" />
              </div>
              <p className="text-xs text-slate-500">Loading telemetry points...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-1 border border-dashed border-slate-200 rounded-lg">
            <Activity size={20} className="text-slate-400 mb-1 opacity-50" />
            <p className="text-xs font-semibold text-slate-700">No telemetry points recorded yet</p>
            <p className="text-[10px] text-slate-500">Ensure mock publisher or ESP32 node is streaming data.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConf?.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={metricConf?.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => formatXAxis(v, selectedRange)}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => `${Number(v).toFixed(v % 1 === 0 ? 0 : 1)}${metricConf?.unit}`}
              />
              <Tooltip
                content={<CustomTooltip metricConf={metricConf} />}
                cursor={{ stroke: metricConf?.color, strokeWidth: 1, strokeDasharray: '2 2' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={metricConf?.color || '#3B82F6'}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${selectedMetric})`}
                dot={data.length < 20 ? { r: 3, fill: metricConf?.color, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: metricConf?.color, stroke: '#FFFFFF', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
