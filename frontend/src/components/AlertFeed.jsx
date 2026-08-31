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
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AlertItem({ alert, onResolve }) {
  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.warning;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg px-3 py-2.5 flex items-start gap-3`}>
      <div className="flex items-center pt-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.indicator}`}
          style={{ boxShadow: styles.glow }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold tracking-widest ${styles.text}`}>
            {styles.label}
          </span>
          <span className="text-[10px] text-[#64748B]">{alert.parameter?.toUpperCase()}</span>
        </div>
        <p className="text-xs font-medium text-[#F1F5F9] leading-snug truncate">{alert.message}</p>
        {alert.trigger_value !== null && alert.trigger_value !== undefined && (
          <p className="text-[10px] text-[#94A3B8] mt-0.5">
            Value: <span className="font-mono font-semibold">{alert.trigger_value}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-[#64748B] whitespace-nowrap">{formatRelativeTime(alert.created_at)}</span>
        {onResolve && (
          <button
            onClick={() => onResolve(alert._id)}
            className="w-5 h-5 rounded flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1A212B] transition-colors"
            title="Mark resolved"
          >
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertFeed({ activeAlerts = [], onResolve, compact = false }) {
  const displayed = compact ? activeAlerts.slice(0, 4) : activeAlerts;

  return (
    <div className="panel-card border border-[#26303B] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-[#64748B]" />
          <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">ACTIVE ALERTS</p>
          {activeAlerts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#EF444420] border border-[#EF444433] flex items-center justify-center text-[9px] font-bold text-[#EF4444]">
              {activeAlerts.length}
            </span>
          )}
        </div>
        {compact && activeAlerts.length > 4 && (
          <Link to="/alerts" className="flex items-center gap-1 text-[10px] text-[#38BDF8] hover:text-[#7DD3FC] transition-colors">
            View all <ChevronRight size={10} />
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="py-4 text-center">
          <div className="w-8 h-8 rounded-full bg-[#22C55E14] border border-[#22C55E33] flex items-center justify-center mx-auto mb-2">
            <span className="text-[#22C55E] text-xs">✓</span>
          </div>
          <p className="text-xs text-[#64748B]">No active alerts</p>
          <p className="text-[10px] text-[#3A4654] mt-0.5">All parameters within normal range</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map((alert) => (
            <AlertItem key={alert._id} alert={alert} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
