export type DateRangeOption = '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';
export type RegionOption = 'all' | 'north' | 'south' | 'east' | 'west';
export type CategoryOption = 'all' | 'electronics' | 'clothing' | 'home' | 'accessories';

export interface GlobalFilterState {
  dateRange: DateRangeOption;
  region: RegionOption;
  category: CategoryOption;
}

export type MetricType = 'revenue' | 'profit' | 'orders';
export type TimeHorizon = 'month' | 'quarter' | 'year';
export type BarOrientation = 'vertical' | 'horizontal';

export interface KPIItem {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  isPositive: boolean;
  sparkline: number[];
  icon: string;
}

export interface ProductItem {
  id: string;
  rank: number;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  growth: number;
}

export type InsightType = 'opportunity' | 'trend' | 'warning' | 'recommendation';

export interface AIInsightItem {
  id: string;
  type: InsightType;
  title: string;
  text: string;
  impact: string;
}

export type WidgetType = 
  | 'kpi' 
  | 'line_chart' 
  | 'bar_chart' 
  | 'donut_chart' 
  | 'area_chart'
  | 'radar_chart'
  | 'table' 
  | 'ai_insight' 
  | 'map'
  | 'sandbox_chart';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  colSpan?: 1 | 2 | 3 | 4;
  position: number;
  customPrompt?: string;
  imageUrl?: string;
  base64Image?: string;
  generatedCode?: string;
  executionTimeMs?: number;
  columnsUsed?: string[];
  chartType?: string;
  explanation?: string;
  spec?: any;
  data?: any;
  html?: string;
}


export interface DashboardPageTab {
  id: string;
  label: string;
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface CategorySalesData {
  category: string;
  amount: number;
  pct: number;
}

export interface CustomerSegmentData {
  name: string;
  percentage: number;
  color: string;
  count: number;
}

export interface RegionData {
  id: string;
  name: string;
  revenue: number;
  growth: number;
  intensity: number;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  records?: number;
  sharePct?: number;
}

export interface RadarDataPoint {
  metric: string;
  score: number;
  benchmark: number;
}
