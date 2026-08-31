import React, { useState, useEffect, useCallback } from 'react';
import { devicesApi } from '../api/client';
import { Cpu, Wifi, WifiOff, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const SENSOR_HARDWARE = [
  'BME280 (Temperature)',
  'BME280 (Pressure)',
  'BME280 (Humidity)',
  'BH1750 (Light)',
  'FC-37 (Rain)',
  'MQ135 (AQI Proxy)',
  'Anemometer (Wind)',
];

function formatLastSeen(ts) {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function DeviceCard({ device }) {
  const isOnline = device.status === 'online';
  return (
    <div className={`panel-card border p-5 ${isOnline ? 'border-[#26303B]' : 'border-[#EF444422]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#11161D] border border-[#26303B] flex items-center justify-center">
            <Cpu size={16} className="text-[#64748B]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9] font-mono">{device.device_id}</p>
            {device.firmware_version && (
              <p className="text-[10px] text-[#64748B]">FW v{device.firmware_version}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#11161D] border border-[#26303B]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
            style={isOnline ? { boxShadow: '0 0 5px #22C55E99' } : {}}
          />
          <span className={`text-[11px] font-semibold tracking-wider ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Device info grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">Last Seen</p>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-[#64748B]" />
            <p className="text-xs text-[#94A3B8]">{formatLastSeen(device.last_seen)}</p>
          </div>
        </div>
        <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">Protocol</p>
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className={isOnline ? 'text-[#22C55E]' : 'text-[#64748B]'} />
            <p className="text-xs text-[#94A3B8]">MQTT / WebSocket</p>
          </div>
        </div>
      </div>

      {/* Sensor list */}
      <div>
        <p className="text-[9px] font-semibold tracking-widest text-[#3A4654] uppercase mb-2.5">SENSOR HARDWARE</p>
        <div className="flex flex-col gap-1.5">
          {SENSOR_HARDWARE.map((sensor) => (
            <div key={sensor} className="flex items-center justify-between">
              <span className="text-[11px] text-[#94A3B8]">{sensor}</span>
              {isOnline ? (
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-[#22C55E]" />
                  <span className="text-[10px] text-[#22C55E] font-medium">HEALTHY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle size={10} className="text-[#64748B]" />
                  <span className="text-[10px] text-[#64748B] font-medium">UNKNOWN</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const [nodes, setNodes] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, healthData] = await Promise.all([
        devicesApi.list(),
        devicesApi.health(),
      ]);
      const nodeList = statusData?.data || statusData || [];
      setNodes(Array.isArray(nodeList) ? nodeList : []);
      setHealth(healthData?.data || healthData);
    } catch {
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      {health && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'TOTAL DEVICES', value: health.total || nodes.length, color: 'text-[#F1F5F9]' },
            { label: 'ONLINE', value: health.online || nodes.filter((n) => n.status === 'online').length, color: 'text-[#22C55E]' },
            { label: 'OFFLINE', value: health.offline || nodes.filter((n) => n.status !== 'online').length, color: 'text-[#EF4444]' },
          ].map((s) => (
            <div key={s.label} className="panel-card border border-[#26303B] px-4 py-3">
              <p className="text-[9px] font-semibold tracking-widest text-[#64748B] uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Registered Nodes</p>
        <button
          onClick={fetch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] bg-[#151B23] border border-[#26303B] rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="panel-card border border-[#26303B] p-5">
              <div className="space-y-3">
                <div className="h-5 bg-[#1A212B] rounded animate-pulse w-1/3" />
                <div className="h-3 bg-[#1A212B] rounded animate-pulse w-1/2" />
                <div className="h-16 bg-[#1A212B] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <div className="panel-card border border-[#26303B] py-16 text-center">
          <Cpu size={28} className="text-[#26303B] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No devices registered</p>
          <p className="text-[10px] text-[#3A4654] mt-1">Devices will appear here once they connect</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {nodes.map((device) => (
            <DeviceCard key={device.device_id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}
