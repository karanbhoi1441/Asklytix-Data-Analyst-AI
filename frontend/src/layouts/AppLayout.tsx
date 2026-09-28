import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';
import { Menu } from 'lucide-react';

const AppLayoutInner: React.FC = () => {
  const { isCollapsed, toggleMobile } = useSidebar();
  const location = useLocation();

  return (
    <AnimatedBackground showGrid={true}>
      <div className="flex min-h-screen w-full relative overflow-x-hidden">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Slide-in Drawer */}
        <MobileSidebar />

        {/* Minimal Mobile Menu Button (No Heading Bar) */}
        <div className="lg:hidden fixed top-3 left-3 z-40">
          <button
            onClick={toggleMobile}
            className="p-2 rounded-xl bg-[#090f1f]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shadow-xl backdrop-blur-md cursor-pointer transition-all"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Main Application Content Area - Full Length */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300 min-h-screen',
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          {/* Dynamic Page Workspace */}
          <main className="flex-1 w-full min-h-screen">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AppLayoutInner />
    </SidebarProvider>
  );
};
