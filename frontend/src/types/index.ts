export type LogoSize = 'small' | 'medium' | 'large';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'number';

export type CardVariant = 'default' | 'glass' | 'analytics' | 'interactive';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md';

export type PageLayoutMode = 'standard' | 'canvas';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  section?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  trend: string;
  icon: string;
}
