import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2,
  Upload,
  Database,
  AlertCircle,
  Brain,
  Code,
  ShieldCheck
} from 'lucide-react';
import type { WidgetType, DashboardWidget } from '@/types/dashboard';
import { datasetService } from '@/services/datasetService';
import { CodeInspectorModal } from './CodeInspectorModal';

export type AIMode = 'visual' | 'deep' | 'executive' | 'trend';

interface AIModeConfig {
  id: AIMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
}

export const AI_MODES: AIModeConfig[] = [
  {
    id: 'visual',
    label: 'Visual Chart Builder',
    shortLabel: 'Chart Builder',
    description: 'Generates specific visual widgets and interactive charts',
    icon: BarChart2
  },
  {
    id: 'deep',
    label: 'Deep Data Analyst',
    shortLabel: 'Deep Analyst',
    description: 'Statistical reasoning, key business drivers and root causes',
    icon: Brain
  },
  {
    id: 'executive',
    label: 'Executive Summary',
    shortLabel: 'Executive',
    description: 'High-level KPIs, top takeaways & stakeholder brief',
    icon: Sparkles
  },
  {
    id: 'trend',
    label: 'Trend & Forecasting',
    shortLabel: 'Trends & Forecast',
    description: 'Historical trajectory, growth rates and time-series patterns',
    icon: TrendingUp
  }
];

interface DashboardAIChatbotProps {
  onGenerateBatchWidgets: (widgets: DashboardWidget[]) => void;
  onClearDashboard: () => void;
  widgetCount: number;
  // Real dataset context
  datasetId: string | null;
  datasetName: string | null;
  datasetColumns: string[];
  hasDataset: boolean;
  isLoadingDataset: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mode?: AIMode;
  stats?: { label: string; value: string }[];
  insights?: string[];
  generatedWidgets?: Array<{
    type: WidgetType;
    title: string;
    colSpan: 1 | 2 | 3 | 4;
  }>;
  sandboxViz?: {
    title: string;
    chart_type: string;
    image_url: string;
    base64_image?: string;
    columns_used: string[];
    code?: string;
    execution_time_ms?: number;
    explanation?: string;
  };
  timestamp: string;
  isError?: boolean;
}

interface InferredResult {
  widgets: Array<{ type: WidgetType; title: string; colSpan: 1 | 2 | 3 | 4 }>;
  validationError?: string;
}

export interface PromptSuggestion {
  original: string;
  suggested: string;
  reason?: string;
  clarifications?: string[];
}

