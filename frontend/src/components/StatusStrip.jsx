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

export default function StatusStrip({ deviceId, deviceStatus, wsState, mqttStatus, lastUpdated }) {
  const isOnline = deviceStatus === 'online';
  const wsOk = wsState === 'connected';

  return (
    <div
      className="flex items-center gap-6 px-4 py-2 rounded-lg border text-xs"
      style={{
        backgroundColor: '#0D1117',
        borderColor: isOnline ? '#1E3A2A' : '#3A1A1A',
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
          className={`font-semibold tracking-wider text-[11px] ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
        >
          SYSTEM {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* Device ID */}
      <div className="flex items-center gap-1.5">
        <span className="text-[#64748B]">NODE</span>
        <span className="text-[#94A3B8] font-mono font-medium">{deviceId || '—'}</span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* MQTT status */}
      <div className="flex items-center gap-1.5">
        <Radio size={11} className={wsOk ? 'text-[#22C55E]' : 'text-[#64748B]'} />
        <span className={wsOk ? 'text-[#22C55E]' : 'text-[#64748B]'}>
          {wsOk ? 'MQTT CONNECTED' : 'MQTT OFFLINE'}
        </span>
      </div>

      <span className="w-px h-3.5 bg-[#26303B]" />

      {/* Last sync */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Clock size={11} className="text-[#64748B]" />
        <span className="text-[#64748B]">LAST SYNC</span>
        <span className="text-[#94A3B8] font-medium">{formatLastSeen(lastUpdated)}</span>
      </div>
    </div>
  );
}
