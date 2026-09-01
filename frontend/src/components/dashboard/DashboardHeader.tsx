import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Edit3, 
  MoreVertical, 
  ChevronDown, 
  Copy, 
  Trash2, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardHeaderProps {
  activeDashboard: string;
  onSelectDashboard: (name: string) => void;
  onAddWidget: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeDashboard,
  onSelectDashboard,
  onAddWidget,
  isEditMode,
  onToggleEditMode
}) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  const selectorRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const dashboardOptions = [
    'Executive Overview',
    'Sales Performance',
    'Customer Analysis',
    'Marketing Performance'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsSelectorOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
      {/* Title & Dashboard Selector */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analytics Dashboard
          </h1>

          {/* Selector Dropdown */}
          <div className="relative" ref={selectorRef}>
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors shadow-sm focus:outline-none"
            >
              <span>{activeDashboard}</span>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <AnimatePresence>
              {isSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-52 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl glow-cyan"
                >
                  <div className="p-1 space-y-0.5">
                    {dashboardOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          onSelectDashboard(opt);
                          setIsSelectorOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          activeDashboard === opt
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          Real-time overview of your business performance
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={onAddWidget}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold"
        >
          Add Widget
        </Button>

        <Button
          variant={isEditMode ? 'outline' : 'secondary'}
          size="sm"
          onClick={onToggleEditMode}
          leftIcon={<Edit3 className="w-4 h-4" />}
          className={`text-xs font-semibold ${isEditMode ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10' : ''}`}
        >
          {isEditMode ? 'Done Editing' : 'Edit Dashboard'}
        </Button>

        {/* More Options Menu */}
        <div className="relative" ref={moreRef}>
          <Button
            variant="icon"
            size="sm"
            onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
            aria-label="More dashboard options"
          >
            <MoreVertical className="w-4 h-4 text-slate-300" />
          </Button>

          <AnimatePresence>
            {isMoreOptionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl glow-cyan"
              >
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      const newTitle = prompt('Rename Dashboard:', activeDashboard);
                      if (newTitle) onSelectDashboard(newTitle);
                      setIsMoreOptionsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Rename Dashboard
                  </button>

                  <button
                    onClick={() => {
                      alert(`Duplicated dashboard '${activeDashboard}'`);
                      setIsMoreOptionsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplicate Dashboard
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete '${activeDashboard}'?`)) {
                        alert('Dashboard deleted.');
                      }
                      setIsMoreOptionsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
