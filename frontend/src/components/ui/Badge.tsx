import React from 'react';
import type { BadgeVariant, BadgeSize } from '@/types';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  className,
  ...props
}) => {
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium'
  };

  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    secondary: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    error: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-300 border border-blue-500/30',
    outline: 'bg-transparent text-purple-300 border border-purple-500/40'
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-cyan-400',
    secondary: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-blue-400',
    outline: 'bg-purple-400'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full transition-colors font-sans',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[variant])} />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotColors[variant])} />
        </span>
      )}

      {icon && <span className="shrink-0">{icon}</span>}
      
      <span>{children}</span>
    </span>
  );
};
