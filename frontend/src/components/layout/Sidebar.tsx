import React from 'react';
import { AskLytixLogo } from '@/components/common/AskLytixLogo';
import { SidebarNav } from './SidebarNav';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();

  const displayName = user?.name || 'Karan Bhoi';
  const displayRole = 'Pro Tier';

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen bg-[#050914]/95 backdrop-blur-2xl border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between select-none shadow-2xl',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Top Header Logo + Toggle Button */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div 
          onClick={() => navigate('/')}
          className="cursor-pointer transition-all duration-300 overflow-hidden flex items-center"
        >
          {isCollapsed ? (
            <AskLytixLogo size="small" showText={false} />
          ) : (
            <AskLytixLogo size="small" showText={true} />
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors focus:outline-none"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <SidebarNav isCollapsed={isCollapsed} />

      {/* Bottom Profile Widget & Creator Links */}
      <div className="p-3 border-t border-slate-800/80 shrink-0 bg-slate-950/60 space-y-2">
        <div
          onClick={() => navigate('/settings')}
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/80 cursor-pointer transition-colors border border-transparent hover:border-slate-800',
            isCollapsed && 'justify-center p-1'
          )}
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-300 font-bold text-xs font-mono">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-bold text-slate-200 truncate">{displayName}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate">{displayRole}</span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
            <span className="text-slate-400 font-semibold">Karan Bhoi</span>
            <span>|</span>
            <a href="https://github.com/karanbhoi1441" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
            <span>|</span>
            <a href="https://www.linkedin.com/in/karanbhoi2005" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">LinkedIn</a>
          </div>
        )}
      </div>
    </aside>
  );
};
