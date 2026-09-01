import { useState, useCallback, useRef, useEffect } from 'react';
import type { Dataset, UploadQueueItem, FileFormat, SortOption } from '@/types/datasets';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE_BYTES } from '@/data/mockDatasets';
import { datasetService } from '@/services/datasetService';

const ACTIVE_ID_KEY = 'asklytix_active_dataset_id';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function loadActiveId(): string | null {
  try {
    const val = localStorage.getItem(ACTIVE_ID_KEY);
    if (!val || val === 'null' || val === 'undefined') return null;
    return val;
  } catch {
    return null;
  }
}

function saveActiveId(id: string | null) {
  try {
    if (id && id !== 'null' && id !== 'undefined') {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch {
    /* quota */
  }
}

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(loadActiveId);
  const [activeDatasetDetails, setActiveDatasetDetails] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<FileFormat | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Fetch datasets list from backend on mount
  const refreshDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await datasetService.list();
      setDatasets(list);

      if (!list || list.length === 0) {
        setActiveDatasetDetails(null);
        setActiveId(null);
        saveActiveId(null);
        return;
      }

      // If we have an activeId explicitly in storage matching one in the list, load it
      const currentStoredId = loadActiveId();
      const matched = currentStoredId ? list.find(d => d.id === currentStoredId) : null;

      if (matched && matched.id) {
        try {
          const details = await datasetService.getById(matched.id);
          setActiveDatasetDetails(details);
          setActiveId(matched.id);
          saveActiveId(matched.id);
        } catch {
          setActiveDatasetDetails(null);
          setActiveId(null);
          saveActiveId(null);
        }
      } else {
        setActiveDatasetDetails(null);
        setActiveId(null);
        saveActiveId(null);
      }
    } catch {
      // Backend unauthenticated or empty
      setDatasets([]);
      setActiveDatasetDetails(null);
      setActiveId(null);
      saveActiveId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  // If activeId changes, fetch active dataset details
  useEffect(() => {
    if (activeId) {
      datasetService.getById(activeId)
        .then((details) => {
          setActiveDatasetDetails(details);
        })
        .catch(() => {
          setActiveDatasetDetails(null);
        });
    } else {
      setActiveDatasetDetails(null);
    }
  }, [activeId]);

  const activeDataset = activeDatasetDetails || (activeId ? datasets.find(d => d.id === activeId) : null) || null;

  // ── Computed filtered+sorted dataset list ──
  const filteredDatasets = datasets
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

  // ── Upload queue management ──
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
      // Send real file to FastAPI backend
      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'processing', progress: 65 } : q)
      );

      const res = await datasetService.upload(item.file);
      const uploaded = res.data;

      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'completed', progress: 100, completedDatasetId: uploaded.dataset_id } : q)
      );

      // Set active dataset ID only (no full dataset rows in localStorage)
      setActiveId(uploaded.dataset_id);
      saveActiveId(uploaded.dataset_id);

      // Refresh dataset list
      refreshDatasets();
    } catch (err: any) {
      setUploadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, state: 'error', error: err?.message || 'Upload failed' } : q)
      );
    }
  }, [uploadQueue, refreshDatasets]);

  const startAllReady = useCallback(() => {
    uploadQueue
      .filter(q => q.state === 'ready')
      .forEach(q => startUpload(q.id));
  }, [uploadQueue, startUpload]);

  // ── Dataset CRUD operations ──
  const setActiveDataset = useCallback((id: string) => {
    setActiveId(id);
    saveActiveId(id);
    datasetService.getById(id).then(details => {
      setActiveDatasetDetails(details);
    }).catch(() => {});
  }, []);

  const deleteDataset = useCallback(async (id: string) => {
    try {
      await datasetService.delete(id);
      setDatasets(prev => prev.filter(d => d.id !== id));
      if (activeId === id) {
        setActiveId(null);
        saveActiveId(null);
        setActiveDatasetDetails(null);
      }
    } catch {
      setDatasets(prev => prev.filter(d => d.id !== id));
    }
  }, [activeId]);

  const renameDataset = useCallback((id: string, newName: string): string | null => {
    const duplicate = datasets.some(d => d.id !== id && d.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) return 'A dataset with this name already exists.';
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    return null;
  }, [datasets]);

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
    setDatasets(prev => [clone, ...prev]);
  }, [datasets]);

  const getDatasetById = useCallback((id: string) => {
    return datasets.find(d => d.id === id) ?? null;
  }, [datasets]);

  const clearAllDatasets = useCallback(async () => {
    try {
      await datasetService.purgeSessionStorage();
    } catch {
      // ignore
    }
    setActiveId(null);
    saveActiveId(null);
    setActiveDatasetDetails(null);
    setDatasets([]);
    try {
      localStorage.removeItem(ACTIVE_ID_KEY);
      localStorage.removeItem('asklytix_dashboard_widgets');
      localStorage.removeItem('asklytix_dashboard_active_region');
    } catch {}
  }, []);

  return {
    datasets,
    filteredDatasets,
    activeDataset,
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
    refreshDatasets,
  };
}
