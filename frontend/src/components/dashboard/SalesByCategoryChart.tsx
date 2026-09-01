import React, { useState } from 'react';
import type { CategorySalesData, BarOrientation } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { BarChart2, Repeat } from 'lucide-react';

interface SalesByCategoryChartProps {
  categories: CategorySalesData[];
  title?: string;
}

export const SalesByCategoryChart: React.FC<SalesByCategoryChartProps> = ({ 
  categories,
  title = 'Sales by Category'
}) => {
  const [orientation, setOrientation] = useState<BarOrientation>('vertical');

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  const barColors = [
    'from-cyan-500 to-blue-600',
    'from-blue-500 to-purple-600',
    'from-purple-500 to-indigo-600',
    'from-cyan-400 to-purple-500',
    'from-blue-600 to-cyan-400'
  ];

  const safeCategories = categories && categories.length > 0 ? categories : [
    { category: 'Electronics', amount: 450000, pct: 45 },
    { category: 'Apparel', amount: 280000, pct: 28 },
    { category: 'Home Goods', amount: 170000, pct: 17 },
    { category: 'Accessories', amount: 100000, pct: 10 },
  ];

  return (
    <Card variant="glass" className="w-full border-blue-500/30 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header & Orientation Toggle */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" /> {title}
          </span>
        </div>

        <button
          onClick={toggleOrientation}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
          title="Toggle Bar / Horizontal Layout"
        >
          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
          <span className="capitalize">{orientation} Mode</span>
        </button>
      </div>

      {/* Dynamic Bar Container */}
      <div className="pt-2">
        {orientation === 'horizontal' ? (
          /* Horizontal Orientation Layout */
          <div className="space-y-4">
            {safeCategories.map((c, idx) => (
              <div key={c.category || `cat-${idx}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">{c.category}</span>
                  <span className="text-cyan-400 font-mono font-bold">${(Number(c.amount) || 0).toLocaleString()} ({c.pct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(Number(c.pct) || 0) * 2.2}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${barColors[idx % barColors.length]} rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vertical Orientation Layout */
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {safeCategories.map((c, idx) => (
              <div key={c.category || `cat-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Value Hover Tooltip */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap shadow-lg">
                  ${(Number(c.amount) || 0).toLocaleString()}
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(Number(c.pct) || 0) * 2.2}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`w-full bg-gradient-to-t ${barColors[idx % barColors.length]} rounded-t-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:brightness-125 transition-all relative overflow-hidden`}
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/60 blur-[1px]" />
                </motion.div>

                <span className="text-[11px] font-semibold text-slate-300 mt-2 truncate w-full text-center">
                  {c.category}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
