import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CloudSun, ArrowUp } from 'lucide-react';

const TEAM = ['C Thanmai Sai', 'Mili Dholaria', 'Thota Bhavya Sri'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{
        background: 'linear-gradient(155deg, #F0F7FF 0%, #E3F2FD 50%, #D0E7FF 100%)',
      }}
    >
      {/* ── Top Header / Brand ───────────────────────────────── */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm">
            <CloudSun size={22} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-950 tracking-tight leading-none">
              IoT Weather Monitoring
            </h2>
            <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
              IT303 Software Engineering
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/80 border border-blue-200 text-blue-800 shadow-sm">
          NIT Karnataka
        </span>
      </header>

      {/* ── Hero & Primary Content ────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Course Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold border shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: '#90CAF9',
            color: '#1565C0',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          IT303 Software Engineering · NIT Karnataka
        </motion.div>

        {/* Project Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5"
          style={{ color: '#0A2540' }}
        >
          IoT-Based Weather{' '}
          <span style={{ color: '#1976D2' }}>Monitoring System</span>
        </motion.h1>

        {/* Concise Project Introduction */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg max-w-2xl mb-8 leading-relaxed font-normal"
          style={{ color: '#2C5282' }}
        >
          A real-time environmental monitoring platform developed to collect, process,
          and visualize live weather telemetry from an ESP32 hardware station via MQTT
          and persistent MongoDB storage.
        </motion.p>

        {/* Project Credits Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mb-8 px-6 py-4 rounded-2xl max-w-xl w-full border shadow-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#BBDEFB',
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-blue-600">
            Developed By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2">
            {TEAM.map((name, i) => (
              <React.Fragment key={name}>
                <span className="text-sm font-semibold text-blue-950">
                  {name}
                </span>
                {i < TEAM.length - 1 && (
                  <span className="text-blue-300 font-bold">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Part of <span className="font-semibold text-blue-900">IT303 Software Engineering Course</span>
            {' '}·{' '}
            Under the guidance of{' '}
            <span className="font-semibold text-blue-900">Prof. Jaidhar C D</span>
          </p>
        </motion.div>

        {/* Single Prominent Call to Action — Nothing Below This */}
        <motion.button
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/choose-access')}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-xl transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
            boxShadow: '0 8px 24px rgba(25, 118, 210, 0.35)',
          }}
        >
          Check Out Now
          <ArrowRight size={19} />
        </motion.button>
      </main>

      {/* Bottom navigation button to go to top of page */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-sm hover:shadow transition-all text-xs font-semibold"
          aria-label="Back to top"
        >
          <ArrowUp size={14} />
          <span>Back to Top</span>
        </button>
      </div>
    </div>
  );
}
