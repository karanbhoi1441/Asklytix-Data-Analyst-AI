import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Clock, 
  Columns, 
  BarChart2, 
  Terminal,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code?: string;
  executionTimeMs?: number;
  columnsUsed?: string[];
  chartType?: string;
  explanation?: string;
}

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  isOpen,
  onClose,
  title,
  code = '# No code available for this visualization',
  executionTimeMs = 0,
  columnsUsed = [],
  chartType = 'Chart',
  explanation
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Generated Python Sandbox Code</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Sandbox Verified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                  {title}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry Summary Bar */}
          <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Execution: <strong className="text-slate-200">{executionTimeMs}ms</strong></span>
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Type: <strong className="text-slate-200 capitalize">{chartType}</strong></span>
              </span>
            </div>

            {columnsUsed.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-400">Columns:</span>
                {columnsUsed.map((col, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px]">
                    {col}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Code Viewer Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            {explanation && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed">
                {explanation}
              </div>
            )}

            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  matplotlib_sandbox_runner.py
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy Code</>
                  )}
                </button>
              </div>

              <pre className="p-4 text-xs font-mono text-cyan-300/90 leading-relaxed overflow-x-auto selection:bg-cyan-500/30">
                <code>{code}</code>
              </pre>
            </div>

            {/* Sandbox Security Guarantee */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Sandbox Security:</strong> This Python script ran in a fully isolated sandbox with restricted imports, memory limits, and zero external network access.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end bg-slate-950/70">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
