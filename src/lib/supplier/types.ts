export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days: number;
  minimum_order_value?: number;
  created_at: Date;
  updated_at: Date;
}

export interface SupplierPerformance {
  supplier_id: string;
  period_start: Date;
  period_end: Date;
  
  // Delivery Performance
  total_orders: number;
  on_time_deliveries: number;
  late_deliveries: number;
  very_late_deliveries: number; // > 3 days late
  average_delay_days: number;
  on_time_delivery_rate: number;
  
  // Quality Performance
  total_items_received: number;
  defective_items: number;
  defect_rate: number;
  quality_complaints: number;
  
  // Cost Performance
  total_spend: number;
  price_variance: number; // % variance from quoted prices
  invoice_accuracy_rate: number;
  discount_captured: number;
  
  // Responsiveness
  average_response_time_hours: number;
  quote_turnaround_days: number;
  issue_resolution_days: number;
  
  // Overall Score
  delivery_score: number; // 0-100
  quality_score: number; // 0-100
  cost_score: number; // 0-100
  responsiveness_score: number; // 0-100
  overall_score: number; // Weighted average
}

export interface SupplierScorecard {
  supplier: Supplier;
  current_performance: SupplierPerformance;
  historical_performance: SupplierPerformance[];
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  supplier_id: string;
  order_number: string;
  order_date: Date;
  expected_delivery_date: Date;
  actual_delivery_date?: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  items: PurchaseOrderItem[];
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_price: number;
  total_price: number;
  defective_quantity?: number;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  averageLeadTime: number;
  averageOnTimeRate: number;
  totalSpend: number;
  topSuppliersBySpend: Array<{
    supplier: Supplier;
    spend: number;
    percentage: number;
  }>;
  performanceDistribution: {
    excellent: number; // >= 90%
    good: number; // 70-89%
    fair: number; // 50-69%
    poor: number; // < 50%
  };
}

export interface SupplierFilter {
  search?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  performanceLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  minSpend?: number;
  maxSpend?: number;
}