import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

const COMMON_WEAK_PATTERNS = [
  'password', '123456', '12345678', 'qwerty', 'admin', 'weather', 'weather123'
];

export function getPasswordStrength(password = '') {
  const val = typeof password === 'string' ? password : '';
  const lowerVal = val.toLowerCase();
  const hasCommonPattern = COMMON_WEAK_PATTERNS.some((pat) => lowerVal.includes(pat));

  const checks = {
    length: val.length >= 12,
    lowercase: /[a-z]/.test(val),
    uppercase: /[A-Z]/.test(val),
    number: /\d/.test(val),
    symbol: /[^A-Za-z0-9]/.test(val),
    notCommon: !hasCommonPattern && val.length > 0,
  };

  const coreChecksPassed = [
    checks.length,
    checks.lowercase,
    checks.uppercase,
    checks.number,
    checks.symbol,
  ].filter(Boolean).length;

  let label = 'Weak';
  let score = 1;

  if (coreChecksPassed === 5 && checks.notCommon) {
    label = 'Strong';
    score = 3;
  } else if ((coreChecksPassed >= 3 && val.length >= 8) || coreChecksPassed >= 4) {
    label = 'Medium';
    score = 2;
  } else {
    label = 'Weak';
    score = 1;
  }

  const valid = coreChecksPassed === 5 && checks.notCommon;

  return {
    checks,
    label,
    score, // 1: Weak, 2: Medium, 3: Strong
    valid,
    hasCommonPattern,
  };
}

export default function PasswordStrength({ password = '' }) {
  if (!password) return null;

  const { checks, label, score, valid, hasCommonPattern } = getPasswordStrength(password);

  const colors = {
    Weak: {
      bar: 'bg-rose-500',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    Medium: {
      bar: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    Strong: {
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  }[label];

  const requirements = [
    { label: 'At least 12 characters', met: checks.length },
    { label: 'Uppercase letter (A–Z)', met: checks.uppercase },
    { label: 'Lowercase letter (a–z)', met: checks.lowercase },
    { label: 'Number (0–9)', met: checks.number },
    { label: 'Special symbol (!@#$...)', met: checks.symbol },
  ];

  return (
    <div className="mt-2.5 space-y-2 p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs">
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">Password Strength:</span>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {label}
        </span>
      </div>

      {/* Visual meter track */}
      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? colors.bar : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? colors.bar : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? colors.bar : 'bg-transparent'}`} />
      </div>

      {hasCommonPattern && (
        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <ShieldAlert size={12} /> Avoid common words or predictable sequences.
        </p>
      )}

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-blue-100/70 text-[11px]">
        {requirements.map((req, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 ${
              req.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            }`}
          >
            {req.met ? (
              <Check size={12} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-0.5 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
