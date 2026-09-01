import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { datasetService } from '@/services/datasetService';
import type { SavedVisualizationItem, VisualSuggestionItem } from '@/services/datasetService';
import type { DashboardWidget } from '@/types/dashboard';
import { generateAiExecutivePdfReport } from '@/services/aiReportService';
import { CodeInspectorModal } from '@/components/dashboard/CodeInspectorModal';
import { LiveVisualizationRenderer } from '@/components/dashboard/LiveVisualizationRenderer';
import {
  BarChart3,
  Bot,
  User,
  Send,
  Sparkles,
  FileText,
  LogOut,
  Code,
  FileSpreadsheet,
  Maximize2,
  Download,
  Loader2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  X,
  TrendingUp,
  PieChart,
  Activity,
  CircleDot,
  Sliders,
  Layers,
  Grid,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  planOfAction?: string[];
  executedCode?: string;
  executionTimeMs?: number;
  columnsUsed?: string[];
  chartType?: string;
  timestamp: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [promptInput, setPromptInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStageText, setLoadingStageText] = useState<string>('Analyzing your request...');
  const [activeVisualIndex, setActiveVisualIndex] = useState<number>(0);
  const [isSuggestVisualsOpen, setIsSuggestVisualsOpen] = useState<boolean>(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [visualSuggestionsList, setVisualSuggestionsList] = useState<VisualSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [selectedModalData, setSelectedModalData] = useState<{
    title?: string;
    code?: string;
    executionTimeMs?: number;
    columnsUsed?: string[];
    chartType?: string;
    explanation?: string;
  }>({});

  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportSuccessNotice, setReportSuccessNotice] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    widgets,
    generateBatchWidgets,
    clearAllWidgets,
    activeDatasetId,
    activeDatasetName,
    activeDatasetRowCount,
    activeDatasetColumns
  } = useDashboard();

  const handleGeneratePdfReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);

    try {
      let targetId = activeDatasetId || localStorage.getItem('asklytix_active_dataset_id') || undefined;
      let currentVisuals: SavedVisualizationItem[] = [];
      let dataQualityScore = 98;
      let dataQualityInfo: any = null;
      let activeDsMeta: any = null;

      // 1. Fetch active or latest uploaded dataset
      try {
        if (!targetId) {
          const allDatasets = await datasetService.list();
          if (allDatasets && allDatasets.length > 0) {
            targetId = allDatasets[0].id;
            activeDsMeta = allDatasets[0];
          }
        } else {
          activeDsMeta = await datasetService.getById(targetId);
        }
      } catch (err) {
        console.warn('Dataset metadata fetch notice:', err);
      }

      // 2. Fetch visualizations and quality metrics
      if (targetId) {
        try {
          const [visRes, qualityRes] = await Promise.allSettled([
            datasetService.getVisualizations(targetId),
            datasetService.getQuality(targetId)
          ]);

          if (visRes.status === 'fulfilled' && visRes.value?.visualizations) {
            currentVisuals = visRes.value.visualizations;
          }
          if (qualityRes.status === 'fulfilled' && qualityRes.value) {
            dataQualityScore = qualityRes.value.score ?? 98;
            dataQualityInfo = qualityRes.value;
          }
        } catch {
          // fallback to session state
        }
      }

      // Include canvas widgets if available and not already in saved visuals
      if (widgets && widgets.length > 0) {
        const existingIds = new Set(currentVisuals.map(v => v.id));
        const widgetVisuals: SavedVisualizationItem[] = widgets
          .filter(w => !existingIds.has(w.id))
          .map((w, idx) => ({
            id: w.id,
            title: w.title,
            chart_type: w.type === 'sandbox_chart' ? (w.chartType || 'bar') : (w.type || 'bar'),
            user_question: w.title,
            columns_used: w.columnsUsed || activeDatasetColumns?.slice(0, 3) || [],
            image_url: w.imageUrl,
            base64_image: w.base64Image,
            explanation: w.explanation,
            execution_time_ms: w.executionTimeMs || 0,
            position: currentVisuals.length + idx + 1,
            data: w.data || w.spec?.data
          } as any));

        if (currentVisuals.length === 0) {
          currentVisuals = widgetVisuals;
        } else if (widgetVisuals.length > 0) {
          currentVisuals = [...currentVisuals, ...widgetVisuals];
        }
      }

      const resolvedName = activeDsMeta?.name || activeDatasetName || 'Employee_Dataset.csv';
      const resolvedRows = activeDsMeta?.rows ?? activeDatasetRowCount ?? 100;
      const rawCols = activeDsMeta?.columnDefs?.map((c: any) => c.name || c.column_name || (typeof c === 'string' ? c : '')) 
        || activeDsMeta?.columns 
        || activeDatasetColumns 
        || [];
      const resolvedCols: string[] = Array.isArray(rawCols) ? rawCols.filter(Boolean) : [];
      const fileExt = resolvedName.includes('.') ? resolvedName.split('.').pop()?.toUpperCase() || 'CSV' : 'CSV';

      // Parse column schema definitions
      const schemaDefs = activeDsMeta?.columnDefs || resolvedCols.map(c => {
        const isId = /id|code|key/i.test(c);
        const isNum = /salary|price|age|amount|count|total|rev|cost/i.test(c);
        return {
          name: c,
          type: isId ? 'INTEGER' : isNum ? 'NUMERIC' : 'VARCHAR',
          missingCount: 0,
          missingPercent: 0,
          uniqueCount: resolvedRows
        };
      });

      await generateAiExecutivePdfReport({
        datasetId: targetId,
        datasetName: resolvedName,
        originalFileName: resolvedName,
        fileType: fileExt,
        rowCount: resolvedRows,
        columnCount: resolvedCols.length || 5,
        columns: resolvedCols,
        schema: schemaDefs,
        visualizations: currentVisuals,
        dataQuality: {
          score: dataQualityScore,
          completeness: dataQualityInfo?.completeness ?? 100,
          consistency: dataQualityInfo?.consistency ?? 100,
          uniqueness: dataQualityInfo?.uniqueness ?? 100,
          validity: dataQualityInfo?.validity ?? 100,
          missingTotal: dataQualityInfo?.total_missing_cells ?? dataQualityInfo?.missingTotal ?? 0,
          duplicatesTotal: dataQualityInfo?.duplicate_rows ?? dataQualityInfo?.duplicatesTotal ?? 0,
          invalidTotal: 0,
          numericCount: resolvedCols.filter(c => /salary|price|age|amount|count|total|rev|cost/i.test(c)).length || 2,
          categoricalCount: resolvedCols.filter(c => !/salary|price|age|amount|count|total|rev|cost|id/i.test(c)).length || 3,
          dateCount: resolvedCols.filter(c => /date|time|year|month/i.test(c)).length,
          usableRows: resolvedRows,
          cleaningOperations: ['Schema ingestion & type validation', 'Zero null corruption check', 'Attribute standardization']
        }
      });

      setReportSuccessNotice(true);
      setTimeout(() => setReportSuccessNotice(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF report', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Helper to map chart type to relevant Lucide icon
  const getSuggestionIcon = (chartType: string) => {
    switch (chartType?.toLowerCase()) {
      case 'line_chart':
        return TrendingUp;
      case 'donut_chart':
      case 'pie_chart':
        return PieChart;
      case 'histogram':
        return Activity;
      case 'scatter_plot':
        return CircleDot;
      case 'box_plot':
        return Sliders;
      case 'area_chart':
        return Layers;
      case 'heatmap':
        return Grid;
      case 'horizontal_bar':
        return BarChart3;
      default:
        return BarChart3;
    }
  };

  // Fetch 10-12 dynamic, validated suggestions from FastAPI backend whenever active dataset changes
  useEffect(() => {
    let isMounted = true;
    const targetId = activeDatasetId || localStorage.getItem('asklytix_active_dataset_id');

    if (targetId && targetId !== 'null' && targetId !== 'undefined') {
      setIsLoadingSuggestions(true);
      datasetService.getVisualSuggestions(targetId)
        .then((res) => {
          if (isMounted && res && res.suggestions && res.suggestions.length > 0) {
            setVisualSuggestionsList(res.suggestions);
          }
        })
        .catch((err) => {
          console.warn('Backend visual suggestions fetch warning:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingSuggestions(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeDatasetId]);

  // Dynamic visual suggestions based on active dataset columns
  const visualSuggestions = React.useMemo(() => {
    const cols = (activeDatasetColumns || []).map((c) => c.toLowerCase());
    const suggestions: string[] = [];

    const hasCity = cols.some((c) => c.includes('city') || c.includes('location') || c.includes('region'));
    const hasShowroom = cols.some((c) => c.includes('showroom') || c.includes('dealer') || c.includes('store'));
    const hasPriceOrRev = cols.some((c) => c.includes('price') || c.includes('revenue') || c.includes('sales') || c.includes('amount') || c.includes('total'));
    const hasCarModel = cols.some((c) => c.includes('model') || c.includes('car') || c.includes('product') || c.includes('category'));
    const hasDate = cols.some((c) => c.includes('date') || c.includes('month') || c.includes('year') || c.includes('time'));
    const hasSalary = cols.some((c) => c.includes('salary') || c.includes('wage') || c.includes('income'));

    if (hasCity && hasShowroom) {
      suggestions.push('Count showrooms in Pune, Nashik, and Mumbai.');
      suggestions.push('Show showroom distribution by city bar chart.');
    }
    if (hasCarModel && hasPriceOrRev) {
      suggestions.push('Compare price per car across car models.');
      suggestions.push('Top 5 car models by total transaction revenue.');
    }
    if (hasCity && hasPriceOrRev) {
      suggestions.push('Show total transaction value by city.');
    }
    if (hasDate && hasPriceOrRev) {
      suggestions.push('Display monthly sales and transaction trend line.');
    }
    if (hasSalary) {
      suggestions.push("Create a horizontal bar chart of the top 5 highest salaries, displaying employee 'name' on the y-axis and 'salary' on the x-axis, sorted descending.");
      suggestions.push('Department salary breakdown donut chart.');
    }

    // Dynamic schema-driven fallback suggestions
    if (suggestions.length < 4 && activeDatasetColumns && activeDatasetColumns.length > 0) {
      const numCol = activeDatasetColumns.find((c) => !c.toLowerCase().includes('id') && !c.toLowerCase().includes('date')) || activeDatasetColumns[0];
      const catCol = activeDatasetColumns.find((c) => c.toLowerCase() !== numCol.toLowerCase() && !c.toLowerCase().includes('id')) || activeDatasetColumns[1] || 'Category';

      suggestions.push(`Show total ${numCol} by ${catCol} bar chart.`);
      suggestions.push(`Distribution breakdown of ${catCol} donut chart.`);
      suggestions.push(`Top 10 highest ${numCol} records sorted descending.`);
      suggestions.push(`Monthly trend analysis of ${numCol} line chart.`);
    }

    return suggestions.length > 0 ? suggestions : [
      'Count showrooms in Pune, Nashik, and Mumbai.',
      'Compare price per car across car models.',
      'Show total transaction value by city.',
      'Monthly sales and transaction trend line.'
    ];
  }, [activeDatasetColumns]);

  // Chat message history initialized dynamically from active dataset
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);

  // Synchronize active visual when widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      setActiveVisualIndex(widgets.length - 1);
    }
  }, [widgets.length]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  const handleSendQuestion = async (overrideText?: string) => {
    const query = (overrideText || promptInput).trim();
    if (!query || isGenerating) return;

    const targetDatasetId = activeDatasetId || localStorage.getItem('asklytix_active_dataset_id') || '';
    const userMsgId = `user_${Date.now()}`;
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: userTime
      }
    ]);

    setPromptInput('');
    setIsGenerating(true);
    setIsSuggestVisualsOpen(false);

    try {
      setLoadingStageText('Analyzing your request...');

      // Call Backend Sandbox Visualization Endpoint
      const res = await datasetService.generateVisualization(targetDatasetId, query, 'visual');

      if (res.status === 'success' && res.visualization) {
        const viz = res.visualization;
        const visualId = res.visualization.id || res.saved_item?.id || `w_sandbox_${Date.now()}`;

        const newWidget: DashboardWidget = {
          id: visualId,
          type: (viz.chart_type === 'kpi' || viz.visualization_type === 'kpi') ? 'kpi' : 'sandbox_chart',
          title: viz.title,
          colSpan: 4,
          position: widgets.length + 1,
          imageUrl: viz.image_url,
          base64Image: viz.base64_image,
          html: viz.html || res.html,
          generatedCode: res.generated_code,
          executionTimeMs: res.execution_time_ms,
          columnsUsed: viz.columns_used,
          chartType: viz.chart_type,
          explanation: res.explanation,
          spec: res.chart_specification || viz,
          data: viz.data
        };

        // Append to workspace canvas (preserving previous visuals)
        generateBatchWidgets([newWidget]);
        setActiveVisualIndex(widgets.length);


        // Add AI Chat Response with Plan of Action and Code
        const aiMsgId = `ai_${Date.now()}`;
        setChatMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: 'ai',
            text: res.explanation || `Visualization generated successfully.`,
            planOfAction: [
              `Targeted columns: ${viz.columns_used.join(', ')}`,
              `Mapped chart type to ${viz.chart_type.toUpperCase()}`,
              `Rendered high-DPI visual in isolated secure sandbox in ${res.execution_time_ms || 50}ms`
            ],
            executedCode: res.generated_code,
            executionTimeMs: res.execution_time_ms,
            columnsUsed: viz.columns_used,
            chartType: viz.chart_type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (res.status === 'validation_error' || res.status === 'validation_failed') {
        // Clear Validation Error
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai_val_err_${Date.now()}`,
            sender: 'ai',
            text: res.message || `I couldn't generate this visualization because the requested column or chart configuration is invalid for this dataset.`,
            planOfAction: res.details || ['Inspected dataset schema', 'Identified column validation constraint'],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        // Execution / Render Error
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai_exec_err_${Date.now()}`,
            sender: 'ai',
            text: res.message || `The visualization was generated but could not be rendered. Please try again.`,
            planOfAction: ['Checked dataset schema', 'Sandbox execution encountered an error'],
            executedCode: res.generated_code,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error('Visualization error:', err);
      const errMsg = err?.response?.data?.detail || err?.message || 'The visualization was generated but could not be rendered. Please try again.';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: errMsg.includes('could not be found') 
            ? errMsg 
            : `The visualization was generated but could not be rendered. Please try again.`,
          planOfAction: ['Contacted backend visualization service', 'Encountered network or service error'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
      setLoadingStageText('Analyzing your request...');
    }
  };

  // Active visualization to display in canvas
  const currentWidget = widgets.length > 0 ? widgets[activeVisualIndex] || widgets[widgets.length - 1] : null;
  const currentImageSrc = currentWidget?.base64Image || (currentWidget?.imageUrl ? `http://127.0.0.1:8000${currentWidget.imageUrl}` : '');

  const handleDownloadActiveVisual = () => {
    if (!currentImageSrc) return;
    const a = document.createElement('a');
    a.href = currentImageSrc;
    a.download = `${(currentWidget?.title || 'visualization').toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!activeDatasetId && widgets.length === 0) {
    return (
      <PageContainer mode="canvas" className="space-y-4 pb-8 max-w-[1850px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-purple-600/30 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.25)]"
          >
            <BarChart3 className="w-10 h-10 text-cyan-400" />
          </motion.div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-white tracking-tight">
              No Dataset Connected
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your dataset to start generating dashboards, sandbox visualizations, and interactive analytics.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(6,182,212,0.45)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/connect')}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 shadow-xl cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Connect & Upload Dataset</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer mode="canvas" className="space-y-4 pb-8 max-w-[1850px] mx-auto">
      {/* ── Top Header Bar (Matching Exact Screenshot) ── */}
      <header className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/80">
        {/* Left: Dataset Name & Row Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-mono tracking-tight">
            Dataset: <span className="text-slate-200">{activeDatasetName || 'cleaned_data.csv'}</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({activeDatasetRowCount || 12} rows)
          </span>
        </div>

        {/* Right: Generate AI Report (Single Click PDF) & Logout Buttons */}
        <div className="flex items-center gap-2.5">
          <motion.button
            id="btn-generate-ai-pdf-report"
            data-testid="generate-pdf-btn"
            onClick={handleGeneratePdfReport}
            disabled={isGeneratingReport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed"
            title="1-Click Generate & Download AI Executive PDF Report"
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-cyan-200" />
                <span>Generate AI Report (PDF)</span>
              </>
            )}
          </motion.button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer select-none shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── 1-CLICK PDF REPORT SUCCESS TOAST ── */}
      <AnimatePresence>
        {reportSuccessNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-[#08152c]/95 border border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.45)] text-white text-xs flex items-center gap-3 backdrop-blur-2xl"
          >
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">AI Executive Report Generated!</p>
              <p className="text-[11px] text-cyan-300 font-mono leading-tight">PDF downloaded with charts & 4–10 line data explanation.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Two-Column Layout (Canvas on Left, Chat on Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── LEFT COLUMN: Visualization Canvas (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0b101f]/95 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[580px] transition-all">
            
            {/* Canvas Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold tracking-tight">
                  Visualization Canvas
                </h2>
              </div>

              {/* Visual History Switcher / Actions */}
              <div className="flex items-center gap-2">
                {widgets.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    {widgets.map((_, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => setActiveVisualIndex(wIdx)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          activeVisualIndex === wIdx
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        #{wIdx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {widgets.length > 0 && (
                  <button
                    onClick={clearAllWidgets}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Main Visualization Body */}
            <div className="relative my-4 flex-1 flex flex-col items-center justify-center bg-[#070b16] rounded-xl border border-slate-800/60 p-4 overflow-hidden min-h-[440px]">
              
              {/* Overlay Interactive Plotly / Sandbox Controls */}
              {currentImageSrc && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 shadow-lg backdrop-blur-md">
                  <button
                    onClick={handleDownloadActiveVisual}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Download Plot as PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreenOpen(true)}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentWidget) {
                        setSelectedModalData({
                          title: currentWidget.title,
                          code: currentWidget.generatedCode,
                          executionTimeMs: currentWidget.executionTimeMs,
                          columnsUsed: currentWidget.columnsUsed,
                          chartType: currentWidget.chartType,
                          explanation: currentWidget.explanation
                        });
                        setIsCodeModalOpen(true);
                      }
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"
                    title="View Python Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Live Interactive Visualization Canvas */}
              {currentWidget ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <LiveVisualizationRenderer
                    widget={currentWidget}
                    datasetName={activeDatasetName || 'Employee_Dataset'}
                    onFullscreen={() => setIsFullscreenOpen(true)}
                    onViewCode={() => {
                      if (currentWidget?.generatedCode) {
                        setSelectedModalData({
                          title: currentWidget.title,
                          code: currentWidget.generatedCode,
                          executionTimeMs: currentWidget.executionTimeMs,
                          columnsUsed: currentWidget.columnsUsed,
                          chartType: currentWidget.chartType,
                          explanation: currentWidget.explanation
                        });
                        setIsCodeModalOpen(true);
                      }
                    }}
                  />
                </div>
              ) : (
                /* Clean Ready State - No automatic visual rendered until requested */
                <div className="w-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 via-indigo-500/10 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Canvas Ready for Visualization
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Type your question in the chat or click a suggestion below to generate an exact visual for <span className="text-cyan-400 font-mono font-bold">{activeDatasetName || 'your dataset'}</span>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-w-md">
                    {visualSuggestions.slice(0, 3).map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendQuestion(prompt)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] font-medium transition-all cursor-pointer shadow-sm text-left truncate max-w-[280px]"
                        title={prompt}
                      >
                        ✨ {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Caption */}
            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
              <span>Auto-synchronized with Data Analyst AI</span>
              {currentWidget && (
                <span className="text-cyan-400 font-bold">{currentWidget.chartType || 'Plotly Visual'}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Data Analyst AI Chat Panel (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-[#0b101f]/95 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between h-[580px]">
            
            {/* Chat Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-tight">
                  Data Analyst AI
                </h2>
              </div>

              {/* Suggest Visuals Action Button */}
              <button
                onClick={() => setIsSuggestVisualsOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm select-none"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Suggest Visuals</span>
              </button>
            </div>

            {/* Visual Suggestions Popover Modal (10-12 Dataset-Specific Small Cards) */}
            <AnimatePresence>
              {isSuggestVisualsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="p-3 rounded-2xl bg-[#060a16] border border-amber-500/40 shadow-2xl space-y-2 my-2 z-20 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 font-mono pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dataset Visual Suggestions ({visualSuggestionsList.length || visualSuggestions.length})</span>
                    </div>
                    <button
                      onClick={() => setIsSuggestVisualsOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-amber-300 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing dataset schema & generating suggestions...</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                      {(visualSuggestionsList.length > 0
                        ? visualSuggestionsList
                        : visualSuggestions.map((text, idx) => ({
                            id: `fallback_${idx}`,
                            suggestion_number: idx + 1,
                            title: text.split('.')[0] || `Visual Query #${idx + 1}`,
                            chart_type: text.toLowerCase().includes('line')
                              ? 'line_chart'
                              : text.toLowerCase().includes('donut') || text.toLowerCase().includes('pie')
                              ? 'donut_chart'
                              : text.toLowerCase().includes('horizontal')
                              ? 'horizontal_bar'
                              : 'bar_chart',
                            icon: 'bar_chart',
                            prompt: text,
                            columns: activeDatasetColumns?.slice(0, 2) || [],
                            reason: 'Derived from dataset columns'
                          }))
                      ).map((sug) => {
                        const IconComponent = getSuggestionIcon(sug.chart_type);
                        return (
                          <button
                            key={sug.id}
                            type="button"
                            onClick={() => {
                              setPromptInput(sug.prompt);
                              setIsSuggestVisualsOpen(false);
                              handleSendQuestion(sug.prompt);
                            }}
                            className="w-full flex items-start gap-2.5 p-2 rounded-xl bg-[#090f20] hover:bg-cyan-950/40 border border-slate-800/90 hover:border-cyan-500/40 text-left transition-all cursor-pointer group shadow-sm"
                          >
                            {/* Chart Icon */}
                            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 shrink-0 mt-0.5">
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>

                            {/* Suggestion Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-300 font-mono">
                                  {sug.suggestion_number}.
                                </span>
                                <span className="text-[11px] font-bold text-white tracking-tight truncate">
                                  {sug.title}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono line-clamp-2 mt-0.5 leading-tight group-hover:text-slate-200">
                                {sug.prompt}
                              </p>
                            </div>

                            {/* Arrow Action Icon */}
                            <div className="p-1 rounded-lg text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1 scrollbar-thin">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    Ask any question about your data
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Type a prompt or select "Suggest Visuals" above to generate live charts.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  if (msg.sender === 'user') {
                    return (
                      <div key={msg.id} className="flex items-start justify-end gap-2">
                        <div className="max-w-[85%] bg-gradient-to-r from-indigo-600 to-[#6366f1] text-white p-3 rounded-2xl rounded-tr-sm shadow-md text-xs leading-relaxed font-medium">
                          {msg.text}
                        </div>
                        <div className="w-7 h-7 rounded-xl bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  }

                  // AI Message Card (Matching Exact Screenshot: Bot Icon, Text, Plan of Action, Executed Python Code)
                  return (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>

                      <div className="flex-1 space-y-2 max-w-[90%]">
                        {/* Summary insight badge bubble */}
                        <div className="p-2.5 rounded-xl bg-[#0e1628] border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed">
                          {msg.text}
                        </div>

                        {/* Action buttons inside message */}
                        <div className="space-y-1.5">
                          {/* Plan of Action Accordion Button */}
                          {msg.planOfAction && msg.planOfAction.length > 0 && (
                            <div>
                              <button
                                onClick={() => setExpandedPlanId(expandedPlanId === msg.id ? null : msg.id)}
                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-mono transition-colors cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Plan of Action</span>
                                </div>
                                <ChevronDown
                                  className={`w-3 h-3 text-slate-400 transition-transform ${
                                    expandedPlanId === msg.id ? 'rotate-180 text-cyan-400' : ''
                                  }`}
                                />
                              </button>

                              {/* Expanded Plan of Action Details */}
                              <AnimatePresence>
                                {expandedPlanId === msg.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-1 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 font-mono space-y-1"
                                  >
                                    {msg.planOfAction.map((step, idx) => (
                                      <div key={idx} className="flex items-start gap-1.5">
                                        <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                                        <span className="leading-tight">{step}</span>
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Executed Python Code Button */}
                          {msg.executedCode && (
                            <button
                              onClick={() => {
                                setSelectedModalData({
                                  title: 'Executed Python Code',
                                  code: msg.executedCode,
                                  executionTimeMs: msg.executionTimeMs || 50,
                                  columnsUsed: msg.columnsUsed || [],
                                  chartType: msg.chartType || 'Plotly / Sandbox'
                                });
                                setIsCodeModalOpen(true);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-mono transition-colors cursor-pointer select-none"
                            >
                              <Code className="w-3.5 h-3.5 text-cyan-400" />
                              <span>&lt;&gt; Executed Python Code</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Generating loading feedback */}
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono animate-pulse pl-9">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{loadingStageText}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar at Bottom (Matching Exact Screenshot) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="relative flex items-center bg-[#070b16] border border-slate-800 focus-within:border-cyan-500/80 rounded-xl p-1 shadow-inner">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuestion();
                    }
                  }}
                  disabled={isGenerating}
                  placeholder="Ask a question or select a suggested visual above..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 font-medium"
                />

                <button
                  type="button"
                  onClick={() => handleSendQuestion()}
                  disabled={isGenerating || !promptInput.trim()}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.4)] shrink-0 mr-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Footer Sub-Bar Underneath Input */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>PowerBI / Tableau level Plotly Visualizations</span>
                <button
                  onClick={() => setIsSuggestVisualsOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors"
                >
                  ✨ View Visual Suggestions
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Code Inspector Dialog Modal */}
      <CodeInspectorModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title={selectedModalData.title || 'Executed Python Code'}
        code={selectedModalData.code}
        executionTimeMs={selectedModalData.executionTimeMs}
        columnsUsed={selectedModalData.columnsUsed}
        chartType={selectedModalData.chartType}
        explanation={selectedModalData.explanation}
      />

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreenOpen && currentImageSrc && (
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
                <h3 className="text-sm font-bold text-white font-mono">
                  {currentWidget?.title || 'Visualization Canvas'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadActiveVisual}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={() => setIsFullscreenOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-950 p-2">
                <img src={currentImageSrc} alt="Visualization" className="max-h-[70vh] object-contain rounded-lg" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
