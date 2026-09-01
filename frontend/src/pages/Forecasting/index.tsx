import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Play, Sliders } from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  return (
    <PageContainer
      badge="Route: /forecasting"
      title="Predictive AI Forecasting"
      subtitle="Project future revenue, churn rates, user acquisition trends, and inventory demands using machine learning time-series models."
      actions={
        <Button variant="primary" size="sm" leftIcon={<Play className="w-4 h-4" />}>
          Run Forecast Model
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Revenue Trajectory (Next 12 Months)
              </span>
              <Badge variant="primary">95% Confidence Interval</Badge>
            </div>
            <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex items-center justify-center text-xs font-mono text-cyan-400">
              [Predictive Model Visualization Workspace]
            </div>
          </Card>

          <Card variant="glass" className="border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Model Hyperparameters
              </span>
              <Badge variant="outline">Prophet / XGBoost</Badge>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Forecast Horizon:</span>
                <span className="font-mono text-cyan-400">365 Days</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Seasonality Mode:</span>
                <span className="font-mono text-purple-400">Multiplicative</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence Band:</span>
                <span className="font-mono text-emerald-400">±4.2%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
