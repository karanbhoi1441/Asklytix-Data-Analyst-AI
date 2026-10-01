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
import { useDatasets } from '@/hooks/useDatasets';

export function useDashboard() {
  const { activeDataset, activeId } = useDatasets();

  const [activeDashboard, setActiveDashboard] = useState<string>('Executive Overview');
  const [tabs, setTabs] = useState<DashboardPageTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [filters, setFilters] = useState<GlobalFilterState>({
    dateRange: '30d',
    region: 'all',
    category: 'all'
  });

  // Widgets connected directly to active dataset visualizations (no random mock widgets)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    try {
      const saved = localStorage.getItem('asklytix_dashboard_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState<boolean>(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(true);

  const [insightIndex, setInsightIndex] = useState<number>(0);
  const [isRefreshingAI, setIsRefreshingAI] = useState<boolean>(false);

  // Real backend metrics — populated for the active dataset
  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Active dataset identity info — pulled from active dataset
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(activeId);
  const [activeDatasetName, setActiveDatasetName] = useState<string | null>(activeDataset?.name || null);
  const [activeDatasetColumns, setActiveDatasetColumns] = useState<string[]>(
    (activeDataset?.columnDefs || []).map((c: any) => c.name || String(c))
  );
  const [activeDatasetRowCount, setActiveDatasetRowCount] = useState<number>(activeDataset?.rows || 0);

  // Persist widgets to storage whenever they change
  useEffect(() => {
    try {
      if (widgets.length > 0) {
        localStorage.setItem('asklytix_dashboard_widgets', JSON.stringify(widgets));
      } else {
        localStorage.removeItem('asklytix_dashboard_widgets');
      }
    } catch {}
  }, [widgets]);

  const loadSavedVisualizations = useCallback((dsId: string) => {
    if (!dsId || dsId === 'null' || dsId === 'undefined') return;
    datasetService.getVisualizations(dsId)
      .then((res) => {
        if (res && res.visualizations && res.visualizations.length > 0) {
          const savedWidgets: DashboardWidget[] = res.visualizations.map((item: SavedVisualizationItem) => {
            const chartData = item.data || item.chart_specification?.data || [];
            return {
              id: item.id,
              type: (item.chart_type === 'kpi') ? 'kpi' : 'sandbox_chart',
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
              explanation: item.explanation,
              spec: item.chart_specification || {
                title: item.title,
                chart_type: item.chart_type,
                data: chartData,
                columns_used: item.columns_used,
                interactive: true
              },
              data: chartData
            };
          });
          setWidgets(savedWidgets);
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

  // Synchronize whenever activeDataset or activeId changes in DatasetContext
  useEffect(() => {
    const currentId = activeDataset?.id || activeId || localStorage.getItem('asklytix_active_dataset_id');

    if (!currentId || currentId === 'null' || currentId === 'undefined') {
      setActiveDatasetId(null);
      setActiveDatasetName(null);
      setActiveDatasetColumns([]);
      setActiveDatasetRowCount(0);
      setBackendMetrics(null);
      return;
    }

    setActiveDatasetId(currentId);

    if (activeDataset) {
      setActiveDatasetName(activeDataset.name);
      setActiveDatasetRowCount(activeDataset.rows || 0);
      if (activeDataset.columnDefs && activeDataset.columnDefs.length > 0) {
        setActiveDatasetColumns(activeDataset.columnDefs.map((c: any) => c.name || String(c)));
      }
    }

    loadMetrics(currentId);

    // Fetch schema details if columns are missing
    datasetService.getById(currentId)
      .then((ds: any) => {
        if (ds && ds.id) {
          setActiveDatasetName(ds.name);
          setActiveDatasetRowCount(ds.rows ?? 0);
          if (ds.columnsList && Array.isArray(ds.columnsList) && ds.columnsList.length > 0) {
            setActiveDatasetColumns(ds.columnsList);
          } else if (ds.columnDefs && Array.isArray(ds.columnDefs)) {
            setActiveDatasetColumns(ds.columnDefs.map((s: any) => s.name || s.column_name || s.field || (typeof s === 'string' ? s : '')).filter(Boolean));
          } else if (ds.columns && Array.isArray(ds.columns)) {
            setActiveDatasetColumns(ds.columns);
          }
        }
      })
      .catch(() => {});

    // Ensure preview columns are available
    datasetService.getPreview(currentId, { limit: 5, offset: 0 }).then((prev: any) => {
      if (prev?.columns && Array.isArray(prev.columns) && prev.columns.length > 0) {
        setActiveDatasetColumns(prev.columns);
      }
    }).catch(() => {});
  }, [activeDataset, activeId, loadMetrics]);

  // Allow external refresh when active dataset changes
  const refreshForDataset = useCallback((id: string, name?: string, columns?: string[], rows?: number) => {
    setActiveDatasetId(id);
    if (name) setActiveDatasetName(name);
    if (columns) setActiveDatasetColumns(columns);
    if (rows !== undefined) setActiveDatasetRowCount(rows);
    setBackendMetrics(null);
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
    if (!id.startsWith('w_') || id.includes('-')) {
      datasetService.deleteVisualization(id).catch(() => {});
    }
  }, []);

  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
    try {
      localStorage.removeItem('asklytix_dashboard_widgets');
    } catch {}
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

  const populateDefaultWidgets = useCallback(() => {
    if (activeDatasetId) {
      loadSavedVisualizations(activeDatasetId);
    }
  }, [activeDatasetId, loadSavedVisualizations]);

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
    hasDataset,
    isLoadingMetrics,
    activeDatasetId,
    activeDatasetName,
    activeDatasetColumns,
    activeDatasetRowCount,
    refreshForDataset,
    selectedLocationFilter,
    setSelectedLocationFilter,
    kpis,
    mainChartData,
    categorySales,
    customerSegments,
    regionData: rawRegionData,
    currentInsights,
    getTopProducts: () => rawTopProducts
  };
}
