import React from 'react';
import { Radio, Clock } from 'lucide-react';

function formatLastSeen(lastUpdated) {
  if (!lastUpdated) return '--';
  const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatClock(date) {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function StatusStrip({ deviceId, deviceStatus, wsState, mqttStatus, lastUpdated }) {
  const isOnline = deviceStatus === 'online';
  const wsOk = wsState === 'connected';

  return (
    <div
      className="flex items-center gap-6 px-4 py-2.5 rounded-xl border text-xs bg-white/95 shadow-xs"
      style={{
        borderColor: isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }}
    >
      {/* Device status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
        />
        <span
          className={`font-bold tracking-wider text-[11px] ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}
        >
          SYSTEM {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-slate-200" />

      {/* Device ID */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500 font-semibold text-[10px] tracking-wider">PRIMARY NODE:</span>
        <span className="text-slate-800 font-mono font-bold text-xs">{deviceId || 'ESP32-NODE-01'}</span>
      </div>

      <span className="w-px h-3.5 bg-slate-200" />

      {/* MQTT status */}
      <div className="flex items-center gap-1.5">
        <Radio size={12} className={wsOk ? 'text-emerald-600' : 'text-slate-400'} />
        <span className={`font-semibold tracking-wider text-[11px] ${wsOk ? 'text-emerald-700' : 'text-slate-500'}`}>
          {wsOk ? 'LIVE WS STREAM' : 'STREAM DISCONNECTED'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-slate-200" />

      {/* Last sync */}
      <div className="flex items-center gap-2 ml-auto">
        <Clock size={12} className="text-blue-500" />
        <span className="text-slate-500 font-semibold text-[10px] tracking-wider">LAST SYNC:</span>
        <span className="text-slate-800 font-medium font-mono">
          {formatLastSeen(lastUpdated)}
        </span>
        {lastUpdated && (
          <span className="text-slate-500 text-[10px] font-mono">({formatClock(lastUpdated)})</span>
        )}
      </div>
    </div>
  );
}
