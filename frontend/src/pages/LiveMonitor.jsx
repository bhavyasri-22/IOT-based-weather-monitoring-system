import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Terminal, 
} from 'lucide-react';
import QuickMetricCards from '../components/QuickMetricCards';
import LiveSensorNetwork from '../components/LiveSensorNetwork';
import LiveActivityFeed from '../components/LiveActivityFeed';
import AlertsPanel from '../components/AlertsPanel';
import { formatRelativeTime } from '../utils/weatherUtils';

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
  const T = telemetry || {};
  const isOnline = deviceStatus === 'online';
  const isWsConnected = wsState === 'connected';

  // Raw telemetry payload inspector
  const [showJson, setShowJson] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto text-slate-800"
    >
      {/* Top Status & Gateway Link Banner */}
      <div className="p-5 rounded-2xl bg-white/90 border border-sky-200/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Live Telemetry Gateway</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                isWsConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isWsConnected ? 'WebSocket Synchronized' : 'Reconnecting...'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Node: {deviceId || 'ESP32-NODE-01'} · Protocol: MQTT + WSS Ingest</p>
          </div>
        </div>

        {/* Live Metrics: Packet Rate, Latency, Sync time */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Ingestion Frequency</span>
            <span className="text-slate-900 font-mono font-semibold">1 frame / 5 sec</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Stream Latency</span>
            <span className="text-emerald-600 font-mono font-semibold">~18 ms</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Last Heartbeat</span>
            <span className="text-blue-600 font-mono font-semibold">{formatRelativeTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <QuickMetricCards telemetry={telemetry} activeAlerts={activeAlerts} />

      {/* Hardware Transducers Grid */}
      <LiveSensorNetwork telemetry={telemetry} lastUpdated={lastUpdated} deviceStatus={deviceStatus} activeAlerts={activeAlerts} />

      {/* Raw Payload Inspector & Observability Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Live Ingestion Stream & Packet Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Terminal size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">Active Frame Inspector</h3>
                  <p className="text-xs text-slate-500">Decoded JSON telemetry payload</p>
                </div>
              </div>

              <button
                onClick={() => setShowJson(!showJson)}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono text-slate-700 transition-all cursor-pointer"
              >
                {showJson ? 'Format View' : 'Raw JSON'}
              </button>
            </div>

            {showJson ? (
              <pre className="p-4 rounded-xl bg-slate-900 text-sky-300 border border-slate-700 text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(T, null, 2)}
              </pre>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(T)
                  .filter(([k]) => !['derived', '_id', '__v'].includes(k))
                  .map(([key, val]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider block">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 font-mono mt-0.5 block truncate">
                        {val != null ? String(val) : '—'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <LiveActivityFeed events={activityFeed} />
        </div>

        {/* Right 5 Columns: Active Alerts */}
        <div className="lg:col-span-5">
          <AlertsPanel activeAlerts={activeAlerts} onResolve={onResolveAlert} />
        </div>
      </div>
    </motion.div>
  );
}
