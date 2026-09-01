import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Share2, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const mockReports = [
    { title: 'Q4 Financial Performance & AI Executive Summary', date: 'August 24, 2026', size: '2.4 MB', format: 'PDF' },
    { title: 'User Churn Analysis & Machine Learning Insight Brief', date: 'August 18, 2026', size: '1.8 MB', format: 'PDF' },
    { title: 'Weekly Revenue Anomaly Detection Audit', date: 'August 12, 2026', size: '940 KB', format: 'CSV' },
  ];

  return (
    <PageContainer
      badge="Route: /reports"
      title="Automated Reports & Export"
      subtitle="Generated executive briefs, PDF data summaries, and scheduled export reports."
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {mockReports.map((r, idx) => (
            <Card key={idx} variant="glass" className="hover:border-cyan-500/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{r.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {r.date}
                      </span>
                      <span>•</span>
                      <span>{r.size}</span>
                      <span>•</span>
                      <Badge variant="primary" size="sm">{r.format}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                    Share
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
