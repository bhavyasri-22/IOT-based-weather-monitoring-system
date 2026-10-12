import React from 'react';

export function getPasswordStrength(password = '') {
  const checks = { length: password.length >= 12, lowercase: /[a-z]/.test(password), uppercase: /[A-Z]/.test(password), number: /\d/.test(password), symbol: /[^A-Za-z0-9]/.test(password) };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, label: passed >= 5 ? 'Strong' : passed >= 3 && password.length >= 8 ? 'Medium' : 'Weak', valid: Object.values(checks).every(Boolean) };
}

export default function PasswordStrength({ password }) {
  const result = getPasswordStrength(password);
  const color = result.label === 'Strong' ? '#15803d' : result.label === 'Medium' ? '#b45309' : '#b91c1c';
  if (!password) return null;
  return <div className="mt-2 text-xs" style={{ color }}><p className="font-semibold">Password strength: {result.label}</p>{!result.valid && <p className="mt-1 text-slate-500">Use 12+ characters with uppercase, lowercase, a number, and a symbol.</p>}</div>;
}
