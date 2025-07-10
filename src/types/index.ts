export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  companies?: Company;
}

export interface DashboardMetrics {
  inventory_value: number;
  monthly_sales: number;
  active_suppliers: number;
  open_alerts: number;
  supply_chain_score: {
    service: number;
    cost: number;
    capital: number;
    overall: number;
  };
}

export interface ActivityLog {
  id: string;
  company_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: any;
  created_at: string;
  user_id?: string;
}

export type UserPersona = 'streamliner' | 'navigator' | 'hub' | 'spring' | 'processor';

export interface DashboardPreferences {
  layout: string;
  widgets: string[];
  theme: 'light' | 'dark';
  shortcuts: boolean;
  notifications: boolean;
}