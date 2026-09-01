import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AskLytixLogo } from '@/components/common/AskLytixLogo';
import { SidebarNav } from './SidebarNav';
import { useSidebar } from '@/hooks/useSidebar';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MobileSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { isMobileOpen, closeMobile } = useSidebar();

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeMobile]);

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-72 h-full bg-[#050914] border-r border-slate-800/80 flex flex-col justify-between shadow-2xl overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
              <div onClick={() => { closeMobile(); navigate('/'); }} className="cursor-pointer">
                <AskLytixLogo size="small" />
              </div>
              <button
                onClick={closeMobile}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                aria-label="Close mobile navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <SidebarNav isCollapsed={false} onItemClick={closeMobile} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
