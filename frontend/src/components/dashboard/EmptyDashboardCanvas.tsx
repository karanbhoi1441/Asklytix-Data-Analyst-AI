import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyDashboardCanvasProps {
  hasDataset?: boolean;
  onOpenAddModal?: () => void;
  onShowAllCharts?: () => void;
}

export const EmptyDashboardCanvas: React.FC<EmptyDashboardCanvasProps> = ({
  hasDataset = false,
  onOpenAddModal,
  onShowAllCharts
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Expansive Clean Empty Canvas Box */}
      <div className="relative min-h-[460px] w-full rounded-3xl border-2 border-dashed border-cyan-500/20 bg-gradient-to-b from-[#060e1d]/90 via-[#040914]/80 to-[#02050b]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.04)]">
        
        {/* Subtle Cyber Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        {/* Ambient Center Glow */}
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        {/* Center Empty Canvas Content */}
        <div className="relative z-10 flex flex-col items-center space-y-4 max-w-md">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <LayoutGrid className="w-8 h-8 text-cyan-400/80" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400/80 animate-ping opacity-60" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[11px] font-mono font-bold tracking-wide">
              <Sparkles className="w-3 h-3" />
              <span>USER-CONTROLLED CANVAS</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              No visualizations yet
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Use the AI assistant or click below to display all charts for this dataset.
            </p>
          </div>

          {hasDataset && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-2 flex flex-wrap items-center justify-center gap-3"
            >
              {onShowAllCharts && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onShowAllCharts}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="shadow-[0_0_20px_rgba(6,182,212,0.3)] text-xs"
                >
                  ✨ Show All Charts
                </Button>
              )}
              {onOpenAddModal && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onOpenAddModal}
                  leftIcon={<PlusCircle className="w-4 h-4 text-cyan-400" />}
                  className="text-xs"
                >
                  + Custom Visual
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

