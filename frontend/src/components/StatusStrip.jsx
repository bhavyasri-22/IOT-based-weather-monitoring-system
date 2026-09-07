import React from 'react';
import { Wifi, WifiOff, Radio, Clock } from 'lucide-react';

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
      className="flex items-center gap-6 px-4 py-2.5 rounded-lg border text-xs panel-card shadow-sm"
      style={{
        borderColor: isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }}
    >
      {/* Device status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
          style={
            isOnline
              ? { boxShadow: '0 0 6px #22C55E99' }
              : { boxShadow: '0 0 6px #EF444499' }
          }
        />
        <span
          className={`font-bold tracking-wider text-[11px] ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
        >
          SYSTEM {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* Device ID */}
      <div className="flex items-center gap-1.5">
        <span className="text-[#64748B] font-semibold text-[10px] tracking-wider">PRIMARY NODE:</span>
        <span className="text-[#94A3B8] font-mono font-bold text-xs">{deviceId || 'ESP32-NODE-01'}</span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* MQTT status */}
      <div className="flex items-center gap-1.5">
        <Radio size={12} className={wsOk ? 'text-[#22C55E]' : 'text-[#64748B]'} />
        <span className={`font-semibold tracking-wider text-[11px] ${wsOk ? 'text-[#22C55E]' : 'text-[#64748B]'}`}>
          {wsOk ? 'LIVE WS STREAM' : 'STREAM DISCONNECTED'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* Last sync */}
      <div className="flex items-center gap-2 ml-auto">
        <Clock size={12} className="text-[#38BDF8]" />
        <span className="text-[#64748B] font-semibold text-[10px] tracking-wider">LAST SYNC:</span>
        <span className="text-[#F1F5F9] font-medium font-mono">
          {formatLastSeen(lastUpdated)}
        </span>
        {lastUpdated && (
          <span className="text-[#64748B] text-[10px] font-mono">({formatClock(lastUpdated)})</span>
        )}
      </div>
    </div>
  );
}
