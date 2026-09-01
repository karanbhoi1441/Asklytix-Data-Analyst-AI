import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-md animate-pulse" />
        <Loader2 className={cn('animate-spin text-cyan-400 relative z-10', sizeStyles[size])} />
      </div>

      {label && (
        <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-800/60 border border-slate-800/40',
        className
      )}
      {...props}
    />
  );
};

export const FullPageLoader: React.FC<{ label?: string }> = ({ label = 'Loading AskLytix Engine...' }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#040711]/90 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="xl" label={label} />
    </div>
  );
};
