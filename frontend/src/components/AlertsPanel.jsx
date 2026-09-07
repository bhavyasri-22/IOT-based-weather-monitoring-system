import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Check,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/weatherUtils';

export default function AlertsPanel({ activeAlerts = [], onResolve }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'resolved'

  // Representative alert list if no live alerts in state
  const mockAlerts = [
    {
      id: 'mock-1',
      parameter: 'humidity',
      severity: 'warning',
      message: 'High humidity detected (86% > 80% threshold)',
      triggered_at: new Date(Date.now() - 10 * 60000),
      resolved: false,
    },
    {
      id: 'mock-2',
      parameter: 'temperature',
      severity: 'normal',
      message: 'Temperature stabilized to normal range (28.1°C)',
      triggered_at: new Date(Date.now() - 24 * 60000),
      resolved: true,
    },
    {
      id: 'mock-3',
      parameter: 'rainfall',
      severity: 'critical',
      message: 'Rain rate threshold exceeded (18.0 mm/h > 15.0 mm/h)',
      triggered_at: new Date(Date.now() - 120 * 60000),
      resolved: false,
    },
  ];

  const sourceAlerts = activeAlerts.length > 0 ? activeAlerts : mockAlerts;

  const filtered = sourceAlerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    if (filter === 'resolved') return a.resolved || a.status === 'resolved';
    return true;
  });

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col h-full space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 flex items-center justify-center text-[#F87171]">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Environmental Alerts</h3>
            <p className="text-xs text-[#64748B]">Threshold breaches and recovery events</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B1728]/80 border border-white/[0.06] self-start sm:self-auto">
          {['all', 'critical', 'warning', 'resolved'].map((f) => {
            const isSelected = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] text-white font-semibold border border-white/[0.12]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 size={28} className="text-[#34D399] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">No active alerts</p>
            <p className="text-xs text-[#64748B]">All environmental telemetry within normal boundaries</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isResolved = alert.resolved || alert.status === 'resolved';

              return (
                <motion.div
                  key={alert._id || alert.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isResolved
                      ? 'bg-[#34D399]/5 border-[#34D399]/20'
                      : isCrit
                      ? 'bg-[#F87171]/10 border-[#F87171]/25'
                      : 'bg-[#FBBF24]/10 border-[#FBBF24]/25'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-[#34D399]/20 text-[#34D399]'
                          : isCrit
                          ? 'bg-[#F87171]/20 text-[#F87171]'
                          : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <AlertTriangle size={15} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isResolved
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : isCrit
                              ? 'bg-[#F87171]/20 text-[#F87171]'
                              : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                          }`}
                        >
                          {isResolved ? 'Resolved' : alert.severity}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {formatRelativeTime(alert.triggered_at || alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-white leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isResolved && onResolve && alert._id && (
                    <button
                      onClick={() => onResolve(alert._id)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#34D399]/20 border border-white/[0.1] hover:border-[#34D399]/40 text-[#94A3B8] hover:text-[#34D399] transition-all text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                    >
                      <Check size={12} />
                      <span>Resolve</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
        <Link
          to="/alerts"
          className="text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1 font-semibold transition-colors"
        >
          <span>Open Full Alerts System</span>
          <ChevronRight size={13} />
        </Link>
        <span className="text-[#64748B] text-[11px]">Audit log retention: 30 days</span>
      </div>
    </div>
  );
}
