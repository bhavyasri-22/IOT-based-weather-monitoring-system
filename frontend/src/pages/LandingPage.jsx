import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  return <main className="min-h-screen grid place-items-center p-6" style={{ background: 'linear-gradient(145deg, #f8fcff, #dbeeff)' }}>
    <section className="max-w-2xl text-center">
      <img src="/favicon.png" alt="Weather monitoring system" className="mx-auto h-16 w-16 rounded-2xl shadow-sm" />
      <p className="mt-7 text-sm font-semibold uppercase tracking-widest text-blue-700">IT303 Software Engineering · NIT Karnataka</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-blue-950 sm:text-6xl">IoT Weather Monitoring System</h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">A real-time platform for collecting, processing, and visualizing ESP32 environmental telemetry.</p>
      <p className="mt-5 text-sm text-slate-600">Developed by C Thanmai Sai, Mili Dholaria, and Thota Bhavya Sri · Guided by Prof. Jaidhar C D</p>
      <button type="button" onClick={() => navigate('/choose-access')} className="mt-9 inline-flex items-center gap-2 rounded-xl px-7 py-3 font-bold text-white shadow-lg" style={{ background: '#1565c0' }}>Check Out Now <ArrowRight size={18} /></button>
    </section>
  </main>;
}
