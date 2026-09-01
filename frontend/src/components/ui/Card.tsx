import React from 'react';
import type { CardVariant } from '@/types';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  glowColor?: 'cyan' | 'blue' | 'purple' | 'none';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glowColor = 'none',
  header,
  footer,
  className,
  ...props
}) => {
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-slate-900/90 border border-slate-800/80 shadow-lg rounded-2xl p-5',
    glass: 'glass-card rounded-2xl p-5 border border-slate-800/60 shadow-xl',
    analytics: 'bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 rounded-2xl p-5 shadow-2xl relative overflow-hidden',
    interactive: 'glass-card-interactive rounded-2xl p-5 cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all duration-300'
  };

  const glowStyles = {
    cyan: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] border-cyan-500/30',
    blue: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] border-blue-500/30',
    purple: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] border-purple-500/30',
    none: ''
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {header && (
        <div className="pb-4 mb-4 border-b border-slate-800/80 flex items-center justify-between">
          {header}
        </div>
      )}
      
      <div>{children}</div>

      {footer && (
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          {footer}
        </div>
      )}
    </div>
  );
};
