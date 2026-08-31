import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, Wifi, WifiOff, CheckCircle, XCircle, Clock } from 'lucide-react';
import { devicesApi } from '../api/client';

const SENSOR_HARDWARE = [
  { id: 'temperature', label: 'BME280 (Temp/Hum)' },
  { id: 'pressure', label: 'BME280 (Pressure)' },
  { id: 'light_lux', label: 'BH1750 (Light)' },
  { id: 'rain_intensity', label: 'FC-37 (Rain)' },
  { id: 'gas_aqi', label: 'MQ135 (AQI Proxy)' },
  { id: 'wind_speed', label: 'Anemometer (Wind)' },
];

function formatLastSeen(ts) {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function DeviceBadge({ telemetry }) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await devicesApi.health();
      const health = data?.data || data;
      if (health?.nodes?.length) {
        setDevice(health.nodes[0]);
      }
    } catch {
      // leave device null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  const isOnline = device?.status === 'online';

  // Count operational sensors from latest telemetry
  const operationalSensors = SENSOR_HARDWARE.filter((s) => {
    const val = telemetry?.[s.id] ?? telemetry?.derived?.[s.id];
    return val !== null && val !== undefined;
  }).length;

  return (
    <div className="panel-card border border-[#26303B] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={13} className="text-[#64748B]" />
        <p className="text-[10px] font-semibold tracking-widest text-[#64748B]">DEVICE HEALTH</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-[#1A212B] rounded animate-pulse w-2/3" />
          <div className="h-3 bg-[#1A212B] rounded animate-pulse w-1/2" />
        </div>
      ) : !device ? (
        <div className="py-3 text-center">
          <WifiOff size={20} className="text-[#64748B] mx-auto mb-1.5" />
          <p className="text-xs text-[#64748B]">No device registered</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9] font-mono">{device.device_id}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
                style={isOnline ? { boxShadow: '0 0 5px #22C55E99' } : {}}
              />
              <span className={`text-[11px] font-semibold tracking-wider ${isOnline ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2">
              <p className="text-[9px] text-[#64748B] uppercase tracking-wider mb-0.5">Last Heartbeat</p>
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-[#64748B]" />
                <p className="text-xs text-[#94A3B8] font-medium">{formatLastSeen(device.last_seen)}</p>
              </div>
            </div>
            <div className="bg-[#11161D] border border-[#26303B] rounded-lg px-3 py-2">
              <p className="text-[9px] text-[#64748B] uppercase tracking-wider mb-0.5">Sensors</p>
              <p className="text-xs text-[#94A3B8] font-medium">
                <span className={operationalSensors === SENSOR_HARDWARE.length ? 'text-[#22C55E]' : 'text-[#F59E0B]'}>
                  {operationalSensors}
                </span>
                <span className="text-[#64748B]"> / {SENSOR_HARDWARE.length} ok</span>
              </p>
            </div>
          </div>

          {/* Sensor checklist */}
          <div>
            <p className="text-[9px] font-semibold tracking-widest text-[#3A4654] uppercase mb-2">SENSORS</p>
            <div className="flex flex-col gap-1.5">
              {SENSOR_HARDWARE.map((sensor) => {
                const val = telemetry?.[sensor.id] ?? telemetry?.derived?.[sensor.id];
                const ok = val !== null && val !== undefined;
                return (
                  <div key={sensor.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#94A3B8]">{sensor.label}</span>
                    <div className="flex items-center gap-1">
                      {ok ? (
                        <>
                          <CheckCircle size={10} className="text-[#22C55E]" />
                          <span className="text-[10px] text-[#22C55E] font-medium">HEALTHY</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={10} className="text-[#64748B]" />
                          <span className="text-[10px] text-[#64748B] font-medium">UNAVAIL.</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
