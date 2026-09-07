import React from 'react';
import { motion } from 'framer-motion';
import WeatherHero from '../components/WeatherHero';
import QuickMetricCards from '../components/QuickMetricCards';
import LiveSensorNetwork from '../components/LiveSensorNetwork';
import MultiMetricAnalytics from '../components/MultiMetricAnalytics';
import TempHumidityCorrelation from '../components/TempHumidityCorrelation';
import WindCompass from '../components/WindCompass';
import AQIIndicator from '../components/AQIIndicator';
import LightIntensityChart from '../components/LightIntensityChart';
import RainfallVisualization from '../components/RainfallVisualization';
import LiveActivityFeed from '../components/LiveActivityFeed';
import AlertsPanel from '../components/AlertsPanel';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto"
    >
      {/* 1. Hero Weather Section + Concentric Atmospheric Radar */}
      <WeatherHero
        telemetry={telemetry}
        lastUpdated={lastUpdated}
        deviceStatus={deviceStatus}
      />

      {/* 2. Quick Metric Cards (6 Compact Metrics with Sparklines) */}
      <QuickMetricCards
        telemetry={telemetry}
      />

      {/* 3. Live Sensor Network (5 Physical Hardware Sensors) */}
      <LiveSensorNetwork
        telemetry={telemetry}
        lastUpdated={lastUpdated}
        deviceStatus={deviceStatus}
      />

      {/* 4. Multi-Metric Time Series & Temp vs Humidity Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <MultiMetricAnalytics
            deviceId={deviceId}
            telemetry={telemetry}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <TempHumidityCorrelation
            telemetry={telemetry}
          />
        </div>
      </div>

      {/* 5. Environmental Transducer Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <WindCompass telemetry={telemetry} />
        <AQIIndicator telemetry={telemetry} />
        <LightIntensityChart telemetry={telemetry} />
        <RainfallVisualization telemetry={telemetry} />
      </div>

      {/* 6. Live Activity Stream & Active Environmental Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveActivityFeed events={activityFeed} />
        <AlertsPanel
          activeAlerts={activeAlerts}
          onResolve={onResolveAlert}
        />
      </div>
    </motion.div>
  );
}
