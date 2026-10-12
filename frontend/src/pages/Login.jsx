import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  CloudSun,
} from 'lucide-react';
import { authApi } from '../api/client';
import PasswordStrength, { getPasswordStrength } from '../components/PasswordStrength';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  // URL parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const roleParam = queryParams.get('role');
  const tokenParam = queryParams.get('token');

  const isAdminFlow = roleParam === 'admin';

  // Mode: 'login', 'register', 'forgot', 'reset'
  const [mode, setMode] = useState(() => (tokenParam ? 'reset' : 'login'));

  useEffect(() => {
    if (tokenParam) {
      setMode('reset');
    }
  }, [tokenParam]);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength evaluation
  const passwordEval = useMemo(() => getPasswordStrength(password), [password]);

  // Handle Tab Switch
  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    // Client-side validations
    if (mode === 'register' || mode === 'reset') {
      if (!passwordEval.valid) {
        return setError(
          'Password does not meet complexity requirements. Use at least 12 characters including uppercase, lowercase, numbers, and symbols.'
        );
      }
      if (password !== confirmPassword) {
        return setError('Passwords do not match. Please re-enter confirmation password.');
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await authApi.login(
          identifier.trim(),
          password,
          isAdminFlow ? 'admin' : undefined
        );
        const data = response?.data || response;

        if (!data?.token || !data?.user) {
          throw new Error('Authentication token was not issued by server.');
        }

        // Additional safeguard for admin login flow
        if (isAdminFlow && data.user.role !== 'admin') {
          throw new Error('Access denied: This account does not possess administrator credentials.');
        }

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        if (typeof onLogin === 'function') {
          onLogin(data.user);
        }

        // Redirect appropriately
        navigate(isAdminFlow ? '/dashboard/admin' : '/dashboard', { replace: true });
      } else if (mode === 'register') {
        // Public registration: strictly role "user"
        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        const response = await authApi.register(cleanUsername, password, cleanEmail);
        const data = response?.data || response;

        if (!data?.token || !data?.user) {
          throw new Error('Registration completed but session token was not returned.');
        }

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        if (typeof onLogin === 'function') {
          onLogin(data.user);
        }

        navigate('/dashboard', { replace: true });
      } else if (mode === 'forgot') {
        const cleanEmail = email.trim();
        await authApi.requestPasswordReset(cleanEmail);
        setNotice(
          'If an account matches that email address, password reset instructions have been generated.'
        );
        setEmail('');
      } else if (mode === 'reset') {
        const resetToken = tokenParam;
        if (!resetToken) {
          throw new Error('No password reset token was found in the link.');
        }

        await authApi.confirmPasswordReset(resetToken, password);
        setNotice('Your password has been successfully updated! You may now sign in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Unable to complete your request. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen grid place-items-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F0F7FF 0%, #E0EFFF 50%, #D0E7FF 100%)',
      }}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/3 w-80 h-80 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl pointer-events-none" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl border bg-white/95 backdrop-blur-2xl p-7 sm:p-8 shadow-2xl relative z-10"
        style={{ borderColor: 'rgba(144, 202, 249, 0.65)' }}
      >
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate('/choose-access')}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={15} /> Switch Role
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
            <CloudSun size={15} className="text-blue-600" />
            <span>IT303 Station</span>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                isAdminFlow
                  ? 'bg-sky-100 text-sky-700 border border-sky-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {isAdminFlow ? <ShieldCheck size={16} /> : <UserCheck size={16} />}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isAdminFlow ? 'Administrator Portal' : 'User Station Access'}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-blue-950 tracking-tight">
            {mode === 'forgot'
              ? 'Reset Password'
              : mode === 'reset'
              ? 'Set New Password'
              : isAdminFlow
              ? 'Admin Sign In'
              : mode === 'register'
              ? 'Create User Account'
              : 'User Sign In'}
          </h1>

          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            {mode === 'forgot'
              ? 'Enter your registered email address to receive password recovery instructions.'
              : mode === 'reset'
              ? 'Choose a strong, compliant new password for your account.'
              : isAdminFlow
              ? 'Only provisioned administrator accounts with database authorization may proceed.'
              : mode === 'register'
              ? 'Register to access telemetry streams, historical logs, and sensor metrics.'
              : 'Sign in to access real-time weather observations and system telemetry.'}
          </p>
        </div>

        {/* Separation for User flow: Sign In vs Create Account tabs */}
        {!isAdminFlow && mode !== 'forgot' && mode !== 'reset' && (
          <div className="flex rounded-xl bg-blue-50/80 p-1 mb-5 border border-blue-100">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-blue-800 shadow-sm border border-blue-200/60'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-blue-800 shadow-sm border border-blue-200/60'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Admin notice: strictly no public registration */}
        {isAdminFlow && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50/80 border border-sky-100 text-[11px] text-sky-800 flex items-start gap-2">
            <ShieldCheck size={15} className="text-sky-600 flex-shrink-0 mt-0.5" />
            <span>
              Public registration is disabled for administrator roles. Accounts must be provisioned via the secure seed script.
            </span>
          </div>
        )}

        {/* Success Notice Banner */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 font-medium"
            >
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 font-medium"
            >
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER REGISTRATION: Username */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. bhavya_thota"
                  minLength={3}
                  required
                  className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <User size={15} className="absolute left-3 top-3 text-blue-400" />
              </div>
            </div>
          )}

          {/* USER REGISTRATION & FORGOT PASSWORD: Email */}
          {(mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  required
                  className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <Mail size={15} className="absolute left-3 top-3 text-blue-400" />
              </div>
            </div>
          )}

          {/* SIGN IN: Identifier (Username or Email) */}
          {mode === 'login' && (
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1.5">
                {isAdminFlow ? 'Admin Username or Email' : 'Username or Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isAdminFlow ? 'admin or admin@weather.local' : 'Enter username or email'}
                  required
                  className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <User size={15} className="absolute left-3 top-3 text-blue-400" />
              </div>
            </div>
          )}

          {/* PASSWORD FIELD (All modes except Forgot Password) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-blue-950">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && !isAdminFlow && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setNotice('');
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <Lock size={15} className="absolute left-3 top-3 text-blue-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-blue-500 hover:text-blue-700 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Validation Widget */}
              {(mode === 'register' || mode === 'reset') && (
                <PasswordStrength password={password} />
              )}
            </div>
          )}

          {/* CONFIRM PASSWORD (Registration and Reset modes) */}
          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className={`w-full rounded-xl border bg-white pl-9 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-100'
                      : 'border-blue-200 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <KeyRound size={15} className="absolute left-3 top-3 text-blue-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-3 text-blue-500 hover:text-blue-700 cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                  Passwords do not match.
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl py-3 text-xs font-bold text-white transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.35)',
            }}
          >
            {loading
              ? 'Verifying with server…'
              : mode === 'forgot'
              ? 'Send Reset Instructions'
              : mode === 'reset'
              ? 'Update Password & Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Bottom Switch Links */}
        <div className="mt-5 text-center text-xs">
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setNotice('');
              }}
              className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              &larr; Return to Sign In
            </button>
          )}

          {mode === 'login' && !isAdminFlow && (
            <p className="text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Create one now
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.section>
    </main>
  );
}
