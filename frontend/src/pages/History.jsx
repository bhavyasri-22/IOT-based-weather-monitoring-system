import React, { useState, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { telemetryApi } from '../api/client';
import { Download, BarChart2 } from 'lucide-react';

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#38BDF8' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#22C55E' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#F59E0B' },
  { key: 'wind_speed', label: 'Wind Speed', unit: 'm/s', color: '#A78BFA' },
  { key: 'gas_aqi', label: 'AQI Proxy (MQ135)', unit: '', color: '#FB923C' },
  { key: 'heat_index', label: 'Heat Index', unit: '°C', color: '#F472B6' },
  { key: 'light_lux', label: 'Light Intensity', unit: 'lux', color: '#FACC15' },
];

const RANGES = [
  { key: '1h', label: 'Last 1 Hour' },
  { key: '6h', label: 'Last 6 Hours' },
  { key: '24h', label: 'Last 24 Hours' },
  { key: '7d', label: 'Last 7 Days' },
];

function formatXTick(ts, range) {
  const d = new Date(ts);
  if (range === '7d') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg border border-[#2D3947] bg-[#11161D] text-xs shadow-xl">
      <p className="text-[#64748B] mb-1">{new Date(label).toLocaleString()}</p>
      <p className="font-semibold text-[#F1F5F9]">
        {Number(payload[0].value).toFixed(2)}{unit}
      </p>
    </div>
  );
};

export default function History({ deviceId }) {
  const [metric, setMetric] = useState('temperature');
  const [range, setRange] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const metricConf = METRICS.find((m) => m.key === metric);

  const load = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await telemetryApi.history(deviceId, metric, range, 500);
      const readings = resp?.data || resp || [];
      const points = (Array.isArray(readings) ? readings : [])
        .filter((r) => {
          const v = r[metric] ?? r?.derived?.[metric];
          return v !== null && v !== undefined;
        })
        .map((r) => ({
          timestamp: r.timestamp,
          value: r[metric] ?? r?.derived?.[metric],
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setData(points);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, metric, range]);

  useEffect(() => { load(); }, [load]);

  const avg = data.length ? data.reduce((sum, r) => sum + r.value, 0) / data.length : null;
  const min = data.length ? Math.min(...data.map((r) => r.value)) : null;
  const max = data.length ? Math.max(...data.map((r) => r.value)) : null;
  const latest = data.length ? data[data.length - 1].value : null;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Metric selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3 py-1.5 text-sm bg-[#151B23] border border-[#26303B] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8] transition-colors"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Range</label>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                  range === r.key
                    ? 'bg-[#1A212B] border-[#38BDF8] text-[#38BDF8]'
                    : 'bg-[#151B23] border-[#26303B] text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1A212B]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'CURRENT', value: latest },
            { label: 'AVERAGE', value: avg },
            { label: 'MINIMUM', value: min },
            { label: 'MAXIMUM', value: max },
          ].map((stat) => (
            <div key={stat.label} className="panel-card border border-[#26303B] px-4 py-3">
              <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">{stat.label}</p>
              <p className="text-xl font-semibold text-[#F1F5F9] tabular-nums">
                {Number(stat.value).toFixed(1)}
                <span className="text-sm text-[#64748B] ml-1">{metricConf?.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="panel-card border border-[#26303B] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} className="text-[#64748B]" />
          <p className="text-sm font-semibold text-[#F1F5F9]">{metricConf?.label}</p>
          <span className="text-xs text-[#64748B]">— {RANGES.find((r) => r.key === range)?.label}</span>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-[#64748B]">Loading data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-[#EF4444]">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <BarChart2 size={24} className="text-[#26303B] mb-2" />
              <p className="text-sm text-[#64748B]">No data available for this range</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A212B" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => formatXTick(v, range)}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={{ stroke: '#26303B' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => `${v}${metricConf?.unit}`}
                />
                <Tooltip content={<CustomTooltip unit={metricConf?.unit} />} cursor={{ stroke: '#26303B', strokeWidth: 1 }} />
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

      {/* Data table */}
      {data.length > 0 && (
        <div className="panel-card border border-[#26303B]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#26303B]">
            <p className="text-xs font-semibold text-[#94A3B8]">Data Points ({data.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1A212B]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Timestamp</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">{metricConf?.label}</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-20).reverse().map((row, i) => (
                  <tr key={i} className="border-b border-[#1A212B] hover:bg-[#151B23] transition-colors">
                    <td className="px-4 py-2 text-[#94A3B8] font-mono">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-[#F1F5F9] tabular-nums">
                      {Number(row.value).toFixed(2)} {metricConf?.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
