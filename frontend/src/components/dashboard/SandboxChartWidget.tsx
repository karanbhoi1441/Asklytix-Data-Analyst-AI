import React, { useState } from 'react';
import { 
  Code, 
  Download, 
  Maximize2, 
  RotateCw, 
  Trash2,
  X
} from 'lucide-react';
import { CodeInspectorModal } from './CodeInspectorModal';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface SandboxChartWidgetProps {
  id: string;
  index?: number;
  title: string;
  imageUrl?: string;
  base64Image?: string;
  generatedCode?: string;
  executionTimeMs?: number;
  columnsUsed?: string[];
  chartType?: string;
  explanation?: string;
  createdAt?: string;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string, prompt: string) => void;
}

export const SandboxChartWidget: React.FC<SandboxChartWidgetProps> = ({
  id,
  index = 1,
  title,
  imageUrl,
  base64Image,
  generatedCode,
  executionTimeMs = 0,
  columnsUsed = [],
  chartType = 'Bar Chart',
  explanation,
  createdAt = 'Created just now',
  onDelete,
  onRegenerate
}) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Format chart type label nicely (e.g. 'bar' -> 'Bar Chart', 'line' -> 'Line Chart')
  const formattedChartType = chartType
    ? chartType.toLowerCase().includes('chart')
      ? chartType.charAt(0).toUpperCase() + chartType.slice(1)
      : `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
    : 'Visual Chart';

  // Determine image source
  const imageSrc = base64Image || (imageUrl ? (imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`) : '');

  const handleDownloadImage = () => {
    if (!imageSrc) return;
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_visualization.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="flex flex-col justify-between h-full bg-[#080d1a]/95 border border-blue-500/20 hover:border-cyan-500/40 rounded-2xl p-4 shadow-xl transition-all duration-300 group hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 pb-2">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white tracking-wide truncate">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>{formattedChartType}</span>
              <span>•</span>
              <span>{createdAt}</span>
            </p>
          </div>

          {/* Number Badge (e.g. #1, #2, #3) */}
          <div className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10.5px] font-bold shrink-0 shadow-sm">
            #{index}
          </div>
        </div>

        {/* Visual Chart Canvas Display */}
        <div className="my-3 flex-1 flex items-center justify-center min-h-[260px] bg-[#050914] rounded-xl border border-slate-800/80 overflow-hidden relative group/img">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              onClick={() => setIsFullscreenOpen(true)}
              className="w-full h-full object-contain max-h-[340px] cursor-zoom-in transition-transform duration-200 group-hover/img:scale-[1.01]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating Sandbox Visualization...</span>
            </div>
          )}
        </div>

        {/* Card Action Toolbar (Matching Reference Image: 4 rounded action buttons) */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => setIsFullscreenOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-sm"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer shadow-sm font-mono text-xs font-bold"
            title="View Generated Code"
          >
            <Code className="w-4 h-4" />
          </button>

          {onRegenerate && (
            <button
              onClick={() => onRegenerate(id, title)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500/40 text-slate-400 hover:text-blue-300 transition-all cursor-pointer shadow-sm"
              title="Regenerate Visualization"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer shadow-sm"
              title="Delete Visual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Code Inspector Modal */}
      <CodeInspectorModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title={title}
        code={generatedCode}
        executionTimeMs={executionTimeMs}
        columnsUsed={columnsUsed}
        chartType={formattedChartType}
        explanation={explanation}
      />

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreenOpen && imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullscreenOpen(false)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-5xl w-full bg-[#080d1a] border border-cyan-500/40 rounded-2xl p-4 z-10 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-slate-400 font-mono">{formattedChartType} • #{index}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadImage} leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download PNG
                  </Button>
                  <button
                    onClick={() => setIsFullscreenOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-950 p-2">
                <img src={imageSrc} alt={title} className="max-h-[70vh] object-contain rounded-lg" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
