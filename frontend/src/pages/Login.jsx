import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Eye, EyeOff, AlertTriangle, ShieldCheck, UserCheck, Sparkles, Lock } from 'lucide-react';
import { authApi } from '../api/client';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('operator'); // 'operator' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authApi.login(email, password);
      } else {
        res = await authApi.register(email, password, role);
      }

      const token = res?.token || res?.data?.token;
      const user = res?.user || res?.data?.user || { email, role };

      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Authentication failed. No access token provided.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole) => {
    const user = {
      username: demoRole === 'admin' ? 'admin' : 'operator',
      email: `${demoRole}@station.local`,
      role: demoRole,
    };
    localStorage.setItem('auth_token', 'demo_token_' + Date.now());
    localStorage.setItem('auth_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#07111F]">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center mb-3 text-[#60A5FA] shadow-xl">
            <CloudSun size={28} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-widest uppercase font-sans">ATMOS</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">IoT Environmental Monitoring Console</p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl p-6 sm:p-7 bg-[#101D2E]/80 border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-5">
          {/* Mode Switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-[#0B1728]/80 border border-white/[0.06]">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg tracking-wider uppercase transition-all ${
                  mode === m
                    ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.12]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('operator')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'operator'
                        ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#64748B]'
                    }`}
                  >
                    <UserCheck size={14} />
                    <span>Operator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'admin'
                        ? 'bg-[#60A5FA]/15 border-[#60A5FA]/40 text-[#60A5FA]'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#64748B]'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="operator or admin@station.local"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#60A5FA] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#60A5FA] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-[#F87171]/10 border border-[#F87171]/25 flex items-center gap-2 text-[#F87171] text-xs">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#60A5FA] hover:bg-[#3B82F6] text-[#07111F] font-bold text-sm transition-all shadow-lg hover:shadow-[#60A5FA]/25 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : `Register ${role === 'admin' ? 'Administrator' : 'Operator'}`}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <span className="text-[10px] text-[#64748B] uppercase font-semibold block text-center">
              Quick Console Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('operator')}
                className="py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-[#94A3B8] hover:text-white transition-colors"
              >
                Operator Mode
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-[#60A5FA] hover:text-white transition-colors"
              >
                Admin Mode
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#64748B] mt-4">
          Atmospheric Glass Sensor Platform · NITK Surathkal
        </p>
      </motion.div>
    </div>
  );
}
