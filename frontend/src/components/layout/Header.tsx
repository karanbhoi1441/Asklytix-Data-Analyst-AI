import React from 'react';
import { useLocation } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { NotificationMenu } from './NotificationMenu';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/Button';
import { Menu, X, Sparkles, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';

const routeTitleMap: Record<string, { title: string; section?: string }> = {
  '/dashboard': { title: 'Dashboard Overview', section: 'Main' },
  '/ask': { title: 'Ask AI Assistant', section: 'Main' },
  '/upload': { title: 'Upload & Ingest Data', section: 'Main' },
  '/data-sources': { title: 'Connected Data Sources', section: 'Data' },
  '/datasets': { title: 'Datasets & Files', section: 'Data' },
  '/analysis': { title: 'Deep Data Analysis', section: 'Data' },
  '/visualizations': { title: 'Custom Visualizations', section: 'Create' },
  '/dashboards': { title: 'Interactive Dashboards', section: 'Create' },
  '/forecasting': { title: 'Predictive Forecasting', section: 'Create' },
  '/reports': { title: 'Automated Reports', section: 'Output' },
  '/history': { title: 'AI Query History', section: 'Output' },
  '/settings': { title: 'Workspace Settings', section: 'Settings' }
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { isMobileOpen, toggleMobile } = useSidebar();

  const currentRoute = routeTitleMap[location.pathname] || {
    title: 'Workspace',
    section: 'AskLytix'
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#040711]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all duration-200">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Left Section: Mobile Menu Toggle + Breadcrumbs & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="icon"
            size="sm"
            onClick={toggleMobile}
            className="lg:hidden text-slate-300 hover:text-white shrink-0"
            aria-label="Toggle navigation drawer"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="min-w-0">
            {currentRoute.section && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span>{currentRoute.section}</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            )}
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              {currentRoute.title}
            </h1>
          </div>
        </div>

        {/* Center Section: Global Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 justify-center">
          <GlobalSearch />
        </div>

        {/* Right Section: AI Status + Notifications + User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* AI Status Indicator */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AskLytix AI Ready</span>
          </div>

          {/* Notifications Dropdown */}
          <NotificationMenu />

          {/* User Profile Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
