import React, { useState } from 'react';
import type { WidgetType } from '@/types/dashboard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  TrendingUp, 
  LineChart, 
  BarChart2, 
  PieChart, 
  Table as TableIcon, 
  Sparkles, 
  Globe,
  Compass,
  Layers,
  Columns,
  Calculator,
  PlusCircle
} from 'lucide-react';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType, title: string, colSpan?: 1 | 2 | 3 | 4) => void;
  datasetColumns?: string[];
  datasetName?: string | null;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
  datasetColumns = [],
  datasetName
}) => {
  const [selectedType, setSelectedType] = useState<WidgetType>('bar_chart');
  const [title, setTitle] = useState('');
  const [dimensionCol, setDimensionCol] = useState<string>('');
  const [metricCol, setMetricCol] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('SUM');
  const [colSpan, setColSpan] = useState<1 | 2 | 3 | 4>(2);

  const widgetTemplates = [
    { type: 'bar_chart' as const, label: 'Category Bar Chart', desc: 'Ranked comparison across categories or dimensions', icon: BarChart2, defaultTitle: 'Category Breakdown & Sales', defaultSpan: 2 as const },
    { type: 'line_chart' as const, label: 'Trend Line Chart', desc: 'Trajectory curve over dates or sequences', icon: LineChart, defaultTitle: 'Performance Trajectory Over Time', defaultSpan: 2 as const },
    { type: 'donut_chart' as const, label: 'Donut / Pie Chart', desc: 'Proportional distribution & segment share', icon: PieChart, defaultTitle: 'Distribution & Market Share', defaultSpan: 1 as const },
    { type: 'area_chart' as const, label: 'Cumulative Area Chart', desc: 'Volume growth and cumulative velocity', icon: TrendingUp, defaultTitle: 'Cumulative Growth Trajectory', defaultSpan: 2 as const },
    { type: 'map' as const, label: 'Real-Time Geographic Map', desc: 'Interactive radar markers & regional analytics', icon: Globe, defaultTitle: 'Geographic Distribution & Real-Time Map', defaultSpan: 2 as const },
    { type: 'kpi' as const, label: 'KPI Metric Cards', desc: '4 High-level aggregated metric KPI boxes', icon: TrendingUp, defaultTitle: 'Core KPI Metrics', defaultSpan: 4 as const },
    { type: 'radar_chart' as const, label: 'Multi-Metric Radar', desc: '6-dimensional score vs performance benchmark', icon: Compass, defaultTitle: 'Multi-Metric Performance Radar', defaultSpan: 2 as const },
    { type: 'table' as const, label: 'Data Summary Table', desc: 'Top records with live metrics and ranking', icon: TableIcon, defaultTitle: 'Top Performing Records', defaultSpan: 2 as const },
    { type: 'ai_insight' as const, label: 'AI Strategic Insights', desc: 'Automated AI analysis, anomalies & tips', icon: Sparkles, defaultTitle: 'AI Strategic Intelligence & Insights', defaultSpan: 1 as const }
  ];

  const handleSelectTemplate = (tpl: typeof widgetTemplates[0]) => {
    setSelectedType(tpl.type);
    setTitle(tpl.defaultTitle);
    setColSpan(tpl.defaultSpan);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `${aggregation} of ${metricCol || 'Data'} by ${dimensionCol || 'Category'}`;
    onAddWidget(selectedType, finalTitle, colSpan);
    onClose();
  };

  const availableCols = datasetColumns.length > 0 ? datasetColumns : ['Category', 'City', 'Showroom_Name', 'Car_Model', 'Salesperson', 'Total_Amount', 'Price_Per_Car', 'Quantity'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Visual Chart"
      subtitle={`Configure and build custom visualizations manually for ${datasetName || 'your active dataset'}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Template Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            1. Select Visual Chart Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {widgetTemplates.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = selectedType === tpl.type;
              return (
                <div
                  key={tpl.type}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg border shrink-0 ${isSelected ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{tpl.label}</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{tpl.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Parameters Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          {/* Dimension Column */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Columns className="w-3 h-3 text-cyan-400" />
              Dimension / X-Axis Column
            </label>
            <select
              value={dimensionCol}
              onChange={(e) => setDimensionCol(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">Auto (Default Dataset Dimension)</option>
              {availableCols.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Metric Column */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Calculator className="w-3 h-3 text-cyan-400" />
              Metric / Y-Axis (Measure)
            </label>
            <select
              value={metricCol}
              onChange={(e) => setMetricCol(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">Auto (Revenue / Values)</option>
              {availableCols.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Aggregation Function */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 font-mono">
              Aggregation Function
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="SUM">SUM (Total Amount / Revenue)</option>
              <option value="AVG">AVG (Average Value)</option>
              <option value="COUNT">COUNT (Total Transactions / Records)</option>
              <option value="MAX">MAX (Peak Value)</option>
              <option value="MIN">MIN (Minimum Value)</option>
            </select>
          </div>

          {/* Layout Span */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 font-mono">
              Canvas Width Span
            </label>
            <select
              value={colSpan}
              onChange={(e) => setColSpan(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value={2}>Half Width (2 Columns / Default)</option>
              <option value={4}>Full Width (4 Columns - Expansive)</option>
              <option value={1}>Compact (1 Column / Sidebar)</option>
            </select>
          </div>
        </div>

        {/* 3. Title Input */}
        <Input
          label="Visual Display Title"
          placeholder="e.g. Pune Showroom Revenue Comparison"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-mono">
            Will add 1 custom visual box to your active canvas.
          </span>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              type="submit"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Add Visual to Canvas
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

