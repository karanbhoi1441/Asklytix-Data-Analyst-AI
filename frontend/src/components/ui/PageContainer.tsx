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
    wide: 'max-w-[1600px]',
    full: 'w-full'
  };

  const isCanvas = mode === 'canvas';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'w-full mx-auto space-y-6',
        isCanvas ? 'w-full px-2 sm:px-4 py-4' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
        !isCanvas && maxWidthStyles[maxWidth],
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            {badge && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 mb-1">
                {badge}
              </span>
            )}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      <div>{children}</div>
    </motion.div>
  );
};
