import React from 'react';
import { AskLytixLogo } from '@/components/common/AskLytixLogo';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/utils/animations';

export const AuthBranding: React.FC = () => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="w-full h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden select-none"
    >
      {/* Top Header Logo */}
      <div className="space-y-4">
        <Link to="/" className="inline-block">
          <AskLytixLogo size="large" />
        </Link>
        <span className="inline-block text-[11px] font-bold font-mono tracking-widest uppercase text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
          AI Intelligence Platform
        </span>
      </div>

      {/* Main Headline & Supporting Phrases */}
      <div className="my-10 space-y-6 max-w-xl">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.18]">
          Turn Your Raw{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent underline decoration-cyan-500/40 underline-offset-8">
            Data
          </span>{' '}
          Into Insights That Drive{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent underline decoration-blue-500/40 underline-offset-8">
            Growth
          </span>
        </h2>

        <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-300 uppercase font-mono bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/80 inline-block">
          Ask. <span className="text-cyan-400">•</span> Analyze. <span className="text-blue-400">•</span> Visualize. <span className="text-purple-400">•</span> Decide.
        </p>

        {/* Product Capabilities Bullets */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Conversational Natural Language Data Queries</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Automated Interactive Dashboard & Report Generation</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Privacy-First Encryption & Enterprise Access Control</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Tag */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Zap className="w-3.5 h-3.5" /> High-Performance AI Sandbox
        </span>
        <span>v1.0 Ready</span>
      </div>
    </motion.div>
  );
};
