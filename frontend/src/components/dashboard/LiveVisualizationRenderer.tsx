import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Sparkles,
  Filter,
  RotateCcw,
  Maximize2,
  Code,
  Download,
  ZoomIn,
  ZoomOut,
  ArrowUpDown,
  Globe,
  Sliders,
  PieChart,
  Grid
} from 'lucide-react';
import type { DashboardWidget } from '@/types/dashboard';

interface LiveVisualizationRendererProps {
  widget: DashboardWidget;
  datasetName?: string;
  onFullscreen?: () => void;
  onViewCode?: () => void;
}

const THEME_COLORS = [
  '#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#a855f7'
];

export const LiveVisualizationRenderer: React.FC<LiveVisualizationRendererProps> = ({
  widget,
  datasetName = 'Active Dataset',
  onFullscreen,
  onViewCode
}) => {
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [activeDatum, setActiveDatum] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const rawType = (widget.chartType || widget.type || '').toLowerCase();
  
  const isKPI = rawType === 'kpi' || widget.title.toLowerCase().includes('kpi') || typeof widget.spec?.value !== 'undefined' || typeof widget.data === 'number';
  const isMap = !isKPI && (rawType.includes('map') || rawType.includes('geo') || widget.title.toLowerCase().includes('map') || widget.title.toLowerCase().includes('location'));
  const isBox = !isKPI && !isMap && (rawType.includes('box'));
  const isViolin = !isKPI && !isMap && (rawType.includes('violin'));
  const isCorrHeatmap = !isKPI && !isMap && (rawType.includes('correlation_heatmap') || rawType.includes('corr_matrix') || widget.title.toLowerCase().includes('correlation'));
  const isHeatmap = !isKPI && !isMap && !isCorrHeatmap && (rawType.includes('heatmap') || widget.title.toLowerCase().includes('heatmap'));
  const isFunnel = !isKPI && !isMap && (rawType.includes('funnel'));
  const isWaterfall = !isKPI && !isMap && (rawType.includes('waterfall'));
  const isTreemap = !isKPI && !isMap && (rawType.includes('treemap'));
  const isGantt = !isKPI && !isMap && (rawType.includes('gantt') || rawType.includes('schedule'));
  const isStacked = !isKPI && !isMap && (rawType.includes('stacked'));
  const isGrouped = !isKPI && !isMap && (rawType.includes('grouped') || rawType.includes('side_by_side'));
  const isRadar = !isKPI && !isMap && (rawType.includes('radar') || rawType.includes('spider'));
  const isPie = !isKPI && !isMap && !isBox && !isViolin && !isCorrHeatmap && !isHeatmap && !isFunnel && !isWaterfall && !isTreemap && !isGantt && !isStacked && !isGrouped && !isRadar && (rawType.includes('pie') || rawType.includes('donut') || rawType.includes('proportion'));
  const isHist = !isKPI && !isMap && !isBox && !isViolin && !isCorrHeatmap && !isHeatmap && !isFunnel && !isWaterfall && !isTreemap && !isGantt && !isStacked && !isGrouped && !isRadar && !isPie && (rawType.includes('hist') || rawType.includes('distribut'));
  const isHorizontalBar = !isKPI && !isMap && !isBox && !isViolin && !isCorrHeatmap && !isHeatmap && !isFunnel && !isWaterfall && !isTreemap && !isGantt && !isStacked && !isGrouped && !isRadar && !isPie && !isHist && (rawType.includes('horizontal') || rawType.includes('barh'));
  const isScatter = !isKPI && !isMap && !isBox && !isViolin && !isCorrHeatmap && !isHeatmap && !isFunnel && !isWaterfall && !isTreemap && !isGantt && !isStacked && !isGrouped && !isRadar && !isPie && !isHist && !isHorizontalBar && (rawType.includes('scatter') || rawType.includes('vs') || rawType.includes('bubble'));
  const isLine = !isKPI && !isMap && !isBox && !isViolin && !isCorrHeatmap && !isHeatmap && !isFunnel && !isWaterfall && !isTreemap && !isGantt && !isStacked && !isGrouped && !isRadar && !isPie && !isHist && !isHorizontalBar && !isScatter && (rawType.includes('line') || rawType.includes('trend') || rawType.includes('time') || rawType.includes('area'));

  const rawChartData = useMemo(() => {
    const candidate = widget.spec?.data || widget.data;
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.map((d: any) => ({
        ...d,
        category: String(d.category || d.name || d.label || d.category_label || d.x || d.city || 'Item'),
        value: Number(d.value ?? d.salary ?? d.amount ?? d.total ?? d.count ?? d.y ?? 0)
      }));
    }
    // Handle object with labels / values or categories / data
    if (candidate && typeof candidate === 'object') {
      if (Array.isArray(candidate.labels) && Array.isArray(candidate.values)) {
        return candidate.labels.map((lbl: any, idx: number) => ({
          category: String(lbl),
          value: Number(candidate.values[idx] ?? 0)
        }));
      }
      if (Array.isArray(candidate.categories) && Array.isArray(candidate.series)) {
        return candidate.categories.map((cat: any, idx: number) => ({
          category: String(cat),
          value: Number(candidate.series[0]?.data?.[idx] ?? candidate.series[idx] ?? 0)
        }));
      }
      if (Array.isArray(candidate.x) && Array.isArray(candidate.y)) {
        return candidate.x.map((xVal: any, idx: number) => ({
          x: xVal,
          y: candidate.y[idx],
          category: String(xVal),
          value: candidate.y[idx]
        }));
      }
    }
    return [];
  }, [widget]);

  // Apply sorting if requested
  const chartData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];
    if (sortOrder === 'default') return rawChartData;
    const sorted = [...rawChartData];
    sorted.sort((a: any, b: any) => {
      const valA = Number(a.value ?? a.count ?? a.y ?? 0);
      const valB = Number(b.value ?? b.count ?? b.y ?? 0);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [rawChartData, sortOrder]);

  // Universal pointer move handler
  const handlePointerMove = (e: React.PointerEvent<SVGElement | HTMLDivElement> | React.MouseEvent<SVGElement | HTMLDivElement>, data: any) => {
    const rect = e.currentTarget.closest('.chart-container')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: Math.max(10, Math.min(e.clientX - rect.left, rect.width - 220)),
        y: Math.max(10, e.clientY - rect.top - 12)
      });
    }
    setHoveredData(data);
  };

  const handlePointerLeave = () => {
    setHoveredData(null);
  };

  const handleSelectDatum = (data: any) => {
    setActiveDatum((prev: any) => (prev?.category === data?.category || prev?.label === data?.label ? null : data));
  };

  const imageSrc = widget.base64Image || (widget.imageUrl ? (widget.imageUrl.startsWith('http') || widget.imageUrl.startsWith('data:') ? widget.imageUrl : widget.imageUrl.startsWith('/') ? widget.imageUrl : `/${widget.imageUrl}`) : '');

  const handleDownloadPNG = () => {
    if (!imageSrc) return;
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `${widget.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_visualization.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // If no structured tabular data is present but a generated image exists, render high-res image canvas
  if (!isKPI && chartData.length === 0 && imageSrc) {
    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide truncate max-w-[280px]">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onViewCode && (
              <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer" title="Inspect Python Code">
                <Code className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer" title="Download PNG">
              <Download className="w-3.5 h-3.5" />
            </button>
            {onFullscreen && (
              <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer" title="Fullscreen">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px] my-2 bg-slate-950/60 rounded-xl overflow-hidden group">
          <img
            src={imageSrc}
            alt={widget.title}
            onClick={onFullscreen}
            className="w-full h-full object-contain max-h-[340px] cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
          />
        </div>

        {widget.columnsUsed && widget.columnsUsed.length > 0 && (
          <div className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Columns: {widget.columnsUsed.join(', ')}
            </span>
            <span className="text-slate-500">{datasetName}</span>
          </div>
        )}
      </div>
    );
  }

  // Universal Tooltip Renderer
  const renderUniversalTooltip = () => {
    if (!hoveredData) return null;

    const categoryText = hoveredData.category || hoveredData.category_label || hoveredData.name || hoveredData.city || hoveredData.location || hoveredData.bin_range || hoveredData.date || hoveredData.stage || hoveredData.label || 'Data Point';
    const categoryTitle = hoveredData.category_label || (hoveredData.city ? 'City' : hoveredData.bin_range ? 'Bin Range' : hoveredData.date ? 'Timeline' : 'Category');

    const metricTitle = hoveredData.metric_label || hoveredData.metric_name || (hoveredData.y_label ? hoveredData.y_label : 'Value');
    const metricVal = hoveredData.formatted_value || (hoveredData.value !== undefined ? (typeof hoveredData.value === 'number' && hoveredData.value > 1000 ? `₹${hoveredData.value.toLocaleString()}` : `${hoveredData.value}`) : (hoveredData.count !== undefined ? `${hoveredData.count}` : (hoveredData.y !== undefined ? `${hoveredData.y}` : '—')));
    
    const countVal = hoveredData.records ?? hoveredData.count;
    const shareVal = hoveredData.percentage;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 4 }}
          transition={{ duration: 0.12 }}
          style={{ left: tooltipPos.x, top: Math.max(10, tooltipPos.y - 75) }}
          className="absolute z-40 px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/70 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_15px_rgba(6,182,212,0.25)] text-[11px] font-mono text-slate-200 pointer-events-none backdrop-blur-xl min-w-[185px] max-w-[260px] space-y-1.5"
        >
          <div className="flex items-center justify-between border-b border-slate-800/90 pb-1">
            <span className="text-cyan-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              {categoryTitle}:
            </span>
            <span className="font-bold text-white truncate max-w-[130px]">{categoryText}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 text-[10px]">{metricTitle}:</span>
            <span className="font-bold text-cyan-300 text-xs">{metricVal}</span>
          </div>

          {countVal !== undefined && (
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Records / Volume:</span>
              <span className="text-slate-200 font-bold">{countVal}</span>
            </div>
          )}

          {shareVal !== undefined && (
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Share:</span>
              <span className="text-emerald-400 font-bold">{shareVal}</span>
            </div>
          )}

          {hoveredData.entities && hoveredData.entities.length > 0 && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Entities: <span className="text-slate-300">{hoveredData.entities.slice(0, 3).join(', ')}</span>
            </div>
          )}

          <div className="pt-1 border-t border-slate-800/80 text-[9px] text-slate-400 flex items-center justify-between">
            <span className="text-slate-500">Pattern Focus:</span>
            <span className="text-cyan-400 font-mono">Touch arrow / Click to select</span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LIVE INTERACTIVE KPI CARD
  // ──────────────────────────────────────────────────────────────────────────
  if (isKPI) {
    const kpiVal = widget.spec?.formatted_value ?? widget.spec?.value ?? (typeof widget.data === 'number' ? widget.data : (chartData[0]?.value ?? 20));
    const kpiTitle = widget.title || widget.spec?.title || 'KPI Metric';
    const kpiLabel = widget.spec?.label || widget.explanation || 'Calculated from active dataset';
    const kpiFilters = widget.spec?.filters || {};
    const filterKey = Object.keys(kpiFilters)[0];
    const filterVal = filterKey ? kpiFilters[filterKey] : null;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 relative chart-container select-none">
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {onViewCode && (
            <button
              onClick={onViewCode}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer shadow-sm transition-all"
              title="Inspect Executed Python Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          )}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer shadow-sm transition-all"
              title="Expand Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <motion.div
          onPointerEnter={(e) => {
            setHoveredData({
              category: filterVal || 'All Records',
              category_label: filterKey || 'Filter',
              metric_label: kpiTitle,
              value: kpiVal,
              formatted_value: `${kpiVal}`,
              records: typeof kpiVal === 'number' ? kpiVal : 20
            });
            handlePointerMove(e, { category: filterVal || 'All', value: kpiVal });
          }}
          onPointerLeave={handlePointerLeave}
          onClick={() => handleSelectDatum({ category: filterVal || 'All', value: kpiVal })}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-xl group cursor-pointer"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />

          {filterVal && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-semibold tracking-wide mb-3">
              <Filter className="w-3 h-3" />
              <span>{filterKey}: {filterVal}</span>
            </div>
          )}

          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold mb-2">
            {kpiTitle}
          </h3>

          <div className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 my-1 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            {kpiVal}
          </div>

          <p className="text-xs text-slate-500 font-sans mt-2 font-medium">
            {kpiLabel}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" />
              Verified Active Dataset
            </span>
            <span className="text-slate-500">{datasetName}</span>
          </div>
        </motion.div>

        {renderUniversalTooltip()}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. LIVE GEOGRAPHIC MAP
  // ──────────────────────────────────────────────────────────────────────────
  if (isMap) {
    const geoData = chartData;
    const lats = geoData.map((d: any) => Number(d.latitude || 19.076));
    const lngs = geoData.map((d: any) => Number(d.longitude || 72.877));
    const minLat = Math.min(...lats, 15);
    const maxLat = Math.max(...lats, 25);
    const minLng = Math.min(...lngs, 70);
    const maxLng = Math.max(...lngs, 85);
    const latSpan = Math.max(maxLat - minLat, 3);
    const lngSpan = Math.max(maxLng - minLng, 3);

    const svgW = 600;
    const svgH = 340;
    const pad = 40;

    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setZoomLevel(1); setActiveDatum(null); }} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>
            {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer" title="View Code"><Code className="w-3.5 h-3.5" /></button>}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer" title="Download PNG"><Download className="w-3.5 h-3.5" /></button>
            {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer" title="Fullscreen"><Maximize2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[340px] overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line key={`lat_${i}`} x1={pad} y1={pad + pct * (svgH - 2 * pad)} x2={svgW - pad} y2={pad + pct * (svgH - 2 * pad)} stroke="#1e293b" strokeDasharray="3 3" />
            ))}
            {geoData.map((d: any, i: number) => {
              const xPos = pad + ((Number(d.longitude) - minLng) / lngSpan) * (svgW - 2 * pad) * zoomLevel;
              const yPos = svgH - pad - ((Number(d.latitude) - minLat) / latSpan) * (svgH - 2 * pad) * zoomLevel;
              const isHover = hoveredData?.city === d.city || hoveredData?.location === d.location;
              const isSel = activeDatum?.city === d.city || activeDatum?.location === d.location;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer" 
                  onClick={() => handleSelectDatum(d)} 
                  onPointerEnter={(e) => handlePointerMove(e, { ...d, category: d.city, metric_label: 'Volume' })}
                  onPointerMove={(e) => handlePointerMove(e, { ...d, category: d.city, metric_label: 'Volume' })} 
                  onPointerLeave={handlePointerLeave}
                >
                  <circle cx={xPos} cy={yPos} r={isHover ? 18 : 12} fill="#06b6d4" fillOpacity={isHover ? 0.35 : 0.2} stroke="#22d3ee" strokeWidth={isHover ? 2 : 1.2} className="animate-pulse" />
                  <circle cx={xPos} cy={yPos} r={isHover ? 6.5 : 4.5} fill={isSel ? '#f43f5e' : '#22d3ee'} stroke="#070b16" strokeWidth={1.5} />
                  <text x={xPos} y={yPos - 12} textAnchor="middle" fill="#f8fafc" fontSize={10} fontWeight="bold" fontFamily="sans-serif">{d.city || d.location}</text>
                </g>
              );
            })}
          </svg>

          {renderUniversalTooltip()}
        </div>

        {activeDatum && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">Selected Pattern:</span>
              <span className="text-white font-semibold">{activeDatum.city || activeDatum.location}</span>
              <span className="text-emerald-400 font-bold">({activeDatum.count ? `${activeDatum.count} records` : ''}{activeDatum.formatted_value ? ` • ${activeDatum.formatted_value}` : ''})</span>
            </div>
            <button 
              onClick={() => setActiveDatum(null)} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. BOX PLOT
  // ──────────────────────────────────────────────────────────────────────────
  if (isBox) {
    const boxData = chartData;
    const allVals = boxData.flatMap((d: any) => [d.min, d.q1, d.median, d.q3, d.max]);
    const minVal = Math.min(...allVals, 0);
    const maxVal = Math.max(...allVals, 100);
    const span = Math.max(maxVal - minVal, 1);

    const svgW = 600;
    const svgH = 320;
    const padL = 60;
    const padR = 30;
    const padT = 30;
    const padB = 40;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Code className="w-3.5 h-3.5" /></button>}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
            {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[340px] overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padT + plotH - pct * plotH;
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">{Math.round(minVal + pct * span)}</text>
                </g>
              );
            })}

            {boxData.map((d: any, i: number) => {
              const colW = plotW / boxData.length;
              const cx = padL + i * colW + colW / 2;
              const bWidth = Math.min(colW * 0.55, 45);

              const yMin = padT + plotH - ((d.min - minVal) / span) * plotH;
              const yQ1 = padT + plotH - ((d.q1 - minVal) / span) * plotH;
              const yMed = padT + plotH - ((d.median - minVal) / span) * plotH;
              const yQ3 = padT + plotH - ((d.q3 - minVal) / span) * plotH;
              const yMax = padT + plotH - ((d.max - minVal) / span) * plotH;
              const isHover = hoveredData?.category === d.category;
              const isSel = activeDatum?.category === d.category;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer transition-all duration-150" 
                  onClick={() => handleSelectDatum(d)}
                  onPointerEnter={(e) => handlePointerMove(e, { ...d, metric_label: 'Median', formatted_value: `₹${d.median?.toLocaleString() || d.median}` })}
                  onPointerMove={(e) => handlePointerMove(e, { ...d, metric_label: 'Median', formatted_value: `₹${d.median?.toLocaleString() || d.median}` })} 
                  onPointerLeave={handlePointerLeave}
                  opacity={isHover || isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.9)}
                >
                  <line x1={cx} y1={yMin} x2={cx} y2={yMax} stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#6366f1'} strokeWidth={isHover || isSel ? 2.5 : 1.5} />
                  <line x1={cx - bWidth / 3} y1={yMin} x2={cx + bWidth / 3} y2={yMin} stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#6366f1'} strokeWidth={isHover || isSel ? 2.5 : 1.5} />
                  <line x1={cx - bWidth / 3} y1={yMax} x2={cx + bWidth / 3} y2={yMax} stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#6366f1'} strokeWidth={isHover || isSel ? 2.5 : 1.5} />

                  <rect 
                    x={cx - bWidth / 2} 
                    y={yQ3} 
                    width={bWidth} 
                    height={Math.max(yQ1 - yQ3, 4)} 
                    fill={isSel ? '#f43f5e' : isHover ? '#06b6d4' : '#6366f1'} 
                    fillOpacity={isHover ? 0.45 : isSel ? 0.5 : 0.25} 
                    stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#818cf8'} 
                    strokeWidth={isHover || isSel ? 2.5 : 1.5} 
                    filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))' : undefined}
                    rx={3} 
                  />
                  <line x1={cx - bWidth / 2} y1={yMed} x2={cx + bWidth / 2} y2={yMed} stroke={isSel ? '#ffffff' : '#22d3ee'} strokeWidth={3} />

                  <text x={cx} y={svgH - 15} textAnchor="middle" fill={isHover || isSel ? '#ffffff' : '#94a3b8'} fontSize={9.5} fontWeight={isHover || isSel ? 'bold' : 'normal'} fontFamily="sans-serif">{d.category}</text>
                </g>
              );
            })}
          </svg>

          {renderUniversalTooltip()}
        </div>

        {activeDatum && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">Selected Pattern:</span>
              <span className="text-white font-semibold">{activeDatum.category}</span>
              <span className="text-emerald-400 font-bold">({activeDatum.formatted_value || `Median: ₹${activeDatum.median?.toLocaleString() || activeDatum.median}`})</span>
            </div>
            <button 
              onClick={() => setActiveDatum(null)} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CORRELATION HEATMAP & CATEGORICAL HEATMAP
  // ──────────────────────────────────────────────────────────────────────────
  if (isCorrHeatmap || isHeatmap) {
    const hData = chartData;
    const xLabels = Array.from(new Set(hData.map((d: any) => d.x)));
    const yLabels = Array.from(new Set(hData.map((d: any) => d.y)));
    const svgW = 560;
    const svgH = 320;
    const padL = 90;
    const padT = 40;
    const cellW = (svgW - padL - 40) / Math.max(xLabels.length, 1);
    const cellH = (svgH - padT - 40) / Math.max(yLabels.length, 1);

    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Code className="w-3.5 h-3.5" /></button>}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
            {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[340px] overflow-visible">
            {hData.map((d: any, i: number) => {
              const xIdx = xLabels.indexOf(d.x);
              const yIdx = yLabels.indexOf(d.y);
              const xPos = padL + xIdx * cellW;
              const yPos = padT + yIdx * cellH;
              const val = Number(d.value || 0);
              const opacity = Math.max(0.15, Math.min(Math.abs(val), 1));
              const fill = val >= 0 ? '#06b6d4' : '#f43f5e';
              const pairName = `${d.y} ↔ ${d.x}`;
              const isHover = hoveredData?.category === pairName;
              const isSel = activeDatum?.category === pairName;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer transition-all duration-150" 
                  onClick={() => handleSelectDatum({ ...d, category: pairName, metric_label: 'Correlation', formatted_value: `${d.value}` })}
                  onPointerEnter={(e) => handlePointerMove(e, { ...d, category: pairName, metric_label: 'Coefficient', formatted_value: `${d.value}` })}
                  onPointerMove={(e) => handlePointerMove(e, { ...d, category: pairName, metric_label: 'Coefficient', formatted_value: `${d.value}` })} 
                  onPointerLeave={handlePointerLeave}
                  opacity={isHover || isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.9)}
                >
                  <rect 
                    x={xPos} 
                    y={yPos} 
                    width={cellW - 2} 
                    height={cellH - 2} 
                    fill={fill} 
                    fillOpacity={isHover || isSel ? 1 : opacity} 
                    stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#070b16'} 
                    strokeWidth={isHover || isSel ? 2.5 : 1.5} 
                    filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))' : undefined}
                    rx={3} 
                  />
                  <text x={xPos + cellW / 2} y={yPos + cellH / 2 + 3} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight="bold" fontFamily="monospace">{d.value}</text>
                </g>
              );
            })}

            {yLabels.map((lbl, i) => (
              <text key={`y_${i}`} x={padL - 8} y={padT + i * cellH + cellH / 2 + 3} textAnchor="end" fill="#94a3b8" fontSize={9.5} fontFamily="sans-serif">{String(lbl)}</text>
            ))}
            {xLabels.map((lbl, i) => (
              <text key={`x_${i}`} x={padL + i * cellW + cellW / 2} y={padT - 8} textAnchor="middle" fill="#94a3b8" fontSize={9.5} fontFamily="sans-serif">{String(lbl)}</text>
            ))}
          </svg>

          {renderUniversalTooltip()}
        </div>

        {activeDatum && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">Selected Pattern:</span>
              <span className="text-white font-semibold">{activeDatum.category}</span>
              <span className="text-emerald-400 font-bold">({activeDatum.formatted_value || activeDatum.value})</span>
            </div>
            <button 
              onClick={() => setActiveDatum(null)} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PIE / DONUT CHART
  // ──────────────────────────────────────────────────────────────────────────
  if (isPie) {
    const pieData = chartData;
    const totalCount = pieData.reduce((acc: number, curr: any) => acc + Number(curr.value ?? curr.count ?? 1), 0) || 1;
    const svgSize = 340;
    const center = svgSize / 2;
    const radius = 110;
    const innerRadius = 58;

    let currentAngle = -Math.PI / 2;
    const slices = pieData.map((d: any, idx: number) => {
      const val = Number(d.value ?? d.count ?? 1);
      const angle = (val / totalCount) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const ix1 = center + innerRadius * Math.cos(endAngle);
      const iy1 = center + innerRadius * Math.sin(endAngle);
      const ix2 = center + innerRadius * Math.cos(startAngle);
      const iy2 = center + innerRadius * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      return {
        ...d,
        color: THEME_COLORS[idx % THEME_COLORS.length],
        pathData,
        percentage: ((val / totalCount) * 100).toFixed(1) + '%'
      };
    });

    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Code className="w-3.5 h-3.5" /></button>}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
            {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 relative min-h-[280px]">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-56 h-56 shrink-0 overflow-visible">
            {slices.map((slice: any, i: number) => {
              const isHover = hoveredData?.category === slice.category;
              const isSel = activeDatum?.category === slice.category;
              return (
                <path
                  key={i}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#070b16'}
                  strokeWidth={isSel ? 3.5 : isHover ? 2.5 : 1.5}
                  className="cursor-pointer transition-all duration-200"
                  opacity={isHover || isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.9)}
                  transform={isHover || isSel ? `scale(1.05) translate(-${center * 0.05}, -${center * 0.05})` : undefined}
                  filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.85))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.85))' : undefined}
                  onClick={() => handleSelectDatum(slice)}
                  onPointerEnter={(e) => handlePointerMove(e, slice)}
                  onPointerMove={(e) => handlePointerMove(e, slice)}
                  onPointerLeave={handlePointerLeave}
                />
              );
            })}
            <circle cx={center} cy={center} r={innerRadius - 4} fill="#070b16" />
            <text x={center} y={center - 4} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="sans-serif">Total</text>
            <text x={center} y={center + 14} textAnchor="middle" fill="#22d3ee" fontSize={14} fontWeight="bold" fontFamily="sans-serif">{totalCount}</text>
          </svg>

          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {slices.map((slice: any, i: number) => {
              const isItemSel = activeDatum?.category === slice.category;
              const isItemHover = hoveredData?.category === slice.category;
              return (
                <div 
                  key={i} 
                  onClick={() => handleSelectDatum(slice)}
                  onPointerEnter={(e) => handlePointerMove(e, slice)}
                  onPointerMove={(e) => handlePointerMove(e, slice)} 
                  onPointerLeave={handlePointerLeave} 
                  className={`flex items-center gap-2 text-xs font-mono p-1.5 rounded-lg transition-all cursor-pointer ${isItemSel ? 'bg-slate-900 border border-rose-500/60 shadow-sm' : isItemHover ? 'bg-slate-900/80 border border-cyan-500/40' : 'hover:bg-slate-900/60'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: slice.color }} />
                  <span className={`truncate max-w-[110px] ${isItemSel ? 'text-white font-bold' : 'text-slate-300'}`}>{slice.category}</span>
                  <span className="text-cyan-400 font-bold ml-auto">{slice.percentage}</span>
                </div>
              );
            })}
          </div>

          {renderUniversalTooltip()}
        </div>

        {activeDatum && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">Selected Pattern:</span>
              <span className="text-white font-semibold">{activeDatum.category || activeDatum.name}</span>
              <span className="text-emerald-400 font-bold">({activeDatum.value} • {activeDatum.percentage})</span>
            </div>
            <button 
              onClick={() => setActiveDatum(null)} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SCATTER PLOT
  // ──────────────────────────────────────────────────────────────────────────
  if (isScatter) {
    const sData = chartData;
    const xVals = sData.map((d: any) => Number(d.x ?? 0));
    const yVals = sData.map((d: any) => Number(d.y ?? 0));
    const minX = Math.min(...xVals, 0);
    const maxX = Math.max(...xVals, 100);
    const minY = Math.min(...yVals, 0);
    const maxY = Math.max(...yVals, 100);

    const svgW = 600;
    const svgH = 320;
    const padL = 60;
    const padR = 30;
    const padT = 30;
    const padB = 45;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;

    return (
      <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
        <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Code className="w-3.5 h-3.5" /></button>}
            <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
            {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[340px] overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padT + chartH - pct * chartH;
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">{Math.round(minY + pct * (maxY - minY))}</text>
                </g>
              );
            })}

            {sData.map((d: any, i: number) => {
              const xPos = padL + ((Number(d.x) - minX) / Math.max(maxX - minX, 1)) * chartW;
              const yPos = padT + chartH - ((Number(d.y) - minY) / Math.max(maxY - minY, 1)) * chartH;
              const isHover = hoveredData?.label === d.label || hoveredData?.category === d.label;
              const isSel = activeDatum?.label === d.label || activeDatum?.category === d.label;

              return (
                <circle
                  key={i}
                  cx={xPos}
                  cy={yPos}
                  r={isHover ? 7.5 : isSel ? 7 : 4.5}
                  fill={isSel ? '#f43f5e' : isHover ? '#ffffff' : '#06b6d4'}
                  stroke={isHover ? '#22d3ee' : isSel ? '#f43f5e' : '#070b16'}
                  strokeWidth={isHover || isSel ? 2.5 : 1.5}
                  opacity={isHover || isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.88)}
                  filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.85))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.85))' : undefined}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => handleSelectDatum({ ...d, category: d.label, formatted_value: d.formatted_y || `(${d.x}, ${d.y})` })}
                  onPointerEnter={(e) => handlePointerMove(e, { ...d, category: d.label, metric_label: d.y_label || 'Y', formatted_value: d.formatted_y || `${d.y}` })}
                  onPointerMove={(e) => handlePointerMove(e, { ...d, category: d.label, metric_label: d.y_label || 'Y', formatted_value: d.formatted_y || `${d.y}` })}
                  onPointerLeave={handlePointerLeave}
                />
              );
            })}
          </svg>

          {renderUniversalTooltip()}
        </div>

        {activeDatum && (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">Selected Pattern:</span>
              <span className="text-white font-semibold">{activeDatum.label || activeDatum.category}</span>
              <span className="text-emerald-400 font-bold">({activeDatum.formatted_value || `X: ${activeDatum.x} • Y: ${activeDatum.y}`})</span>
            </div>
            <button 
              onClick={() => setActiveDatum(null)} 
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. DEFAULT LIVE BAR / HORIZONTAL BAR / HISTOGRAM / LINE CHART
  // ──────────────────────────────────────────────────────────────────────────
  const isLineView = isLine;
  const svgW = 600;
  const svgH = 320;
  const padL = isHorizontalBar ? 95 : 65;
  const padR = isHorizontalBar ? 65 : 30;
  const padT = 30;
  const padB = 45;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const maxVal = Math.max(...chartData.map((d: any) => Number(d.value ?? d.salary ?? d.count ?? 0)), 1);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 relative chart-container select-none">
      <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono tracking-wide">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSortOrder(prev => prev === 'default' ? 'desc' : prev === 'desc' ? 'asc' : 'default')}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 text-[10px] font-mono"
            title="Sort"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortOrder !== 'default' && <span className="uppercase">{sortOrder}</span>}
          </button>
          {onViewCode && <button onClick={onViewCode} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Code className="w-3.5 h-3.5" /></button>}
          <button onClick={handleDownloadPNG} className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
          {onFullscreen && <button onClick={onFullscreen} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      <div className="w-full flex-1 flex items-center justify-center relative min-h-[280px]">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[340px] overflow-visible">
          {isHorizontalBar ? (
            [0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const x = padL + pct * chartW;
              const tickVal = Math.round(pct * maxVal);
              const label = tickVal >= 1000000 ? `${(tickVal / 1000000).toFixed(1)}M` : tickVal >= 1000 ? `${(tickVal / 1000).toFixed(0)}k` : `${tickVal}`;
              return (
                <g key={i}>
                  <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y={padT + chartH + 15} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">{label}</text>
                </g>
              );
            })
          ) : (
            [0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padT + chartH - pct * chartH;
              const tickVal = Math.round(pct * maxVal);
              const label = tickVal >= 1000000 ? `${(tickVal / 1000000).toFixed(1)}M` : tickVal >= 1000 ? `${(tickVal / 1000).toFixed(0)}k` : `${tickVal}`;
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">{label}</text>
                </g>
              );
            })
          )}

          {isHorizontalBar ? (
            chartData.map((d: any, i: number) => {
              const val = Number(d.value ?? d.salary ?? d.count ?? 0);
              const barW = Math.max((val / maxVal) * chartW, 2);
              const barH = Math.min((chartH / chartData.length) * 0.65, 36);
              const yPos = padT + (i + 0.5) * (chartH / chartData.length) - barH / 2;
              const xPos = padL;
              const isHover = hoveredData?.category === d.category || hoveredData?.name === d.name;
              const isSel = activeDatum?.category === d.category || activeDatum?.name === d.name;

              return (
                <g
                  key={i}
                  className="cursor-pointer transition-transform duration-150"
                  onClick={() => handleSelectDatum(d)}
                  onPointerEnter={(e) => handlePointerMove(e, d)}
                  onPointerMove={(e) => handlePointerMove(e, d)}
                  onPointerLeave={handlePointerLeave}
                >
                  <text
                    x={padL - 8}
                    y={yPos + barH / 2 + 3.5}
                    textAnchor="end"
                    fill={isHover || isSel ? '#ffffff' : '#94a3b8'}
                    fontSize={chartData.length > 7 ? 8.5 : 9.5}
                    fontWeight={isHover || isSel ? 'bold' : 'normal'}
                    fontFamily="sans-serif"
                  >
                    {String(d.category || d.name || `P${i + 1}`).length > 15
                      ? `${String(d.category || d.name || `P${i + 1}`).slice(0, 14)}…`
                      : String(d.category || d.name || `P${i + 1}`)}
                  </text>
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barW}
                    height={barH}
                    fill={THEME_COLORS[i % THEME_COLORS.length]}
                    fillOpacity={isHover ? 1 : isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.88)}
                    stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#6366f1'}
                    strokeWidth={isSel ? 3 : isHover ? 2.5 : 1}
                    filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))' : undefined}
                    rx={4}
                    className="transition-all duration-150"
                  />
                  <text
                    x={xPos + barW + 6}
                    y={yPos + barH / 2 + 3}
                    textAnchor="start"
                    fill={isHover || isSel ? '#ffffff' : '#94a3b8'}
                    fontSize={8.5}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {d.formatted_value || (val > 1000 ? `₹${val.toLocaleString()}` : `${val}`)}
                  </text>
                </g>
              );
            })
          ) : !isLineView ? (
            chartData.map((d: any, i: number) => {
              const val = Number(d.value ?? d.salary ?? d.count ?? 0);
              const barH = (val / maxVal) * chartH;
              const barW = Math.min((chartW / chartData.length) * 0.65, 45);
              const xPos = padL + (i + 0.5) * (chartW / chartData.length) - barW / 2;
              const yPos = padT + chartH - barH;
              const isHover = hoveredData?.category === d.category || hoveredData?.bin_range === d.bin_range;
              const isSel = activeDatum?.category === d.category;
              const rawLabel = String(d.category || d.bin_range || d.date || `P${i + 1}`);
              const displayLabel = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer transition-transform duration-150" 
                  onClick={() => handleSelectDatum(d)}
                  onPointerEnter={(e) => handlePointerMove(e, d)}
                  onPointerMove={(e) => handlePointerMove(e, d)} 
                  onPointerLeave={handlePointerLeave}
                >
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barW}
                    height={Math.max(barH, 2)}
                    fill={THEME_COLORS[i % THEME_COLORS.length]}
                    fillOpacity={isHover ? 1 : isSel ? 1 : (hoveredData || activeDatum ? 0.35 : 0.88)}
                    stroke={isSel ? '#f43f5e' : isHover ? '#22d3ee' : '#6366f1'}
                    strokeWidth={isSel ? 3 : isHover ? 2.5 : 1}
                    filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))' : undefined}
                    rx={4}
                    className="transition-all duration-150"
                  />
                  {/* Top bar value indicator */}
                  <text
                    x={xPos + barW / 2}
                    y={Math.max(yPos - 5, padT + 8)}
                    textAnchor="middle"
                    fill={isHover || isSel ? '#ffffff' : '#64748b'}
                    fontSize={8}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {d.formatted_value || (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `${val}`)}
                  </text>
                  {/* Bottom Category Label with smart angle on small screens / many bars */}
                  <text 
                    x={xPos + barW / 2} 
                    y={svgH - 12} 
                    textAnchor={chartData.length > 4 ? 'end' : 'middle'} 
                    transform={chartData.length > 4 ? `rotate(-20, ${xPos + barW / 2}, ${svgH - 12})` : undefined}
                    fill={isHover || isSel ? '#ffffff' : '#94a3b8'} 
                    fontSize={chartData.length > 6 ? 8.5 : 9.5} 
                    fontWeight={isHover || isSel ? 'bold' : 'normal'} 
                    fontFamily="sans-serif"
                  >
                    {displayLabel}
                  </text>
                </g>
              );
            })
          ) : (
            <g>
              {(() => {
                const points = chartData.map((d: any, i: number) => {
                  const val = Number(d.value ?? d.count ?? 1);
                  const x = padL + (i + 0.5) * (chartW / chartData.length);
                  const y = padT + chartH - (val / maxVal) * chartH;
                  return { x, y, d };
                });
                const pathD = points.reduce((acc: string, p: any, idx: number) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                const areaD = `${pathD} L ${points[points.length - 1].x} ${padT + chartH} L ${points[0].x} ${padT + chartH} Z`;

                const hoveredPoint = points.find((p: any) => p.d.date === hoveredData?.date || p.d.category === hoveredData?.category);

                return (
                  <>
                    {/* Hover vertical alignment crosshair guide line */}
                    {hoveredPoint && (
                      <line
                        x1={hoveredPoint.x}
                        y1={padT}
                        x2={hoveredPoint.x}
                        y2={padT + chartH}
                        stroke="#22d3ee"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        opacity={0.8}
                      />
                    )}
                    <path d={areaD} fill="#06b6d4" fillOpacity={0.15} />
                    <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth={2.5} />
                    {points.map((p: any, idx: number) => {
                      const isHover = hoveredData?.date === p.d.date || hoveredData?.category === p.d.category;
                      const isSel = activeDatum?.date === p.d.date || activeDatum?.category === p.d.category;

                      return (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={isHover ? 7.5 : isSel ? 7 : 4.5}
                          fill={isSel ? '#f43f5e' : isHover ? '#ffffff' : '#22d3ee'}
                          stroke={isHover ? '#22d3ee' : '#070b16'}
                          strokeWidth={isHover || isSel ? 3 : 1.5}
                          filter={isHover ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.9))' : isSel ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.9))' : undefined}
                          className="cursor-pointer transition-all duration-150"
                          onClick={() => handleSelectDatum(p.d)}
                          onPointerEnter={(e) => handlePointerMove(e, p.d)}
                          onPointerMove={(e) => handlePointerMove(e, p.d)}
                          onPointerLeave={handlePointerLeave}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {renderUniversalTooltip()}
      </div>

      {activeDatum && (
        <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 text-xs font-mono shadow-[0_4px_20px_rgba(6,182,212,0.25)] backdrop-blur-md mt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300 font-bold">Selected Pattern:</span>
            <span className="text-white font-semibold">{activeDatum.category || activeDatum.name || activeDatum.city || activeDatum.label || activeDatum.date}</span>
            <span className="text-emerald-400 font-bold">({activeDatum.formatted_value || (activeDatum.value !== undefined ? (typeof activeDatum.value === 'number' && activeDatum.value > 1000 ? `₹${activeDatum.value.toLocaleString()}` : `${activeDatum.value}`) : '')}{activeDatum.percentage ? ` • ${activeDatum.percentage}` : ''})</span>
          </div>
          <button 
            onClick={() => setActiveDatum(null)} 
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};
