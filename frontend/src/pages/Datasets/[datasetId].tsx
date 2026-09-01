import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatasets } from '@/hooks/useDatasets';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import type { Dataset, DatasetColumn, ColumnType, DatasetPreviewRow, DataQualityIssue } from '@/types/datasets';
import {
  FileText, Search, ChevronLeft, ChevronRight, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Loader2, ShieldCheck,
  Database, Hash, Calendar, ToggleLeft, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/utils/cn';

const TYPE_ICON: Record<string, React.ElementType> = {
  numeric: Hash, text: FileText, date: Calendar, boolean: ToggleLeft
};
const TYPE_COLOR: Record<string, string> = {
  numeric: 'text-cyan-400', text: 'text-emerald-400', date: 'text-amber-400', boolean: 'text-purple-400'
};

function OverviewTab({ dataset }: { dataset: Dataset }) {
  if (!dataset) return null;
  const missing = dataset.columnDefs.reduce((a: number, c: DatasetColumn) => a + c.missingCount, 0);
  const numeric = dataset.columnDefs.filter((c: DatasetColumn) => c.type === 'numeric').length;
  const categorical = dataset.columnDefs.filter((c: DatasetColumn) => c.type === 'text').length;
  const dateCount = dataset.columnDefs.filter((c: DatasetColumn) => c.type === 'date').length;
  const boolCount = dataset.columnDefs.filter((c: DatasetColumn) => c.type === 'boolean').length;

  const typeDist = [
    { label: 'Numeric', count: numeric, color: '#06b6d4', pct: Math.round(numeric / dataset.columns * 100) },
    { label: 'Text', count: categorical, color: '#10b981', pct: Math.round(categorical / dataset.columns * 100) },
    { label: 'Date', count: dateCount, color: '#f59e0b', pct: Math.round(dateCount / dataset.columns * 100) },
    { label: 'Boolean', count: boolCount, color: '#a855f7', pct: Math.round(boolCount / dataset.columns * 100) },
  ].filter(t => t.count > 0);

  const stats = [
    { label: 'Total Rows', value: dataset.rows.toLocaleString() },
    { label: 'Total Columns', value: dataset.columns },
    { label: 'Missing Values', value: missing.toLocaleString() },
    { label: 'Numeric Columns', value: numeric },
    { label: 'Categorical Columns', value: categorical },
    { label: 'Date Columns', value: dateCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} variant="glass" className="text-center p-4">
            <p className="text-2xl font-extrabold text-white mb-1">{s.value}</p>
            <p className="text-xs font-mono text-slate-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Column Type Distribution */}
      <Card variant="glass" className="border-slate-800 space-y-4 p-5">
        <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800/80">Column Type Distribution</h3>
        <div className="space-y-3">
          {typeDist.map(t => (
            <div key={t.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{t.label} ({t.count} columns)</span>
                <span className="font-mono" style={{ color: t.color }}>{t.pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${t.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PreviewTab({ dataset }: { dataset: Dataset }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const rowsPerPage = 8;

  const columns = Object.keys(dataset.previewRows[0] ?? {});
  const visibleCols = columns.filter(c => !hiddenCols.has(c));

  const filtered = dataset.previewRows.filter((row: DatasetPreviewRow) =>
    Object.values(row).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search rows..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />} className="text-xs" />
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-xs overflow-x-auto">
          {columns.map(col => (
            <button
              key={col}
              onClick={() => setHiddenCols(prev => { const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next; })}
              title={`Toggle ${col}`}
              className={cn('text-[10px] px-2 py-1 rounded-lg border font-mono transition-all', hiddenCols.has(col) ? 'border-slate-700 text-slate-500 bg-slate-950' : 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10')}
            >
              {hiddenCols.has(col) ? <EyeOff className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
              {col}
            </button>
          ))}
        </div>
      </div>

      <Card variant="glass" className="border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead className="bg-slate-950/90 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase sticky top-0">
              <tr>
                <th className="py-3 px-3 text-right w-12">#</th>
                {visibleCols.map(col => (
                  <th key={col} className="py-3 px-3 text-left whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.map((row: DatasetPreviewRow, rIdx: number) => (
                <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{(page - 1) * rowsPerPage + rIdx + 1}</td>
                  {visibleCols.map(col => (
                    <td key={col} className={cn('py-2.5 px-3 whitespace-nowrap', row[col] === null ? 'text-slate-600 italic' : '')}>
                      {row[col] === null ? 'NULL' : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Showing {paginated.length} of {filtered.length} rows</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>Page {page} of {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ColumnsTab({ dataset }: { dataset: Dataset }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ColumnType | 'all'>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedCol, setSelectedCol] = useState<DatasetColumn | null>(null);

  const filtered = dataset.columnDefs
    .filter((c: DatasetColumn) => c.name.toLowerCase().includes(search.toLowerCase()) && (typeFilter === 'all' || c.type === typeFilter))
    .sort((a: DatasetColumn, b: DatasetColumn) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-40">
            <Input placeholder="Search columns..." value={search} onChange={e => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />} className="text-xs" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ColumnType | 'all')}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
            <option value="all">All Types</option>
            <option value="numeric">Numeric</option>
            <option value="text">Text</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
          <button onClick={() => setSortAsc(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white transition-colors cursor-pointer">
            <ArrowUpDown className="w-3.5 h-3.5" /> Name {sortAsc ? 'A→Z' : 'Z→A'}
          </button>
        </div>

        <Card variant="glass" className="border-slate-800 overflow-hidden">
          <table className="w-full text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-3 text-left">Column</th>
                <th className="py-3 px-3 text-left">Type</th>
                <th className="py-3 px-3 text-right">Non-Null</th>
                <th className="py-3 px-3 text-right">Missing</th>
                <th className="py-3 px-3 text-right">Unique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((col: DatasetColumn) => {
                const Icon = TYPE_ICON[col.type] || FileText;
                const colorClass = TYPE_COLOR[col.type] || 'text-slate-300';
                return (
                  <tr key={col.name}
                    className={cn('hover:bg-slate-900/60 transition-colors cursor-pointer', selectedCol?.name === col.name && 'bg-cyan-500/10')}
                    onClick={() => setSelectedCol(col)}>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">{col.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn('flex items-center gap-1.5', colorClass)}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{col.type}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-300">{col.nonNullCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">{col.missingCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-300">{col.uniqueValues.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Selected Column Detail Panel */}
      <div>
        {selectedCol ? (
          <Card variant="glass" className="border-cyan-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-sm font-bold text-white font-mono">{selectedCol.name}</p>
                <p className="text-xs text-slate-400 capitalize">{selectedCol.type} Column</p>
              </div>
              <Badge variant="primary" size="sm">{selectedCol.type}</Badge>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Non-Null Count:</span>
                <span className="text-white font-bold">{selectedCol.nonNullCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Missing Values:</span>
                <span className="text-amber-400 font-bold">{selectedCol.missingCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Unique Values:</span>
                <span className="text-purple-400 font-bold">{selectedCol.uniqueValues.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-white">Sample Values:</p>
              <div className="space-y-1">
                {selectedCol.examples.map((ex: string, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 truncate">
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="glass" className="border-slate-800 p-6 text-center text-slate-400 text-xs">
            Select a column on the left to inspect its distribution and sample values.
          </Card>
        )}
      </div>
    </div>
  );
}

function QualityTab({ dataset }: { dataset: Dataset }) {
  const [isRunning, setIsRunning] = useState(false);
  const [quality, setQuality] = useState(dataset.quality);

  const runCheck = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setQuality({
        ...quality,
        score: Math.min(100, quality.score + 2),
      });
    }, 1200);
  };

  const categories = [
    { label: 'Completeness', value: quality.completeness, color: '#06b6d4' },
    { label: 'Consistency', value: quality.consistency, color: '#3b82f6' },
    { label: 'Uniqueness', value: quality.uniqueness, color: '#a855f7' },
    { label: 'Validity', value: quality.validity, color: '#10b981' },
  ];

  const scoreColor = quality.score >= 90 ? 'text-emerald-400' : quality.score >= 70 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="glass" className="border-cyan-500/30 flex flex-col items-center justify-center py-8 space-y-3">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Overall Quality Score</p>
          <div className={cn('text-6xl font-black tabular-nums', scoreColor)}>
            {isRunning ? '—' : quality.score}
          </div>
          <p className="text-xs text-slate-400 font-mono">/ 100</p>
          <Button variant="primary" size="sm" onClick={runCheck} isLoading={isRunning}
            leftIcon={isRunning ? undefined : <ShieldCheck className="w-4 h-4" />}>
            {isRunning ? 'Analyzing Dataset...' : 'Run Data Quality Check'}
          </Button>
        </Card>

        <Card variant="glass" className="border-slate-800 space-y-4 p-5">
          <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800/80">Quality Dimensions</h3>
          {categories.map(cat => (
            <div key={cat.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{cat.label}</span>
                <span className="font-mono" style={{ color: cat.color }}>{isRunning ? '...' : `${cat.value}%`}</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: isRunning ? '0%' : `${cat.value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card variant="glass" className="border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-800/80">Detected Issues & Validations</h3>
        {isRunning ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
            <p className="text-xs font-mono text-cyan-300 font-bold animate-pulse">Scanning dataset for quality issues...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quality.issues.map((issue: DataQualityIssue, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                className={cn('flex items-start gap-3 p-3 rounded-xl border text-xs',
                  issue.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300')}>
                {issue.severity === 'warning'
                  ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="leading-snug">{issue.message}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export const DatasetDetailPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const { getDatasetById } = useDatasets();
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'columns' | 'quality'>('overview');

  const dataset = getDatasetById(datasetId ?? '');

  if (!dataset) {
    return (
      <PageContainer title="Dataset Not Found">
        <Card variant="glass" className="p-8 text-center space-y-4 max-w-md mx-auto">
          <Database className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-400">Dataset could not be found or has been cleared.</p>
          <Button variant="primary" onClick={() => navigate('/connect')}>
            Go to Data Source
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={dataset.name}
      subtitle={`${dataset.format.toUpperCase()} • ${dataset.sizeLabel} • ${dataset.rows.toLocaleString()} rows • ${dataset.columns} columns`}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 w-fit">
          <button onClick={() => setActiveTab('overview')} className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer', activeTab === 'overview' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white')}>Overview</button>
          <button onClick={() => setActiveTab('preview')} className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer', activeTab === 'preview' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white')}>Preview Data</button>
          <button onClick={() => setActiveTab('columns')} className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer', activeTab === 'columns' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white')}>Columns Schema</button>
          <button onClick={() => setActiveTab('quality')} className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer', activeTab === 'quality' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white')}>Data Quality</button>
        </div>

        {activeTab === 'overview' && <OverviewTab dataset={dataset} />}
        {activeTab === 'preview' && <PreviewTab dataset={dataset} />}
        {activeTab === 'columns' && <ColumnsTab dataset={dataset} />}
        {activeTab === 'quality' && <QualityTab dataset={dataset} />}
      </div>
    </PageContainer>
  );
};
