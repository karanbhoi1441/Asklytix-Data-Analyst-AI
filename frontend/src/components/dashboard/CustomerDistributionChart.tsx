import React from 'react';
import type { CustomerSegmentData } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerDistributionChartProps {
  segments: CustomerSegmentData[];
  title?: string;
}

export const CustomerDistributionChart: React.FC<CustomerDistributionChartProps> = ({
  segments,
  title = 'Customer Distribution'
}) => {
  const safeSegments = segments && segments.length > 0 ? segments : [
    { name: 'Enterprise', percentage: 45, color: '#06b6d4', count: 450 },
    { name: 'Mid-Market', percentage: 30, color: '#6366f1', count: 300 },
    { name: 'Small Business', percentage: 18, color: '#a855f7', count: 180 },
    { name: 'Consumer', percentage: 7, color: '#ec4899', count: 70 },
  ];

  const totalCount = safeSegments.reduce((acc, s) => acc + (Number(s.count) || 0), 0);
  const radius = 40;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <Card variant="glass" className="w-full border-purple-500/30 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <span className="font-bold text-white text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" /> {title}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {safeSegments.map((slice, idx) => {
              const pct = Number(slice.percentage) || 0;
              const strokeDashoffset = circumference - (pct / 100) * circumference;
              const rotation = accumulatedPercent * 360;
              accumulatedPercent += pct / 100;

              return (
                <motion.circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={slice.color || '#06b6d4'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    transformOrigin: '50% 50%',
                    transform: `rotate(${rotation}deg)`
                  }}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
              );
            })}
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-extrabold text-white tracking-tight font-sans">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Total Users</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
          {safeSegments.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color || '#06b6d4' }} />
                <span className="text-slate-300 font-medium">{s.name}</span>
              </div>
              <div className="font-mono text-cyan-400 font-bold">
                {(Number(s.count) || 0).toLocaleString()} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
