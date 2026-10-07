import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Gauge,
  Activity,
  ArrowRight,
  Wifi,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';

const TEAM = ['C Thanmai Sai', 'Mili Dholaria', 'Thota Bhavya Sri'];

const SENSORS = [
  { icon: Thermometer, label: 'Temperature', color: '#1976D2', sub: 'BME280' },
  { icon: Droplets,    label: 'Humidity',    color: '#0288D1', sub: 'BME280' },
  { icon: CloudRain,   label: 'Rainfall',    color: '#0097A7', sub: 'FC-37'  },
  { icon: Gauge,       label: 'Pressure',    color: '#1565C0', sub: 'BME280' },
  { icon: Activity,    label: 'Air Quality', color: '#2E7D32', sub: 'MQ-135' },
  { icon: Wind,        label: 'Ambient Light', color: '#1565C0', sub: 'BH1750' },
];

const FLOW = [
  { icon: Cpu,      label: 'ESP32 Node',       sub: 'Hardware sensors' },
  { icon: Radio,    label: 'MQTT Broker',       sub: 'Real-time data stream' },
  { icon: Database, label: 'MongoDB Atlas',     sub: 'Persistent storage' },
  { icon: Wifi,     label: 'WebSocket Gateway', sub: 'Live dashboard push' },
];

function FloatingCloud({ cx, cy, r, speed, delay }) {
  return (
    <motion.ellipse
      cx={cx} cy={cy} rx={r * 2.2} ry={r}
      fill="rgba(255,255,255,0.55)"
      animate={{ x: [0, 22, 0] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #EAF6FF 0%, #DDEFFF 40%, #C8E6FF 100%)' }}
    >
      {/* ── Sky SVG Background ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          {/* Soft ambient orbs */}
          <defs>
            <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1976D2" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1976D2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="150" rx="380" ry="280" fill="url(#orb1)" />
          <ellipse cx="1300" cy="700" rx="420" ry="300" fill="url(#orb2)" />

          {/* Floating clouds */}
          <FloatingCloud cx={280}  cy={180} r={38} speed={10} delay={0}   />
          <FloatingCloud cx={680}  cy={90}  r={28} speed={13} delay={2.5} />
          <FloatingCloud cx={1100} cy={160} r={42} speed={11} delay={1}   />
          <FloatingCloud cx={900}  cy={320} r={22} speed={14} delay={3.5} />
          <FloatingCloud cx={420}  cy={360} r={18} speed={16} delay={1.5} />
          <FloatingCloud cx={1300} cy={250} r={32} speed={12} delay={4}   />

          {/* Subtle horizontal divider line */}
          <line x1="0" y1="880" x2="1440" y2="880" stroke="#B3D9F5" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── TOP NAV BAR ──────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
            <span
              className="text-sm font-bold tracking-tight"
              style={{ color: '#0F4C81' }}
            >
              IoT Weather Monitor
            </span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-semibold px-4 py-2 rounded-xl border transition-all hover:shadow-md"
            style={{
              color: '#1976D2',
              borderColor: '#90CAF9',
              background: 'rgba(255,255,255,0.7)',
            }}
          >
            Sign In
          </button>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-10 pb-16">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold border"
            style={{
              background: 'rgba(255,255,255,0.75)',
              borderColor: '#90CAF9',
              color: '#1565C0',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            IT303 · Internet of Things · NIT Karnataka
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 max-w-4xl"
            style={{ color: '#0D3563' }}
          >
            IoT – Weather{' '}
            <span style={{ color: '#1976D2' }}>Monitoring</span>{' '}
            System
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg max-w-2xl mb-6 leading-relaxed"
            style={{ color: '#2C6EA0' }}
          >
            A real-time IoT-based weather monitoring system for collecting,
            processing and visualizing environmental sensor data — powered by
            ESP32, MQTT, and MongoDB Atlas.
          </motion.p>

          {/* Developed By & Guidance directly under description */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mb-8 px-6 py-4 rounded-2xl max-w-xl mx-auto"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(144,202,249,0.6)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(25,118,210,0.06)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5096C8' }}>
              Developed By
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2">
              {TEAM.map((name, i) => (
                <React.Fragment key={name}>
                  <span className="text-sm font-semibold" style={{ color: '#0F4C81' }}>
                    {name}
                  </span>
                  {i < TEAM.length - 1 && (
                    <span style={{ color: '#90CAF9' }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#4E84B0' }}>
              Part of <span className="font-semibold" style={{ color: '#1565C0' }}>IT303 Course</span>
              {' '}·{' '}
              Under the guidance of{' '}
              <span className="font-semibold" style={{ color: '#1565C0' }}>Prof. Jaidhar C D</span>
            </p>
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
              boxShadow: '0 8px 24px rgba(25,118,210,0.35)',
            }}
          >
            Check Out Now
            <ArrowRight size={18} />
          </motion.button>
        </section>

        {/* ── SENSOR CARDS STRIP ───────────────────────────────── */}
        <section className="relative z-10 px-6 sm:px-10 pb-14">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: '#5096C8' }}
          >
            Sensors Monitored in Real-Time
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {SENSORS.map(({ icon: Icon, label, color, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(144,202,249,0.5)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <p className="text-xs font-bold" style={{ color: '#123B5D' }}>{label}</p>
                <p className="text-[10px] font-mono" style={{ color: '#6499BC' }}>{sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── ARCHITECTURE FLOW ────────────────────────────────── */}
        <section className="relative z-10 px-6 sm:px-10 pb-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs font-bold uppercase tracking-widest mb-8"
            style={{ color: '#5096C8' }}
          >
            System Architecture
          </motion.h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
            {FLOW.map(({ icon: Icon, label, sub }, i) => (
              <React.Fragment key={label}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl text-center min-w-[130px]"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(144,202,249,0.55)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(25,118,210,0.12)', border: '1px solid rgba(25,118,210,0.2)' }}
                  >
                    <Icon size={20} style={{ color: '#1976D2' }} />
                  </div>
                  <p className="text-xs font-bold" style={{ color: '#123B5D' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: '#5E9EC0' }}>{sub}</p>
                </motion.div>
                {i < FLOW.length - 1 && (
                  <div
                    className="hidden sm:flex items-center"
                    style={{ color: '#90CAF9' }}
                  >
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer
          className="relative z-10 py-6 px-6 text-center text-xs border-t"
          style={{
            background: 'rgba(255,255,255,0.5)',
            borderColor: 'rgba(144,202,249,0.4)',
            color: '#5096C8',
          }}
        >
          <p className="font-medium" style={{ color: '#2C6EA0' }}>
            © 2026 IoT – Weather Monitoring System. All Rights Reserved.
          </p>
          <p className="mt-1" style={{ color: '#5096C8' }}>
            IT303 &nbsp;|&nbsp; Under the guidance of Prof. Jaidhar C D
          </p>
        </footer>
      </div>
    </div>
  );
}
