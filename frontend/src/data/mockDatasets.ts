import type { Dataset, DatasetColumn, DatasetPreviewRow, DataQualityResult } from '@/types/datasets';

const salesColumns: DatasetColumn[] = [
  { name: 'order_id', type: 'text', nonNullCount: 10000, missingCount: 0, uniqueValues: 10000, examples: ['ORD-10001', 'ORD-10002', 'ORD-10003'] },
  { name: 'order_date', type: 'date', nonNullCount: 10000, missingCount: 0, uniqueValues: 365, examples: ['2026-01-15', '2026-02-22', '2026-03-08'] },
  { name: 'customer_name', type: 'text', nonNullCount: 9982, missingCount: 18, uniqueValues: 4230, examples: ['Alice Morgan', 'Bob Chen', 'Diana Park'] },
  { name: 'product', type: 'text', nonNullCount: 10000, missingCount: 0, uniqueValues: 148, examples: ['Neural Edge Sensor X1', 'Pro Data Hub', 'Quantum Terminal'] },
  { name: 'category', type: 'text', nonNullCount: 10000, missingCount: 0, uniqueValues: 5, examples: ['Electronics', 'Clothing', 'Home & Living'] },
  { name: 'region', type: 'text', nonNullCount: 9968, missingCount: 32, uniqueValues: 5, examples: ['North', 'South', 'East', 'West'] },
  { name: 'quantity', type: 'numeric', nonNullCount: 10000, missingCount: 0, uniqueValues: 49, examples: ['1', '2', '5'], min: 1, max: 50, mean: 3.4 },
  { name: 'unit_price', type: 'numeric', nonNullCount: 10000, missingCount: 0, uniqueValues: 148, examples: ['299.99', '149.50', '79.00'], min: 9.99, max: 4999.99, mean: 143.65 },
  { name: 'revenue', type: 'numeric', nonNullCount: 10000, missingCount: 0, uniqueValues: 5204, examples: ['1499.95', '299.00', '395.00'], min: 9.99, max: 24999.95, mean: 488.41 },
  { name: 'profit', type: 'numeric', nonNullCount: 10000, missingCount: 0, uniqueValues: 4891, examples: ['509.98', '101.66', '134.30'], min: 1.50, max: 8499.98, mean: 166.06 },
  { name: 'discount_pct', type: 'numeric', nonNullCount: 9870, missingCount: 130, uniqueValues: 11, examples: ['0', '0.05', '0.10'], min: 0, max: 0.5, mean: 0.08 },
  { name: 'payment_method', type: 'text', nonNullCount: 10000, missingCount: 0, uniqueValues: 4, examples: ['Credit Card', 'PayPal', 'Bank Transfer'] },
  { name: 'is_returned', type: 'boolean', nonNullCount: 10000, missingCount: 0, uniqueValues: 2, examples: ['false', 'true'] },
];

