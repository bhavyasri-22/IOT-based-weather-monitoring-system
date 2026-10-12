import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Radio, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  AlertTriangle, 
  CheckCircle2,
} from 'lucide-react';

export default function LiveActivityFeed({ events = [] }) {
  // If empty, supply representative real-time observational events
  const defaultEvents = [
    {
      id: 1,
      type: 'telemetry',
      title: 'Temperature updated',
      subtitle: '28.4°C · BME280',
      timestamp: new Date(Date.now() - 2000),
      icon: Thermometer,
      color: '#D97706',
    },
    {
      id: 2,
      type: 'telemetry',
      title: 'Humidity steady',
      subtitle: '74% · Target range',
      timestamp: new Date(Date.now() - 15000),
      icon: Droplets,
      color: '#0284C7',
    },
    {
      id: 3,
      type: 'telemetry',
      title: 'Rain sensor checked',
      subtitle: '0.0 mm/h · Dry surface',
      timestamp: new Date(Date.now() - 32000),
      icon: CloudRain,
      color: '#0891B2',
    },
    {
      id: 4,
      type: 'heartbeat',
      title: 'ESP32 Node Heartbeat',
      subtitle: 'RSSI -62 dBm · Packet ACK',
      timestamp: new Date(Date.now() - 75000),
      icon: Radio,
      color: '#2563EB',
    },
  ];

  const displayList = events.length > 0 ? events : defaultEvents;

  function getEventIcon(type, title) {
    if (title?.toLowerCase().includes('temp')) return { icon: Thermometer, color: '#D97706' };
    if (title?.toLowerCase().includes('hum')) return { icon: Droplets, color: '#0284C7' };
    if (title?.toLowerCase().includes('wind')) return { icon: Wind, color: '#059669' };
    if (title?.toLowerCase().includes('rain')) return { icon: CloudRain, color: '#0891B2' };
    if (type === 'alert') return { icon: AlertTriangle, color: '#DC2626' };
    if (type === 'alert_resolved') return { icon: CheckCircle2, color: '#059669' };
    return { icon: Radio, color: '#2563EB' };
  }

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 backdrop-blur-xl shadow-xs flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Live Activity Stream</h3>
            <p className="text-xs text-slate-500">Real-time WebSocket event ingestion</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">STREAMING</span>
        </div>
      </div>

      {/* Timeline Feed Container */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5">
        <AnimatePresence initial={false}>
          {displayList.map((item, idx) => {
            const { icon: EventIcon, color } = getEventIcon(item.type, item.title);
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Now';

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-3"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <EventIcon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{timeStr}</span>
                  </div>
                  {item.subtitle && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{item.subtitle}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
