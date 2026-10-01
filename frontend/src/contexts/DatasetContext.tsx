import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Dataset, UploadQueueItem, FileFormat, SortOption } from '@/types/datasets';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE_BYTES } from '@/data/mockDatasets';
import { datasetService } from '@/services/datasetService';

const ACTIVE_ID_KEY = 'asklytix_active_dataset_id';
const CACHED_DATASETS_KEY = 'asklytix_cached_datasets';
const CACHED_ACTIVE_KEY = 'asklytix_cached_active_dataset';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function loadStoredActiveId(): string | null {
  try {
    const val = localStorage.getItem(ACTIVE_ID_KEY);
    if (!val || val === 'null' || val === 'undefined') return null;
    return val;
  } catch {
    return null;
  }
}

function loadStoredDatasets(): Dataset[] {
  try {
    const val = localStorage.getItem(CACHED_DATASETS_KEY);
    if (!val) return [];
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStoredActiveDataset(): Dataset | null {
  try {
    const val = localStorage.getItem(CACHED_ACTIVE_KEY);
    if (!val) return null;
    const parsed = JSON.parse(val);
    return parsed && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

export interface DatasetContextValue {
  datasets: Dataset[];
  filteredDatasets: Dataset[];
  activeDataset: Dataset | null;
  activeId: string | null;
  isLoading: boolean;
  uploadQueue: UploadQueueItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  formatFilter: FileFormat | 'all';
  setFormatFilter: (fmt: FileFormat | 'all') => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
  view: 'grid' | 'table';
  setView: (v: 'grid' | 'table') => void;
  addFilesToQueue: (files: FileList | File[]) => void;
  removeFromQueue: (id: string) => void;
  startUpload: (id: string) => Promise<void>;
  startAllReady: () => void;
  setActiveDataset: (id: string) => void;
  deleteDataset: (id: string) => Promise<void>;
  renameDataset: (id: string, newName: string) => string | null;
  duplicateDataset: (id: string) => void;
  getDatasetById: (id: string) => Dataset | null;
  clearAllDatasets: () => Promise<void>;
  loadSampleDataset: () => void;
  refreshDatasets: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextValue | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>(loadStoredDatasets);
  const [activeId, setActiveId] = useState<string | null>(loadStoredActiveId);
  const [activeDatasetDetails, setActiveDatasetDetails] = useState<Dataset | null>(loadStoredActiveDataset);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<FileFormat | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Sync active dataset details when activeId changes or on initial load
  const syncActiveDetails = useCallback(async (targetId: string, fallbackDataset?: Dataset) => {
    try {
      const details = await datasetService.getById(targetId);
      if (details && details.id) {
        setActiveDatasetDetails(details);
        try {
          localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(details));
        } catch {}
        return;
      }
    } catch {
      // If network fails or pending, retain fallback or cached copy
    }

    if (fallbackDataset) {
      setActiveDatasetDetails(fallbackDataset);
      try {
        localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(fallbackDataset));
      } catch {}
    }
  }, []);

  // Fetch datasets list from backend and maintain persistence
  const refreshDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await datasetService.list();

      if (list && list.length > 0) {
        setDatasets(list);
        try {
          localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify(list));
        } catch {}

        const currentStoredId = loadStoredActiveId();
        const matched = currentStoredId ? list.find(d => d.id === currentStoredId) : null;
        const target = matched || list[0];

        if (target && target.id) {
          setActiveId(target.id);
          try {
            localStorage.setItem(ACTIVE_ID_KEY, target.id);
          } catch {}
          await syncActiveDetails(target.id, target);
        }
      } else if (list && list.length === 0) {
        // Only clear if server explicitly says 0 AND local storage had no real upload
        const cached = loadStoredDatasets();
        if (cached.length === 0) {
          setDatasets([]);
          setActiveId(null);
          setActiveDatasetDetails(null);
          try {
            localStorage.removeItem(ACTIVE_ID_KEY);
            localStorage.removeItem(CACHED_ACTIVE_KEY);
            localStorage.removeItem(CACHED_DATASETS_KEY);
          } catch {}
        }
      }
    } catch {
      // Backend hiccup or route transition - preserve all local cached data!
    } finally {
      setIsLoading(false);
    }
  }, [syncActiveDetails]);

  // Initial load
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  // Active dataset computation
  const activeDataset = useMemo(() => {
    if (activeDatasetDetails) return activeDatasetDetails;
    if (activeId) {
      const found = datasets.find(d => d.id === activeId);
      if (found) return found;
    }
    if (datasets.length > 0) return datasets[0];
    return null;
  }, [activeDatasetDetails, activeId, datasets]);

  // Filtered and sorted dataset list
  const filteredDatasets = useMemo(() => {
    return datasets
      .filter(d => {
        const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFormat = formatFilter === 'all' || d.format === formatFilter;
        return matchSearch && matchFormat;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'recent': return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          case 'size_desc': return b.sizeBytes - a.sizeBytes;
          case 'rows_desc': return b.rows - a.rows;
          default: return 0;
        }
      });
  }, [datasets, searchTerm, formatFilter, sortOption]);

  // Upload queue management
  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newItems: UploadQueueItem[] = [];

    for (const file of arr) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const isSupported = SUPPORTED_FORMATS.includes(ext as FileFormat);
      const isDuplicate = uploadQueue.some(q => q.name === file.name);
      const isTooBig = file.size > MAX_FILE_SIZE_BYTES;

      newItems.push({
        id: `uq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        format: isSupported ? (ext as FileFormat) : null,
        sizeLabel: formatBytes(file.size),
        state: !isSupported ? 'error' : isDuplicate ? 'error' : isTooBig ? 'error' : 'ready',
        progress: 0,
        error: !isSupported
          ? 'Unsupported file format. Please upload CSV, Excel, JSON, or Parquet files.'
          : isDuplicate
          ? `A file named "${file.name}" is already in the upload queue.`
          : isTooBig
          ? `File exceeds the 500 MB maximum size limit.`
          : undefined,
      });
    }

    setUploadQueue(prev => [...prev, ...newItems]);
  }, [uploadQueue]);

  const removeFromQueue = useCallback((id: string) => {
    if (timerRefs.current[id]) clearInterval(timerRefs.current[id]);
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  }, []);

  const startUpload = useCallback(async (id: string) => {
    const item = uploadQueue.find(q => q.id === id);
    if (!item) return;

    setUploadQueue(prev =>
      prev.map(q => q.id === id ? { ...q, state: 'uploading', progress: 25 } : q)
    );

    try {
      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'processing', progress: 65 } : q)
      );

      const res = await datasetService.upload(item.file);
      const uploaded = res.data;

      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'completed', progress: 100, completedDatasetId: uploaded.dataset_id } : q)
      );

      // Persist active dataset
      const newDatasetObj: Dataset = {
        id: uploaded.dataset_id,
        name: uploaded.name,
        format: (uploaded.format?.toLowerCase() || 'csv') as FileFormat,
        sizeBytes: uploaded.size_bytes || item.file.size,
        sizeLabel: uploaded.sizeLabel || formatBytes(item.file.size),
        rows: uploaded.row_count || 0,
        columns: uploaded.column_count || 0,
        uploadedAt: new Date().toISOString(),
        status: 'active',
        isActive: true,
        columnDefs: (uploaded.schema || []).map((col: any) => ({
          name: col.name || col.column_name || String(col),
          type: col.type || 'text',
          nonNullCount: uploaded.row_count || 0,
          missingCount: 0,
          uniqueValues: 10,
          examples: []
        })),
        previewRows: uploaded.preview || [],
        quality: uploaded.quality || {
          score: 95,
          completeness: 100,
          consistency: 100,
          uniqueness: 100,
          validity: 100,
          issues: []
        },
        active_version_id: uploaded.active_version_id
      };

      setDatasets(prev => [newDatasetObj, ...prev.filter(d => d.id !== uploaded.dataset_id)]);
      setActiveId(uploaded.dataset_id);
      setActiveDatasetDetails(newDatasetObj);

      try {
        localStorage.setItem(ACTIVE_ID_KEY, uploaded.dataset_id);
        localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(newDatasetObj));
        localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify([newDatasetObj, ...datasets.filter(d => d.id !== uploaded.dataset_id)]));
      } catch {}

      // Refresh from server in background
      refreshDatasets();
    } catch (err: any) {
      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'error', error: err?.message || 'Upload failed' } : q)
      );
    }
  }, [uploadQueue, datasets, refreshDatasets]);

  const startAllReady = useCallback(() => {
    uploadQueue
      .filter(q => q.state === 'ready')
      .forEach(q => startUpload(q.id));
  }, [uploadQueue, startUpload]);

  // Dataset Operations
  const setActiveDataset = useCallback((id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } catch {}

    const found = datasets.find(d => d.id === id);
    if (found) {
      setActiveDatasetDetails(found);
      try {
        localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(found));
      } catch {}
    }

    datasetService.getById(id).then(details => {
      if (details && details.id) {
        setActiveDatasetDetails(details);
        try {
          localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(details));
        } catch {}
      }
    }).catch(() => {});
  }, [datasets]);

  const deleteDataset = useCallback(async (id: string) => {
    try {
      await datasetService.delete(id);
    } catch {}

    const updated = datasets.filter(d => d.id !== id);
    setDatasets(updated);
    try {
      localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify(updated));
    } catch {}

    if (activeId === id) {
      const nextActive = updated.length > 0 ? updated[0] : null;
      const nextId = nextActive ? nextActive.id : null;
      setActiveId(nextId);
      setActiveDatasetDetails(nextActive);

      try {
        if (nextId) {
          localStorage.setItem(ACTIVE_ID_KEY, nextId);
          localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(nextActive));
        } else {
          localStorage.removeItem(ACTIVE_ID_KEY);
          localStorage.removeItem(CACHED_ACTIVE_KEY);
        }
      } catch {}
    }
  }, [datasets, activeId]);

  const renameDataset = useCallback((id: string, newName: string): string | null => {
    const duplicate = datasets.some(d => d.id !== id && d.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) return 'A dataset with this name already exists.';

    setDatasets(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, name: newName } : d);
      try {
        localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeDatasetDetails?.id === id) {
      const updatedActive = { ...activeDatasetDetails, name: newName };
      setActiveDatasetDetails(updatedActive);
      try {
        localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(updatedActive));
      } catch {}
    }

    return null;
  }, [datasets, activeDatasetDetails]);

  const duplicateDataset = useCallback((id: string) => {
    const src = datasets.find(d => d.id === id);
    if (!src) return;
    const clone: Dataset = {
      ...src,
      id: `ds-${Date.now()}`,
      name: `${src.name} (Copy)`,
      isActive: false,
      uploadedAt: new Date().toISOString(),
    };
    setDatasets(prev => {
      const updated = [clone, ...prev];
      try {
        localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [datasets]);

  const getDatasetById = useCallback((id: string) => {
    return datasets.find(d => d.id === id) ?? null;
  }, [datasets]);

  const clearAllDatasets = useCallback(async () => {
    setActiveId(null);
    setActiveDatasetDetails(null);
    setDatasets([]);
    try {
      localStorage.removeItem(ACTIVE_ID_KEY);
      localStorage.removeItem(CACHED_DATASETS_KEY);
      localStorage.removeItem(CACHED_ACTIVE_KEY);
      localStorage.removeItem('asklytix_dashboard_widgets');
      localStorage.removeItem('asklytix_dashboard_active_region');
      sessionStorage.clear();
    } catch {}
  }, []);

  const loadSampleDataset = useCallback(() => {
    // Only loads sample when explicitly requested by user
    const sampleCols = ['order_id', 'order_date', 'customer_name', 'product', 'category', 'region', 'quantity', 'unit_price', 'revenue', 'profit', 'discount_pct', 'payment_method', 'is_returned'];
    const sample: Dataset = {
      id: 'ds-sample-001',
      name: 'Sales Performance 2026',
      format: 'csv',
      sizeBytes: 2411724,
      sizeLabel: '2.3 MB',
      rows: 10000,
      columns: 13,
      uploadedAt: new Date().toISOString(),
      status: 'active',
      isActive: true,
      columnDefs: sampleCols.map(c => ({
        name: c,
        type: ['quantity', 'unit_price', 'revenue', 'profit', 'discount_pct'].includes(c) ? 'numeric' : 'text',
        nonNullCount: 10000,
        missingCount: 0,
        uniqueValues: 50,
        examples: []
      })),
      previewRows: [],
      quality: {
        score: 98,
        completeness: 100,
        consistency: 98,
        uniqueness: 100,
        validity: 98,
        issues: []
      }
    };
    setDatasets([sample]);
    setActiveId(sample.id);
    setActiveDatasetDetails(sample);
    try {
      localStorage.setItem(ACTIVE_ID_KEY, sample.id);
      localStorage.setItem(CACHED_DATASETS_KEY, JSON.stringify([sample]));
      localStorage.setItem(CACHED_ACTIVE_KEY, JSON.stringify(sample));
    } catch {}
  }, []);

  const contextValue: DatasetContextValue = {
    datasets,
    filteredDatasets,
    activeDataset,
    activeId,
    isLoading,
    uploadQueue,
    searchTerm,
    setSearchTerm,
    formatFilter,
    setFormatFilter,
    sortOption,
    setSortOption,
    view,
    setView,
    addFilesToQueue,
    removeFromQueue,
    startUpload,
    startAllReady,
    setActiveDataset,
    deleteDataset,
    renameDataset,
    duplicateDataset,
    getDatasetById,
    clearAllDatasets,
    loadSampleDataset,
    refreshDatasets,
  };

  return (
    <DatasetContext.Provider value={contextValue}>
      {children}
    </DatasetContext.Provider>
  );
};

export function useDatasetContext(): DatasetContextValue {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDatasetContext must be used within a DatasetProvider');
  }
  return context;
}
