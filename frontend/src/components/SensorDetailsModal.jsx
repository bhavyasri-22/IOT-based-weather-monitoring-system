import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Cpu, 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SensorDetailsModal({ sensor, onClose, telemetry }) {
  if (!sensor) return null;

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sparkData = [];

  const isConnected = sensor.isAvailable !== false;

  const pillStyles = sensor.isBreached
    ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse'
    : isConnected
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0D3563]/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden z-10 text-slate-800"
        >
          {/* Subtle atmospheric gradient in background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900">{sensor.name}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${pillStyles}`}>
                    ● {sensor.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{sensor.description}</p>
              </div>
            </div>

            {/* Close (X) button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shadow-xs z-20"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-5 space-y-5">
            {/* Primary Current Reading Big Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Telemetry</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5 font-sans tabular-nums">
                  {sensor.currentDisplay}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Hardware Interface</span>
                <span className="text-xs text-blue-600 font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200 inline-block mt-0.5 font-semibold">
                  {sensor.interface}
                </span>
              </div>
            </div>

            {/* 3 Metric Summary Boxes: Min, Max, Avg */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-medium">24h Minimum</span>
                <p className="text-base font-bold text-blue-600 mt-0.5">{isConnected ? sensor.minDisplay : 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-medium">24h Average</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">{isConnected ? sensor.avgDisplay : 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-medium">24h Maximum</span>
                <p className="text-base font-bold text-amber-500 mt-0.5">{isConnected ? sensor.maxDisplay : 'N/A'}</p>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">24-Hour Trend Analysis</span>
                <span className="text-[11px] text-slate-500">{isConnected ? 'Sampling rate: 5 sec' : 'No data (Sensor Offline)'}</span>
              </div>
              <div className="h-32 w-full flex items-center justify-center text-xs text-slate-400">
                {isConnected ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                      <defs>
                        <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#0F172A',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Area type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} fill="url(#sensorGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="italic">Hardware is currently not connected. No live trend stream available.</p>
                )}
              </div>
            </div>

            {/* Hardware Diagnostic Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Status</span>
                <span className={`font-medium ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isConnected ? 'Online' : 'Not Connected'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Sampling Pin</span>
                <span className="text-cyan-700 font-mono font-medium">{sensor.pin}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Calibration</span>
                <span className="text-slate-700 font-medium">
                  {isConnected ? 'Calibrated (±0.2)' : 'Unassigned'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Alert Rule</span>
                <span className="text-slate-800 font-medium">{sensor.thresholdRule}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
