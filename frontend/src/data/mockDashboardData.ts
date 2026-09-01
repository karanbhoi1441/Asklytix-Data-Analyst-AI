import type { 
  GlobalFilterState, 
  KPIItem, 
  ChartDataPoint, 
  CategorySalesData, 
  CustomerSegmentData, 
  RegionData, 
  ProductItem, 
  AIInsightItem 
} from '@/types/dashboard';

export const initialTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products' },
  { id: 'forecast', label: 'Forecast' }
];

export const initialWidgets = [
  { id: 'kpi_grid', type: 'kpi' as const, title: 'Key Metrics Overview', colSpan: 4 as const, position: 1 },
  { id: 'main_revenue_chart', type: 'line_chart' as const, title: 'Revenue Performance', colSpan: 3 as const, position: 2 },
  { id: 'customer_distribution', type: 'donut_chart' as const, title: 'Customer Distribution', colSpan: 1 as const, position: 3 },
  { id: 'sales_by_category', type: 'bar_chart' as const, title: 'Sales by Category', colSpan: 2 as const, position: 4 },
  { id: 'geographic_performance', type: 'map' as const, title: 'Revenue by Region', colSpan: 2 as const, position: 5 },
  { id: 'top_products_table', type: 'table' as const, title: 'Top Performing Products', colSpan: 3 as const, position: 6 },
  { id: 'ai_insights_panel', type: 'ai_insight' as const, title: 'AskLytix AI Insights', colSpan: 1 as const, position: 7 }
];

// Helper multiplier based on filter state
function getFilterMultiplier(filters: GlobalFilterState): number {
  let mult = 1.0;
  if (filters.dateRange === '7d') mult *= 0.25;
  if (filters.dateRange === '3m') mult *= 2.8;
  if (filters.dateRange === '6m') mult *= 5.2;
  if (filters.dateRange === '1y') mult *= 9.5;

  if (filters.region === 'north') mult *= 0.35;
  if (filters.region === 'south') mult *= 0.25;
  if (filters.region === 'east') mult *= 0.22;
  if (filters.region === 'west') mult *= 0.18;

  if (filters.category === 'electronics') mult *= 0.45;
  if (filters.category === 'clothing') mult *= 0.25;
  if (filters.category === 'home') mult *= 0.20;
  if (filters.category === 'accessories') mult *= 0.10;

  return mult;
}

export function getKPIs(filters: GlobalFilterState): KPIItem[] {
  const m = getFilterMultiplier(filters);

  return [
    {
      id: 'rev',
      label: 'Total Revenue',
      value: Math.round(1284500 * m),
      prefix: '$',
      change: 12.5,
      isPositive: true,
      sparkline: [35, 42, 58, 52, 68, 74, 82, 95],
      icon: 'DollarSign'
    },
    {
      id: 'cust',
      label: 'Total Customers',
      value: Math.round(24530 * (m > 1 ? m * 0.7 : Math.max(0.3, m))),
      change: 8.2,
      isPositive: true,
      sparkline: [120, 140, 155, 180, 210, 240, 255],
      icon: 'Users'
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: Math.round(8942 * (m > 1 ? m * 0.75 : Math.max(0.35, m))),
      change: 15.7,
      isPositive: true,
      sparkline: [40, 45, 62, 58, 72, 85, 94],
      icon: 'ShoppingBag'
    },
    {
      id: 'aov',
      label: 'Average Order Value',
      value: Number((143.65 * (0.95 + (m % 0.1))).toFixed(2)),
      prefix: '$',
      change: 4.3,
      isPositive: true,
      sparkline: [130, 135, 142, 138, 145, 141, 143],
      icon: 'TrendingUp'
    }
  ];
}

export function getMainChartData(filters: GlobalFilterState): ChartDataPoint[] {
  const m = getFilterMultiplier(filters);
  const baseMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return baseMonths.map((month, idx) => {
    const baseRev = (80000 + idx * 8500 + (idx % 3) * 6000) * m;
    const baseProfit = baseRev * 0.34;
    const baseOrders = (600 + idx * 45 + (idx % 2) * 30) * (m > 1 ? m * 0.7 : Math.max(0.3, m));

    return {
      label: month,
      revenue: Math.round(baseRev),
      profit: Math.round(baseProfit),
      orders: Math.round(baseOrders)
    };
  });
}

export function getCategorySales(filters: GlobalFilterState): CategorySalesData[] {
  const m = getFilterMultiplier(filters);

  return [
    { category: 'Electronics', amount: Math.round(485000 * m), pct: 38 },
    { category: 'Clothing', amount: Math.round(310000 * m), pct: 24 },
    { category: 'Home & Living', amount: Math.round(240000 * m), pct: 19 },
    { category: 'Accessories', amount: Math.round(155000 * m), pct: 12 },
    { category: 'Other', amount: Math.round(94500 * m), pct: 7 }
  ];
}

