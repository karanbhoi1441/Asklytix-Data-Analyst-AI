import React, { useState, useRef } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useDatasets } from '@/hooks/useDatasets';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UploadCloud, LayoutGrid, List, MoreVertical,
  FileText, Eye, Star, Copy, Trash2, Edit2,
  Database, Layers, HardDrive, Zap
} from 'lucide-react';
import type { Dataset, FileFormat, SortOption } from '@/types/datasets';
import { cn } from '@/utils/cn';

const FORMAT_COLORS: Record<string, string> = {
  csv: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  xlsx: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  xls: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  json: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  parquet: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

function DatasetCardMenu({
  onOpen,
  onSetActive,
  onRename,
  onDuplicate,
  onDelete,
}: {
  dataset?: Dataset;
  onOpen: () => void;
  onSetActive: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const menuItems = [
    { label: 'Open', icon: Eye, action: onOpen },
    { label: 'Set as Active Dataset', icon: Star, action: onSetActive },
    { label: 'Rename', icon: Edit2, action: onRename },
    { label: 'Duplicate', icon: Copy, action: onDuplicate },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 w-52 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl z-50 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-1 space-y-0.5">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={e => { e.stopPropagation(); setOpen(false); item.action(); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                      item.danger
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', item.danger ? 'text-rose-400' : 'text-slate-400')} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    datasets, filteredDatasets,
    searchTerm, setSearchTerm,
    formatFilter, setFormatFilter,
    sortOption, setSortOption,
    view, setView,
    activeDataset,
    setActiveDataset, deleteDataset, renameDataset, duplicateDataset,
  } = useDatasets();

  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);
  const [renameTarget, setRenameTarget] = useState<Dataset | null>(null);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');

  const totalRows = datasets.reduce((a, d) => a + d.rows, 0);
  const totalSize = datasets.reduce((a, d) => a + d.sizeBytes, 0);
  const formatSize = (b: number) => b < 1024 ** 3 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${(b / 1024 ** 3).toFixed(2)} GB`;

  const sortLabels: Record<SortOption, string> = {
    recent: 'Recently Added', name_asc: 'Name A→Z', name_desc: 'Name Z→A',
    size_desc: 'Largest Size', rows_desc: 'Most Rows',
  };

  const formatOptions: { value: FileFormat | 'all'; label: string }[] = [
    { value: 'all', label: 'All Formats' },
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel XLSX' },
    { value: 'json', label: 'JSON' },
    { value: 'parquet', label: 'Parquet' },
  ];

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const error = renameDataset(renameTarget.id, newName.trim());
    if (error) { setRenameError(error); return; }
    setRenameTarget(null);
    setNewName('');
    setRenameError('');
  };

  return (
    <PageContainer badge="Route: /datasets" title="My Datasets" subtitle="Manage and explore all your uploaded data." maxWidth="wide">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Datasets', value: datasets.length, icon: Layers, color: 'text-cyan-400' },
            { label: 'Total Rows', value: totalRows.toLocaleString(), icon: Database, color: 'text-blue-400' },
            { label: 'Total Storage', value: formatSize(totalSize), icon: HardDrive, color: 'text-purple-400' },
            { label: 'Active Dataset', value: activeDataset?.name ?? 'None selected', icon: Zap, color: 'text-emerald-400', truncate: true },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} variant="analytics" glowColor={idx === 0 ? 'cyan' : 'none'} className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-slate-400">{stat.label}</p>
                  <p className={cn('text-sm font-extrabold text-white', stat.truncate && 'truncate')}>{stat.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="bg-slate-950/80 text-xs"
            />
          </div>

          <select
            value={formatFilter}
            onChange={e => setFormatFilter(e.target.value as FileFormat | 'all')}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            {formatOptions.map(o => (
              <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
            ))}
          </select>

          <div className="relative">
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/80 cursor-pointer pr-8"
            >
              {(Object.keys(sortLabels) as SortOption[]).map(k => (
                <option key={k} value={k} className="bg-slate-900">{sortLabels[k]}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setView('grid')}
              className={cn('p-1.5 rounded-lg transition-all', view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-200')}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn('p-1.5 rounded-lg transition-all', view === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-200')}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={() => navigate('/upload')} leftIcon={<UploadCloud className="w-4 h-4" />}>
            Upload New Data
          </Button>
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredDatasets.map((dataset, idx) => (
                <motion.div
                  key={dataset.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    variant="analytics"
                    className={cn(
                      'cursor-pointer hover:border-cyan-500/50 transition-all',
                      dataset.isActive && 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    )}
                    onClick={() => navigate(`/datasets/${dataset.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">{dataset.name}</span>
                            {dataset.isActive && <Badge variant="success" size="sm" dot>Active</Badge>}
                          </div>
                          <span className={cn('text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full border', FORMAT_COLORS[dataset.format] || '')}>
                            {dataset.format.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <DatasetCardMenu
                        dataset={dataset}
                        onOpen={() => navigate(`/datasets/${dataset.id}`)}
                        onSetActive={() => setActiveDataset(dataset.id)}
                        onRename={() => { setRenameTarget(dataset); setNewName(dataset.name); }}
                        onDuplicate={() => duplicateDataset(dataset.id)}
                        onDelete={() => setDeleteTarget(dataset)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-slate-800/80 mb-3">
                      {[
                        { label: 'Rows', val: dataset.rows.toLocaleString() },
                        { label: 'Cols', val: dataset.columns },
                        { label: 'Size', val: dataset.sizeLabel },
                      ].map(stat => (
                        <div key={stat.label}>
                          <p className="text-sm font-extrabold text-white">{stat.val}</p>
                          <p className="text-[10px] font-mono text-slate-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{new Date(dataset.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Badge variant={dataset.isActive ? 'success' : 'secondary'} size="sm">{dataset.isActive ? 'active' : dataset.status}</Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Table View */}
        {view === 'table' && (
          <AnimatePresence mode="wait">
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card variant="glass" className="border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                      <tr>
                        <th className="py-3 px-4 text-left">Dataset Name</th>
                        <th className="py-3 px-4 text-left">Format</th>
                        <th className="py-3 px-4 text-right">Rows</th>
                        <th className="py-3 px-4 text-right">Columns</th>
                        <th className="py-3 px-4 text-right">Size</th>
                        <th className="py-3 px-4 text-left">Uploaded</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredDatasets.map(dataset => (
                        <tr
                          key={dataset.id}
                          className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                          onClick={() => navigate(`/datasets/${dataset.id}`)}
                        >
                          <td className="py-3 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              {dataset.name}
                              {dataset.isActive && <Badge variant="success" size="sm" dot>Active</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn('text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border', FORMAT_COLORS[dataset.format] || '')}>
                              {dataset.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">{dataset.rows.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono">{dataset.columns}</td>
                          <td className="py-3 px-4 text-right font-mono text-cyan-400">{dataset.sizeLabel}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {new Date(dataset.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={dataset.isActive ? 'success' : 'secondary'} size="sm" dot={dataset.isActive}>{dataset.isActive ? 'active' : dataset.status}</Badge>
                          </td>
                          <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                            <DatasetCardMenu
                              dataset={dataset}
                              onOpen={() => navigate(`/datasets/${dataset.id}`)}
                              onSetActive={() => setActiveDataset(dataset.id)}
                              onRename={() => { setRenameTarget(dataset); setNewName(dataset.name); }}
                              onDuplicate={() => duplicateDataset(dataset.id)}
                              onDelete={() => setDeleteTarget(dataset)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {filteredDatasets.length === 0 && (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-600 mb-3" />
            <p className="font-bold text-slate-300">No datasets match your filters</p>
            <p className="text-xs">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Dataset"
        subtitle="This action cannot be undone"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Are you sure you want to delete <span className="font-bold text-white">"{deleteTarget?.name}"</span>?</p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            ⚠ This action will permanently remove the dataset from your AskLytix workspace.
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="primary" size="sm" fullWidth className="bg-rose-600 hover:bg-rose-500 border-rose-500"
              onClick={() => { if (deleteTarget) deleteDataset(deleteTarget.id); setDeleteTarget(null); }}>
              Delete Dataset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => { setRenameTarget(null); setRenameError(''); }}
        title="Rename Dataset"
        maxWidth="sm"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <Input
            label="New Dataset Name"
            value={newName}
            onChange={e => { setNewName(e.target.value); setRenameError(''); }}
            placeholder="Enter a new name..."
            required
            error={renameError}
            autoFocus
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" fullWidth type="button" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button variant="primary" size="sm" fullWidth type="submit">Save Name</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
