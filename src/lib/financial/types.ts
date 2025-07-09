export interface FinancialMetrics {
  // Working Capital Metrics
  inventory_value: number;
  accounts_receivable: number;
  accounts_payable: number;
  working_capital: number;
  
  // Cash Conversion Cycle
  days_inventory_outstanding: number;
  days_sales_outstanding: number;
  days_payable_outstanding: number;
  cash_conversion_cycle: number;
  
  // Liquidity Ratios
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  
  // Activity Ratios
  inventory_turnover: number;
  receivables_turnover: number;
  payables_turnover: number;
  asset_turnover: number;
  
  // Profitability Metrics
  gross_margin: number;
  operating_margin: number;
  net_margin: number;
  return_on_assets: number;
  return_on_equity: number;
  
  // Period info
  period_start: Date;
  period_end: Date;
}

export interface CashFlowProjection {
  date: Date;
  
  // Inflows
  sales_collections: number;
  other_income: number;
  total_inflows: number;
  
  // Outflows
  supplier_payments: number;
  operating_expenses: number;
  capital_expenditures: number;
  other_expenses: number;
  total_outflows: number;
  
  // Net Position
  net_cash_flow: number;
  cumulative_cash_position: number;
  
  // Confidence
  confidence_level: 'high' | 'medium' | 'low';
}

export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  
  // Assumptions
  assumptions: {
    sales_growth_rate: number;
    cost_inflation_rate: number;
    payment_terms_change: number;
    inventory_turns_change: number;
    other_assumptions: Record<string, any>;
  };
  
  // Projected Outcomes
  projected_metrics: FinancialMetrics;
  cash_flow_projections: CashFlowProjection[];
  
  // Impact Analysis
  working_capital_impact: number;
  cash_cycle_impact: number;
  profitability_impact: number;
  
  // Risk Assessment
  risk_factors: string[];
  probability: 'high' | 'medium' | 'low';
  impact_severity: 'high' | 'medium' | 'low';
}

export interface OptimizationRecommendation {
  id: string;
  category: 'inventory' | 'receivables' | 'payables' | 'operations';
  title: string;
  description: string;
  
  // Expected Impact
  expected_working_capital_improvement: number;
  expected_cash_cycle_reduction_days: number;
  expected_cost_savings: number;
  
  // Implementation
  effort_required: 'low' | 'medium' | 'high';
  time_to_implement_days: number;
  prerequisites: string[];
  
  // Priority
  priority_score: number; // 0-100
  quick_win: boolean;
}

export interface WorkingCapitalDashboard {
  current_metrics: FinancialMetrics;
  historical_metrics: FinancialMetrics[];
  
  // Trends
  working_capital_trend: 'improving' | 'stable' | 'deteriorating';
  cash_cycle_trend: 'improving' | 'stable' | 'deteriorating';
  
  // Benchmarks
  industry_benchmarks: {
    inventory_turns: number;
    receivables_days: number;
    payables_days: number;
    cash_cycle_days: number;
  };
  
  // Optimization Opportunities
  optimization_potential: {
    inventory_reduction: number;
    receivables_acceleration: number;
    payables_extension: number;
    total_opportunity: number;
  };
  
  recommendations: OptimizationRecommendation[];
}

export interface FinancialAlert {
  id: string;
  type: 'cash_shortage' | 'working_capital_spike' | 'margin_erosion' | 'payment_delay';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric_value: number;
  threshold_value: number;
  created_at: Date;
  acknowledged: boolean;
}