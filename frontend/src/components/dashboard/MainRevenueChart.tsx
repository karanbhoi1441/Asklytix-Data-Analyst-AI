import React, { useState } from 'react';
import type { ChartDataPoint, MetricType, TimeHorizon } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { LineChart } from 'lucide-react';

interface MainRevenueChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const MainRevenueChart: React.FC<MainRevenueChartProps> = ({ data, title = 'Revenue Performance' }) => {
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [horizon, setHorizon] = useState<TimeHorizon>('month');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; val: number } | null>(null);

  const safeData = data && data.length > 0 ? data : [
    { label: 'Jan', revenue: 10000, profit: 3200, orders: 100 },
    { label: 'Feb', revenue: 15000, profit: 4800, orders: 150 },
    { label: 'Mar', revenue: 22000, profit: 7000, orders: 210 },
    { label: 'Apr', revenue: 28000, profit: 8900, orders: 260 },
  ];

  const values = safeData.map((d) => Number(d[metric]) || 0);
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.15;

  const width = 700;
  const height = 260;
  const paddingLeft = 60;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const points = safeData.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(safeData.length - 1, 1)) * graphWidth;
    const currentVal = Number(d[metric]) || 0;
    const y = height - paddingBottom - ((currentVal - minVal) / (maxVal - minVal || 1)) * graphHeight;
    return { x, y, label: d.label || `P${idx + 1}`, val: currentVal };
  });

  const pathString = points.reduce(
    (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const areaString = points.length > 0
    ? `${pathString} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  const formatMetricValue = (val: number) => {
    if (metric === 'revenue' || metric === 'profit') {
      return `$${val.toLocaleString()}`;
    }
    return val.toLocaleString();
  };

  return (
    <Card variant="glass" className="w-full border-cyan-500/30 p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base flex items-center gap-2">
              <LineChart className="w-4 h-4 text-cyan-400" /> {title}
            </span>
            <Badge variant="primary" size="sm">Real-time Stream</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Displaying {metric.toUpperCase()} telemetry across {data.length} periods
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector Toggles */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                metric === 'revenue' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric('profit')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                metric === 'profit' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Profit
            </button>
            <button
              onClick={() => setMetric('orders')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                metric === 'orders' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orders
            </button>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
            {(['month', 'quarter', 'year'] as TimeHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-lg font-mono capitalize transition-all ${
                  horizon === h ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Graphic */}
      <div className="relative w-full h-64">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="mainLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <linearGradient id="mainAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + graphHeight * (1 - ratio);
            const val = minVal + (maxVal - minVal) * ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X-Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 12}
              fill="#94a3b8"
              fontSize="11"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}

          {/* Gradient Area Fill */}
          <path d={areaString} fill="url(#mainAreaGrad)" />

          {/* Animated Curve Path */}
          <motion.path
            d={pathString}
            fill="none"
            stroke="url(#mainLineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ d: pathString }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Data Nodes & Hover Interactivity */}
          {points.map((p, idx) => (
            <g key={idx}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#040711"
                stroke="#38bdf8"
                strokeWidth="2"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                animate={{ cx: p.x, cy: p.y }}
                transition={{ duration: 0.8 }}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-30 p-2.5 bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none text-xs space-y-1 font-mono glow-cyan"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 20}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-bold text-white">{hoveredPoint.label}</div>
            <div className="text-cyan-400 font-bold">{formatMetricValue(hoveredPoint.val)}</div>
          </div>
        )}
      </div>
    </Card>
  );
};
