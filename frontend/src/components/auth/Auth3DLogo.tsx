import React, { useState } from 'react';
import { motion } from 'framer-motion';
import logo3dImg from '@/assets/asklytix_3d_logo.png';

export const Auth3DLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center select-none relative -translate-y-6 lg:-translate-y-8 ${className}`}>
      {/* ── LAYERED ATTRACTIVE & VISIBLE AMBIENT LIGHT GLOW ── */}
      {/* Outer Atmospheric Glow */}
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-cyan-500/25 via-indigo-600/30 to-fuchsia-600/25 blur-[80px] pointer-events-none -z-10 animate-pulse-glow" />
      
      {/* Inner Radiant Core Neon Light */}
      <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-cyan-400/35 via-sky-500/35 to-indigo-500/30 blur-[50px] pointer-events-none -z-10" />

      {/* Floating 3D Logo Container - Shifted Higher & Continuously Floating */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: [-4, 4, -4] 
        }}
        transition={{ 
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.6, ease: 'easeOut' },
          scale: { duration: 0.6, ease: 'easeOut' }
        }}
        whileHover={{ scale: 1.04, y: -6 }}
        className="relative flex flex-col items-center group cursor-pointer"
      >
        {!imgError ? (
          <div className="relative flex flex-col items-center">
            {/* Soft Ambient Light Aura around Logo */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/25 via-transparent to-purple-500/20 rounded-3xl blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            
            <img
              src={logo3dImg}
              alt="AskLytix 3D Logo"
              onError={() => setImgError(true)}
              className="w-[185px] sm:w-[220px] md:w-[250px] max-w-full h-auto object-contain relative z-10 drop-shadow-[0_10px_28px_rgba(6,182,212,0.45)] drop-shadow-[0_4px_16px_rgba(168,85,247,0.35)] transition-transform duration-500"
            />

            {/* Pedestal Ground Light Flare */}
            <div className="w-36 sm:w-44 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent blur-[1.2px] shadow-[0_0_14px_#22d3ee] mt-1 relative z-10" />
          </div>
        ) : (
          /* High-Fidelity Vector 3D SVG Fallback */
          <div className="flex flex-col items-center">
            <svg
              width="185"
              height="155"
              viewBox="0 0 240 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_12px_25px_rgba(99,102,241,0.4)]"
            >
              <defs>
                <linearGradient id="ribbonGrad1" x1="10%" y1="90%" x2="90%" y2="10%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="45%" stopColor="#3b82f6" />
                  <stop offset="75%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              {/* 3D Folded Ribbon "A" */}
              <path
                d="M120 20 L40 170 C36 178 42 186 52 186 H74 C80 186 85 182 87 176 L104 135 H136 L153 176 C155 182 160 186 166 186 H188 C198 186 204 178 200 170 L120 20 Z"
                fill="url(#ribbonGrad1)"
              />
              <polygon points="120,55 92,120 148,120" fill="#090d16" />

              {/* Glowing Analytics Bars inside */}
              <rect x="96" y="98" width="8" height="20" rx="3" fill="url(#barGrad)" />
              <rect x="108" y="85" width="8" height="33" rx="3" fill="#38bdf8" />
              <rect x="120" y="75" width="8" height="43" rx="3" fill="#60a5fa" />
              <rect x="132" y="90" width="8" height="28" rx="3" fill="url(#barGrad2)" />

              {/* Connected Molecular Nodes on top right */}
              <line x1="150" y1="40" x2="190" y2="35" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="190" y1="35" x2="210" y2="70" stroke="#818cf8" strokeWidth="2" />
              <line x1="150" y1="40" x2="210" y2="70" stroke="#c084fc" strokeWidth="1.5" opacity="0.6" />
              <circle cx="190" cy="35" r="7" fill="#38bdf8" className="animate-pulse" />
              <circle cx="210" cy="70" r="8" fill="#ec4899" />
              <circle cx="165" cy="50" r="4" fill="#a855f7" />
            </svg>

            {/* Typography */}
            <div className="flex items-baseline mt-3 tracking-tight font-sans">
              <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
                Ask
              </span>
              <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent drop-shadow-sm ml-0.5">
                Lytix
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
