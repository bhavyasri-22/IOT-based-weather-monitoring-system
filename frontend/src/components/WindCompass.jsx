import React from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';
import { degreesToCardinal } from '../utils/weatherUtils';

export default function WindCompass({ telemetry }) {
  const T = telemetry || {};
  const isAvailable = T.wind_speed != null;
  const speed   = isAvailable ? Number(T.wind_speed).toFixed(1) : null;
  const degrees = T.wind_direction != null ? Number(T.wind_direction) : null;
  const gust    = speed != null ? (parseFloat(speed) * 1.35).toFixed(1) : null;
  const cardinal = degreesToCardinal(degrees);

  // Beaufort scale label
  const beaufort = speed != null
    ? parseFloat(speed) < 1 ? 'Calm'
    : parseFloat(speed) < 6 ? 'Light Air'
    : parseFloat(speed) < 12 ? 'Light Breeze'
    : parseFloat(speed) < 20 ? 'Gentle Breeze'
    : parseFloat(speed) < 29 ? 'Moderate Breeze'
    : parseFloat(speed) < 39 ? 'Fresh Breeze'
    : 'Strong Wind'
    : 'N/A';

  const cardinalPoints = [
    { label: 'N', deg: 0, isMajor: true },
    { label: 'NE', deg: 45, isMajor: false },
    { label: 'E', deg: 90, isMajor: true },
    { label: 'SE', deg: 135, isMajor: false },
    { label: 'S', deg: 180, isMajor: true },
    { label: 'SW', deg: 225, isMajor: false },
    { label: 'W', deg: 270, isMajor: true },
    { label: 'NW', deg: 315, isMajor: false },
  ];

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 backdrop-blur-xl shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
            <Wind size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Wind Vector & Dynamics</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                isAvailable 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isAvailable ? 'Anemometer Connected' : 'Anemometer Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Cup Anemometer · azimuth + velocity</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
          {degrees != null ? `${cardinal} · ${degrees}°` : 'N/A'}
        </span>
      </div>

      {/* Compass dial */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto flex items-center justify-center">
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-30 rounded-full flex flex-col items-center justify-center text-center p-4">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium mb-1">
              Cup Anemometer Offline
            </span>
            <p className="text-[10px] text-slate-400">
              Hardware channel not connected
            </p>
          </div>
        )}
        <div className="absolute inset-0 rounded-full border border-slate-200 bg-slate-50/50">
          {/* Degree ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div key={deg} className="absolute w-full h-full flex justify-center"
              style={{ transform: `rotate(${deg}deg)` }}>
              <div className={`w-0.5 ${deg % 90 === 0 ? 'h-2 bg-blue-500' : 'h-1 bg-slate-300'}`} />
            </div>
          ))}

          {/* Cardinal labels */}
          {cardinalPoints.map((pt) => {
            const rad = (pt.deg - 90) * (Math.PI / 180);
            const r = 80;
            return (
              <span key={pt.label}
                className={`absolute text-[10px] font-bold ${pt.isMajor ? (pt.label === 'N' ? 'text-rose-500' : 'text-slate-800') : 'text-slate-400'}`}
                style={{ transform: `translate(${(r * Math.cos(rad)).toFixed(0)}px, ${(r * Math.sin(rad)).toFixed(0)}px)` }}>
                {pt.label}
              </span>
            );
          })}
        </div>

        {/* Rotating needle – only if we have real direction */}
        {degrees != null && (
          <motion.div
            animate={{ rotate: degrees }}
            transition={{ type: 'spring', damping: 15, stiffness: 60 }}
            className="absolute w-36 h-36 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="flex flex-col items-center justify-between h-full py-1">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-emerald-500" />
              <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-500 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          </motion.div>
        )}

        {/* Center readout */}
        <div className="relative z-20 w-24 h-24 rounded-full bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            {speed != null ? speed : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">km/h</span>
          <span className="text-[9px] text-emerald-600 font-mono mt-1 font-semibold">
            {degrees != null ? `${cardinal} ${degrees}°` : 'Offline'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
          <span className="text-slate-500 block text-[11px]">Peak Gust Est.</span>
          <span className="text-slate-900 font-semibold font-mono">{gust != null ? `${gust} km/h` : 'N/A'}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
          <span className="text-slate-500 block text-[11px]">Beaufort Force</span>
          <span className="text-slate-700 font-semibold">{beaufort}</span>
        </div>
      </div>
    </div>
  );
}
