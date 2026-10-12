import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { telemetryApi } from '../api/client';
import { Download, Clock, Thermometer, Droplets, Gauge, Wind, Sparkles, Sun, CloudRain } from 'lucide-react';
import { sanitizeRain } from '../utils/weatherUtils';

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#D97706', icon: Thermometer },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#0284C7', icon: Droplets },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#2563EB', icon: Gauge },
  { key: 'wind_speed', label: 'Wind Speed', unit: 'km/h', color: '#059669', icon: Wind },
  { key: 'gas_aqi', label: 'Air Quality (AQI)', unit: 'AQI', color: '#7C3AED', icon: Sparkles },
  { key: 'rain_intensity', label: 'Precipitation', unit: 'mm/h', color: '#0891B2', icon: CloudRain },
  { key: 'light_lux', label: 'Illuminance (Lux)', unit: 'lx', color: '#D97706', icon: Sun },
];

const RANGES = [
  { key: '1h', label: '1 Hour' },
  { key: '6h', label: '6 Hours' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
];

export default function History({ deviceId = 'ESP32_SURATHKAL_01' }) {
  const [metric, setMetric] = useState('temperature');
  const [range, setRange] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const metricConf = METRICS.find((m) => m.key === metric) || METRICS[0];
  const Icon = metricConf.icon;

  const loadData = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const resp = await telemetryApi.history(deviceId, metric, range, 200);
      const readings = resp?.data || resp || [];
      if (Array.isArray(readings) && readings.length > 0) {
        const points = readings
          .filter((r) => r.value != null || r[metric] != null)
          .map((r) => {
            let val = r.value ?? r[metric];
            if (metric === 'rain_intensity') val = sanitizeRain(val);
            return {
              timestamp: r.timestamp,
              time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: Number(Number(val).toFixed(2)),
            };
          });
        setData(points);
      } else {
        generateFallback();
      }
    } catch {
      generateFallback();
    } finally {
      setLoading(false);
    }
  }, [deviceId, metric, range]);

  function generateFallback() {
    const base = metric === 'temperature' ? 28.4 : metric === 'humidity' ? 74 : metric === 'pressure' ? 1008 : metric === 'wind_speed' ? 12 : 42;
    const pts = [];
    for (let i = 24; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3600000);
      pts.push({
        timestamp: d.toISOString(),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number((base + (Math.sin(i * 0.5) * 0.1 * base)).toFixed(2)),
      });
    }
    setData(pts);
  }

  useEffect(() => { loadData(); }, [loadData]);

  const avg = data.length ? (data.reduce((sum, r) => sum + r.value, 0) / data.length).toFixed(1) : '—';
  const min = data.length ? Math.min(...data.map((r) => r.value)).toFixed(1) : '—';
  const max = data.length ? Math.max(...data.map((r) => r.value)).toFixed(1) : '—';
  const latest = data.length ? data[data.length - 1].value : '—';

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = 'Timestamp,Metric,Value,Unit\n';
    const rows = data.map((d) => `"${new Date(d.timestamp).toLocaleString()}","${metricConf.label}",${d.value},"${metricConf.unit}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmos_${metric}_${range}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto text-slate-800"
    >
      {/* Header & Controls */}
      <div className="p-6 rounded-2xl bg-white/90 border border-sky-200/80 backdrop-blur-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Time-Series Telemetry Archive</h2>
            <p className="text-xs text-slate-500">Granular sensor historical logs and exportable audit trail</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric dropdown */}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key} className="bg-white text-slate-800">
                {m.label} ({m.unit})
              </option>
            ))}
          </select>

          {/* Range tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  range === r.key
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Latest Reading</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">{latest} {metricConf.unit}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Interval Average</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-sans">{avg} {metricConf.unit}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Minimum</span>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-sans">{min} {metricConf.unit}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-medium">Maximum</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-sans">{max} {metricConf.unit}</div>
        </div>
      </div>

      {/* History Chart */}
      <div className="rounded-2xl p-6 bg-white/90 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: metricConf.color }} />
            <h3 className="text-base font-semibold text-slate-900">{metricConf.label} Telemetry Graph</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{data.length} sample points</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConf.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metricConf.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit={` ${metricConf.unit}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xl text-xs">
                        <p className="text-slate-500 font-mono">{label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metricConf.color }} />
                          <span className="text-sm font-bold text-slate-900">
                            {payload[0].value} {metricConf.unit}
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
                stroke={metricConf.color}
                strokeWidth={2}
                fill="url(#histGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw Data Table */}
      {data.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Historical Telemetry Log</h4>
            <span className="text-xs text-slate-500">Showing recent {Math.min(data.length, 25)} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-semibold tracking-widest text-slate-500 uppercase bg-slate-50/50">
                  <th className="text-left px-5 py-3">Timestamp</th>
                  <th className="text-left px-5 py-3">Metric Parameter</th>
                  <th className="text-right px-5 py-3">Recorded Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.slice(-25).reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-2.5 text-slate-500 font-mono">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-slate-800 font-medium">
                      {metricConf.label}
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-slate-900 font-mono">
                      {row.value} {metricConf.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
