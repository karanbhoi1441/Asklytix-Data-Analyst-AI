import React from 'react';
import { cn } from '@/utils/cn';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  rightElement?: React.ReactNode;
  centered?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  rightElement,
  centered = false,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col gap-2 mb-6',
      centered ? 'items-center text-center' : 'items-start text-left',
      className
    )}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {badge}
        </span>
      )}

      <div className={cn(
        'w-full flex flex-col sm:flex-row gap-3',
        centered ? 'justify-center items-center' : 'justify-between items-start sm:items-center'
      )}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {rightElement && (
          <div className="shrink-0">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
