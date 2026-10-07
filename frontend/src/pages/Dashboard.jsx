import React from 'react';
import { motion } from 'framer-motion';
import WeatherOverviewCard    from '../components/WeatherOverviewCard';
import SensorConditionsGrid   from '../components/SensorConditionsGrid';
import RainStatusCard         from '../components/RainStatusCard';
import WeatherTrendChart      from '../components/WeatherTrendChart';
import RecentReadingsTable    from '../components/RecentReadingsTable';
import ActiveAlertsBanner     from '../components/ActiveAlertsBanner';

export default function Dashboard({
  telemetry,
  deviceId,
  deviceStatus,
  wsState,
  lastUpdated,
  activeAlerts,
  onResolveAlert,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-12 max-w-[1440px] mx-auto"
    >
      {/* Active Environmental Alerts */}
      <ActiveAlertsBanner
        activeAlerts={activeAlerts}
        onResolve={onResolveAlert}
      />

      {/* Main Weather Overview */}
      <WeatherOverviewCard
        telemetry={telemetry}
        lastUpdated={lastUpdated}
        deviceStatus={deviceStatus}
      />

      {/* Sensor Conditions Grid */}
      <SensorConditionsGrid telemetry={telemetry} />

      {/* Rain Status & Recent Readings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <RainStatusCard telemetry={telemetry} />
        </div>
        <div className="lg:col-span-7">
          <RecentReadingsTable deviceId={deviceId} telemetry={telemetry} />
        </div>
      </div>

      {/* Environmental Trend Chart */}
      <WeatherTrendChart deviceId={deviceId} telemetry={telemetry} />
    </motion.div>
  );
}
