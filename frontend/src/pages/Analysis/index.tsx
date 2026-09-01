import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Cpu, Activity, Brain, Play } from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  return (
    <PageContainer
      badge="Route: /analysis"
      title="Automated Data Analysis Engine"
      subtitle="Run statistical correlation analysis, outlier detection, regression models, and anomaly scans."
      actions={
        <Button variant="primary" size="sm" leftIcon={<Play className="w-4 h-4" />}>
          Run Full Scan
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card variant="glass" className="border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Anomaly Detection
              </span>
              <Badge variant="success">0 Anomalies</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Scans dataset metrics against historical confidence intervals to highlight spikes or drops.
            </p>
            <Button variant="secondary" size="sm" fullWidth>Configure Scan</Button>
          </Card>

          <Card variant="glass" className="border-blue-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Feature Correlation
              </span>
              <Badge variant="primary">Pearson Matrix</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Computes pairwise correlation coefficients across numeric variables to uncover hidden drivers.
            </p>
            <Button variant="secondary" size="sm" fullWidth>View Heatmap</Button>
          </Card>

          <Card variant="glass" className="border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" /> Automated Insights
              </span>
              <Badge variant="outline">AI Model</Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Generates plain-language executive summaries of statistical distributions and key takeaways.
            </p>
            <Button variant="secondary" size="sm" fullWidth>Generate Brief</Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