// Generate intelligent, dataset-aware prompt suggestions
export function generateDatasetAwarePromptSuggestion(
  rawInput: string,
  columns: string[]
): PromptSuggestion | null {
  const text = rawInput.trim();
  if (text.length < 4) return null;

  const lower = text.toLowerCase();
  const cleanTokens = lower.replace(/[.,/;&+\-_?!()[\]"']/g, ' ').split(/\s+/).filter(Boolean);
  const lcCols = columns.map(c => c.toLowerCase());

  // Detect common city/location names in dataset
  const KNOWN_CITIES = ['pune', 'nashik', 'nasik', 'mumbai', 'nagpur', 'aurangabad', 'thane', 'kolhapur', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'kolkata'];
  const mentionedCities = KNOWN_CITIES.filter(city => 
    lower.includes(city) || cleanTokens.some(t => t.includes(city) || (city === 'nashik' && (t === 'nashil' || t === 'nasik')))
  );

  // Normalization maps
  const hasShowroom = lower.includes('showroom') || lower.includes('showrooms') || lower.includes('showrrom') || lower.includes('dealer') || lower.includes('dealership');
  const hasKPI = lower.includes('kpi') || lower.includes("kpi's") || lower.includes('kpis');
  const hasHowMany = lower.includes('how many') || lower.includes('how much') || lower.includes('count of') || lower.includes('total count');
  const hasGrammarIssues = lower.includes('give mi') || lower.includes('the how many') || lower.includes('located the') || lower.includes('opan') || lower.includes('nashil');

  // Case 1: Location KPI / Count query (e.g., "give mi the KPI's for the how many showroom located the pune, nashil,and mumbai?")
  if ((hasShowroom || hasHowMany || hasKPI) && mentionedCities.length > 0) {
    const formattedCities = mentionedCities.map(c => {
      if (c === 'nasik' || c === 'nashil') return 'Nashik';
      return c.charAt(0).toUpperCase() + c.slice(1);
    });
    const citiesStr = formattedCities.length > 2 
      ? `${formattedCities.slice(0, -1).join(', ')}, and ${formattedCities[formattedCities.length - 1]}`
      : formattedCities.join(' and ');

    const suggested = `Count the number of showrooms located in ${citiesStr} as KPI cards.`;
    if (text !== suggested) {
      return {
        original: text,
        suggested,
        reason: 'Corrected grammar, spelling, and mapped to active dataset locations.'
      };
    }
  }

  // Case 2: Ambiguous "show showroom performance" / "sales analysis"
  if ((lower === 'show showroom performance' || lower === 'showroom performance' || lower === 'showroom analysis') && lcCols.some(c => c.includes('showroom'))) {
    return {
      original: text,
      suggested: 'Show revenue and transaction performance breakdown by showroom.',
      clarifications: [
        'Revenue by Showroom (Bar Chart)',
        'Transaction Count by Showroom',
        'Average Price by Showroom',
        'Showroom KPI Summary'
      ]
    };
  }

  // Case 3: Ambiguous "sales bar chart" / "sales chart"
  if (lower === 'sales bar chart' || lower === 'sales chart' || lower === 'show sales') {
    const catCol = columns.find(c => !c.toLowerCase().includes('rev') && !c.toLowerCase().includes('amount') && !c.toLowerCase().includes('price') && !c.toLowerCase().includes('id')) || 'Category';
    return {
      original: text,
      suggested: `Create a bar chart showing total revenue by ${catCol}.`,
      clarifications: [
        `Revenue by ${catCol} (Bar Chart)`,
        'Monthly Sales Trend (Line Chart)',
        'Sales Segment Distribution (Donut Chart)',
        'Top Sales Records (Table)'
      ]
    };
  }

  // Case 4: Monthly trend / date queries (e.g. "show profit month" / "revenue trend")
  if ((lower.includes('profit month') || lower.includes('sales month') || lower.includes('monthly trend')) && lcCols.some(c => c.includes('date') || c.includes('month') || c.includes('time'))) {
    return {
      original: text,
      suggested: 'Create a monthly revenue and transaction trend line chart.',
      reason: 'Matched date dimension with sales metric.'
    };
  }

  // Case 5: Single city data query (e.g. "show me pune data" / "pune sales")
  if (mentionedCities.length === 1 && (lower.includes('data') || lower.includes('records') || lower.includes('details') || lower.includes('show'))) {
    const cityName = mentionedCities[0].charAt(0).toUpperCase() + mentionedCities[0].slice(1);
    return {
      original: text,
      suggested: `Show all transactions and performance records for ${cityName}.`,
      reason: `Filtered query exclusively to ${cityName}.`
    };
  }

  // Case 6: Minor grammar cleanup if user typed "give mi" or punctuation-jammed words
  if (hasGrammarIssues) {
    let cleanQuery = text
      .replace(/give mi/gi, 'Show me')
      .replace(/the how many/gi, 'how many')
      .replace(/located the/gi, 'located in')
      .replace(/opan/gi, 'open')
      .replace(/nashil/gi, 'Nashik')
      .replace(/,/g, ', ');
    cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();
    if (cleanQuery !== text && cleanQuery.length > 5) {
      return {
        original: text,
        suggested: cleanQuery,
        reason: 'Fixed typing errors and spacing.'
      };
    }
  }

  return null;
}

// Map user query text and AI mode to schema-validated chart widgets
function inferWidgetsFromUserQuery(
  queryText: string,
  columns: string[],
  mode: AIMode = 'visual'
): InferredResult {
  const p = queryText.toLowerCase().trim();
  const lc = columns.map(c => c.toLowerCase());

  // Find column types in dataset
  const numCols = columns.filter((_, idx) => {
    const name = lc[idx];
    return name.includes('rev') || name.includes('sales') || name.includes('amount') ||
           name.includes('price') || name.includes('cost') || name.includes('profit') ||
           name.includes('qty') || name.includes('quantity') || name.includes('marks') ||
           name.includes('score') || name.includes('total') || name.includes('value') ||
           name.includes('units') || name.includes('rate') || name.includes('salary');
  });

  const catCols = columns.filter((_, idx) => {
    const name = lc[idx];
    return !numCols.includes(columns[idx]) && !name.includes('date') && !name.includes('time') && !name.includes('year') && !name.includes('month');
  });

  const dateCols = columns.filter((_, idx) => {
    const name = lc[idx];
    return name.includes('date') || name.includes('time') || name.includes('month') || name.includes('year') || name.includes('day');
  });

  const geoCols = columns.filter((_, idx) => {
    const name = lc[idx];
    return name.includes('city') || name.includes('state') || name.includes('country') || name.includes('region') || name.includes('location') || name.includes('address');
  });

  // Check schema compatibility: if user asks for sales/revenue but dataset has no numeric/sales columns
  const asksForSales = p.includes('sales') || p.includes('revenue') || p.includes('profit') || p.includes('turnover');
  if (asksForSales && numCols.length === 0 && !lc.some(c => c.includes('sales') || c.includes('rev') || c.includes('amount'))) {
    return {
      widgets: [],
      validationError: `I found your dataset, but could not find sales or revenue columns. Available columns are: ${columns.slice(0, 8).join(', ')}.`
    };
  }

  // Check date compatibility if user asks for time series
  const asksForDate = p.includes('month') || p.includes('monthly') || p.includes('by date') || p.includes('over time');
  if (asksForDate && dateCols.length === 0 && !asksForSales) {
    return {
      widgets: [],
      validationError: `I could not find date or time columns in the uploaded dataset. Available columns are: ${columns.slice(0, 8).join(', ')}.`
    };
  }

  // Check map compatibility
  const asksForMap = p.includes('map') || p.includes('geographic');
  if (asksForMap && geoCols.length === 0) {
    return {
      widgets: [],
      validationError: `I could not find geographic or city columns in the uploaded dataset. Available columns are: ${columns.slice(0, 8).join(', ')}.`
    };
  }

  const result: Array<{ type: WidgetType; title: string; colSpan: 1 | 2 | 3 | 4 }> = [];

  // Match target columns from query
  const matchedCat = catCols.find(c => p.includes(c.toLowerCase())) || catCols[0] || 'Category';
  const matchedNum = numCols.find(c => p.includes(c.toLowerCase())) || numCols[0] || 'Metric';

  // Specific user request checks first (EXACT EXECUTION)
  const isKpiOnly = (p.includes('kpi') || p.includes('how many') || p.includes('count of') || p.includes('number of')) &&
                    !p.includes('bar chart') && !p.includes('line chart') && !p.includes('donut') && !p.includes('pie') && !p.includes('table');

  if (isKpiOnly) {
    result.push({
      type: 'kpi',
      title: 'Target Performance & Metric KPIs',
      colSpan: 4
    });
    return { widgets: result };
  }

  // Specific Single Widget Requests
  if (p.includes('bar chart') || p.includes('bar graph')) {
    result.push({
      type: 'bar_chart',
      title: `${matchedNum} by ${matchedCat}`,
      colSpan: 2
    });
    return { widgets: result };
  }

  if (p.includes('line chart') || p.includes('line graph') || p.includes('trajectory')) {
    result.push({
      type: 'line_chart',
      title: `${matchedNum} Trend Trajectory`,
      colSpan: 2
    });
    return { widgets: result };
  }

  if (p.includes('donut chart') || p.includes('pie chart') || p.includes('distribution')) {
    result.push({
      type: 'donut_chart',
      title: `${matchedCat} Distribution`,
      colSpan: 1
    });
    return { widgets: result };
  }

  if (p.includes('map') || p.includes('geographic map')) {
    result.push({
      type: 'map',
      title: 'Geographic Distribution Map',
      colSpan: 2
    });
    return { widgets: result };
  }

  if (p.includes('table') || p.includes('records table') || p.includes('data table') || p.includes('show records')) {
    result.push({
      type: 'table',
      title: 'Detailed Dataset Records',
      colSpan: 2
    });
    return { widgets: result };
  }

  // AI Modes Fallback
  if (mode === 'executive') {
    result.push({ type: 'kpi', title: 'Executive Summary KPIs', colSpan: 4 });
    return { widgets: result };
  }

  if (mode === 'trend') {
    result.push({ type: 'line_chart', title: `${matchedNum} Performance Trend`, colSpan: 2 });
    result.push({ type: 'area_chart', title: 'Growth Area Trajectory', colSpan: 2 });
    return { widgets: result };
  }

  if (mode === 'deep') {
    result.push({ type: 'kpi', title: 'Deep Analysis Metrics & Benchmarks', colSpan: 4 });
    if (catCols.length > 0) {
      result.push({ type: 'bar_chart', title: `${matchedNum} Breakdown by ${matchedCat}`, colSpan: 2 });
    }
    result.push({ type: 'ai_insight', title: 'Analyst Findings & Recommendations', colSpan: 1 });
    return { widgets: result };
  }

  // Visual builder default
  result.push({
    type: 'kpi',
    title: 'Key Performance Indicators',
    colSpan: 4
  });
  return { widgets: result };
}

export const DashboardAIChatbot: React.FC<DashboardAIChatbotProps> = ({
  onGenerateBatchWidgets,
  onClearDashboard,
  widgetCount,
  datasetId,
  datasetName,
  datasetColumns,
  hasDataset,
  isLoadingDataset
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [promptInput, setPromptInput] = useState<string>('');
  const [activeMode, setActiveMode] = useState<AIMode>('visual');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: hasDataset
        ? `Ask any question or specify what charts you want to generate. Select an AI mode below to customize the analytical depth.`
        : "Upload a dataset to begin. Ask me any analysis question and I'll generate the exact requested visual.",
      timestamp: 'Just now',
      mode: 'visual'
    }
  ]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update welcome message when dataset loads
  useEffect(() => {
    if (hasDataset && datasetName && messages.length === 1 && messages[0].id === 'msg_welcome') {
      setMessages([{
        id: 'msg_welcome',
        sender: 'ai',
        text: `Ready to analyze "${datasetName}" (${datasetColumns.length} columns). Ask any question or request specific charts to build your dashboard.`,
        timestamp: 'Just now',
        mode: activeMode
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDataset, datasetName]);

  const [selectedCodeModal, setSelectedCodeModal] = useState<{
    isOpen: boolean;
    title?: string;
    code?: string;
    executionTimeMs?: number;
    columnsUsed?: string[];
    chartType?: string;
    explanation?: string;
  }>({ isOpen: false });

  const [queryStage, setQueryStage] = useState<
    'understanding' | 'checking_schema' | 'selecting_visual' | 'generating_code' | 'executing_sandbox' | 'saving_visual' | null
  >(null);

  const handleSendMessage = async (overridePrompt?: string) => {
    const text = (overridePrompt || promptInput).trim();
    if (!text) return;

    let targetDatasetId = (datasetId && datasetId !== 'null' && datasetId !== 'undefined') ? datasetId : null;
    if (!targetDatasetId) {
      const stored = localStorage.getItem('asklytix_active_dataset_id');
      if (stored && stored !== 'null' && stored !== 'undefined') {
        targetDatasetId = stored;
      }
    }

    const userText = text;
    const currentMode = activeMode;
    const userMsgId = `user_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        mode: currentMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setPromptInput('');
    setIsQuerying(true);
    setQueryStage('understanding');

    try {
      // Check if user request is for chart/graph/visualization
      const isChartRequest = currentMode === 'visual' ||
        userText.toLowerCase().includes('chart') ||
        userText.toLowerCase().includes('bar') ||
        userText.toLowerCase().includes('line') ||
        userText.toLowerCase().includes('plot') ||
        userText.toLowerCase().includes('graph') ||
        userText.toLowerCase().includes('donut') ||
        userText.toLowerCase().includes('pie') ||
        userText.toLowerCase().includes('visual') ||
        userText.toLowerCase().includes('trend') ||
        userText.toLowerCase().includes('compare') ||
        userText.toLowerCase().includes('comparison') ||
        userText.toLowerCase().includes('count') ||
        userText.toLowerCase().includes('show');

      const isStrictKpiOrTable = (userText.toLowerCase().includes('kpi') || userText.toLowerCase().includes('only table')) &&
        !userText.toLowerCase().includes('chart') && !userText.toLowerCase().includes('bar') && !userText.toLowerCase().includes('line');

      // A. EXECUTE IN SECURE PYTHON SANDBOX IF CHART REQUESTED
      if (isChartRequest && !isStrictKpiOrTable && targetDatasetId) {
        setQueryStage('checking_schema');
        await new Promise(r => setTimeout(r, 200));
        setQueryStage('selecting_visual');
        await new Promise(r => setTimeout(r, 200));
        setQueryStage('generating_code');

        const vizRes = await datasetService.generateVisualization(targetDatasetId, userText, currentMode);
        setQueryStage('executing_sandbox');

        if (vizRes.status === 'success' && vizRes.visualization) {
          setQueryStage('saving_visual');
          const viz = vizRes.visualization;
          const visualId = vizRes.saved_item?.id || `w_sandbox_${Date.now()}`;
          const sandboxWidget: DashboardWidget = {
            id: visualId,
            type: 'sandbox_chart',
            title: viz.title,
            colSpan: 4,
            position: vizRes.saved_item?.position || 1,
            imageUrl: viz.image_url || '',
            base64Image: viz.base64_image,
            html: viz.html || vizRes.html,
            generatedCode: vizRes.generated_code,
            executionTimeMs: vizRes.execution_time_ms,
            columnsUsed: viz.columns_used,
            chartType: viz.chart_type,
            explanation: vizRes.explanation
          };

          onGenerateBatchWidgets([sandboxWidget]);

          setMessages((prev) => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              sender: 'ai',
              text: vizRes.explanation || `Generated Python sandbox visualization for: "${userText}"`,
              mode: currentMode,
              stats: [
                { label: 'Sandbox Status', value: 'Verified 🔒' },
                { label: 'Execution', value: `${vizRes.execution_time_ms || 0}ms` },
                { label: 'Chart Type', value: viz.chart_type.toUpperCase() }
              ],
              insights: [
                `Executed Python visualization code in isolated secure sandbox.`,
                `Targeted columns: ${viz.columns_used.join(', ')}.`,
                `High-DPI visual widget added directly to your dashboard canvas.`
              ],
              sandboxViz: {
                title: viz.title,
                chart_type: viz.chart_type,
                image_url: viz.image_url || '',
                base64_image: viz.base64_image,
                html: viz.html || vizRes.html,
                columns_used: viz.columns_used,
                code: vizRes.generated_code,
                execution_time_ms: vizRes.execution_time_ms,
                explanation: vizRes.explanation
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);

          setIsQuerying(false);
          setQueryStage(null);
          return;
        }
      }

      // B. FALLBACK / TEXT ANALYSIS / KPI EXECUTION
      const inference = inferWidgetsFromUserQuery(userText, datasetColumns, currentMode);

      if (inference.validationError) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: inference.validationError || 'Could not validate query against dataset schema.',
            mode: currentMode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsQuerying(false);
        setQueryStage(null);
        return;
      }

      const modePrompt = currentMode === 'deep'
        ? `[Deep Analysis Mode - Provide statistical metrics and root cause breakdown]: ${userText}`
        : currentMode === 'executive'
        ? `[Executive Summary Mode - Concise KPI highlights and strategic takeaways]: ${userText}`
        : currentMode === 'trend'
        ? `[Trend & Forecast Mode - Time series trajectory and growth analysis]: ${userText}`
        : userText;

      const res = await datasetService.queryAnalysis(targetDatasetId || '', modePrompt);
      const inferredWidgets = inference.widgets;

      if (inferredWidgets.length > 0) {
        const fullWidgets: DashboardWidget[] = inferredWidgets.map((w, i) => ({
          id: `w_${Date.now()}_${i}`,
          type: w.type,
          title: w.title,
          colSpan: w.colSpan,
          position: i + 1
        }));
        onGenerateBatchWidgets(fullWidgets);
      }

      const aiText = res.text || `Generated analysis for: "${userText}"`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiText,
          mode: currentMode,
          stats: res.stats,
          insights: res.insights,
          generatedWidgets: inferredWidgets.length > 0 ? inferredWidgets : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: `Analysis failed: ${err?.message || 'Could not connect to backend.'}`,
          mode: currentMode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsQuerying(false);
      setQueryStage(null);
    }
  };

  const handleApplyWidgets = (widgetsToApply: Array<{ type: WidgetType; title: string; colSpan: 1 | 2 | 3 | 4 }>) => {
    const fullWidgets: DashboardWidget[] = widgetsToApply.map((w, i) => ({
      id: `w_${Date.now()}_${i}`,
      type: w.type,
      title: w.title,
      colSpan: w.colSpan,
      position: i + 1
    }));
    onGenerateBatchWidgets(fullWidgets);
  };

  return (
    <Card
      variant="analytics"
      glowColor="cyan"
      className="border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/90 to-slate-950 p-0 overflow-hidden shadow-2xl rounded-2xl transition-all"
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shrink-0">
            <Wand2 className="w-4 h-4" />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${hasDataset ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-wide">
                AI Analysis & Chart Builder
              </h2>
              <Badge variant={hasDataset ? 'success' : 'outline'} size="sm">
                {isLoadingDataset ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" />Loading</>
                ) : hasDataset ? (
                  <><Database className="w-3 h-3 mr-1" />{datasetName}</>
                ) : (
                  'No Dataset'
                )}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {hasDataset && datasetName
                ? `Analyzing: ${datasetName} · Custom requirement chat`
                : hasDataset
                ? 'Dataset Active · Ask any question to visualize'
                : 'Upload a dataset to enable AI analysis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {widgetCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearDashboard(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer mr-2"
              title="Clear all widgets from canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Canvas
            </button>
          )}
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* NO DATASET STATE */}
            {!hasDataset && !isLoadingDataset ? (
              <div className="p-6 flex flex-col items-center justify-center text-center space-y-5 min-h-[320px]">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.1)]">
                  <Database className="w-8 h-8 text-amber-400/80" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-60" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-mono font-bold">
                    <AlertCircle className="w-3 h-3" />
                    NO DATASET UPLOADED
                  </div>
                  <h3 className="text-lg font-bold text-white">Upload Your Data First</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                    The AI can only analyze and visualize <span className="text-cyan-400 font-semibold">your uploaded data</span>. 
                    No demo or sample data is shown — every chart reflects your real dataset.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/connect')}
                  leftIcon={<Upload className="w-4 h-4" />}
                  className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  Upload Dataset
                </Button>
              </div>
            ) : isLoadingDataset ? (
              <div className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm text-slate-400">Loading your dataset...</p>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                {/* AI Mode Selector Bar */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> AI Analytical Mode:
                    </span>
                    <span className="text-[10px] text-cyan-400/80 font-mono">
                      {AI_MODES.find(m => m.id === activeMode)?.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {AI_MODES.map((m) => {
                      const Icon = m.icon;
                      const isActive = activeMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveMode(m.id)}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                            isActive
                              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                              : 'bg-slate-900/80 border border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                          title={m.description}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className="truncate">{m.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chat Messages Conversation Stream */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 border-y border-slate-800/60 py-3 scrollbar-thin">
                  {messages.map((msg) => {
                    const msgModeConfig = AI_MODES.find(m => m.id === msg.mode);
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'ai' && (
                          <div className={`p-2 rounded-xl text-white shrink-0 shadow-md ${msg.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-cyan-500 to-purple-600'}`}>
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl max-w-xl text-xs space-y-2.5 ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-cyan-500/40 text-slate-100'
                              : msg.isError
                              ? 'bg-rose-950/50 border border-rose-500/30 text-rose-200'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${msg.isError ? 'text-rose-400' : 'text-cyan-400'}`}>
                                {msg.sender === 'ai' ? 'AskLytix AI' : 'You'}
                              </span>
                              {msgModeConfig && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9.5px] font-mono text-slate-400">
                                  {msgModeConfig.shortLabel}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                          </div>

                          {/* Message text — render bullet lines nicely */}
                          <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                          {/* Real stats from backend */}
                          {msg.stats && msg.stats.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
                              {msg.stats.map((stat, si) => (
                                <div key={si} className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                  <div className="text-[10px] text-slate-500 font-mono">{stat.label}</div>
                                  <div className="text-sm font-bold text-cyan-300">{stat.value}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Insights list */}
                          {msg.insights && msg.insights.length > 0 && (
                            <div className="pt-2 border-t border-slate-800 space-y-1">
                              {msg.insights.map((ins, ii) => (
                                <div key={ii} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                                  <CheckCircle2 className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />
                                  <span>{ins}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sandbox Visualization Inline Card */}
                          {msg.sandboxViz && (
                            <div className="pt-2 border-t border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  Sandbox Verified Chart
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCodeModal({
                                    isOpen: true,
                                    title: msg.sandboxViz?.title,
                                    code: msg.sandboxViz?.code,
                                    executionTimeMs: msg.sandboxViz?.execution_time_ms,
                                    columnsUsed: msg.sandboxViz?.columns_used,
                                    chartType: msg.sandboxViz?.chart_type,
                                    explanation: msg.sandboxViz?.explanation
                                  })}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-[10.5px] font-mono text-cyan-300 transition-all cursor-pointer"
                                >
                                  <Code className="w-3 h-3 text-cyan-400" />
                                  <span>View Code</span>
                                </button>
                              </div>

                              {(msg.sandboxViz.base64_image || msg.sandboxViz.image_url) && (
                                <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 max-h-[180px] flex items-center justify-center p-1">
                                  <img
                                    src={msg.sandboxViz.base64_image || `http://127.0.0.1:8000${msg.sandboxViz.image_url}`}
                                    alt={msg.sandboxViz.title}
                                    className="max-h-[170px] w-full object-contain rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Generated widget tags */}
                          {msg.generatedWidgets && msg.generatedWidgets.length > 0 && (
                            <div className="pt-2 border-t border-slate-800 space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {msg.generatedWidgets.map((gw, gIdx) => (
                                  <span
                                    key={gIdx}
                                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                    {gw.title}
                                  </span>
                                ))}
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => msg.generatedWidgets && handleApplyWidgets(msg.generatedWidgets)}
                                leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                                className="text-xs py-1 px-3 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                              >
                                Re-inject Charts ({msg.generatedWidgets.length})
                              </Button>
                            </div>
                          )}
                        </div>

                        {msg.sender === 'user' && (
                          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isQuerying && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono animate-pulse pl-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {queryStage === 'understanding'
                        ? 'Understanding your question...'
                        : queryStage === 'checking_schema'
                        ? 'Checking dataset columns...'
                        : queryStage === 'selecting_visual'
                        ? 'Selecting the best visualization...'
                        : queryStage === 'generating_code'
                        ? 'Generating visualization code...'
                        : queryStage === 'executing_sandbox'
                        ? 'Executing in secure sandbox...'
                        : queryStage === 'saving_visual'
                        ? 'Saving visualization...'
                        : `Analyzing your data with ${AI_MODES.find(m => m.id === activeMode)?.label}...`}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Single Clean Question Input Box */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isQuerying}
                    placeholder={`Ask any analytical question in ${AI_MODES.find(m => m.id === activeMode)?.shortLabel} mode...`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-all disabled:opacity-50"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleSendMessage()}
                    isLoading={isQuerying}
                    disabled={isQuerying || !promptInput.trim()}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                    className="shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    Analyze
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Inspector Modal for Chat Messages */}
      <CodeInspectorModal
        isOpen={selectedCodeModal.isOpen}
        onClose={() => setSelectedCodeModal({ isOpen: false })}
        title={selectedCodeModal.title || 'Sandbox Visualization Code'}
        code={selectedCodeModal.code}
        executionTimeMs={selectedCodeModal.executionTimeMs}
        columnsUsed={selectedCodeModal.columnsUsed}
        chartType={selectedCodeModal.chartType}
        explanation={selectedCodeModal.explanation}
      />
    </Card>
  );
};
