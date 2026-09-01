import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Activity, Sparkles } from 'lucide-react';
import type { ChartDataPoint } from '@/types/dashboard';

interface AreaGrowthChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const AreaGrowthChart: React.FC<AreaGrowthChartProps> = ({
  data,
  title = 'Cumulative Growth & Velocity'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = data.map((d) => d.revenue);
  const maxVal = Math.max(...values, 100);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Build SVG Path Coordinates for Area Chart
  const svgWidth = 500;
  const svgHeight = 180;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((d.revenue - minVal) / range) * (svgHeight - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || svgWidth - padding} ${svgHeight - padding} L ${points[0]?.x || padding} ${svgHeight - padding} Z`;

  const totalGrowth = (((data[data.length - 1]?.revenue || 0) - (data[0]?.revenue || 1)) / (data[0]?.revenue || 1) * 100).toFixed(1);

  return (
    <Card variant="analytics" glowColor="cyan" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <Badge variant="primary" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Real-time cumulative trajectory telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> +{totalGrowth}% Trajectory
          </span>
        </div>
      </div>

      {/* SVG Interactive Area Chart */}
      <div className="relative w-full h-[200px] flex items-center justify-center select-none">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct, idx) => (
            <line
              key={idx}
              x1={padding}
              y1={padding + pct * (svgHeight - padding * 2)}
              x2={svgWidth - padding}
              y2={padding + pct * (svgHeight - padding * 2)}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#areaGlow)"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 6 : 3.5}
                fill={hoveredIdx === idx ? '#22d3ee' : '#06b6d4'}
                stroke="#020617"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
              />
              {hoveredIdx === idx && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill="#06b6d4"
                  opacity="0.25"
                  className="animate-ping pointer-events-none"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl text-center"
            style={{
              left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIdx].y / svgHeight) * 60}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <p className="text-[10px] font-mono text-slate-400">{points[hoveredIdx].label}</p>
            <p className="text-xs font-bold text-cyan-300 font-mono">
              ${points[hoveredIdx].revenue.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Footer Axis Labels */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-2 pt-1 border-t border-slate-800/60">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </Card>
  );
};
