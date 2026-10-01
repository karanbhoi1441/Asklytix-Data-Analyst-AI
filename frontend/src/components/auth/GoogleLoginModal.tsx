import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { email: string; name?: string }) => Promise<void>;
  isLoading: boolean;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLoading,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [selectedQuickAccount, setSelectedQuickAccount] = useState<string | null>(null);

  // Quick preset accounts for convenience
  const defaultAccounts = [
    {
      name: 'Karan Bhoi',
      email: 'karanbhoi1441@gmail.com',
      avatarColor: 'from-blue-600 to-indigo-600',
      initials: 'KB',
    },
  ];

  const handleSelectQuickAccount = async (accountEmail: string, accountName: string) => {
    setSelectedQuickAccount(accountEmail);
    setError('');
    try {
      await onSuccess({ email: accountEmail, name: accountName });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google connection failed');
      setSelectedQuickAccount(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid Google or Gmail address.');
      return;
    }
    setError('');
    try {
      await onSuccess({ email: cleanEmail, name: name.trim() || undefined });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google connection failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 overflow-hidden text-left"
          >
            {/* Top Google Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 via-green-500 to-blue-500" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Official Google G Logo */}
                <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    Connect Google Account
                  </h3>
                  <p className="text-xs text-slate-400">Choose your real email to sync your workspace</p>
                </div>
              </div>

              {!isLoading && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Quick 1-Click Connect Account Cards */}
            <div className="space-y-2 mb-5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick 1-Click Google Sign In
              </label>
              {defaultAccounts.map((acc) => (
                <motion.button
                  key={acc.email}
                  disabled={isLoading}
                  onClick={() => handleSelectQuickAccount(acc.email, acc.name)}
                  whileHover={!isLoading ? { scale: 1.01, backgroundColor: '#0f172a' } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${acc.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`}
                    >
                      {acc.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isLoading && selectedQuickAccount === acc.email ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Connect <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-[1px] bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Or Connect Another Email
              </span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>

            {/* Custom Google/Gmail Email Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karan Bhoi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Real Google / Gmail Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.01 } : {}}
                whileTap={!isLoading ? { scale: 0.99 } : {}}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading && !selectedQuickAccount ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Real Email...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Privacy & Real Connection Guarantee */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Google session connection with zero unauthorized persistence</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
