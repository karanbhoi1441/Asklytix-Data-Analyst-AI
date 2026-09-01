import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edit3, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditDashboardBarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddWidget: () => void;
}

export const EditDashboardBar: React.FC<EditDashboardBarProps> = ({
  isEditMode,
  onToggleEditMode,
  onAddWidget
}) => {
  if (!isEditMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-2xl p-4 border border-cyan-500/50 bg-cyan-950/20 text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 glow-cyan mb-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
          <Edit3 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Dashboard Edit Mode Active</span>
            <Badge variant="primary">Customizing Layout</Badge>
          </div>
          <p className="text-xs text-slate-300">
            Hover over widgets to remove or duplicate them. Click "Add Widget" to insert new chart panels.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button variant="secondary" size="sm" onClick={onAddWidget} leftIcon={<Plus className="w-4 h-4" />}>
          Add Widget
        </Button>
        <Button variant="primary" size="sm" onClick={onToggleEditMode} leftIcon={<Save className="w-4 h-4" />}>
          Save Dashboard Layout
        </Button>
      </div>
    </motion.div>
  );
};
