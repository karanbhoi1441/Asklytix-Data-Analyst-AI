import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Sparkles, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { NotificationItem } from '@/types';

export const NotificationMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Dataset Ingestion Complete',
      message: 'Q4_Financial_Growth.csv has been successfully indexed.',
      time: '5m ago',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'AI Insight Alert',
      message: 'Detected 18.4% anomaly in organic conversion rates.',
      time: '1h ago',
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Report Generated',
      message: 'Executive_Summary_August.pdf is ready for download.',
      time: '3h ago',
      read: true,
      type: 'info'
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="icon"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative text-slate-300 hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
          </>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl glow-cyan"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-800/40 ${
                    !n.read ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 text-cyan-400 shrink-0 mt-0.5">
                    {n.title.includes('Dataset') ? (
                      <Database className="w-4 h-4 text-cyan-400" />
                    ) : n.title.includes('AI') ? (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100 truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 text-center text-xs text-slate-400 font-mono">
              AskLytix AI Notification System
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