const salesPreviewRows: DatasetPreviewRow[] = [
  { order_id: 'ORD-10001', order_date: '2026-01-15', customer_name: 'Alice Morgan', product: 'Neural Edge Sensor X1', category: 'Electronics', region: 'North', quantity: 2, unit_price: 299.99, revenue: 599.98, profit: 203.99, discount_pct: 0, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10002', order_date: '2026-01-16', customer_name: 'Bob Chen', product: 'Pro Data Hub v2', category: 'Electronics', region: 'West', quantity: 1, unit_price: 149.50, revenue: 149.50, profit: 50.83, discount_pct: 0, payment_method: 'PayPal', is_returned: 'false' },
  { order_id: 'ORD-10003', order_date: '2026-01-17', customer_name: 'Diana Park', product: 'Cybernetic Hoodie Pro', category: 'Clothing', region: 'South', quantity: 3, unit_price: 79.00, revenue: 237.00, profit: 80.58, discount_pct: 0.05, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10004', order_date: '2026-01-18', customer_name: 'Marcus Lee', product: 'Smart Desk Ambient Mesh', category: 'Home & Living', region: 'East', quantity: 1, unit_price: 249.00, revenue: 249.00, profit: 84.66, discount_pct: 0, payment_method: 'Bank Transfer', is_returned: 'false' },
  { order_id: 'ORD-10005', order_date: '2026-01-19', customer_name: null, product: 'Neural Edge Sensor X1', category: 'Electronics', region: 'North', quantity: 5, unit_price: 299.99, revenue: 1499.95, profit: 509.98, discount_pct: 0.10, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10006', order_date: '2026-01-20', customer_name: 'Priya Sharma', product: 'Holographic Display Stand', category: 'Accessories', region: 'West', quantity: 2, unit_price: 89.99, revenue: 179.98, profit: 61.19, discount_pct: 0, payment_method: 'PayPal', is_returned: 'true' },
  { order_id: 'ORD-10007', order_date: '2026-01-21', customer_name: 'Ethan Brooks', product: 'Quantum Analytics Terminal', category: 'Electronics', region: null, quantity: 1, unit_price: 1299.00, revenue: 1299.00, profit: 441.66, discount_pct: 0, payment_method: 'Bank Transfer', is_returned: 'false' },
  { order_id: 'ORD-10008', order_date: '2026-01-22', customer_name: 'Lena Fischer', product: 'Ergonomic AI Chair Core', category: 'Home & Living', region: 'East', quantity: 1, unit_price: 549.00, revenue: 549.00, profit: 186.66, discount_pct: 0, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10009', order_date: '2026-01-23', customer_name: 'James Wilson', product: 'Cybernetic Hoodie Pro', category: 'Clothing', region: 'South', quantity: 4, unit_price: 79.00, revenue: 316.00, profit: 107.44, discount_pct: 0.05, payment_method: 'PayPal', is_returned: 'false' },
  { order_id: 'ORD-10010', order_date: '2026-01-24', customer_name: 'Sofia Rossi', product: 'Wireless Data Pulse Keypad', category: 'Accessories', region: 'North', quantity: 3, unit_price: 49.99, revenue: 149.97, profit: 50.99, discount_pct: 0, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10011', order_date: '2026-01-25', customer_name: 'Chen Wei', product: 'Pro Data Hub v2', category: 'Electronics', region: 'West', quantity: 2, unit_price: 149.50, revenue: 299.00, profit: 101.66, discount_pct: 0, payment_method: 'Bank Transfer', is_returned: 'false' },
  { order_id: 'ORD-10012', order_date: '2026-01-26', customer_name: 'Anna Schmidt', product: 'Neural Edge Sensor X1', category: 'Electronics', region: 'East', quantity: 1, unit_price: 299.99, revenue: 299.99, profit: 101.99, discount_pct: 0.10, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10013', order_date: '2026-01-27', customer_name: 'Ahmed Hassan', product: 'Smart Desk Ambient Mesh', category: 'Home & Living', region: 'North', quantity: 2, unit_price: 249.00, revenue: 498.00, profit: 169.32, discount_pct: 0, payment_method: 'PayPal', is_returned: 'false' },
  { order_id: 'ORD-10014', order_date: '2026-01-28', customer_name: 'Maya Patel', product: 'Holographic Display Stand', category: 'Accessories', region: 'South', quantity: 5, unit_price: 89.99, revenue: 449.95, profit: 152.98, discount_pct: 0.05, payment_method: 'Credit Card', is_returned: 'false' },
  { order_id: 'ORD-10015', order_date: '2026-01-29', customer_name: 'Riku Tanaka', product: 'Quantum Analytics Terminal', category: 'Electronics', region: null, quantity: 1, unit_price: 1299.00, revenue: 1299.00, profit: 441.66, discount_pct: 0, payment_method: 'Bank Transfer', is_returned: 'false' },
];

const salesQuality: DataQualityResult = {
  score: 92,
  completeness: 97,
  consistency: 96,
  uniqueness: 99,
  validity: 95,
  issues: [
    { severity: 'warning', message: '32 missing values in "region" column' },
    { severity: 'warning', message: '18 missing values in "customer_name" column' },
    { severity: 'warning', message: '130 missing values in "discount_pct" column' },
    { severity: 'warning', message: '8 duplicate order rows detected' },
    { severity: 'success', message: 'All order_date values are valid ISO-8601 format' },
    { severity: 'success', message: 'Numeric columns (quantity, revenue, profit) successfully validated' },
    { severity: 'success', message: 'No negative revenue or profit anomalies found' },
    { severity: 'success', message: 'Boolean column "is_returned" is fully populated' },
  ]
};

export const INITIAL_MOCK_DATASETS: Dataset[] = [
  {
    id: 'ds-001',
    name: 'Sales Performance 2026',
    format: 'csv',
    sizeBytes: 2411520,
    sizeLabel: '2.4 MB',
    rows: 10000,
    columns: 13,
    uploadedAt: '2026-08-27T10:30:00Z',
    status: 'active',
    isActive: true,
    columnDefs: salesColumns,
    previewRows: salesPreviewRows,
    quality: salesQuality,
  },
  {
    id: 'ds-002',
    name: 'Customer Churn Events Q3',
    format: 'parquet',
    sizeBytes: 90701824,
    sizeLabel: '86.5 MB',
    rows: 890200,
    columns: 42,
    uploadedAt: '2026-08-26T14:15:00Z',
    status: 'ready',
    isActive: false,
    columnDefs: salesColumns.slice(0, 6),
    previewRows: salesPreviewRows.slice(0, 10),
    quality: { ...salesQuality, score: 88, completeness: 91, issues: salesQuality.issues.slice(0, 3) },
  },
  {
    id: 'ds-003',
    name: 'Marketing Campaign Results',
    format: 'xlsx',
    sizeBytes: 1258291,
    sizeLabel: '1.2 MB',
    rows: 5420,
    columns: 18,
    uploadedAt: '2026-08-25T09:00:00Z',
    status: 'ready',
    isActive: false,
    columnDefs: salesColumns.slice(0, 8),
    previewRows: salesPreviewRows.slice(0, 8),
    quality: { ...salesQuality, score: 95, completeness: 99, issues: salesQuality.issues.slice(4) },
  },
  {
    id: 'ds-004',
    name: 'User Behavior Telemetry',
    format: 'json',
    sizeBytes: 8493466,
    sizeLabel: '8.1 MB',
    rows: 54100,
    columns: 16,
    uploadedAt: '2026-08-24T16:45:00Z',
    status: 'ready',
    isActive: false,
    columnDefs: salesColumns.slice(0, 7),
    previewRows: salesPreviewRows.slice(0, 12),
    quality: { ...salesQuality, score: 79, completeness: 84, issues: salesQuality.issues },
  },
  {
    id: 'ds-005',
    name: 'Inventory Stock Levels',
    format: 'csv',
    sizeBytes: 734003,
    sizeLabel: '717 KB',
    rows: 12800,
    columns: 10,
    uploadedAt: '2026-08-23T11:20:00Z',
    status: 'ready',
    isActive: false,
    columnDefs: salesColumns.slice(0, 5),
    previewRows: salesPreviewRows.slice(0, 6),
    quality: { ...salesQuality, score: 97, completeness: 99, issues: salesQuality.issues.slice(4) },
  },
];

export const MOCK_RECENT_UPLOADS = INITIAL_MOCK_DATASETS.map(d => ({ ...d, uploadedAt: d.uploadedAt }));

export const FORMAT_LABELS: Record<string, string> = {
  csv: 'CSV',
  xlsx: 'Excel XLSX',
  xls: 'Excel XLS',
  json: 'JSON',
  parquet: 'Parquet',
};

export const SUPPORTED_FORMATS = ['csv', 'xlsx', 'xls', 'json', 'parquet'] as const;
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB mock limit
