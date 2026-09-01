import React from 'react';
import type { PasswordStrengthResult } from '@/types/auth';

interface PasswordStrengthProps {
  password?: string;
}

export function evaluatePasswordStrength(password: string = ''): PasswordStrengthResult {
  if (!password) {
    return { level: 'weak', score: 0, label: 'None', color: 'bg-slate-700' };
  }

  let score = 0;
  if (password.length >= 8) score += 30;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score < 45) {
    return { level: 'weak', score, label: 'Weak', color: 'bg-amber-500' };
  } else if (score < 75) {
    return { level: 'medium', score, label: 'Medium', color: 'bg-blue-500' };
  } else {
    return { level: 'strong', score, label: 'Strong', color: 'bg-emerald-500' };
  }
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);

  return (
    <div className="w-full space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Password Strength:</span>
        <span className="font-bold font-mono text-slate-200">{result.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-[0.5px]">
        <div className={`h-full rounded-full transition-all duration-300 ${result.score > 0 ? result.color : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${result.score >= 45 ? result.color : 'bg-transparent'}`} />
        <div className={`h-full rounded-full transition-all duration-300 ${result.score >= 75 ? result.color : 'bg-transparent'}`} />
      </div>
    </div>
  );
};
