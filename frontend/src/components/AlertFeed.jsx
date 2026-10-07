import React from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-[#1F0F0F]',
    border: 'border-[#EF444433]',
    indicator: 'bg-[#EF4444]',
    text: 'text-[#EF4444]',
    icon: 'text-[#EF4444]',
    label: 'CRITICAL',
    glow: '0 0 6px #EF444466',
  },
  warning: {
    bg: 'bg-[#1A1200]',
    border: 'border-[#F59E0B33]',
    indicator: 'bg-[#F59E0B]',
    text: 'text-[#F59E0B]',
    icon: 'text-[#F59E0B]',
    label: 'WARNING',
    glow: '0 0 6px #F59E0B66',
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
    <div className={`${styles.bg} ${styles.border} border rounded-lg px-3.5 py-3 flex items-start gap-3 transition-all hover:border-opacity-100 shadow-sm relative group`}>
      <div className="flex items-center pt-1">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.indicator}`}
          style={{ boxShadow: styles.glow }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-bold tracking-widest ${styles.text} px-1.5 py-0.2 rounded bg-sky-950/10 uppercase`}>
            {styles.label}
          </span>
          <span className="text-[10px] text-[#94A3B8] font-semibold">{alert.parameter?.toUpperCase()}</span>
          {alert.device_id && (
            <span className="text-[9px] text-[#64748B] font-mono">· {alert.device_id}</span>
          )}
        </div>
        <p className="text-xs font-semibold text-[#F1F5F9] leading-snug break-words">{alert.message}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#64748B]">
          {alert.trigger_value !== null && alert.trigger_value !== undefined && (
            <span>
              Val: <span className="font-mono font-bold text-[#F1F5F9]">{alert.trigger_value}</span>
            </span>
          )}
          {alert.threshold_limit !== null && alert.threshold_limit !== undefined && (
            <span>
              Limit: <span className="font-mono font-semibold text-[#F59E0B]">{alert.threshold_limit}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-[#64748B] font-mono whitespace-nowrap" title={timeStr}>
          {formatRelativeTime(rawTime)}
        </span>
        {onResolve && (
          <button
            onClick={handleResolveClick}
            disabled={resolving}
            className="px-2 py-1 rounded bg-[#1A212B] border border-[#2D3947] text-[#94A3B8] hover:text-[#22C55E] hover:border-[#22C55E55] hover:bg-[#15231B] transition-all flex items-center gap-1 text-[10px] font-semibold shadow-xs disabled:opacity-50"
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
    <div className="panel-card border border-[#26303B] p-4.5 shadow-md">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#F59E0B]" />
          <p className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">ACTIVE ALERTS</p>
          {activeAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#EF444420] border border-[#EF444455] text-[10px] font-bold text-[#EF4444] animate-pulse">
              {activeAlerts.length}
            </span>
          )}
        </div>
        {compact && activeAlerts.length > 4 && (
          <Link to="/alerts" className="flex items-center gap-1 text-[11px] font-medium text-[#38BDF8] hover:text-[#7DD3FC] transition-colors">
            View all ({activeAlerts.length}) <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-9 h-9 rounded-full bg-[#22C55E14] border border-[#22C55E33] flex items-center justify-center mx-auto mb-2">
            <span className="text-[#22C55E] text-sm">✓</span>
          </div>
          <p className="text-xs font-semibold text-[#F1F5F9]">All Clear</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">No active alerts. All parameters are within normal thresholds.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {displayed.map((alert) => (
            <AlertItem key={alert._id || alert.id || Math.random()} alert={alert} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
