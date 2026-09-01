import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { User as UserIcon, Settings, LogOut, Shield } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Karan Bhoi';
  const displayEmail = user?.email || 'karanbhoi1441@gmail.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-colors focus:outline-none group"
      >
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-sm">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-300 font-bold text-xs font-mono">
            {initials || <UserIcon className="w-4 h-4" />}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
        </div>

        <div className="hidden xl:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-200 leading-tight group-hover:text-cyan-300 transition-colors">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Pro Workspace</span>
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl glow-cyan"
          >
            {/* User Details */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 space-y-1">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 font-mono truncate">{displayEmail}</p>
              <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <Shield className="w-3 h-3" /> Authenticated Pro Member
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-cyan-400" /> My Profile
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <Settings className="w-4 h-4 text-purple-400" /> Workspace Settings
              </button>
            </div>

            {/* Sign Out */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950/40">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
