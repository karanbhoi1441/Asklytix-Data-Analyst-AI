import React from 'react';
import type { AIInsightItem, InsightType } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Lightbulb, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightsPanelProps {
  insights: AIInsightItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  title?: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  isRefreshing,
  onRefresh,
  title = 'AI Insights & Signals'
}) => {
  const badgeMap: Record<InsightType, { variant: 'success' | 'info' | 'warning' | 'error'; label: string; icon: React.ElementType }> = {
    opportunity: { variant: 'success', label: 'Opportunity', icon: Lightbulb },
    trend: { variant: 'info', label: 'Trend', icon: TrendingUp },
    warning: { variant: 'error', label: 'Warning', icon: AlertTriangle },
    recommendation: { variant: 'warning', label: 'Recommendation', icon: ShieldAlert }
  };

  return (
    <Card variant="glass" className="w-full border-purple-500/30 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="font-bold text-white text-base">{title}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-purple-400" />}
          className="text-xs font-semibold"
        >
          Refresh Insights
        </Button>
      </div>

      {/* AI Processing Overlay State */}
      {isRefreshing ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider animate-pulse">
            Analyzing your dashboard metrics...
          </p>
        </div>
      ) : (
        /* Insight List */
        <div className="space-y-3.5">
          {insights.map((item, idx) => {
            const meta = badgeMap[item.type];
            const Icon = meta.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" /> {item.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{item.impact}</span>
                    <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
