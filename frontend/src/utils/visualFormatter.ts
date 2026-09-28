/**
 * Unified Visual & Chart Naming Formatter
 * Standardizes visual titles and chart type labels across Dashboard, Reports, and Visualizations Gallery.
 */

const CHART_TYPE_MAP: Record<string, string> = {
  bar: 'Bar Chart',
  bar_chart: 'Bar Chart',
  vertical_bar: 'Vertical Bar Chart',
  horizontal_bar: 'Horizontal Bar Chart',
  barh: 'Horizontal Bar Chart',
  pie: 'Pie Chart',
  pie_chart: 'Pie Chart',
  donut: 'Donut Chart',
  donut_chart: 'Donut Chart',
  line: 'Line Chart',
  line_chart: 'Line Chart',
  area: 'Area Chart',
  area_chart: 'Area Chart',
  scatter: 'Scatter Plot',
  scatter_plot: 'Scatter Plot',
  bubble: 'Bubble Chart',
  histogram: 'Histogram',
  hist: 'Histogram',
  heatmap: 'Heatmap',
  correlation_heatmap: 'Correlation Heatmap',
  corr_matrix: 'Correlation Matrix',
  radar: 'Radar Chart',
  radar_chart: 'Radar Chart',
  spider: 'Radar Chart',
  box: 'Box Plot',
  box_plot: 'Box Plot',
  violin: 'Violin Plot',
  violin_plot: 'Violin Plot',
  funnel: 'Funnel Chart',
  funnel_chart: 'Funnel Chart',
  waterfall: 'Waterfall Chart',
  waterfall_chart: 'Waterfall Chart',
  treemap: 'Treemap',
  gantt: 'Gantt Timeline Chart',
  gantt_chart: 'Gantt Timeline Chart',
  stacked: 'Stacked Bar Chart',
  stacked_bar: 'Stacked Bar Chart',
  grouped: 'Grouped Bar Chart',
  grouped_bar: 'Grouped Bar Chart',
  map: 'Geographic Map',
  geographic_map: 'Geographic Map',
  kpi: 'KPI Metric Card',
  metric_card: 'KPI Metric Card',
  table: 'Data Table',
  ai_insight: 'AI Analysis & Insights',
  sandbox_chart: 'Interactive Chart'
};

/**
 * Returns a clean, human-readable name for any chart type string.
 * Example: 'horizontal_bar' -> 'Horizontal Bar Chart', 'pie' -> 'Pie Chart'
 */
export function formatChartTypeName(rawType?: string): string {
  if (!rawType) return 'Visualization Chart';

  const normalized = rawType.trim().toLowerCase();
  if (CHART_TYPE_MAP[normalized]) {
    return CHART_TYPE_MAP[normalized];
  }

  // Handle composite or unknown keys
  const cleaned = rawType
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  if (
    cleaned.toLowerCase().includes('chart') ||
    cleaned.toLowerCase().includes('plot') ||
    cleaned.toLowerCase().includes('map') ||
    cleaned.toLowerCase().includes('card') ||
    cleaned.toLowerCase().includes('table') ||
    cleaned.toLowerCase().includes('matrix') ||
    cleaned.toLowerCase().includes('funnel') ||
    cleaned.toLowerCase().includes('treemap') ||
    cleaned.toLowerCase().includes('histogram')
  ) {
    return cleaned;
  }

  return `${cleaned} Chart`;
}

/**
 * Cleans and standardizes visual titles across reports, widgets, and charts.
 * Removes raw column underscores and ensures proper capitalization.
 * Example: 'car_model distribution' -> 'Car Model Distribution'
 */
export function formatVisualTitle(rawTitle?: string): string {
  if (!rawTitle) return 'Dataset Visualization';

  let cleaned = rawTitle.trim();

  // Strip leading action verbs if user query was passed as title
  cleaned = cleaned.replace(/^(show|display|plot|create|generate|give me)\s+/i, '');

  // Replace underscores with spaces
  cleaned = cleaned.replace(/_+/g, ' ');

  // Standardize common abbreviations and title-case
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (['kpi', 'id', 'ai', 'usd', 'inr', 'ctc', 'roi', 'mrr', 'arr'].includes(lower)) {
        return lower.toUpperCase();
      }
      if (['by', 'of', 'in', 'vs', 'and', 'for', 'to', 'on', 'with'].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
