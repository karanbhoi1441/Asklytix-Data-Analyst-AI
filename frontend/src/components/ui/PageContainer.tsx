import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/utils/animations';
import { cn } from '@/utils/cn';
import type { PageLayoutMode } from '@/types';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  mode?: PageLayoutMode;
  className?: string;
  maxWidth?: 'normal' | 'wide' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
  mode = 'standard',
  className,
  maxWidth = 'normal'
}) => {
  const maxWidthStyles = {
    normal: 'max-w-7xl',
    wide: 'max-w-[1920px]',
    full: 'w-full'
  };

  const isCanvas = mode === 'canvas';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'w-full mx-auto space-y-4 sm:space-y-5',
        isCanvas ? 'w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4' : 'px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6',
        !isCanvas && maxWidthStyles[maxWidth],
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1 min-w-0">
            {badge && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 mb-1">
                {badge}
              </span>
            )}
            {title && (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl text-break-safe">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      <div>{children}</div>
    </motion.div>
  );
};
