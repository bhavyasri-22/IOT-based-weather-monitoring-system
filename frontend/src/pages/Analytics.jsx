import React, { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { telemetryApi } from '../api/client';

const METRICS = [
  { id: 'temperature', label: 'Temperature', unit: '°C' },
  { id: 'humidity', label: 'Humidity', unit: '%' },
  { id: 'pressure', label: 'Pressure', unit: 'hPa' },
  { id: 'rain_intensity', label: 'Rainfall', unit: 'mm/h' },
  { id: 'gas_aqi', label: 'Raw gas-sensor reading', unit: '' },
];

export default function Analytics({ deviceId }) {
  const [metric, setMetric] = useState('temperature'); const [range, setRange] = useState('24h'); const [data, setData] = useState([]); const [error, setError] = useState('');
  const config = METRICS.find((item) => item.id === metric);
  const load = useCallback(async () => { try { const response = await telemetryApi.history(deviceId, metric, range, 200); const readings = response?.data || []; const points = readings.filter((reading) => Number.isFinite(Number(reading[metric] ?? reading.value))).map((reading) => ({ timestamp: reading.timestamp, time: new Date(reading.timestamp).toLocaleString(), value: Number(reading[metric] ?? reading.value) })).reverse(); setData(points); setError(''); } catch (err) { setData([]); setError(err.message || 'Unable to load historical telemetry.'); } }, [deviceId, metric, range]);
  useEffect(() => { load(); }, [load]);
  const values = data.map((point) => point.value); const average = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
  return <section className="mx-auto max-w-6xl space-y-5 pb-10"><header className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: '#bfdbfe' }}><h2 className="text-xl font-bold text-blue-950">Historical analytics</h2><p className="mt-1 text-sm text-slate-600">Charts are drawn only from stored telemetry. Wind and light are unavailable because their sensors are not configured.</p><div className="mt-4 flex flex-wrap gap-2">{METRICS.map((item) => <button key={item.id} type="button" onClick={() => setMetric(item.id)} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: metric === item.id ? '#dbeafe' : '#f8fafc', color: '#1d4ed8' }}>{item.label}</button>)}{['1h', '6h', '24h', '7d'].map((item) => <button key={item} type="button" onClick={() => setRange(item)} className="rounded-lg border px-3 py-2 text-sm text-blue-800" style={{ borderColor: range === item ? '#2563eb' : '#bfdbfe' }}>{item}</button>)}</div></header>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="grid gap-4 sm:grid-cols-3"><Stat label="Samples" value={String(data.length)} /><Stat label="Latest" value={values.length ? `${values.at(-1)} ${config.unit}` : 'Awaiting data'} /><Stat label="Average" value={values.length ? `${average} ${config.unit}` : 'Unavailable'} /></div><div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: '#bfdbfe' }}>{data.length < 2 ? <div className="grid h-72 place-items-center text-center text-slate-500">No historical {config.label.toLowerCase()} readings are available yet.</div> : <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid stroke="#dbeafe" /><XAxis dataKey="time" hide /><YAxis /><Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.time || ''} /><Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" /></AreaChart></ResponsiveContainer></div>}</div></section>;
}
function Stat({ label, value }) { return <div className="rounded-2xl border bg-white p-4" style={{ borderColor: '#bfdbfe' }}><p className="text-xs font-semibold uppercase text-blue-700">{label}</p><p className="mt-1 text-lg font-bold text-blue-950">{value}</p></div>; }
