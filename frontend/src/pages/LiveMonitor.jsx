import React from 'react';
import SensorCard from '../components/SensorCard';
import StatusStrip from '../components/StatusStrip';
import ActivityFeed from '../components/ActivityFeed';
import AlertFeed from '../components/AlertFeed';

export default function LiveMonitor({
  telemetry,
  deviceId,
  deviceStatus,
  wsState,
  lastUpdated,
  activeAlerts,
  onResolveAlert,
  activityFeed,
}) {
  const T = telemetry;
  const derived = T?.derived || {};

  const ALL_SENSORS = [
    { sensor: 'temperature', value: T?.temperature ?? null, variant: 'primary' },
    { sensor: 'humidity', value: T?.humidity ?? null, variant: 'primary' },
    { sensor: 'wind_speed', value: T?.wind_speed ?? null, variant: 'primary' },
    { sensor: 'rain_intensity', value: T?.rain_intensity ?? null, variant: 'primary' },
    { sensor: 'pressure', value: T?.pressure ?? null, variant: 'primary' },
    { sensor: 'light_lux', value: T?.light_lux ?? null, variant: 'primary' },
    { sensor: 'gas_aqi', value: T?.gas_aqi ?? null, variant: 'primary' },
    { sensor: 'heat_index', value: derived.heat_index ?? null, variant: 'primary' },
  ];

  return (
    <div className="space-y-5">
      <StatusStrip
        deviceId={deviceId}
        deviceStatus={deviceStatus}
        wsState={wsState}
        lastUpdated={lastUpdated}
      />

      <div>
        <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-3">
          All Sensors — Real-Time
        </p>
        <div className="grid grid-cols-4 gap-4">
          {ALL_SENSORS.map(({ sensor, value, variant }) => (
            <SensorCard key={sensor} sensor={sensor} value={value} updated={lastUpdated} variant={variant} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AlertFeed activeAlerts={activeAlerts} onResolve={onResolveAlert} />
        <ActivityFeed events={activityFeed} />
      </div>
    </div>
  );
}
