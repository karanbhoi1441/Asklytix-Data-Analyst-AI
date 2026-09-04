import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Database,
  MessageSquare,
  LayoutDashboard,
  Settings
} from 'lucide-react';

interface SidebarNavProps {
  isCollapsed: boolean;
  onItemClick?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ isCollapsed, onItemClick }) => {
  const mainItems = [
    { label: 'Data Source', path: '/connect', icon: Database },
    { label: 'Data Health & Clean', path: '/ask', icon: MessageSquare, badge: 'AI' },
    { label: 'Analysis Chat', path: '/dashboard', icon: LayoutDashboard },
  ];

  const bottomItems = [
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-3 py-4 space-y-4">
      {/* Clean Primary Navigation */}
      <div className="space-y-1.5">
        {mainItems.map((item) => {
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group select-none',
                  isActive
                    ? 'bg-[#0f2d5e] text-[#60a5fa] border border-[#1e4a8a] shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_#3b82f6]" />
                  )}

                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                        : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded-full border border-cyan-500/40">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );

          return isCollapsed ? (
            <Tooltip key={item.path} content={item.label} position="right">
              {linkContent}
            </Tooltip>
          ) : (
            linkContent
          );
        })}
      </div>

      {/* Bottom Settings Link */}
      <div className="pt-2 border-t border-slate-800/80">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group select-none',
                  isActive
                    ? 'bg-slate-900 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-purple-400 to-cyan-500 rounded-r-full shadow-[0_0_8px_#a855f7]" />
                  )}

                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                        : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />

                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );

          return isCollapsed ? (
            <Tooltip key={item.path} content={item.label} position="right">
              {linkContent}
            </Tooltip>
          ) : (
            linkContent
          );
        })}
      </div>
    </div>
  );
};
