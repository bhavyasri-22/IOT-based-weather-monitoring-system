import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Activity, 
  Wifi, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  RefreshCw,
  HardDrive,
  Zap,
  Gauge
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
      className="space-y-6 pb-12 max-w-[1600px] mx-auto"
    >
      {/* Top Status & Gateway Link Banner */}
      <div className="p-5 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Live Telemetry Gateway</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-medium">
                {isWsConnected ? 'WebSocket Synchronized' : 'Reconnecting...'}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">Node: {deviceId || 'ESP32_SURATHKAL_01'} · Protocol: MQTT + WSS Ingest</p>
          </div>
        </div>

        {/* Live Metrics: Packet Rate, Latency, Sync time */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#64748B] block text-[10px]">Ingestion Frequency</span>
            <span className="text-white font-mono font-semibold">1 frame / 5 sec</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#64748B] block text-[10px]">Stream Latency</span>
            <span className="text-[#34D399] font-mono font-semibold">~18 ms</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[#64748B] block text-[10px]">Last Heartbeat</span>
            <span className="text-[#60A5FA] font-mono font-semibold">{formatRelativeTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <QuickMetricCards telemetry={telemetry} />

      {/* Hardware Transducers Grid */}
      <LiveSensorNetwork telemetry={telemetry} lastUpdated={lastUpdated} deviceStatus={deviceStatus} />

      {/* Raw Payload Inspector & Observability Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Live Ingestion Stream & Packet Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                  <Terminal size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">Active Frame Inspector</h3>
                  <p className="text-xs text-[#64748B]">Decoded JSON telemetry payload</p>
                </div>
              </div>

              <button
                onClick={() => setShowJson(!showJson)}
                className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-[#94A3B8] hover:text-white transition-all"
              >
                {showJson ? 'Format View' : 'Raw JSON'}
              </button>
            </div>

            {showJson ? (
              <pre className="p-4 rounded-xl bg-[#091525] border border-white/[0.06] text-xs font-mono text-[#38BDF8] overflow-x-auto max-h-72">
                {JSON.stringify(T, null, 2)}
              </pre>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(T)
                  .filter(([k]) => !['derived', '_id', '__v'].includes(k))
                  .map(([key, val]) => (
                    <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] uppercase text-[#64748B] font-mono tracking-wider block">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-semibold text-white font-mono mt-0.5 block truncate">
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
