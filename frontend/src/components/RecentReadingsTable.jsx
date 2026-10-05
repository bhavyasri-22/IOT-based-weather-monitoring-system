import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Layers } from 'lucide-react';
import { telemetryApi } from '../api/client';
import { sanitizeRain } from '../utils/weatherUtils';

export default function RecentReadingsTable({ deviceId, telemetry }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecent = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await telemetryApi.history(deviceId, 'temperature', '24h', 8);
      const list = res?.data || res || [];
      if (Array.isArray(list) && list.length > 0) {
        setReadings(list);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [deviceId]);

  // When a new live telemetry reading arrives, push to the top
  useEffect(() => {
    if (!telemetry) return;
    setReadings((prev) => {
      const entry = {
        _id: 'live_' + Date.now(),
        timestamp: new Date().toISOString(),
        ...telemetry
      };
      return [entry, ...prev.filter(r => !r._id?.startsWith('live_') || Date.now() - new Date(r.timestamp).getTime() > 10000)].slice(0, 8);
    });
  }, [telemetry]);

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0E1A29]/80 border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Layers size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Station Telemetry
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chronological sensor packet logs
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecent}
          disabled={loading}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          title="Refresh table"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06] text-slate-400 dark:text-slate-500 font-semibold">
              <th className="pb-2.5 font-medium">Time</th>
              <th className="pb-2.5 font-medium">Temp</th>
              <th className="pb-2.5 font-medium">Humidity</th>
              <th className="pb-2.5 font-medium">Rainfall</th>
              <th className="pb-2.5 font-medium">AQI Proxy</th>
              <th className="pb-2.5 font-medium">Pressure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {readings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500">
                  {loading ? 'Loading sensor records…' : 'No telemetry records yet'}
                </td>
              </tr>
            ) : (
              readings.map((r, idx) => {
                const d = new Date(r.timestamp || r.createdAt);
                const timeStr = !isNaN(d.getTime())
                  ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '—';
                const rainVal = sanitizeRain(r.rain_intensity);

                return (
                  <tr
                    key={r._id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 font-mono text-slate-500 dark:text-slate-400">
                      {timeStr}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {r.temperature != null ? `${Number(r.temperature).toFixed(1)} °C` : '—'}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {r.humidity != null ? `${Math.round(r.humidity)} %` : '—'}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${
                        rainVal && rainVal > 0.5
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {rainVal != null ? `${rainVal.toFixed(1)} mm` : '0.0 mm'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {r.gas_aqi != null ? Math.round(r.gas_aqi) : '—'}
                    </td>
                    <td className="py-2.5 font-mono text-slate-500 dark:text-slate-400">
                      {r.pressure != null ? `${Math.round(r.pressure)} hPa` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
