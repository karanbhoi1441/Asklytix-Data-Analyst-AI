import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LayoutGrid, Plus, Eye, Share2 } from 'lucide-react';

export const DashboardsPage: React.FC = () => {
  const mockDashboards = [
    { title: 'Executive Growth & Revenue Board', widgets: '12 Widgets', status: 'Live Published', updated: '10m ago' },
    { title: 'Marketing Acquisition & Conversion Hub', widgets: '8 Widgets', status: 'Live Published', updated: '2h ago' },
    { title: 'Product Retention & Churn Analytics', widgets: '6 Widgets', status: 'Draft Mode', updated: '1d ago' }
  ];

  return (
    <PageContainer
      mode="canvas"
      badge="Route: /dashboards"
      title="Custom Dashboards Gallery"
      subtitle="Build, arrange, publish, and embed multi-widget BI dashboards."
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          New Dashboard Canvas
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mockDashboards.map((d, idx) => (
            <Card key={idx} variant="interactive" className="hover:border-cyan-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <Badge variant={d.status.includes('Published') ? 'success' : 'secondary'} size="sm">
                  {d.status}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{d.title}</h3>
              <p className="text-xs text-slate-400 font-mono mb-4">{d.widgets} • Updated {d.updated}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                  Open Canvas
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>
                  Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
