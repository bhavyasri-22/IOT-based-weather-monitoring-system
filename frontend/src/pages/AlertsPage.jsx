import React, { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../api/client';
import { AlertTriangle, CheckCircle, Clock, X, RefreshCw } from 'lucide-react';

const SEVERITY_STYLES = {
  critical: { dot: 'bg-[#EF4444]', text: 'text-[#EF4444]', border: 'border-l-[#EF4444]', label: 'CRITICAL', glow: '0 0 6px #EF444466' },
  warning: { dot: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', border: 'border-l-[#F59E0B]', label: 'WARNING', glow: '0 0 6px #F59E0B66' },
};

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AlertRow({ alert, showResolve, onResolve, isAdmin }) {
  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.warning;
  return (
    <div className={`flex items-start gap-4 px-4 py-3 border-b border-[#1A212B] hover:bg-[#151B23] transition-colors border-l-2 ${styles.border}`}>
      <div className="flex items-center pt-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} style={{ boxShadow: styles.glow }} />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-6 gap-3 text-xs items-start">
        <div>
          <span className={`text-[10px] font-bold tracking-wider ${styles.text}`}>{styles.label}</span>
        </div>
        <div className="col-span-2">
          <p className="text-[#F1F5F9] font-medium leading-snug">{alert.message}</p>
          <p className="text-[#64748B] text-[10px] mt-0.5 capitalize">{alert.alert_type?.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] font-mono uppercase text-[10px]">{alert.parameter}</p>
        </div>
        <div>
          {alert.trigger_value !== null && alert.trigger_value !== undefined ? (
            <p className="text-[#F1F5F9] font-semibold font-mono">{alert.trigger_value}</p>
          ) : (
            <p className="text-[#64748B]">—</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[#64748B] text-[10px]">{formatDateTime(alert.created_at)}</p>
          {alert.resolved_at && (
            <p className="text-[#22C55E] text-[10px]">Resolved {formatRelativeTime(alert.resolved_at)}</p>
          )}
        </div>
      </div>
      {showResolve && alert.status === 'active' && (
        isAdmin ? (
          <button
            onClick={() => onResolve(alert._id)}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1A212B] border border-[#26303B] flex items-center justify-center text-[#64748B] hover:text-[#EF4444] hover:border-[#EF444455] transition-colors"
            title="Admin Override: Force resolve alert"
          >
            <X size={12} />
          </button>
        ) : (
          <span className="text-[9px] font-mono text-[#475569] uppercase border border-[#1E2630] px-1.5 py-0.5 rounded">
            Monitoring
          </span>
        )
      )}
    </div>
  );
}

export default function AlertsPage({ user, onResolve }) {
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = tab === 'active' ? { status: 'active' } : { status: 'resolved', limit: 100 };
      const data = await alertsApi.list(params);
      const list = data?.data || data || [];
      setAlerts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleResolve = async (id) => {
    try {
      await alertsApi.resolve(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#151B23] border border-[#26303B] rounded-lg p-1">
          {['active', 'resolved'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold rounded tracking-wider uppercase transition-all ${
                tab === t
                  ? 'bg-[#1A212B] text-[#F1F5F9]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={fetch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] bg-[#151B23] border border-[#26303B] rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="panel-card border border-[#26303B] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-3 px-4 py-2 border-b border-[#26303B] text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
          <div>Severity</div>
          <div className="col-span-2">Message</div>
          <div>Sensor</div>
          <div>Value</div>
          <div className="text-right">Timestamp</div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-xs text-[#64748B]">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-xs text-[#EF4444]">{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center">
            {tab === 'active' ? (
              <>
                <CheckCircle size={24} className="text-[#22C55E] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No active alerts</p>
                <p className="text-[10px] text-[#3A4654] mt-1">All parameters within normal range</p>
              </>
            ) : (
              <>
                <Clock size={24} className="text-[#64748B] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No resolved alerts found</p>
              </>
            )}
          </div>
        ) : (
          alerts.map((a) => (
            <AlertRow
              key={a._id}
              alert={a}
              showResolve={tab === 'active'}
              onResolve={handleResolve}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
}
