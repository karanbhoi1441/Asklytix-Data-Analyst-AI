import React from 'react';
import type { KPIItem } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardsGridProps {
  kpis: KPIItem[];
}

export const KPICardsGrid: React.FC<KPICardsGridProps> = ({ kpis }) => {
  const iconMap: Record<string, React.ElementType> = {
    DollarSign,
    Users,
    ShoppingBag,
    TrendingUp
  };

  const glowColors: Record<number, 'cyan' | 'blue' | 'purple' | 'none'> = {
    0: 'cyan',
    1: 'blue',
    2: 'purple',
    3: 'cyan'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {(kpis || []).map((kpi, idx) => {
        const IconComponent = (kpi.icon && iconMap[kpi.icon]) || TrendingUp;
        const rawVal = kpi.value ?? 0;
        const formatted = typeof rawVal === 'number'
          ? (kpi.prefix ? `${kpi.prefix}${rawVal.toLocaleString()}` : rawVal.toLocaleString())
          : String(rawVal);

        const sparkPoints = (kpi.sparkline && kpi.sparkline.length > 1)
          ? kpi.sparkline
          : [20, 25, 22, 35, 30, 45, 42, 50];

        const isPositive = kpi.isPositive ?? (String(kpi.change).startsWith('+') || Number(kpi.change) >= 0);
        const changeVal = String(kpi.change ?? '0').replace('+', '');

        return (
          <Card key={kpi.id || `kpi-${idx}`} variant="analytics" glowColor={glowColors[idx]}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 shadow-sm">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <motion.h3
                  key={String(rawVal)}
                  initial={{ opacity: 0.5, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans"
                >
                  {formatted}
                </motion.h3>

                <Badge variant={isPositive ? 'success' : 'error'} size="sm">
                  {isPositive ? '+' : ''}{changeVal}%
                </Badge>
              </div>

              {/* Sparkline Visualizer */}
              <div className="w-full h-8 pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30">
                  <polyline
                    fill="none"
                    stroke={idx % 2 === 0 ? '#06b6d4' : '#8b5cf6'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    points={sparkPoints
                      .map((val, i) => {
                        const x = (i / (sparkPoints.length - 1)) * 120;
                        const min = Math.min(...sparkPoints);
                        const max = Math.max(...sparkPoints);
                        const y = 28 - ((val - min) / (max - min || 1)) * 24;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
