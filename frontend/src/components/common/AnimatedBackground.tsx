import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  showGrid?: boolean;
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  showGrid = true,
  className
}) => {
  return (
    <div className={cn('relative min-h-screen w-full bg-[#040711] overflow-hidden text-slate-100', className)}>
      {/* Background Mesh Gradient Spheres */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Tech Grid Pattern */}
      {showGrid && (
        <div 
          className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none"
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
      )}

      {/* Animated Floating Particles / Orbs */}
      <motion.div 
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-cyan-400/40 shadow-[0_0_12px_#06b6d4] pointer-events-none"
      />
      <motion.div 
        animate={{
          y: [15, -15, 15],
          x: [10, -10, 10]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-2/3 right-1/4 w-3 h-3 rounded-full bg-purple-400/40 shadow-[0_0_15px_#a855f7] pointer-events-none"
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};
