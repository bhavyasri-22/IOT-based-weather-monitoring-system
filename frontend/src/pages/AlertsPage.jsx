import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { alertsApi } from '../api/client';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  RefreshCw, 
  Filter,
  Search,
  ShieldAlert
} from 'lucide-react';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function AlertsPage({ user, onResolve }) {
  const [tab, setTab] = useState('all'); // 'all' | 'critical' | 'warning' | 'resolved'
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertsApi.list({ limit: 100 });
      const list = data?.data || data || [];
      setAlerts(Array.isArray(list) ? list : []);
    } catch {
      // Fallback sample alerts
      setAlerts([
        {
          _id: 'a1',
          parameter: 'humidity',
          severity: 'warning',
          message: 'High humidity detected (86% > 80% limit)',
          trigger_value: 86,
          status: 'active',
          triggered_at: new Date(Date.now() - 10 * 60000),
        },
        {
          _id: 'a2',
          parameter: 'rain_intensity',
          severity: 'critical',
          message: 'Flash precipitation rate exceeded 18.0 mm/h',
          trigger_value: 18.0,
          status: 'active',
          triggered_at: new Date(Date.now() - 45 * 60000),
        },
        {
          _id: 'a3',
          parameter: 'temperature',
          severity: 'warning',
          message: 'Ambient temperature reached 34.2°C',
          trigger_value: 34.2,
          status: 'resolved',
          triggered_at: new Date(Date.now() - 180 * 60000),
          resolved_at: new Date(Date.now() - 120 * 60000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolveAlert = async (id) => {
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
      className="space-y-6 pb-12 max-w-[1600px] mx-auto text-slate-800 dark:text-white"
    >
      {/* Top Banner & Statistics */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-[#F87171]/15 border border-rose-200 dark:border-[#F87171]/30 flex items-center justify-center text-rose-600 dark:text-[#F87171]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Environmental Alerts & Audit Center</h2>
            <p className="text-xs text-slate-500 dark:text-[#64748B]">Real-time safety rules, breach events, and incident resolutions</p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-[#F87171]/10 border border-rose-200 dark:border-[#F87171]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-[#F87171]" />
            <span className="text-rose-600 dark:text-[#F87171] font-semibold">{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-[#FBBF24]/10 border border-amber-200 dark:border-[#FBBF24]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#FBBF24]" />
            <span className="text-amber-600 dark:text-[#FBBF24] font-semibold">{activeCount} Active</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-[#34D399]/10 border border-emerald-200 dark:border-[#34D399]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#34D399]" />
            <span className="text-emerald-600 dark:text-[#34D399] font-semibold">{resolvedCount} Resolved</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1728]/80 border border-slate-200 dark:border-white/[0.06] overflow-x-auto">
          {['all', 'critical', 'warning', 'resolved'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                tab === t
                  ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.12]'
                  : 'text-slate-600 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#94A3B8]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-blue-500 dark:focus:border-[#60A5FA]"
            />
          </div>

          <button
            type="button"
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts Table/List */}
      <div className="rounded-2xl bg-white dark:bg-[#101D2E]/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={36} className="text-emerald-500 dark:text-[#34D399] mx-auto mb-2 opacity-80" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">No alerts found</p>
            <p className="text-xs text-slate-500 dark:text-[#64748B] mt-0.5">All monitored sensors are operating within defined thresholds</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isResolved = alert.status === 'resolved' || alert.resolved;
              const alertKey = alert._id || alert.id;

              return (
                <div
                  key={alertKey}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-[#34D399]/15 dark:text-[#34D399]'
                          : isCrit
                          ? 'bg-rose-100 text-rose-600 dark:bg-[#F87171]/15 dark:text-[#F87171]'
                          : 'bg-amber-100 text-amber-600 dark:bg-[#FBBF24]/15 dark:text-[#FBBF24]'
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
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-[#34D399]/20 dark:text-[#34D399]'
                              : isCrit
                              ? 'bg-rose-100 text-rose-700 dark:bg-[#F87171]/20 dark:text-[#F87171]'
                              : 'bg-amber-100 text-amber-700 dark:bg-[#FBBF24]/20 dark:text-[#FBBF24]'
                          }`}
                        >
                          {isResolved ? 'Resolved' : alert.severity}
                        </span>
                        <span className="text-xs font-mono text-blue-600 dark:text-[#60A5FA] uppercase font-semibold">
                          {alert.parameter}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#64748B]">·</span>
                        <span className="text-xs text-slate-500 dark:text-[#64748B] font-mono">
                          {formatRelativeTime(alert.triggered_at || alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  {/* Right: Trigger value & 1-click resolve */}
                  <div className="flex items-center gap-4 self-end sm:self-center flex-shrink-0">
                    {alert.trigger_value != null && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 dark:text-[#64748B] block font-mono uppercase">Reading</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{alert.trigger_value}</span>
                      </div>
                    )}

                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alertKey)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-white/[0.05] dark:hover:bg-[#34D399]/20 border border-slate-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-[#34D399]/40 text-slate-700 hover:text-emerald-700 dark:text-[#94A3B8] dark:hover:text-[#34D399] transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
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
