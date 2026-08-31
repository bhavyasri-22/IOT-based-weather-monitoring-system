import React, { useState, useCallback } from 'react';
import SensorCard from '../components/SensorCard';
import TrendChart from '../components/TrendChart';
import AlertFeed from '../components/AlertFeed';
import ActivityFeed from '../components/ActivityFeed';
import DeviceBadge from '../components/DeviceBadge';
import StatusStrip from '../components/StatusStrip';
import { telemetryApi } from '../api/client';

export default function Dashboard({
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

  const handleFetchHistory = useCallback(
    async (metric, range) => {
      if (!deviceId) return [];
      try {
        const data = await telemetryApi.history(deviceId, metric, range, 200);
        return data?.data || data || [];
      } catch {
        return [];
      }
    },
    [deviceId]
  );

  return (
    <div className="space-y-5">
      {/* Status strip */}
      <StatusStrip
        deviceId={deviceId}
        deviceStatus={deviceStatus}
        wsState={wsState}
        lastUpdated={lastUpdated}
      />

      {/* Live Conditions */}
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-3">
          Live Conditions
        </p>

        {/* Primary sensors – 2x2 grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <SensorCard sensor="temperature" value={T?.temperature ?? null} updated={lastUpdated} />
          <SensorCard sensor="humidity" value={T?.humidity ?? null} updated={lastUpdated} />
          <SensorCard sensor="wind_speed" value={T?.wind_speed ?? null} updated={lastUpdated} />
          <SensorCard sensor="rain_intensity" value={T?.rain_intensity ?? null} updated={lastUpdated} />
        </div>

        {/* Secondary sensors – 2x2 compact grid */}
        <div className="grid grid-cols-2 gap-3">
          <SensorCard sensor="pressure" value={T?.pressure ?? null} variant="secondary" />
          <SensorCard sensor="light_lux" value={T?.light_lux ?? null} variant="secondary" />
          <SensorCard sensor="gas_aqi" value={T?.gas_aqi ?? null} variant="secondary" />
          <SensorCard sensor="heat_index" value={derived.heat_index ?? null} variant="secondary" />
        </div>
      </div>

      {/* Trend Chart */}
      <TrendChart
        deviceId={deviceId}
        onFetchHistory={handleFetchHistory}
        defaultMetric="temperature"
      />

      {/* Bottom row: Alerts + Activity + Device Health */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <AlertFeed
            activeAlerts={activeAlerts}
            onResolve={onResolveAlert}
            compact
          />
        </div>
        <div className="col-span-1">
          <ActivityFeed events={activityFeed} />
        </div>
        <div className="col-span-1">
          <DeviceBadge telemetry={T} />
        </div>
      </div>
    </div>
  );
}
