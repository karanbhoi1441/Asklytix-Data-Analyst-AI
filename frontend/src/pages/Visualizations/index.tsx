import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { datasetService } from '@/services/datasetService';
import type { Dataset } from '@/types/datasets';
import type { SavedVisualizationItem, VisualSuggestionItem } from '@/services/datasetService';
import type { DashboardWidget } from '@/types/dashboard';
import { LiveVisualizationRenderer } from '@/components/dashboard/LiveVisualizationRenderer';
import { CodeInspectorModal } from '@/components/dashboard/CodeInspectorModal';
import {
  BarChart3,
  LineChart,
  PieChart,
  CircleDot,
  Sliders,
  Grid,
  Globe,
  Sparkles,
  Trash2,
  Maximize2,
  Code,
  Send,
  Loader2,
  RefreshCw,
  Plus,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VisualizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [visualizations, setVisualizations] = useState<SavedVisualizationItem[]>([]);
  const [suggestions, setSuggestions] = useState<VisualSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedChartFilter, setSelectedChartFilter] = useState<string>('all');
  const [fullscreenVisual, setFullscreenVisual] = useState<SavedVisualizationItem | null>(null);
  const [codeModalData, setCodeModalData] = useState<{
    title?: string;
    code?: string;
    executionTimeMs?: number;
    columnsUsed?: string[];
    chartType?: string;
    explanation?: string;
  } | null>(null);

  // Load all datasets on mount
  useEffect(() => {
    let isMounted = true;
    datasetService.list()
      .then((data) => {
        if (!isMounted) return;
        setDatasets(data || []);
        const activeId = localStorage.getItem('asklytix_active_dataset_id');
        if (activeId && data.some(d => d.id === activeId)) {
          setSelectedDatasetId(activeId);
        } else if (data && data.length > 0) {
          setSelectedDatasetId(data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch datasets list:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch visualizations & suggestions whenever selectedDatasetId changes
  useEffect(() => {
    if (!selectedDatasetId) {
      setVisualizations([]);
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      datasetService.getVisualizations(selectedDatasetId),
      datasetService.getVisualSuggestions(selectedDatasetId)
    ]).then(([visRes, sugRes]) => {
      if (!isMounted) return;
      if (visRes.status === 'fulfilled' && visRes.value?.visualizations) {
        setVisualizations(visRes.value.visualizations);
      } else {
        setVisualizations([]);
      }

      if (sugRes.status === 'fulfilled' && sugRes.value?.suggestions) {
        setSuggestions(sugRes.value.suggestions);
      } else {
        setSuggestions([]);
      }
    }).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDatasetId]);

  const selectedDataset = useMemo(() => {
    return datasets.find(d => d.id === selectedDatasetId);
  }, [datasets, selectedDatasetId]);

  // Handle generating a new dynamic visualization from prompt or suggestion
  const handleGenerate = async (queryText?: string) => {
    const text = (queryText || promptInput).trim();
    if (!text || !selectedDatasetId || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await datasetService.generateVisualization(selectedDatasetId, text, 'visual');
      if (res.status === 'success' && res.visualization) {
        // Refresh visualizations list from backend
        const updatedList = await datasetService.getVisualizations(selectedDatasetId);
        if (updatedList?.visualizations) {
          setVisualizations(updatedList.visualizations);
        } else if (res.saved_item) {
          setVisualizations(prev => [res.saved_item!, ...prev]);
        }
        setPromptInput('');
      }
    } catch (err) {
      console.error('Visualization generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle deleting a single visualization
  const handleDeleteVisual = async (visualId: string) => {
    try {
      await datasetService.deleteVisualization(visualId);
      setVisualizations(prev => prev.filter(v => v.id !== visualId));
    } catch (err) {
      console.error('Failed to delete visual:', err);
    }
  };

  // Handle clearing all visualizations for the selected dataset
  const handleClearAll = async () => {
    if (!selectedDatasetId || visualizations.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all visualizations for this dataset?')) return;
    try {
      await datasetService.clearAllVisualizations(selectedDatasetId);
      setVisualizations([]);
    } catch (err) {
      console.error('Failed to clear visualizations:', err);
    }
  };

  // Filtered visualizations by chart type
  const filteredVisualizations = useMemo(() => {
    if (selectedChartFilter === 'all') return visualizations;
    return visualizations.filter(v => {
      const ct = (v.chart_type || '').toLowerCase();
      if (selectedChartFilter === 'bar') return ct.includes('bar') || ct.includes('hist');
      if (selectedChartFilter === 'line') return ct.includes('line') || ct.includes('trend') || ct.includes('area');
      if (selectedChartFilter === 'pie') return ct.includes('pie') || ct.includes('donut');
      if (selectedChartFilter === 'scatter') return ct.includes('scatter');
      if (selectedChartFilter === 'heatmap') return ct.includes('heatmap') || ct.includes('corr');
      if (selectedChartFilter === 'map') return ct.includes('map') || ct.includes('geo');
      if (selectedChartFilter === 'kpi') return ct.includes('kpi');
      if (selectedChartFilter === 'box') return ct.includes('box') || ct.includes('violin');
      return true;
    });
  }, [visualizations, selectedChartFilter]);

  // Convert SavedVisualizationItem to DashboardWidget for LiveVisualizationRenderer
  const toWidget = (v: SavedVisualizationItem): DashboardWidget => ({
    id: v.id,
    type: (v.chart_type === 'kpi') ? 'kpi' : 'sandbox_chart',
    title: v.title,
    colSpan: 4,
    position: v.position || 1,
    imageUrl: v.image_url,
    base64Image: v.base64_image,
    html: v.html,
    generatedCode: v.generated_code,
    executionTimeMs: v.execution_time_ms,
    columnsUsed: v.columns_used,
    chartType: v.chart_type,
    explanation: v.explanation,
    spec: (v as any).chart_specification || {
      title: v.title,
      chart_type: v.chart_type,
      data: (v as any).data
    },
    data: (v as any).data
  });

  const chartFilterOptions = [
    { key: 'all', label: 'All Charts', icon: BarChart3 },
    { key: 'bar', label: 'Bar & Histograms', icon: BarChart3 },
    { key: 'line', label: 'Line & Trends', icon: LineChart },
    { key: 'pie', label: 'Pie & Donut', icon: PieChart },
    { key: 'scatter', label: 'Scatter Plots', icon: CircleDot },
    { key: 'heatmap', label: 'Heatmaps', icon: Grid },
    { key: 'map', label: 'Geographic Maps', icon: Globe },
    { key: 'kpi', label: 'KPI Cards', icon: Sparkles },
    { key: 'box', label: 'Box Plots', icon: Sliders },
  ];

  if (datasets.length === 0 && !isLoading) {
    return (
      <PageContainer
        badge="Route: /visualizations"
        title="Interactive Visualizations Studio"
        subtitle="Dynamic chart generation and visual analytics engine."
      >
        <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 space-y-5 glass-card rounded-2xl border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-black text-white">No Datasets Connected</h2>
            <p className="text-xs text-slate-400">
              Connect or upload a CSV/Excel dataset to automatically generate dynamic charts and interactive visual analytics.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/connect')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Connect Dataset Now
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      badge="Route: /visualizations"
      title="Interactive Visualizations Studio"
      subtitle="Explore, configure, and generate dynamic visual representations of your active datasets."
      actions={
        <div className="flex items-center gap-2">
          {visualizations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              className="hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-300"
            >
              Clear All ({visualizations.length})
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
          >
            Open Dashboard Canvas
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Top Dynamic Toolbar & AI Prompt Bar ── */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Dataset Selector Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Dataset:</span>
              </div>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="bg-slate-900 text-xs text-cyan-300 font-mono font-bold border border-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.rows || (d as any).row_count || 0} rows)
                  </option>
                ))}
              </select>
              {selectedDataset && (
                <Badge variant="primary" size="sm">
                  {selectedDataset.format || 'CSV'} • {selectedDataset.rows || (selectedDataset as any).row_count || 0} Rows
                </Badge>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                if (selectedDatasetId) {
                  setIsLoading(true);
                  datasetService.getVisualizations(selectedDatasetId).then(res => {
                    setVisualizations(res.visualizations || []);
                  }).finally(() => setIsLoading(false));
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Visuals</span>
            </button>
          </div>

          {/* Natural Language Visual Generator Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="flex items-center gap-2 bg-slate-950/90 border border-cyan-500/30 rounded-xl p-2 shadow-inner focus-within:border-cyan-500/70 transition-all"
          >
            <div className="p-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={`Ask for any chart (e.g. "Monthly sales trend line", "Salary distribution by department donut chart", "Showroom locations map")...`}
              disabled={isGenerating}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!promptInput.trim() || isGenerating}
              leftIcon={isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            >
              {isGenerating ? 'Generating...' : 'Generate Visual'}
            </Button>
          </form>

          {/* Dynamic Suggestion Pills */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Suggested for this dataset:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {suggestions.slice(0, 6).map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerate(sug.prompt)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-all cursor-pointer truncate max-w-[320px] text-left"
                    title={sug.prompt}
                  >
                    ✨ {sug.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Chart Category Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {chartFilterOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedChartFilter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedChartFilter(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Visualizations Dynamic Grid ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-mono text-slate-400">Loading dataset visualizations...</p>
          </div>
        ) : filteredVisualizations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVisualizations.map((item, idx) => {
              const widget = toWidget(item);
              return (
                <div
                  key={item.id || idx}
                  className="bg-[#0b101f]/95 border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between min-h-[420px] transition-all group"
                >
                  {/* Top Bar for Card */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white tracking-wide truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span className="text-cyan-400 font-semibold">{item.chart_type?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCodeModalData({
                            title: item.title,
                            code: item.generated_code,
                            executionTimeMs: item.execution_time_ms,
                            columnsUsed: item.columns_used,
                            chartType: item.chart_type,
                            explanation: item.explanation
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer transition-all"
                        title="Inspect Python Code"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFullscreenVisual(item)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-all"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVisual(item.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer transition-all"
                        title="Delete Visual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Live Interactive Visualization Body */}
                  <div className="flex-1 my-3 flex items-center justify-center bg-[#070b16] rounded-xl border border-slate-800/60 overflow-hidden relative min-h-[300px]">
                    <LiveVisualizationRenderer
                      widget={widget}
                      datasetName={selectedDataset?.name || 'Active Dataset'}
                      onFullscreen={() => setFullscreenVisual(item)}
                      onViewCode={() => {
                        setCodeModalData({
                          title: item.title,
                          code: item.generated_code,
                          executionTimeMs: item.execution_time_ms,
                          columnsUsed: item.columns_used,
                          chartType: item.chart_type,
                          explanation: item.explanation
                        });
                      }}
                    />
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      {item.columns_used?.length ? item.columns_used.join(', ') : 'All dataset fields'}
                    </span>
                    <span className="text-slate-500">
                      {item.execution_time_ms ? `${item.execution_time_ms}ms` : 'Instant'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty / Suggestion Grid when no visuals match the filter */
          <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Visualizations Created Yet</h3>
              <p className="text-xs text-slate-400">
                Click any of the AI-tailored suggestions below to generate dynamic interactive charts for <span className="text-cyan-400 font-mono font-bold">{selectedDataset?.name || 'this dataset'}</span>.
              </p>
            </div>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto pt-2">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerate(sug.prompt)}
                  disabled={isGenerating}
                  className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      {sug.chart_type?.replace('_', ' ')}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {sug.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Click to generate visual →
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code Inspector Modal */}
      {codeModalData && (
        <CodeInspectorModal
          isOpen={!!codeModalData}
          onClose={() => setCodeModalData(null)}
          title={codeModalData.title || 'Visualization Code'}
          code={codeModalData.code}
          executionTimeMs={codeModalData.executionTimeMs}
          columnsUsed={codeModalData.columnsUsed}
          chartType={codeModalData.chartType}
          explanation={codeModalData.explanation}
        />
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {fullscreenVisual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenVisual(null)}
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
                  <h3 className="text-sm font-bold text-white">{fullscreenVisual.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {fullscreenVisual.chart_type?.toUpperCase()} • {selectedDataset?.name}
                  </p>
                </div>
                <button
                  onClick={() => setFullscreenVisual(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="min-h-[480px] max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-950 p-2">
                <LiveVisualizationRenderer
                  widget={toWidget(fullscreenVisual)}
                  datasetName={selectedDataset?.name || 'Dataset'}
                  onViewCode={() => {
                    setCodeModalData({
                      title: fullscreenVisual.title,
                      code: fullscreenVisual.generated_code,
                      executionTimeMs: fullscreenVisual.execution_time_ms,
                      columnsUsed: fullscreenVisual.columns_used,
                      chartType: fullscreenVisual.chart_type,
                      explanation: fullscreenVisual.explanation
                    });
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
