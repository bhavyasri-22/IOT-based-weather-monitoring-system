import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/client';
import PasswordStrength, { getPasswordStrength } from '../components/PasswordStrength';

const Field = ({ label, children }) => <label className="block text-sm font-semibold text-blue-950"><span className="mb-1.5 block">{label}</span>{children}</label>;
const inputClass = 'w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-slate-800 outline-none focus:border-blue-600';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const adminOnly = new URLSearchParams(location.search).get('role') === 'admin';
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const strong = useMemo(() => getPasswordStrength(password), [password]);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    if (mode === 'register' && !strong.valid) return setError('Choose a stronger password before creating your account.');
    setLoading(true);
    try {
      if (mode === 'login') {
        const response = await authApi.login(identifier, password);
        const data = response?.data || response;
        if (!data?.token || !data?.user) throw new Error('Authentication token was not issued.');
        if (adminOnly && data.user.role !== 'admin') throw new Error('This account does not have administrator access.');
        localStorage.setItem('auth_token', data.token); localStorage.setItem('auth_user', JSON.stringify(data.user)); onLogin(data.user);
        navigate(adminOnly ? '/dashboard/admin' : '/dashboard', { replace: true });
      } else if (mode === 'register') {
        const response = await authApi.register(username.trim(), password, 'operator', email.trim());
        const data = response?.data || response;
        localStorage.setItem('auth_token', data.token); localStorage.setItem('auth_user', JSON.stringify(data.user)); onLogin(data.user); navigate('/dashboard', { replace: true });
      } else if (mode === 'forgot') {
        await authApi.requestPasswordReset(email.trim()); setNotice('If an account matches that email, password reset instructions have been sent.');
      } else {
        await authApi.confirmPasswordReset(new URLSearchParams(location.search).get('token'), password); navigate('/auth', { replace: true });
      }
    } catch (err) { setError(err.message || 'Unable to complete this request.'); } finally { setLoading(false); }
  };
  const resetToken = new URLSearchParams(location.search).get('token');
  const currentMode = resetToken && mode === 'login' ? 'reset' : mode;
  return <main className="min-h-screen grid place-items-center p-5" style={{ background: '#edf6ff' }}><section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm" style={{ borderColor: '#bfdbfe' }}>
    <button type="button" onClick={() => navigate(adminOnly ? '/choose-access' : '/')} className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><ChevronLeft size={16} /> Back</button>
    <h1 className="text-2xl font-bold text-blue-950">{currentMode === 'forgot' ? 'Reset password' : currentMode === 'reset' ? 'Choose a new password' : adminOnly ? 'Administrator sign in' : mode === 'register' ? 'Create read-only account' : 'Sign in'}</h1>
    <p className="mt-1 text-sm text-slate-600">{adminOnly ? 'Administrative access is verified by the server.' : 'Weather data is available in read-only mode.'}</p>
    {!adminOnly && currentMode !== 'forgot' && currentMode !== 'reset' && <div className="mt-5 flex rounded-xl bg-blue-50 p-1"><button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'login' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'}`}>Sign in</button><button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'register' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'}`}>Register</button></div>}
    {notice && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={submit} className="mt-5 space-y-4">
      {currentMode === 'register' && <Field label="Username"><input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} minLength="3" required /></Field>}
      {(currentMode === 'forgot' || currentMode === 'register') && <Field label="Email address"><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>}
      {currentMode === 'login' && <Field label="Username or email"><input className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required /></Field>}
      {currentMode !== 'forgot' && <Field label="Password"><div className="relative"><input className={inputClass} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-3 text-blue-700" aria-label="Show or hide password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{(currentMode === 'register' || currentMode === 'reset') && <PasswordStrength password={password} />}</Field>}
      <button disabled={loading} className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Please wait…' : currentMode === 'forgot' ? 'Send reset instructions' : currentMode === 'reset' ? 'Update password' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
    </form>
    {currentMode === 'login' && <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="mt-4 text-sm font-semibold text-blue-700">Forgot Password?</button>}
    {currentMode === 'forgot' && <button type="button" onClick={() => setMode('login')} className="mt-4 text-sm font-semibold text-blue-700">Return to sign in</button>}
  </section></main>;
}
