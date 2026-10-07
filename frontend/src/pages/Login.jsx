import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff, AlertCircle, Lock, Mail, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { authApi } from '../api/client';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setNotice('Your session has expired. Please log in again.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    // Frontend validation
    if (mode === 'login') {
      const identifier = (email || username).trim();
      if (!identifier) {
        setError('Please enter your username or email address');
        return;
      }
      if (!password) {
        setError('Please enter your password');
        return;
      }
    } else {
      if (!username.trim() || username.trim().length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (!password || password.length < 4) {
        setError('Password must be at least 4 characters long');
        return;
      }
    }

    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        const identifier = (email || username).trim();
        res = await authApi.login(identifier, password);
      } else {
        res = await authApi.register(username.trim(), password, 'admin', email.trim());
      }

      const token = res?.token || res?.data?.token;
      const user = res?.user || res?.data?.user;

      if (token && user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        onLogin(user);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Authentication failed. Valid authentication token was not issued.');
      }
    } catch (err) {
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to reach the weather monitoring server. Please verify the backend is running.');
      } else if (err.status === 401) {
        setError('Invalid username or password.');
      } else if (err.status === 503) {
        setError('Database connection is offline. Ingestion backend cannot verify credentials.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #EAF6FF 0%, #DDEFFF 40%, #C8E6FF 100%)' }}
    >
      {/* Ambient sky accents */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(79,195,247,0.22)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(25,118,210,0.15)' }}
      />

      {/* Back to landing */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-xl border"
        style={{
          color: '#1565C0',
          borderColor: 'rgba(144,202,249,0.7)',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronLeft size={16} />
        Back to Home
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden mb-3 shadow-md flex items-center justify-center border"
            style={{ borderColor: 'rgba(144,202,249,0.7)', background: '#FFFFFF' }}
          >
            <img src="/favicon.png" alt="Weather Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0D3563' }}>
            IoT – Weather Monitoring System
          </h1>
          <p className="text-xs mt-1" style={{ color: '#5096C8' }}>
            Real-Time Environmental Sensor Station
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-3xl p-6 sm:p-8 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(144,202,249,0.6)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(25,118,210,0.12)',
          }}
        >
          {/* Sign In / Register Tab Toggle */}
          <div
            className="grid grid-cols-2 p-1 rounded-2xl"
            style={{ background: 'rgba(234,246,255,0.8)', border: '1px solid rgba(144,202,249,0.4)' }}
          >
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setNotice(''); }}
                className="py-2 text-xs font-bold rounded-xl transition-all"
                style={{
                  background: mode === m ? '#FFFFFF' : 'transparent',
                  color: mode === m ? '#1565C0' : '#5096C8',
                  border: mode === m ? '1px solid rgba(144,202,249,0.6)' : '1px solid transparent',
                  boxShadow: mode === m ? '0 2px 8px rgba(25,118,210,0.1)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Session Expiry Banner */}
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl flex items-start gap-2.5 text-xs border"
              style={{
                background: 'rgba(255,248,225,0.95)',
                borderColor: 'rgba(255,179,0,0.4)',
                color: '#B45309',
              }}
            >
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <p className="font-semibold">{notice}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#1565C0' }}>
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#5096C8' }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
                    style={{
                      background: 'rgba(234,246,255,0.8)',
                      border: '1px solid rgba(144,202,249,0.55)',
                      color: '#0D3563',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#1565C0' }}>
                {mode === 'login' ? 'Username or Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#5096C8' }} />
                <input
                  type={mode === 'register' ? 'email' : 'text'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={mode === 'login' ? 'admin or name@station.local' : 'name@example.com'}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
                  style={{
                    background: 'rgba(234,246,255,0.8)',
                    border: '1px solid rgba(144,202,249,0.55)',
                    color: '#0D3563',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#1565C0' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#5096C8' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60"
                  style={{
                    background: 'rgba(234,246,255,0.8)',
                    border: '1px solid rgba(144,202,249,0.55)',
                    color: '#0D3563',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#5096C8' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl flex items-start gap-2.5 text-xs border"
                style={{
                  background: 'rgba(255,235,238,0.95)',
                  borderColor: 'rgba(239,83,80,0.3)',
                  color: '#C62828',
                }}
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              style={{
                background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
                boxShadow: '0 6px 20px rgba(25,118,210,0.3)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5 font-medium" style={{ color: '#5096C8' }}>
          Secured with JWT authentication &amp; MongoDB Atlas storage
        </p>
      </motion.div>
    </div>
  );
}
