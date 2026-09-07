import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  Settings,
  HardDrive
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SensorDetailsModal({ sensor, onClose, telemetry }) {
  if (!sensor) return null;

  // Generate mock 24h trend for this sensor's main reading
  const sparkData = [
    { time: '00:00', val: sensor.avg * 0.92 },
    { time: '04:00', val: sensor.min * 1.02 },
    { time: '08:00', val: sensor.avg * 0.98 },
    { time: '12:00', val: sensor.max * 0.99 },
    { time: '16:00', val: sensor.avg * 1.05 },
    { time: '20:00', val: sensor.avg * 0.96 },
    { time: 'Now', val: sensor.currentNumeric },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#0B1728] border border-white/[0.12] rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden z-10"
        >
          {/* Subtle atmospheric gradient in background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-semibold text-white">{sensor.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-medium">
                    ● {sensor.status}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">{sensor.description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-5 space-y-5">
            {/* Primary Current Reading Big Banner */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Current Telemetry</span>
                <div className="text-2xl sm:text-3xl font-bold text-white mt-0.5 font-sans">
                  {sensor.currentDisplay}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#64748B] font-medium block">Hardware Interface</span>
                <span className="text-xs text-[#60A5FA] font-mono px-2 py-0.5 rounded bg-[#60A5FA]/10 border border-[#60A5FA]/20 inline-block mt-0.5">
                  {sensor.interface}
                </span>
              </div>
            </div>

            {/* 3 Metric Summary Boxes: Min, Max, Avg */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                <span className="text-[11px] text-[#64748B] font-medium">24h Minimum</span>
                <p className="text-base font-semibold text-[#60A5FA] mt-0.5">{sensor.minDisplay}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                <span className="text-[11px] text-[#64748B] font-medium">24h Average</span>
                <p className="text-base font-semibold text-[#34D399] mt-0.5">{sensor.avgDisplay}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                <span className="text-[11px] text-[#64748B] font-medium">24h Maximum</span>
                <p className="text-base font-semibold text-[#FBBF24] mt-0.5">{sensor.maxDisplay}</p>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#94A3B8]">24-Hour Trend Analysis</span>
                <span className="text-[11px] text-[#64748B]">Sampling rate: 5 sec</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101D2E',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="val" stroke="#60A5FA" strokeWidth={2} fill="url(#sensorGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hardware Diagnostic Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748B] block">Uptime</span>
                <span className="text-white font-medium">99.98%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748B] block">Sampling Pin</span>
                <span className="text-[#38BDF8] font-mono font-medium">{sensor.pin}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748B] block">Calibration</span>
                <span className="text-[#34D399] font-medium">Calibrated (±0.2)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748B] block">Alert Rule</span>
                <span className="text-white font-medium">{sensor.thresholdRule}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
