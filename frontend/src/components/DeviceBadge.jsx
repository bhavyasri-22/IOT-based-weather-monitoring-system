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
    <div className="bg-white/95 border border-sky-200/80 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={13} className="text-slate-500" />
        <p className="text-[10px] font-semibold tracking-widest text-slate-500">DEVICE HEALTH</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        </div>
      ) : !device ? (
        <div className="py-3 text-center">
          <WifiOff size={20} className="text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500">No device registered</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 font-mono">{device.device_id}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
              <span className={`text-[11px] font-semibold tracking-wider ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Last Heartbeat</p>
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-slate-400" />
                <p className="text-xs text-slate-700 font-medium">{formatLastSeen(device.last_seen)}</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Sensors</p>
              <p className="text-xs text-slate-700 font-medium">
                <span className={operationalSensors === SENSOR_HARDWARE.length ? 'text-emerald-600' : 'text-amber-600'}>
                  {operationalSensors}
                </span>
                <span className="text-slate-500"> / {SENSOR_HARDWARE.length} active</span>
              </p>
            </div>
          </div>

          {/* Sensor checklist */}
          <div>
            <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase mb-2">SENSORS</p>
            <div className="flex flex-col gap-1.5">
              {SENSOR_HARDWARE.map((sensor) => {
                const val = telemetry?.[sensor.id] ?? telemetry?.derived?.[sensor.id];
                const ok = val !== null && val !== undefined;
                return (
                  <div key={sensor.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">{sensor.label}</span>
                    <div className="flex items-center gap-1">
                      {ok ? (
                        <>
                          <CheckCircle size={10} className="text-emerald-600" />
                          <span className="text-[10px] text-emerald-600 font-medium">HEALTHY</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={10} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">NOT CONNECTED</span>
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
