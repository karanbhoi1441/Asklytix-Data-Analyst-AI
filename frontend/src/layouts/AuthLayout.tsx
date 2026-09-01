import React from 'react';
import { Outlet } from 'react-router-dom';
import { Auth3DLogo } from '@/components/auth/Auth3DLogo';
import { InteractiveParticleNetwork } from '@/components/auth/InteractiveParticleNetwork';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#080c16] overflow-x-hidden text-slate-100 flex items-center justify-center select-none py-8 px-4 sm:px-6 lg:px-12">
      {/* ── FULL-PAGE INTERACTIVE CONSTELLATION & PARTICLE NETWORK ── */}
      <InteractiveParticleNetwork />

      {/* Atmospheric Radial Ambient Glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Main 2-Column Responsive Grid */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[calc(100vh-4rem)]">
        {/* Left Column: AskLytix 3D Emblem & Brand Visual */}
        <div className="lg:col-span-6 flex items-center justify-center lg:justify-center p-4">
          <Auth3DLogo />
        </div>

        {/* Right Column: Sleek Floating Glassmorphic Auth Form */}
        <div className="lg:col-span-6 flex items-center justify-center p-2 sm:p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
