import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Search, Command } from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const inputEl = document.getElementById('global-search-input');
        if (inputEl) inputEl.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-sm sm:max-w-md relative">
      <Input
        id="global-search-input"
        type="search"
        placeholder="Search datasets, reports, dashboards... (⌘K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        rightIcon={
          <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        }
        className="bg-slate-900/90 border-slate-800 focus:border-cyan-500/80 text-xs py-2 rounded-xl"
      />
    </div>
  );
};
