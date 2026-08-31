import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const METRIC_OPTS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#38BDF8' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#22C55E' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#F59E0B' },
  { key: 'wind_speed', label: 'Wind Speed', unit: 'm/s', color: '#A78BFA' },
  { key: 'gas_aqi', label: 'AQI Proxy', unit: '', color: '#FB923C' },
  { key: 'heat_index', label: 'Heat Index', unit: '°C', color: '#F472B6' },
];

const RANGE_OPTS = [
  { key: '1h', label: '1H' },
  { key: '6h', label: '6H' },
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
];

function formatXAxis(isoString, range) {
  const d = new Date(isoString);
  if (range === '7d') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg border border-[#2D3947] bg-[#11161D] text-xs shadow-xl">
      <p className="text-[#64748B] mb-1">{new Date(label).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      <p className="font-semibold text-[#F1F5F9]">
        {Number(payload[0].value).toFixed(2)}{unit}
      </p>
    </div>
  );
};

export default function TrendChart({ deviceId, onFetchHistory, defaultMetric = 'temperature' }) {
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const [selectedRange, setSelectedRange] = useState('1h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const metricConf = METRIC_OPTS.find((m) => m.key === selectedMetric);

  const load = useCallback(async () => {
    if (!deviceId || !onFetchHistory) return;
    setLoading(true);
    try {
      const readings = await onFetchHistory(selectedMetric, selectedRange);
      const points = (readings || [])
        .filter((r) => {
          const val = r[selectedMetric] ?? r?.derived?.[selectedMetric];
          return val !== null && val !== undefined;
        })
        .map((r) => ({
          timestamp: r.timestamp,
          value: r[selectedMetric] ?? r?.derived?.[selectedMetric],
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

  const currentVal = data.length ? data[data.length - 1].value : null;

  return (
    <div className="panel-card border border-[#26303B] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[#64748B]" />
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">LIVE TELEMETRY</p>
            <p className="text-sm font-semibold text-[#F1F5F9] mt-0.5">
              {metricConf?.label}
              {currentVal !== null && (
                <span className="ml-2 text-base font-semibold" style={{ color: metricConf?.color }}>
                  {Number(currentVal).toFixed(1)}{metricConf?.unit}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-[#11161D] border border-[#26303B] rounded-lg p-1">
            {METRIC_OPTS.slice(0, 4).map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`px-2 py-1 text-[10px] font-semibold rounded tracking-wider transition-colors ${
                  selectedMetric === m.key
                    ? 'bg-[#1A212B] text-[#F1F5F9]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {m.label.split(' ')[0].toUpperCase()}
              </button>
            ))}
          </div>
          {/* Range Selector */}
          <div className="flex items-center gap-0.5 bg-[#11161D] border border-[#26303B] rounded-lg p-1">
            {RANGE_OPTS.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRange(r.key)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded tracking-wider transition-colors ${
                  selectedRange === r.key
                    ? 'bg-[#1A212B] text-[#38BDF8]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-full h-1.5 bg-[#11161D] rounded overflow-hidden" style={{ width: 200 }}>
                <div className="h-full bg-[#1A212B] rounded animate-pulse w-3/4" />
              </div>
              <p className="text-xs text-[#64748B]">Loading telemetry...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[#64748B]">No telemetry data available for this range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A212B" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => formatXAxis(v, selectedRange)}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={{ stroke: '#26303B' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v) => `${v}${metricConf?.unit}`}
              />
              <Tooltip
                content={<CustomTooltip unit={metricConf?.unit} />}
                cursor={{ stroke: '#26303B', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metricConf?.color || '#38BDF8'}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: metricConf?.color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
