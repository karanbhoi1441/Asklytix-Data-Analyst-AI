import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Compass, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RadarDataPoint } from '@/types/dashboard';

interface RadarPerformanceChartProps {
  title?: string;
  data?: RadarDataPoint[];
}

const DEFAULT_RADAR_DATA: RadarDataPoint[] = [
  { metric: 'Conversion', score: 88, benchmark: 75 },
  { metric: 'Retention', score: 92, benchmark: 80 },
  { metric: 'Profit Margin', score: 78, benchmark: 70 },
  { metric: 'AOV Index', score: 85, benchmark: 65 },
  { metric: 'Satisfaction', score: 94, benchmark: 85 },
  { metric: 'Speed to Close', score: 81, benchmark: 72 }
];

export const RadarPerformanceChart: React.FC<RadarPerformanceChartProps> = ({
  title = 'Multi-Metric Performance Radar',
  data = DEFAULT_RADAR_DATA
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const total = data.length;

  const getCoordinates = (index: number, valuePct: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = radius * (valuePct / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const scorePoints = data.map((d, i) => getCoordinates(i, d.score));
  const benchmarkPoints = data.map((d, i) => getCoordinates(i, d.benchmark));

  const scorePolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(' ');
  const benchmarkPolygon = benchmarkPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Card variant="analytics" glowColor="purple" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <Badge variant="outline" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Radar
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">6-dimensional comparative analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-slate-300 font-bold">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/50" />
            <span className="text-slate-400">Target</span>
          </div>
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="relative flex items-center justify-center py-2 select-none">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <linearGradient id="radarScoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Web Rings (25%, 50%, 75%, 100%) */}
          {[0.25, 0.5, 0.75, 1.0].map((ring, rIdx) => {
            const ringPoints = data.map((_, i) => getCoordinates(i, ring * 100));
            const ringPath = ringPoints.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={rIdx}
                points={ringPath}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray={rIdx < 3 ? '2 2' : 'none'}
              />
            );
          })}

          {/* Axis Spoke Lines */}
          {data.map((_, i) => {
            const edge = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={edge.x}
                y2={edge.y}
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark Target Polygon */}
          <polygon
            points={benchmarkPolygon}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Current Score Polygon */}
          <polygon
            points={scorePolygon}
            fill="url(#radarScoreGrad)"
            stroke="#a855f7"
            strokeWidth="2.5"
          />

          {/* Interactive Metric Points */}
          {scorePoints.map((pt, idx) => {
            const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
            const labelDist = radius + 22;
            const labelX = center + labelDist * Math.cos(angle);
            const labelY = center + labelDist * Math.sin(angle);

            return (
              <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === idx ? 6 : 3.5}
                  fill={hoveredIdx === idx ? '#c084fc' : '#a855f7'}
                  stroke="#020617"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                />
                {/* Metric Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    'text-[10px] font-mono font-bold transition-all select-none',
                    hoveredIdx === idx ? 'fill-purple-300' : 'fill-slate-400'
                  )}
                >
                  {data[idx].metric}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-purple-500/60 shadow-2xl text-center z-20 pointer-events-none">
            <p className="text-[11px] font-bold text-white">{data[hoveredIdx].metric}</p>
            <p className="text-xs font-mono text-purple-300">
              Score: <span className="font-extrabold text-white">{data[hoveredIdx].score}%</span> (Target: {data[hoveredIdx].benchmark}%)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
