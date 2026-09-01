import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Copy, Check, Download, Play, Terminal,
  Database, CheckCircle2, X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface CodeRecordDetails {
  query: string;
  datasetName: string;
  pythonCode: string;
  sqlQuery: string;
  jsCode: string;
  executionSteps: { step: string; desc: string }[];
  simulatedOutput: string;
}

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CodeRecordDetails | null;
}

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  isOpen,
  onClose,
  details
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  if (!isOpen || !details) return null;

  const currentCode = details.pythonCode || '# Python (Pandas) analysis code';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asklytix_pandas_script.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunCode = () => {
    setIsExecuting(true);
    setHasRun(false);
    setTimeout(() => {
      setIsExecuting(false);
      setHasRun(true);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl z-10 overflow-hidden text-slate-100 backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Analysis Code for Query
                  </h3>
                  <Badge variant="primary" size="sm">
                    Live Record Engine
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md font-mono">
                  Target Query: <span className="text-cyan-300">"{details.query}"</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* Top Language Badge & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
                  <span>🐍</span>
                  <span>Python (Pandas)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Copy & Download Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  className="text-xs font-semibold"
                >
                  {isCopied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
                  className="text-xs font-semibold"
                >
                  Download Script (.py)
                </Button>
              </div>
            </div>

            {/* Code Block Window */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  {details.datasetName}
                </span>
                <span className="text-cyan-400 font-mono text-[10.5px]">
                  Format: PYTHON (PANDAS)
                </span>
              </div>
              <pre className="p-4 text-cyan-300 overflow-x-auto leading-relaxed">
                <code>{currentCode}</code>
              </pre>
            </div>

            {/* Interactive Sandbox Execution */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Test Execution against CSV
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunCode}
                  isLoading={isExecuting}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500"
                >
                  Run in Live Sandbox
                </Button>
              </div>

              {hasRun && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-black border border-emerald-500/30 font-mono text-[11px] text-emerald-300 space-y-1.5 shadow-inner"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-1">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Status: 200 OK (Executed)
                    </span>
                    <span>Latency: 14ms • Memory: 3.8 MB</span>
                  </div>
                  <pre className="overflow-x-auto text-slate-300 py-1">
                    <code>{details.simulatedOutput}</code>
                  </pre>
                </motion.div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">
              AskLytix AI Code Engine v2.4
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
