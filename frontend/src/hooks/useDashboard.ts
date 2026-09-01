import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  GlobalFilterState, 
  DashboardWidget, 
  DashboardPageTab, 
  WidgetType,
  KPIItem,
  ChartDataPoint,
  CategorySalesData,
  CustomerSegmentData,
  RegionData
} from '@/types/dashboard';
import { initialTabs, aiInsightPools } from '@/data/mockDashboardData';
import { datasetService } from '@/services/datasetService';
import type { SavedVisualizationItem } from '@/services/datasetService';

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'w_kpi_default', type: 'kpi', title: 'Dataset Key Performance Indicators', colSpan: 4, position: 1 },
  { id: 'w_line_default', type: 'line_chart', title: 'Performance Trend Over Time', colSpan: 2, position: 2 },
  { id: 'w_bar_default', type: 'bar_chart', title: 'Sales & Records by Category', colSpan: 2, position: 3 },
  { id: 'w_donut_default', type: 'donut_chart', title: 'Segment & Customer Distribution', colSpan: 1, position: 4 },
  { id: 'w_area_default', type: 'area_chart', title: 'Growth Area Trajectory', colSpan: 2, position: 5 },
  { id: 'w_radar_default', type: 'radar_chart', title: 'Radar Performance Matrix', colSpan: 2, position: 6 },
  { id: 'w_map_default', type: 'map', title: 'Geographic Distribution & Real-Time Map', colSpan: 2, position: 7 },
  { id: 'w_table_default', type: 'table', title: 'Top Performing Items', colSpan: 2, position: 8 },
  { id: 'w_insights_default', type: 'ai_insight', title: 'AI Analysis & Recommendations', colSpan: 1, position: 9 },
];

