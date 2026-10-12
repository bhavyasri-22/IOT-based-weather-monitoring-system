import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, UserRound, ChevronLeft, ArrowRight, CloudSun } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <main
      className="min-h-screen grid place-items-center p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, #F0F7FF 0%, #E3F2FD 50%, #D0E7FF 100%)',
      }}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl rounded-3xl border bg-white/95 backdrop-blur-xl p-8 sm:p-10 text-center shadow-xl relative z-10"
        style={{ borderColor: 'rgba(144, 202, 249, 0.7)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={16} /> Back to Home
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
            <CloudSun size={16} className="text-blue-600" />
            <span>IT303 Software Engineering</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
          Select Your Role
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Choose an access role to proceed. Users have direct read-only access to weather telemetry; administrators must authenticate with provisioned credentials.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">
          {/* USER CARD: Directly go to dashboard */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group relative rounded-2xl border p-6 transition-all hover:scale-[1.02] active:scale-[0.99] hover:shadow-lg cursor-pointer bg-white hover:bg-blue-50/80"
            style={{ borderColor: '#BBDEFB' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <UserRound size={24} />
            </div>
            <h2 className="mt-4 text-base font-bold text-blue-950 flex items-center justify-between">
              <span>User</span>
              <ArrowRight size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-normal">
              Direct access to live weather telemetry, sensor conditions, and trend graphs in read-only mode.
            </p>
            <div className="mt-4 pt-3 border-t border-blue-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              Direct Dashboard Access &rarr;
            </div>
          </button>

          {/* ADMIN CARD: Redirect to admin login page */}
          <button
            type="button"
            onClick={() => navigate('/auth?role=admin')}
            className="group relative rounded-2xl border p-6 transition-all hover:scale-[1.02] active:scale-[0.99] hover:shadow-lg cursor-pointer bg-white hover:bg-sky-50/80"
            style={{ borderColor: '#BBDEFB' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <ShieldCheck size={24} />
            </div>
            <h2 className="mt-4 text-base font-bold text-blue-950 flex items-center justify-between">
              <span>Admin</span>
              <ArrowRight size={16} className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-normal">
              Secure authentication for station administrators. System configuration and alert management.
            </p>
            <div className="mt-4 pt-3 border-t border-sky-100 text-[11px] font-bold text-sky-700 flex items-center gap-1">
              Admin Sign In &rarr;
            </div>
          </button>
        </div>
      </motion.section>
    </main>
  );
}
