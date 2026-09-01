export type FileFormat = 'csv' | 'xlsx' | 'xls' | 'json' | 'parquet';
export type UploadState = 'ready' | 'uploading' | 'processing' | 'completed' | 'error';
export type DatasetStatus = 'active' | 'ready' | 'processing' | 'error';
export type ColumnType = 'numeric' | 'text' | 'date' | 'boolean';
export type DatasetView = 'grid' | 'table';
export type SortOption = 'recent' | 'name_asc' | 'name_desc' | 'size_desc' | 'rows_desc';

export interface DatasetColumn {
  name: string;
  type: ColumnType;
  nonNullCount: number;
  missingCount: number;
  uniqueValues: number;
  examples: string[];
  min?: number;
  max?: number;
  mean?: number;
}

export interface DataQualityIssue {
  severity: 'warning' | 'success';
  message: string;
}

export interface DataQualityResult {
  score: number;
  completeness: number;
  consistency: number;
  uniqueness: number;
  validity: number;
  integrity?: number;
  issues: DataQualityIssue[];
}

export type QualityMetrics = DataQualityResult;

export interface DatasetPreviewRow {
  [key: string]: string | number | null;
}

export interface Dataset {
  id: string;
  name: string;
  format: FileFormat;
  sizeBytes: number;
  sizeLabel: string;
  rows: number;
  columns: number;
  uploadedAt: string;
  status: DatasetStatus;
  isActive: boolean;
  columnDefs: DatasetColumn[];
  previewRows: DatasetPreviewRow[];
  quality: DataQualityResult;
  active_version_id?: string;
  schema?: any[];
}

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  format: FileFormat | null;
  sizeLabel: string;
  state: UploadState;
  progress: number;
  error?: string;
  completedDatasetId?: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  actionLabel: string;
  tag: string;
}
