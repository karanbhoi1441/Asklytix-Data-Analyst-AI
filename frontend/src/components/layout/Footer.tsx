import React from 'react';
import { AskLytixLogo } from '@/components/common/AskLytixLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#040711] border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <AskLytixLogo size="small" />
          <span className="hidden sm:inline text-slate-700">|</span>
          <p className="text-xs text-slate-400 font-medium italic">
            “Turn Your Raw Data Into Insights That Drive Growth”
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <a href="#privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          <a href="#docs" className="hover:text-cyan-400 transition-colors">Documentation</a>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Systems Operational
          </span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900 text-center text-[11px] text-slate-400 font-mono">
        © {new Date().getFullYear()} AskLytix AI Platform. All rights reserved. Built with React + TypeScript + Tailwind CSS.
      </div>
    </footer>
  );
};
