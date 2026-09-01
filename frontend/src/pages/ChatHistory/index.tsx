import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChatHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const mockHistory = [
    { title: 'Q3 Organic Conversion & CAC Driver Analysis', dataset: 'Q4_Financial_Growth.csv', date: 'Today, 2:15 PM', queries: 8 },
    { title: 'Customer Churn Factors & Retention Cohorts', dataset: 'Customer_Churn_Events.parquet', date: 'Yesterday, 4:30 PM', queries: 14 },
    { title: 'Monthly Recurring Revenue Growth Trend Inspection', dataset: 'User_Behavior_Telemetry.json', date: 'August 24, 2026', queries: 5 }
  ];

  return (
    <PageContainer
      badge="Route: /history"
      title="Ask AI Query History"
      subtitle="Review past natural language conversations, SQL code queries, and generated chart summaries."
    >
      <div className="space-y-4 max-w-5xl mx-auto">
        {mockHistory.map((h, idx) => (
          <Card key={idx} variant="glass" className="hover:border-cyan-500/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{h.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="text-cyan-400">{h.dataset}</span>
                    <span>•</span>
                    <span>{h.queries} queries</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {h.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/ask')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Resume Chat
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
