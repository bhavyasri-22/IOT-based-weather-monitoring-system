import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Sparkles, 
  CloudRain, 
  Sun 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { telemetryApi } from '../api/client';

const METRICS = [
  { id: 'temperature', label: 'Temperature', unit: '°C', color: '#D97706', icon: Thermometer, installed: true },
  { id: 'humidity', label: 'Humidity', unit: '%', color: '#0284C7', icon: Droplets, installed: true },
  { id: 'pressure', label: 'Pressure', unit: 'hPa', color: '#2563EB', icon: Gauge, installed: true },
  { id: 'rain_intensity', label: 'Precipitation', unit: 'mm/h', color: '#0891B2', icon: CloudRain, installed: true },
  { id: 'gas_aqi', label: 'Gas Reading (Raw MQ-135)', unit: 'raw', color: '#7C3AED', icon: Sparkles, installed: false, statusLabel: 'Uncalibrated / Unavailable' },
  { id: 'wind_speed', label: 'Wind Speed', unit: 'km/h', color: '#059669', icon: Wind, installed: false, statusLabel: 'Not Installed' },
  { id: 'light_lux', label: 'Ambient Light', unit: 'lx', color: '#D97706', icon: Sun, installed: false, statusLabel: 'Not Installed' },
];

export default function Analytics({ deviceId = 'ESP32_SURATHKAL_01', telemetry }) {
  const [metric, setMetric] = useState('temperature');
  const [range, setRange] = useState('24h');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const activeCfg = METRICS.find((m) => m.id === metric) || METRICS[0];
  const Icon = activeCfg.icon;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await telemetryApi.history(deviceId, metric, range, 120);
      const readings = res?.data || res || [];
      if (Array.isArray(readings) && readings.length > 0) {
        const mapped = readings
          .filter((r) => r.value != null || r[metric] != null)
          .map((r) => ({
            time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            val: Number(Number(r.value ?? r[metric]).toFixed(2)),
            raw: r.timestamp,
          }));
        setChartData(mapped);
      } else {
        setChartData([]);
      }
    } catch {
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, metric, range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute analytics summary statistics
  const values = chartData.map((d) => d.val);
  const minVal = values.length > 0 ? Math.min(...values).toFixed(1) : '—';
  const maxVal = values.length > 0 ? Math.max(...values).toFixed(1) : '—';
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';

  // Export CSV handler
  const handleExportCSV = () => {
    if (chartData.length === 0) return;
    const headers = 'Timestamp,Metric,Value,Unit\n';
    const rows = chartData.map((d) => `"${d.time}","${activeCfg.label}",${d.val},"${activeCfg.unit}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmos_${metric}_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
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
      {/* Top Banner & Control Bar */}
      <div className="p-6 rounded-2xl bg-white/90 border border-sky-200/80 backdrop-blur-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Environmental Historical Analytics</h2>
              <p className="text-xs text-slate-500">Multi-sensor trendline correlation, statistical ranges and exports</p>
            </div>
          </div>
        </div>

        {/* Controls: Time Range + Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {['1h', '6h', '24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-all cursor-pointer ${
                  range === r
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
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

      {/* Metric Selector Tabs Horizontal Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {METRICS.map((m) => {
          const isSel = metric === m.id;
          const MIcon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSel
                  ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300'
                  : 'bg-white/90 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}
                >
                  <MIcon size={14} />
                </div>
                {!m.installed && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Slot
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold block leading-tight ${isSel ? 'text-blue-900' : 'text-slate-900'}`}>
                {m.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                {m.installed ? m.unit : m.statusLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Analytics Graph & Statistics */}
      <div className="rounded-2xl p-6 bg-white/90 border border-slate-200 shadow-xs space-y-6">
        {/* Statistical KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-medium tracking-wider">Current Sample</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">
              {values.length > 0 ? values[values.length - 1] : '—'}{' '}
              <span className="text-sm font-light text-slate-500">{activeCfg.unit}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-medium tracking-wider">Window Minimum</span>
            <div className="text-2xl font-bold text-blue-600 mt-1 font-sans">
              {minVal} <span className="text-sm font-light text-slate-500">{activeCfg.unit}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-medium tracking-wider">Window Average</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-sans">
              {avgVal} <span className="text-sm font-light text-slate-500">{activeCfg.unit}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-medium tracking-wider">Window Maximum</span>
            <div className="text-2xl font-bold text-amber-600 mt-1 font-sans">
              {maxVal} <span className="text-sm font-light text-slate-500">{activeCfg.unit}</span>
            </div>
          </div>
        </div>

        {/* Large Analytics Chart or Empty State */}
        {chartData.length === 0 ? (
          <div className="h-96 w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
              <Icon size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Recorded Measurements</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
              {!activeCfg.installed
                ? `${activeCfg.label} is an uninstalled slot channel on the physical hardware and produces null telemetry readings.`
                : `No sensor telemetry points recorded for ${activeCfg.label} across the selected ${range} interval. Measurements will appear live once ingested.`
              }
            </p>
          </div>
        ) : (
          <div className="h-96 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit={` ${activeCfg.unit}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xl text-xs">
                        <p className="text-slate-500 font-mono">{label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCfg.color }} />
                          <span className="text-sm font-bold text-slate-900">
                            {payload[0].value} {activeCfg.unit}
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
                dataKey="val"
                stroke={activeCfg.color}
                strokeWidth={2.5}
                fill="url(#analyticsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