export function useDashboard() {
  const [activeDashboard, setActiveDashboard] = useState<string>('Executive Overview');
  const [tabs, setTabs] = useState<DashboardPageTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [filters, setFilters] = useState<GlobalFilterState>({
    dateRange: '30d',
    region: 'all',
    category: 'all'
  });

  // Start with empty widgets or populated default
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState<boolean>(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(true);

  const [insightIndex, setInsightIndex] = useState<number>(0);
  const [isRefreshingAI, setIsRefreshingAI] = useState<boolean>(false);

  // Real backend metrics — only populated when a real dataset exists
  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Active dataset identity info — pulled from backend
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeDatasetName, setActiveDatasetName] = useState<string | null>(null);
  const [activeDatasetColumns, setActiveDatasetColumns] = useState<string[]>([]);
  const [activeDatasetRowCount, setActiveDatasetRowCount] = useState<number>(0);

  const populateDefaultWidgets = useCallback(() => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS);
  }, []);

  const loadSavedVisualizations = useCallback((dsId: string) => {
    if (!dsId || dsId === 'null' || dsId === 'undefined') return;
    datasetService.getVisualizations(dsId)
      .then((res) => {
        if (res && res.visualizations && res.visualizations.length > 0) {
          const savedWidgets: DashboardWidget[] = res.visualizations.map((item: SavedVisualizationItem) => ({
            id: item.id,
            type: 'sandbox_chart',
            title: item.title,
            colSpan: 4,
            position: item.position,
            imageUrl: item.image_url,
            base64Image: item.base64_image,
            html: item.html,
            generatedCode: item.generated_code,
            executionTimeMs: item.execution_time_ms,
            columnsUsed: item.columns_used,
            chartType: item.chart_type,
            explanation: item.explanation
          }));
          // Preserve existing non-sandbox or append
          setWidgets((prev) => {
            const nonSandbox = prev.filter(w => w.type !== 'sandbox_chart');
            return [...nonSandbox, ...savedWidgets];
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadMetrics = useCallback((datasetId: string) => {
    if (!datasetId || datasetId === 'null' || datasetId === 'undefined') return;
    setIsLoadingMetrics(true);
    datasetService.getDashboardMetrics(datasetId)
      .then((metrics) => {
        if (metrics && (metrics.kpis?.length > 0 || metrics.mainChartData?.length > 0)) {
          setBackendMetrics(metrics);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingMetrics(false));
    
    // Also load persistent visualizations
    loadSavedVisualizations(datasetId);
  }, [loadSavedVisualizations]);

  // Fetch real aggregated metrics from active backend dataset
  useEffect(() => {
    const rawStoredId = localStorage.getItem('asklytix_active_dataset_id');
    const storedId = (rawStoredId && rawStoredId !== 'null' && rawStoredId !== 'undefined') ? rawStoredId : null;

    if (!storedId) {
      setActiveDatasetId(null);
      setActiveDatasetName(null);
      setActiveDatasetColumns([]);
      setActiveDatasetRowCount(0);
      setBackendMetrics(null);
      return;
    }

    setActiveDatasetId(storedId);
    loadMetrics(storedId);

    // Also load dataset metadata (name, columns, rows)
    datasetService.getById(storedId)
      .then((ds: any) => {
        if (ds && ds.id) {
          setActiveDatasetName(ds.name);
          setActiveDatasetRowCount(ds.rows ?? 0);
          if (ds.columnDefs && Array.isArray(ds.columnDefs)) {
            setActiveDatasetColumns(ds.columnDefs.map((s: any) => s.name || s.column_name || s.field || (typeof s === 'string' ? s : '')).filter(Boolean));
          } else if (ds.schema && Array.isArray(ds.schema)) {
            setActiveDatasetColumns(ds.schema.map((s: any) => s.name || s.column_name || (typeof s === 'string' ? s : '')).filter(Boolean));
          } else if (ds.columns && Array.isArray(ds.columns)) {
            setActiveDatasetColumns(ds.columns);
          }
        }
      })
      .catch(() => {
        setActiveDatasetId(null);
        setActiveDatasetName(null);
        setActiveDatasetColumns([]);
        setActiveDatasetRowCount(0);
        setBackendMetrics(null);
        try {
          localStorage.removeItem('asklytix_active_dataset_id');
        } catch {}
      });

    // Also fetch preview for columns guarantee
    datasetService.getPreview(storedId, { limit: 5, offset: 0 }).then((prev: any) => {
      if (prev?.columns && Array.isArray(prev.columns) && prev.columns.length > 0) {
        setActiveDatasetColumns(prev.columns);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow external refresh when active dataset changes (e.g., after upload)
  const refreshForDataset = useCallback((id: string, name?: string, columns?: string[], rows?: number) => {
    setActiveDatasetId(id);
    if (name) setActiveDatasetName(name);
    if (columns) setActiveDatasetColumns(columns);
    if (rows !== undefined) setActiveDatasetRowCount(rows);
    setBackendMetrics(null);
    setWidgets([]); // Clear old widgets when switching datasets
    loadMetrics(id);
  }, [loadMetrics]);

  const updateFilters = useCallback((newFilters: Partial<GlobalFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ dateRange: '30d', region: 'all', category: 'all' });
  }, []);

  const addDashboardTab = useCallback(() => {
    const newId = `tab_${Date.now()}`;
    const newTab = { id: newId, label: `Custom Page ${tabs.length + 1}` };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newId);
  }, [tabs.length]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const addWidget = useCallback((type: WidgetType, title: string, colSpan: 1 | 2 | 3 | 4 = 2) => {
    const newWidget: DashboardWidget = {
      id: `w_${Date.now()}`,
      type,
      title,
      colSpan,
      position: widgets.length + 1
    };
    setWidgets((prev) => [...prev, newWidget]);
    setIsAddWidgetModalOpen(false);
  }, [widgets.length]);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    // If it's a saved sandbox visual, delete from backend
    if (!id.startsWith('w_') || id.includes('-')) {
      datasetService.deleteVisualization(id).catch(() => {});
    }
  }, []);

  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
    if (activeDatasetId) {
      datasetService.clearAllVisualizations(activeDatasetId).catch(() => {});
    }
  }, [activeDatasetId]);

  const generateBatchWidgets = useCallback((newWidgets: DashboardWidget[]) => {
    setWidgets((prev) => [...prev, ...newWidgets]);
  }, []);

  const duplicateWidget = useCallback((id: string) => {
    const target = widgets.find((w) => w.id === id);
    if (!target) return;
    const clone: DashboardWidget = {
      ...target,
      id: `w_${Date.now()}`,
      title: `${target.title} (Copy)`,
      position: widgets.length + 1
    };
    setWidgets((prev) => [...prev, clone]);
  }, [widgets]);

  const refreshAIInsights = useCallback(() => {
    setIsRefreshingAI(true);
    setTimeout(() => {
      setInsightIndex((prev) => (prev + 1) % aiInsightPools.length);
      setIsRefreshingAI(false);
    }, 1200);
  }, []);

  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null);

  // Determine whether a real dataset is loaded
  const hasDataset = Boolean(
    activeDatasetId && 
    activeDatasetId !== 'null' && 
    activeDatasetId !== 'undefined' && 
    (activeDatasetName || backendMetrics || isLoadingMetrics)
  );

  // Base raw metrics
  const rawKpis = backendMetrics?.kpis ?? [];
  const rawMainChartData = backendMetrics?.mainChartData ?? [];
  const rawCategorySales = backendMetrics?.categorySales ?? [];
  const rawCustomerSegments = backendMetrics?.customerSegments ?? [];
  const rawRegionData = backendMetrics?.regionData ?? [];
  const rawTopProducts = backendMetrics?.topProducts ?? [];

  // Find active location region object
  const activeRegionObj = useMemo<RegionData | null>(() => {
    if (!selectedLocationFilter || rawRegionData.length === 0) return null;
    return rawRegionData.find(
      (r: RegionData) => r.name.toLowerCase() === selectedLocationFilter.toLowerCase()
    ) ?? null;
  }, [selectedLocationFilter, rawRegionData]);

  // Dynamically cross-filtered metrics for all visual boxes
  const kpis = useMemo<KPIItem[]>(() => {
    if (!activeRegionObj || rawKpis.length === 0) return rawKpis;
    const ratio = activeRegionObj.sharePct ? activeRegionObj.sharePct / 100 : (activeRegionObj.revenue / Math.max(rawKpis[0]?.value || 1, 1));
    return rawKpis.map((kpi: KPIItem) => {
      if (kpi.id === 'rev') {
        return { ...kpi, label: `${activeRegionObj.name} Revenue`, value: activeRegionObj.revenue, change: activeRegionObj.growth };
      }
      if (kpi.id === 'records') {
        return { ...kpi, label: `${activeRegionObj.name} Records`, value: activeRegionObj.records || Math.round(kpi.value * ratio) };
      }
      if (kpi.id === 'profit') {
        return { ...kpi, label: `${activeRegionObj.name} Net Profit`, value: Math.round(activeRegionObj.revenue * 0.32) };
      }
      if (kpi.id === 'aov') {
        const records = activeRegionObj.records || 1;
        return { ...kpi, label: `${activeRegionObj.name} Avg Value`, value: Math.round((activeRegionObj.revenue / records) * 100) / 100 };
      }
      return { ...kpi, value: Math.round(kpi.value * Math.max(ratio, 0.2)) };
    });
  }, [activeRegionObj, rawKpis]);

  const mainChartData = useMemo<ChartDataPoint[]>(() => {
    if (!activeRegionObj || rawMainChartData.length === 0) return rawMainChartData;
    const ratio = activeRegionObj.sharePct ? activeRegionObj.sharePct / 100 : (activeRegionObj.revenue / Math.max(rawKpis[0]?.value || 1, 1));
    return rawMainChartData.map((d: ChartDataPoint) => ({
      ...d,
      revenue: Math.round(d.revenue * Math.max(ratio, 0.15)),
      profit: Math.round(d.profit * Math.max(ratio, 0.15)),
      orders: Math.max(1, Math.round(d.orders * Math.max(ratio, 0.15)))
    }));
  }, [activeRegionObj, rawMainChartData, rawKpis]);

  const categorySales = useMemo<CategorySalesData[]>(() => {
    if (!activeRegionObj || rawCategorySales.length === 0) return rawCategorySales;
    const ratio = activeRegionObj.sharePct ? activeRegionObj.sharePct / 100 : 0.4;
    return rawCategorySales.map((c: CategorySalesData) => ({
      ...c,
      amount: Math.round(c.amount * Math.max(ratio, 0.2))
    }));
  }, [activeRegionObj, rawCategorySales]);

  const customerSegments = useMemo<CustomerSegmentData[]>(() => {
    if (!activeRegionObj || rawCustomerSegments.length === 0) return rawCustomerSegments;
    const ratio = activeRegionObj.sharePct ? activeRegionObj.sharePct / 100 : 0.4;
    return rawCustomerSegments.map((s: CustomerSegmentData) => ({
      ...s,
      count: Math.max(1, Math.round(s.count * Math.max(ratio, 0.2)))
    }));
  }, [activeRegionObj, rawCustomerSegments]);

  const currentInsights = aiInsightPools[insightIndex];

  return {
    activeDashboard,
    setActiveDashboard,
    tabs,
    activeTab,
    setActiveTab,
    addDashboardTab,
    filters,
    updateFilters,
    resetFilters,
    widgets,
    isEditMode,
    toggleEditMode,
    isAddWidgetModalOpen,
    setIsAddWidgetModalOpen,
    isAIChatOpen,
    setIsAIChatOpen,
    addWidget,
    removeWidget,
    clearAllWidgets,
    generateBatchWidgets,
    duplicateWidget,
    populateDefaultWidgets,
    refreshAIInsights,
    isRefreshingAI,
    // Dataset info
    hasDataset,
    isLoadingMetrics,
    activeDatasetId,
    activeDatasetName,
    activeDatasetColumns,
    activeDatasetRowCount,
    refreshForDataset,
    // Connected Location Cross-Filter
    selectedLocationFilter,
    setSelectedLocationFilter,
    // Real data payload (cross-filtered for all visual boxes)
    kpis,
    mainChartData,
    categorySales,
    customerSegments,
    regionData: rawRegionData,
    currentInsights,
    getTopProducts: () => rawTopProducts
  };
}
