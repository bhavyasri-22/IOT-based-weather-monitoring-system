import React from 'react';
import { AlertTriangle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    indicator: 'bg-rose-500',
    text: 'text-rose-700',
    labelBg: 'bg-rose-100',
    label: 'CRITICAL',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    indicator: 'bg-amber-500',
    text: 'text-amber-800',
    labelBg: 'bg-amber-100',
    label: 'WARNING',
  },
};

function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Recently';
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function AlertItem({ alert, onResolve }) {
  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.warning;
  const rawTime = alert.triggered_at || alert.createdAt || alert.timestamp;
  const timeStr = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const [resolving, setResolving] = React.useState(false);

  const handleResolveClick = async (e) => {
    e.stopPropagation();
    if (!onResolve || resolving) return;
    setResolving(true);
    try {
      await onResolve(alert._id);
    } catch {}
  };

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl px-3.5 py-3 flex items-start gap-3 transition-all shadow-xs relative group`}>
      <div className="flex items-center pt-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.indicator}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-bold tracking-widest ${styles.text} ${styles.labelBg} px-1.5 py-0.5 rounded uppercase`}>
            {styles.label}
          </span>
          <span className="text-[10px] text-slate-700 font-semibold">{alert.parameter?.toUpperCase()}</span>
          {alert.device_id && (
            <span className="text-[9px] text-slate-500 font-mono">· {alert.device_id}</span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-800 leading-snug break-words">{alert.message}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
          {alert.trigger_value !== null && alert.trigger_value !== undefined && (
            <span>
              Val: <span className="font-mono font-bold text-slate-800">{alert.trigger_value}</span>
            </span>
          )}
          {alert.threshold_limit !== null && alert.threshold_limit !== undefined && (
            <span>
              Limit: <span className="font-mono font-semibold text-amber-700">{alert.threshold_limit}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap" title={timeStr}>
          {formatRelativeTime(rawTime)}
        </span>
        {onResolve && (
          <button
            onClick={handleResolveClick}
            disabled={resolving}
            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-all flex items-center gap-1 text-[10px] font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            title="Resolve & Dismiss alert"
          >
            <X size={11} className={resolving ? 'animate-spin' : ''} />
            <span>{resolving ? 'Resolving...' : 'Dismiss'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertFeed({ activeAlerts = [], onResolve, compact = false }) {
  const displayed = compact ? activeAlerts.slice(0, 4) : activeAlerts;

  return (
    <div className="bg-white/95 border border-sky-200/80 rounded-2xl p-4.5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">ACTIVE ALERTS</p>
          {activeAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[10px] font-bold text-rose-600 animate-pulse">
              {activeAlerts.length}
            </span>
          )}
        </div>
        {compact && activeAlerts.length > 4 && (
          <Link to="/alerts" className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
            View all ({activeAlerts.length}) <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-2 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-800">No active alerts</p>
          <p className="text-[10px] text-slate-500 mt-0.5">All sensor values within nominal safety limits</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayed.map((alert) => (
            <AlertItem key={alert._id || alert.id} alert={alert} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
