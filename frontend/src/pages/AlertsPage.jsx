import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { alertsApi } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  RefreshCw, 
  Search, 
  ShieldAlert 
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function AlertsPage({ user, onResolve }) {
  const [tab, setTab] = useState('all'); // 'all' | 'critical' | 'warning' | 'resolved'
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertsApi.list({ limit: 100 });
      const list = data?.data || data || [];
      setAlerts(Array.isArray(list) ? list : []);
      setError('');
    } catch (err) {
      setAlerts([]);
      setError(err.message || 'Unable to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolveAlert = async (id) => {
    if (user?.role !== 'admin') return;
    try {
      await alertsApi.resolve(id);
    } catch {}
    setAlerts((prev) =>
      prev.map((a) => ((a._id || a.id) === id ? { ...a, status: 'resolved', resolved_at: new Date() } : a))
    );
    if (onResolve) onResolve(id);
  };

  const filtered = alerts.filter((a) => {
    const isResolved = a.status === 'resolved' || a.resolved;
    if (tab === 'critical' && a.severity !== 'critical') return false;
    if (tab === 'warning' && a.severity !== 'warning') return false;
    if (tab === 'resolved' && !isResolved) return false;
    if (tab === 'active' && isResolved) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        a.parameter?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        a.severity?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'active' && !a.resolved).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved' || a.resolved).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto text-slate-800"
    >
      {/* Top Banner & Statistics */}
      <div className="p-6 rounded-2xl bg-white/90 border border-sky-200/80 backdrop-blur-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Environmental Alerts & Audit Center</h2>
            <p className="text-xs text-slate-500">Real-time safety rules, breach events, and incident resolutions</p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-rose-700 font-semibold">{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-800 font-semibold">{activeCount} Active</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-semibold">{resolvedCount} Resolved</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto">
          {['all', 'critical', 'warning', 'resolved'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                tab === t
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts Table/List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {error && <p className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-base font-semibold text-slate-900">No alerts found</p>
            <p className="text-xs text-slate-500 mt-0.5">All monitored sensors are operating within defined thresholds</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isResolved = alert.status === 'resolved' || alert.resolved;
              const alertKey = alert._id || alert.id;

              return (
                <div
                  key={alertKey}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-600'
                          : isCrit
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCrit
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isResolved ? 'Resolved' : alert.severity}
                        </span>
                        <span className="text-xs font-mono text-blue-600 uppercase font-semibold">
                          {alert.parameter}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {formatRelativeTime(alert.triggered_at || alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  {/* Right: Trigger value & 1-click resolve */}
                  <div className="flex items-center gap-4 self-end sm:self-center flex-shrink-0">
                    {alert.trigger_value != null && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono uppercase">Reading</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{alert.trigger_value}</span>
                      </div>
                    )}

                    {!isResolved && user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alertKey)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check size={13} />
                        <span>Acknowledge & Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
