import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Header } from '@/components/layout/Header';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';

const AppLayoutInner: React.FC = () => {
  const { isCollapsed } = useSidebar();
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

        {/* Main Application Content Area */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300 min-h-screen',
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          {/* Top Header */}
          <Header />

          {/* Dynamic Page Workspace */}
          <main className="flex-1 w-full">
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
