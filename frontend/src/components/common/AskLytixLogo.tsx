import React from 'react';
import type { LogoSize } from '@/types';
import { cn } from '@/utils/cn';

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
    small: { icon: 28, text: 'text-lg', gap: 'gap-2', barWidth: 2 },
    medium: { icon: 38, text: 'text-2xl', gap: 'gap-3', barWidth: 3 },
    large: { icon: 54, text: 'text-4xl', gap: 'gap-4', barWidth: 4.5 }
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
      {/* SVG Stylized "A" + Analytics Bars + Network Nodes */}
      <div className="relative flex items-center justify-center">
        {/* Neon Backlight Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-purple-500/40 rounded-full blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
        
        <svg 
          width={currentSize.icon} 
          height={currentSize.icon} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
        >
          <defs>
            {/* Main Brand Linear Gradient */}
            <linearGradient id="asklytixGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Stylized Outer "A" Frame */}
          <path
            d="M50 8 L18 84 C16 88 19 92 24 92 H34 C37 92 39 90 40 87 L48 66 H68 C70 66 71 67 72 69 L78 87 C79 90 81 92 85 92 H90 C95 92 97 87 95 83 L63 8 Z"
            fill="url(#asklytixGrad)"
          />

          {/* Dark Inner Cutout for "A" Roof */}
          <polygon 
            points="50,26 38,56 62,56" 
            fill="#040711" 
          />

          {/* Integrated Analytics Bars inside Crossbar Area */}
          <g className="opacity-90">
            {/* Bar 1 (Short) */}
            <rect x="42" y="44" width="3.5" height="9" rx="1.5" fill="#38bdf8" />
            {/* Bar 2 (Medium) */}
            <rect x="48" y="38" width="3.5" height="15" rx="1.5" fill="#60a5fa" />
            {/* Bar 3 (Tall) */}
            <rect x="54" y="34" width="3.5" height="19" rx="1.5" fill="#c084fc" />
          </g>

          {/* Connected Upper-Right Data Network Nodes */}
          <g className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            {/* Network Node Lines */}
            <line x1="63" y1="12" x2="80" y2="8" stroke="url(#nodeGrad)" strokeWidth="2" strokeDasharray="2 2" />
            <line x1="80" y1="8" x2="90" y2="24" stroke="url(#nodeGrad)" strokeWidth="2" />
            <line x1="63" y1="12" x2="90" y2="24" stroke="url(#nodeGrad)" strokeWidth="1.5" opacity="0.6" />

            {/* Network Dots */}
            <circle cx="80" cy="8" r="4" fill="#38bdf8" className="animate-pulse" />
            <circle cx="90" cy="24" r="3.5" fill="#a855f7" />
            <circle cx="68" cy="18" r="2.5" fill="#06b6d4" />
          </g>
        </svg>
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
