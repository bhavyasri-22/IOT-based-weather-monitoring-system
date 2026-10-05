import React from 'react';
import { motion } from 'framer-motion';
import WeatherOverviewCard from '../components/WeatherOverviewCard';
import SensorConditionsGrid from '../components/SensorConditionsGrid';
import RainStatusCard from '../components/RainStatusCard';
import WeatherTrendChart from '../components/WeatherTrendChart';
import RecentReadingsTable from '../components/RecentReadingsTable';
import ActiveAlertsBanner from '../components/ActiveAlertsBanner';

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
      {/* 0. Project & Course Attribution Banner */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-3xl px-6 py-4 bg-white dark:bg-[#0E1A29]/80 border border-slate-200/80 dark:border-white/[0.08] shadow-sm text-center space-y-1"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <span>C Thanmai Sai</span>
          <span className="text-slate-300 dark:text-white/20 hidden sm:inline">·</span>
          <span>Mili Dholaria</span>
          <span className="text-slate-300 dark:text-white/20 hidden sm:inline">·</span>
          <span>Thota Bhavya Sri</span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
          under <span className="font-semibold text-slate-700 dark:text-slate-300">IT 303 Course</span> · supervised by{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">Prof. Jaidhar C D</span>
        </p>
      </motion.div>

      {/* 1. Active Environmental Alerts (if any) */}
      <ActiveAlertsBanner
        activeAlerts={activeAlerts}
        onResolve={onResolveAlert}
      />

      {/* 2. Main Weather Overview (Large Primary Focal Card) */}
      <WeatherOverviewCard
        telemetry={telemetry}
        lastUpdated={lastUpdated}
        deviceStatus={deviceStatus}
      />

      {/* 3. Sensor Conditions Grid (Consolidated Real Hardware Telemetry) */}
      <SensorConditionsGrid
        telemetry={telemetry}
      />

      {/* 4. Rain Status & Recent Readings Log (Structured 2-Column Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <RainStatusCard
            telemetry={telemetry}
          />
        </div>
        <div className="lg:col-span-7">
          <RecentReadingsTable
            deviceId={deviceId}
            telemetry={telemetry}
          />
        </div>
      </div>

      {/* 5. Prominent Environmental & Rainfall Trend Chart */}
      <WeatherTrendChart
        deviceId={deviceId}
        telemetry={telemetry}
      />
    </motion.div>
  );
}
