import React from 'react';
import type { LogoSize } from '@/types';
import { cn } from '@/utils/cn';
import logo3dImg from '@/assets/asklytix_3d_logo.png';

interface AskLytixLogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AskLytixLogo: React.FC<AskLytixLogoProps> = ({
  size = 'medium',
  showText = true,
  className,
  onClick
}) => {
  const sizeDimensions = {
    small: { icon: 'w-8 h-8', text: 'text-sm', gap: 'gap-2' },
    medium: { icon: 'w-10 h-10', text: 'text-lg', gap: 'gap-2.5' },
    large: { icon: 'w-14 h-14', text: 'text-3xl', gap: 'gap-3.5' }
  };

  const currentSize = sizeDimensions[size];

  return (
    <div 
      onClick={onClick}
      className={cn(
        'inline-flex items-center select-none group transition-transform duration-300 hover:scale-[1.02]',
        onClick ? 'cursor-pointer' : '',
        currentSize.gap,
        className
      )}
    >
      {/* 3D Brand Icon with Cyan Halo Glow */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute inset-0 bg-cyan-500/25 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={logo3dImg}
          alt="AskLytix 3D Logo"
          className={cn(
            currentSize.icon,
            'object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(6,182,212,0.45)] transition-transform duration-300 group-hover:scale-105'
          )}
        />
      </div>

      {/* Brand Text Typography */}
      {showText && (
        <div className="flex items-baseline">
          <span className={cn(
            'font-bold tracking-tight font-sans text-white drop-shadow-md',
            currentSize.text
          )}>
            Ask
          </span>
          <span className={cn(
            'font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm',
            currentSize.text
          )}>
            Lytix
          </span>
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75 inline-block" />
        </div>
      )}
    </div>
  );
};