export function getCustomerSegments(): CustomerSegmentData[] {
  return [
    { name: 'Returning Customers', percentage: 54, color: '#06b6d4', count: 13246 },
    { name: 'New Customers', percentage: 32, color: '#3b82f6', count: 7849 },
    { name: 'Premium VIP Members', percentage: 14, color: '#a855f7', count: 3435 }
  ];
}

export function getRegionData(filters: GlobalFilterState): RegionData[] {
  const m = getFilterMultiplier(filters);

  return [
    { id: 'r1', name: 'North America', revenue: Math.round(450000 * m), growth: 14.2, intensity: 0.9, x: 25, y: 35 },
    { id: 'r2', name: 'Europe East', revenue: Math.round(320000 * m), growth: 9.8, intensity: 0.7, x: 52, y: 30 },
    { id: 'r3', name: 'Asia Pacific', revenue: Math.round(280000 * m), growth: 18.5, intensity: 0.8, x: 75, y: 45 },
    { id: 'r4', name: 'Latin America', revenue: Math.round(140000 * m), growth: -2.4, intensity: 0.4, x: 32, y: 70 },
    { id: 'r5', name: 'Middle East', revenue: Math.round(94500 * m), growth: 6.1, intensity: 0.5, x: 62, y: 52 }
  ];
}

export function getTopProducts(filters: GlobalFilterState, searchTerm: string = ''): ProductItem[] {
  const m = getFilterMultiplier(filters);

  const products: ProductItem[] = [
    { id: 'p1', rank: 1, name: 'AskLytix Neural Edge Sensor X1', category: 'Electronics', revenue: Math.round(184200 * m), orders: 1280, growth: 24.5 },
    { id: 'p2', rank: 2, name: 'Pro Data Hub Gateway v2', category: 'Electronics', revenue: Math.round(142000 * m), orders: 940, growth: 18.2 },
    { id: 'p3', rank: 3, name: 'Quantum Analytics Terminal', category: 'Electronics', revenue: Math.round(118500 * m), orders: 620, growth: 31.0 },
    { id: 'p4', rank: 4, name: 'Cybernetic Tech Hoodie Pro', category: 'Clothing', revenue: Math.round(95400 * m), orders: 2150, growth: 12.4 },
    { id: 'p5', rank: 5, name: 'Smart Desk Ambient Mesh', category: 'Home & Living', revenue: Math.round(82100 * m), orders: 890, growth: -4.2 },
    { id: 'p6', rank: 6, name: 'Holographic Display Stand', category: 'Accessories', revenue: Math.round(68300 * m), orders: 1420, growth: 8.9 },
    { id: 'p7', rank: 7, name: 'Ergonomic AI Chair Core', category: 'Home & Living', revenue: Math.round(54200 * m), orders: 410, growth: 15.1 },
    { id: 'p8', rank: 8, name: 'Wireless Data Pulse Keypad', category: 'Accessories', revenue: Math.round(42800 * m), orders: 1890, growth: 6.7 }
  ];

  if (!searchTerm) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export const aiInsightPools: AIInsightItem[][] = [
  [
    {
      id: 'i1',
      type: 'opportunity',
      title: 'Electronics Revenue Surge',
      text: 'Revenue increased 12.5% compared to the previous period, driven primarily by high demand in Electronics.',
      impact: '+12.5% Rev'
    },
    {
      id: 'i2',
      type: 'trend',
      title: 'High Customer Loyalty',
      text: 'Returning customers generated 63% of total revenue this month with a 4.2x higher AOV.',
      impact: '63% Revenue'
    },
    {
      id: 'i3',
      type: 'warning',
      title: 'Regional Dip in South',
      text: 'Sales in the South region declined 7.2%, which may require promotional adjustments.',
      impact: '-7.2% Sales'
    },
    {
      id: 'i4',
      type: 'recommendation',
      title: 'Inventory Reorder Alert',
      text: 'AskLytix Neural Edge Sensor X1 stock is depleting 2.4x faster than predicted. Recommend reordering.',
      impact: 'Stock Alert'
    }
  ],
  [
    {
      id: 'i5',
      type: 'opportunity',
      title: 'Asia-Pacific Growth Acceleration',
      text: 'Asia Pacific region demonstrated an 18.5% quarter-over-quarter surge in net enterprise volume.',
      impact: '+18.5% Volume'
    },
    {
      id: 'i6',
      type: 'trend',
      title: 'Mobile Checkout Dominance',
      text: 'Mobile transactions represented 54% of total cart completions during peak hours.',
      impact: '54% Mobile'
    },
    {
      id: 'i7',
      type: 'recommendation',
      title: 'Bundle Promotion Strategy',
      text: 'Pairing Accessories with Neural Sensors could increase total cart AOV by an estimated 8.4%.',
      impact: '+8.4% AOV'
    }
  ]
];
