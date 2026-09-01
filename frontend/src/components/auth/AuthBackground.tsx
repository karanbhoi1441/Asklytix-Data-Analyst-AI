import React from 'react';
import { motion } from 'framer-motion';

export const AuthBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#040711] overflow-hidden text-slate-100 flex flex-col justify-between select-none">
      {/* Background Glow Layers */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {/* Subtle Tech Grid Pattern */}
      <div 
        className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />

      {/* Faint Connected Data Nodes & Lines SVG Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line x1="10%" y1="20%" x2="40%" y2="35%" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="40%" y1="35%" x2="30%" y2="70%" stroke="#3b82f6" strokeWidth="1" />
        <line x1="70%" y1="15%" x2="90%" y2="40%" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="90%" y1="40%" x2="75%" y2="80%" stroke="#06b6d4" strokeWidth="1" />

        <circle cx="10%" cy="20%" r="3" fill="#06b6d4" />
        <circle cx="40%" cy="35%" r="4" fill="#3b82f6" />
        <circle cx="30%" cy="70%" r="3.5" fill="#8b5cf6" />
        <circle cx="70%" cy="15%" r="3" fill="#a855f7" />
        <circle cx="90%" cy="40%" r="4" fill="#06b6d4" />
      </svg>

      {/* Floating Soft Ambient Particles */}
      <motion.div 
        animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/6 w-2 h-2 rounded-full bg-cyan-400/40 shadow-[0_0_12px_#06b6d4] pointer-events-none"
      />
      <motion.div 
        animate={{ y: [15, -15, 15], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/3 right-1/5 w-2.5 h-2.5 rounded-full bg-purple-400/40 shadow-[0_0_15px_#a855f7] pointer-events-none"
      />

      {/* Lower Area Data-Wave Effect */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Main Content Shell */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
