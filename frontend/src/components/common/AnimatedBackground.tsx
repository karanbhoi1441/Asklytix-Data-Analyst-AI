import React from 'react';
import { cn } from '@/utils/cn';
import { DataSourceMotionBackground } from '@/components/connect/DataSourceMotionBackground';

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
    <div className={cn('relative min-h-screen w-full bg-[#070d1a] overflow-x-hidden text-slate-100', className)}>
      {/* Live Data Pipeline & Ingestion Motion Background from Data Source page */}
      <DataSourceMotionBackground />

      {/* Background Mesh Gradient Spheres */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Tech Grid Pattern with Radial Vignette */}
      {showGrid && (
        <div 
          className="absolute inset-0 bg-tech-grid opacity-35 pointer-events-none"
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 85%)'
          }}
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
