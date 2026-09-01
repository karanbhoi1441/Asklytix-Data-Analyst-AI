import React from 'react';
import type { DashboardPageTab } from '@/types/dashboard';
import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DashboardTabsProps {
  tabs: DashboardPageTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onAddTab
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                'relative px-4 py-2 text-xs font-bold transition-all rounded-xl select-none shrink-0',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
              )}
            </button>
          );
        })}

        {/* Add Page Tab Button */}
        <button
          onClick={onAddTab}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800/80 transition-colors shrink-0"
          aria-label="Add new dashboard page tab"
          title="Add Dashboard Page"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
