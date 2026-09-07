import React, { useState } from 'react';
import { CloudSun, Eye, EyeOff, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { authApi } from '../api/client';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState('operator'); // operator | admin
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
        setError('Authentication failed. No token received.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#151B23] border border-[#26303B] flex items-center justify-center mb-4">
            <CloudSun size={22} className="text-[#38BDF8]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-[#F1F5F9] tracking-wide">WEATHER STATION</p>
          <p className="text-xs text-[#64748B] mt-1">IoT Monitoring Console</p>
        </div>

        {/* Card */}
        <div className="panel-card border border-[#26303B] p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-[#11161D] border border-[#26303B] rounded-lg p-1 mb-5">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded tracking-wider uppercase transition-all ${
                  mode === m
                    ? 'bg-[#1A212B] text-[#F1F5F9]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection on Register */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('operator')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                      role === 'operator'
                        ? 'bg-[#15231C] border-[#22C55E88] text-[#22C55E]'
                        : 'bg-[#11161D] border-[#26303B] text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    <UserCheck size={13} />
                    <span>Operator / User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                      role === 'admin'
                        ? 'bg-[#12222E] border-[#38BDF888] text-[#38BDF8]'
                        : 'bg-[#11161D] border-[#26303B] text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span>Administrator</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#4B5563] mt-1.5">
                  {role === 'admin'
                    ? '⚡ Full control: calibrate thresholds, manage devices & resolve alerts.'
                    : '📊 Telemetry monitor: real-time streaming, trend analysis & alerts feed.'}
                </p>
              </div>
            )}

            {/* Email / Username */}
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={mode === 'login' ? "operator or admin@station.local" : "admin_user or operator@station.local"}
                className="w-full px-3 py-2.5 text-sm bg-[#11161D] border border-[#26303B] rounded-lg text-[#F1F5F9] placeholder-[#3A4654] focus:outline-none focus:border-[#38BDF8] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-[#11161D] border border-[#26303B] rounded-lg text-[#F1F5F9] placeholder-[#3A4654] focus:outline-none focus:border-[#38BDF8] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F0F0F] border border-[#EF444433]">
                <AlertTriangle size={12} className="text-[#EF4444] flex-shrink-0" />
                <p className="text-xs text-[#EF4444]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#1A212B] border border-[#2D3947] text-[#F1F5F9] hover:bg-[#1E2836] hover:border-[#38BDF8] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : `Create ${role === 'admin' ? 'Admin' : 'Operator'} Account`}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#3A4654] mt-4">
          ESP32 IoT Environmental Monitoring Station
        </p>
      </div>
    </div>
  );
}
