import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, UploadCloud, BarChart2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsPanelProps {
  onAddTab: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onAddTab }) => {
  const navigate = useNavigate();

  return (
    <Card variant="glass" className="w-full border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
          Quick Actions
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/ask')}
          leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
          className="text-xs font-semibold justify-start"
        >
          Ask AI About Dashboard
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/upload')}
          leftIcon={<UploadCloud className="w-4 h-4 text-blue-400" />}
          className="text-xs font-semibold justify-start"
        >
          Upload New Data
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/visualizations')}
          leftIcon={<BarChart2 className="w-4 h-4 text-purple-400" />}
          className="text-xs font-semibold justify-start"
        >
          Create Visualization
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onAddTab}
          leftIcon={<Plus className="w-4 h-4 text-cyan-400" />}
          className="text-xs font-semibold justify-start"
        >
          Add Dashboard Page
        </Button>
      </div>
    </Card>
  );
};
