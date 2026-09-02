import { apiClient } from '@/services/apiClient';
import type { Dataset, DatasetPreviewRow, QualityMetrics } from '@/types/datasets';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    dataset_id: string;
    name: string;
    format: string;
    size_bytes: number;
    sizeLabel: string;
    row_count: number;
    column_count: number;
    status: string;
    active_version_id: string;
    quality: QualityMetrics;
    schema: any[];
    preview: DatasetPreviewRow[];
  };
}

export interface PreviewResponse {
  total_rows: number;
  limit: number;
  offset: number;
  columns: string[];
  rows: DatasetPreviewRow[];
}

export interface CleanResponse {
  success: boolean;
  message: string;
  version_id: string;
  version_number: number;
  quality: QualityMetrics;
  audit_log: string[];
  new_score: number;
  rows: number;
  columns: number;
}

export interface AnalysisResponse {
  text: string;
  insights: string[];
  stats?: { label: string; value: string }[];
  codeSnippet?: string;
  codeDetails?: any;
  rows?: Record<string, any>[];  // inline table rows returned by analysis
  rowColumns?: string[];          // column names for the rows table
}


export interface SavedVisualizationItem {
  id: string;
  dataset_id?: string;
  user_question: string;
  chart_type: string;
  title: string;
  columns_used: string[];
  sandbox_execution_id?: string;
  image_url?: string;
  base64_image?: string;
  html?: string;
  generated_code?: string;
  explanation?: string;
  execution_time_ms: number;
  position: number;
  created_at?: string;
}

export interface VisualizationResponse {
  status: 'success' | 'validation_error' | 'validation_failed' | 'execution_failed' | string;
  execution_id?: string;
  execution_time_ms?: number;
  html?: string;
  visualization?: {
    id?: string;
    title: string;
    chart_type: string;
    visualization_type?: string;
    value?: any;
    formatted_value?: string;
    label?: string;
    filters?: Record<string, any>;
    interactive?: boolean;
    html?: string;
    image_url?: string;
    base64_image?: string;
    columns_used: string[];
    category_column?: string;
    value_column?: string;
    geo_column?: string;
    metric_column?: string;
    aggregation?: string;
    data?: any[];
    status?: string;
  };

  chart_specification?: any;
  saved_item?: SavedVisualizationItem;
  generated_code?: string;
  explanation?: string;
  message?: string;
  details?: string[];
}


export interface VisualSuggestionItem {
  id: string;
  suggestion_number?: number;
  title: string;
  description?: string;
  chart_type: string;
  x_column?: string;
  y_column?: string;
  group_column?: string;
  aggregation?: string;
  icon: string;
  prompt: string;
  columns?: string[];
  reason?: string;
  confidence?: number;
}



export interface VisualSuggestionsResponse {
  dataset_id: string;
  dataset_name: string;
  total_suggestions: number;
  suggestions: VisualSuggestionItem[];
}

export interface VisualizationListResponse {
  total: number;
  visualizations: SavedVisualizationItem[];
}

export interface DashboardMetricsResponse {
  kpis: any[];
  mainChartData: any[];
  categorySales: any[];
  customerSegments: any[];
  regionData: any[];
  topProducts: any[];
}

export const datasetService = {
  async upload(file: File, name?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
    return apiClient.post<UploadResponse>('/api/v1/datasets/upload', formData);
  },

  async list(): Promise<Dataset[]> {
    return apiClient.get<Dataset[]>('/api/v1/datasets');
  },

  async getById(id: string): Promise<Dataset> {
    return apiClient.get<Dataset>(`/api/v1/datasets/${id}`);
  },

  async getPreview(
    id: string,
    params?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      categoryFilter?: string;
      categoryCol?: string;
    }
  ): Promise<PreviewResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.sortBy) query.set('sort_by', params.sortBy);
    if (params?.sortOrder) query.set('sort_order', params.sortOrder);
    if (params?.search) query.set('search', params.search);
    if (params?.categoryFilter) query.set('category_filter', params.categoryFilter);
    if (params?.categoryCol) query.set('category_col', params.categoryCol);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<PreviewResponse>(`/api/v1/datasets/${id}/preview${qs}`);
  },

  async getQuality(id: string): Promise<QualityMetrics> {
    return apiClient.get<QualityMetrics>(`/api/v1/datasets/${id}/quality`);
  },

  async autoClean(id: string): Promise<CleanResponse> {
    return apiClient.post<CleanResponse>(`/api/v1/datasets/${id}/clean`);
  },

  getDownloadUrl(datasetId: string, versionId: string): string {
    const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
    const base = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    return `${base}/api/v1/datasets/${datasetId}/versions/${versionId}/download`;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/datasets/${id}`);
  },

  async queryAnalysis(datasetId: string, query: string): Promise<AnalysisResponse> {
    return apiClient.post<AnalysisResponse>('/api/v1/analysis/query', {
      dataset_id: datasetId,
      query,
    });
  },

  async generateVisualization(
    datasetId: string,
    prompt: string,
    mode: string = 'chart_builder'
  ): Promise<VisualizationResponse> {
    return apiClient.post<VisualizationResponse>('/api/v1/visualizations/generate', {
      dataset_id: datasetId,
      prompt,
      mode
    });
  },

  async getVisualSuggestions(datasetId?: string): Promise<VisualSuggestionsResponse> {
    const qs = datasetId ? `?dataset_id=${datasetId}` : '';
    return apiClient.get<VisualSuggestionsResponse>(`/api/v1/visualizations/suggestions${qs}`);
  },

  async getVisualizations(datasetId?: string): Promise<VisualizationListResponse> {
    const qs = datasetId ? `?dataset_id=${datasetId}` : '';
    return apiClient.get<VisualizationListResponse>(`/api/v1/visualizations${qs}`);
  },

  async deleteVisualization(visualId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/visualizations/${visualId}`);
  },

  async clearAllVisualizations(datasetId?: string): Promise<{ success: boolean; message: string }> {
    const qs = datasetId ? `?dataset_id=${datasetId}` : '';
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/visualizations/clear/all${qs}`);
  },

  async transform(datasetId: string, prompt: string): Promise<{
    success: boolean;
    message: string;
    version_id: string;
    version_number: number;
    total_rows: number;
    columns: string[];
    rows: DatasetPreviewRow[];
  }> {
    return apiClient.post('/api/v1/analysis/transform', {
      dataset_id: datasetId,
      prompt,
    });
  },

  async getAggregates(datasetId: string): Promise<{ aggregates: any[] }> {
    return apiClient.get<{ aggregates: any[] }>(`/api/v1/datasets/${datasetId}/aggregates`);
  },

  async getDashboardMetrics(datasetId?: string): Promise<DashboardMetricsResponse> {
    const qs = datasetId ? `?dataset_id=${datasetId}` : '';
    return apiClient.get<DashboardMetricsResponse>(`/api/v1/dashboard/metrics${qs}`);
  },

  async purgeSessionStorage(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/v1/datasets/session/purge');
  },
};

