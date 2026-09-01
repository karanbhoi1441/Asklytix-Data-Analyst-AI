import React from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className
}) => {
  return (
    <div className={cn(
      'glass-card rounded-2xl p-8 lg:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 border border-slate-800/80',
      className
    )}>
      {icon && (
        <div className="relative mb-5 p-4 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full" />
          <div className="relative z-10 w-8 h-8 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-100 mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          leftIcon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
