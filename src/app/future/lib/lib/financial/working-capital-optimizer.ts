import { 
  FinancialMetrics, 
  OptimizationRecommendation,
  WorkingCapitalDashboard 
} from './types';

export class WorkingCapitalOptimizer {
  
  analyzeWorkingCapital(
    currentMetrics: FinancialMetrics,
    historicalMetrics: FinancialMetrics[],
    industryBenchmarks: any
  ): WorkingCapitalDashboard {
    
    // Calculate trends
    const workingCapitalTrend = this.calculateWorkingCapitalTrend(currentMetrics, historicalMetrics);
    const cashCycleTrend = this.calculateCashCycleTrend(currentMetrics, historicalMetrics);
    
    // Calculate optimization potential
    const optimizationPotential = this.calculateOptimizationPotential(
      currentMetrics,
      industryBenchmarks
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentMetrics,
      industryBenchmarks,
      optimizationPotential
    );

    return {
      current_metrics: currentMetrics,
      historical_metrics: historicalMetrics,
      working_capital_trend: workingCapitalTrend,
      cash_cycle_trend: cashCycleTrend,
      industry_benchmarks: industryBenchmarks,
      optimization_potential: optimizationPotential,
      recommendations: recommendations.sort((a, b) => b.priority_score - a.priority_score)
    };
  }

  private calculateWorkingCapitalTrend(
    current: FinancialMetrics,
    historical: FinancialMetrics[]
  ): 'improving' | 'stable' | 'deteriorating' {
    if (historical.length < 3) return 'stable';
    
    const recentAvg = historical
      .slice(-3)
      .reduce((sum, m) => sum + m.working_capital, 0) / 3;
    
    const percentChange = ((current.working_capital - recentAvg) / recentAvg) * 100;
    
    if (percentChange < -10) return 'deteriorating';
    if (percentChange > 10) return 'improving';
    return 'stable';
  }

  private calculateCashCycleTrend(
    current: FinancialMetrics,
    historical: FinancialMetrics[]
  ): 'improving' | 'stable' | 'deteriorating' {
    if (historical.length < 3) return 'stable';
    
    const recentAvg = historical
      .slice(-3)
      .reduce((sum, m) => sum + m.cash_conversion_cycle, 0) / 3;
    
    const daysDiff = current.cash_conversion_cycle - recentAvg;
    
    // For cash cycle, lower is better
    if (daysDiff < -5) return 'improving';
    if (daysDiff > 5) return 'deteriorating';
    return 'stable';
  }

  private calculateOptimizationPotential(
    current: FinancialMetrics,
    benchmarks: any
  ): any {
    // Calculate potential improvements based on industry benchmarks
    const inventoryReduction = Math.max(0,
      current.inventory_value - 
      (current.inventory_value * benchmarks.inventory_turns / current.inventory_turnover)
    );
    
    const receivablesAcceleration = Math.max(0,
      current.accounts_receivable * 
      (current.days_sales_outstanding - benchmarks.receivables_days) / 
      current.days_sales_outstanding
    );
    
    const payablesExtension = Math.max(0,
      current.accounts_payable * 
      (benchmarks.payables_days - current.days_payable_outstanding) / 
      benchmarks.payables_days
    );
    
    return {
      inventory_reduction: inventoryReduction,
      receivables_acceleration: receivablesAcceleration,
      payables_extension: payablesExtension,
      total_opportunity: inventoryReduction + receivablesAcceleration + payablesExtension
    };
  }

  private generateRecommendations(
    metrics: FinancialMetrics,
    benchmarks: any,
    potential: any
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Inventory recommendations
    if (metrics.inventory_turnover < benchmarks.inventory_turns * 0.8) {
      recommendations.push({
        id: 'inv-1',
        category: 'inventory',
        title: 'Optimize Inventory Levels',
        description: `Current inventory turns (${metrics.inventory_turnover.toFixed(1)}) are below industry benchmark (${benchmarks.inventory_turns}). Consider implementing JIT practices.`,
        expected_working_capital_improvement: potential.inventory_reduction,
        expected_cash_cycle_reduction_days: 5,
        expected_cost_savings: potential.inventory_reduction * 0.15, // 15% holding cost
        effort_required: 'medium',
        time_to_implement_days: 60,
        prerequisites: ['Demand forecasting system', 'Supplier agreements'],
        priority_score: 85,
        quick_win: false
      });
    }

    // Receivables recommendations
    if (metrics.days_sales_outstanding > benchmarks.receivables_days * 1.2) {
      recommendations.push({
        id: 'rec-1',
        category: 'receivables',
        title: 'Accelerate Collections',
        description: `DSO of ${Math.round(metrics.days_sales_outstanding)} days exceeds benchmark of ${benchmarks.receivables_days} days. Implement stricter credit policies.`,
        expected_working_capital_improvement: potential.receivables_acceleration,
        expected_cash_cycle_reduction_days: metrics.days_sales_outstanding - benchmarks.receivables_days,
        expected_cost_savings: potential.receivables_acceleration * 0.02, // 2% bad debt reduction
        effort_required: 'low',
        time_to_implement_days: 30,
        prerequisites: ['Updated credit policy', 'Collection process'],
        priority_score: 90,
        quick_win: true
      });

      recommendations.push({
        id: 'rec-2',
        category: 'receivables',
        title: 'Offer Early Payment Discounts',
        description: 'Incentivize customers to pay early with 2/10 net 30 terms.',
        expected_working_capital_improvement: potential.receivables_acceleration * 0.3,
        expected_cash_cycle_reduction_days: 10,
        expected_cost_savings: -potential.receivables_acceleration * 0.02, // Cost of discount
        effort_required: 'low',
        time_to_implement_days: 14,
        prerequisites: ['Customer communication'],
        priority_score: 75,
        quick_win: true
      });
    }

    // Payables recommendations
    if (metrics.days_payable_outstanding < benchmarks.payables_days * 0.8) {
      recommendations.push({
        id: 'pay-1',
        category: 'payables',
        title: 'Negotiate Extended Payment Terms',
        description: `Current DPO of ${Math.round(metrics.days_payable_outstanding)} days is below benchmark. Negotiate longer payment terms with suppliers.`,
        expected_working_capital_improvement: potential.payables_extension,
        expected_cash_cycle_reduction_days: benchmarks.payables_days - metrics.days_payable_outstanding,
        expected_cost_savings: 0,
        effort_required: 'medium',
        time_to_implement_days: 45,
        prerequisites: ['Supplier negotiations', 'Strong supplier relationships'],
        priority_score: 70,
        quick_win: false
      });
    }

    // Operations recommendations
    if (metrics.cash_conversion_cycle > benchmarks.cash_cycle_days * 1.3) {
      recommendations.push({
        id: 'ops-1',
        category: 'operations',
        title: 'Implement Supply Chain Finance Program',
        description: 'Use supply chain financing to optimize both payables and receivables.',
        expected_working_capital_improvement: potential.total_opportunity * 0.4,
        expected_cash_cycle_reduction_days: 15,
        expected_cost_savings: potential.total_opportunity * 0.01,
        effort_required: 'high',
        time_to_implement_days: 90,
        prerequisites: ['Banking partner', 'IT integration', 'Supplier onboarding'],
        priority_score: 80,
        quick_win: false
      });
    }

    // Quick win - process improvements
    recommendations.push({
      id: 'ops-2',
      category: 'operations',
      title: 'Automate Invoice Processing',
      description: 'Reduce processing time and errors with automated AP/AR systems.',
      expected_working_capital_improvement: metrics.working_capital * 0.02,
      expected_cash_cycle_reduction_days: 2,
      expected_cost_savings: 50000, // Annual savings from automation
      effort_required: 'medium',
      time_to_implement_days: 60,
      prerequisites: ['Software selection', 'Process mapping'],
      priority_score: 65,
      quick_win: false
    });

    return recommendations;
  }

  calculateROCE(metrics: FinancialMetrics): number {
    // Return on Capital Employed
    const capitalEmployed = metrics.working_capital + metrics.inventory_value;
    const operatingProfit = metrics.operating_margin * (metrics.inventory_value * metrics.inventory_turnover);
    
    return capitalEmployed > 0 ? (operatingProfit / capitalEmployed) * 100 : 0;
  }

  projectCashFlow(
    metrics: FinancialMetrics,
    assumptions: any,
    periods: number = 12
  ): any[] {
    const projections = [];
    let cumulativeCash = metrics.working_capital;
    
    for (let i = 1; i <= periods; i++) {
      const salesGrowthFactor = Math.pow(1 + assumptions.sales_growth_rate / 100, i / 12);
      const costInflationFactor = Math.pow(1 + assumptions.cost_inflation_rate / 100, i / 12);
      
      // Project monthly values
      const monthlySales = (metrics.inventory_value * metrics.inventory_turnover / 12) * salesGrowthFactor;
      const collections = monthlySales * (30 / metrics.days_sales_outstanding);
      const supplierPayments = (monthlySales * (1 - metrics.gross_margin)) * costInflationFactor;
      const operatingExpenses = monthlySales * (metrics.gross_margin - metrics.operating_margin);
      
      const netCashFlow = collections - supplierPayments - operatingExpenses;
      cumulativeCash += netCashFlow;
      
      projections.push({
        month: i,
        sales_collections: collections,
        supplier_payments: supplierPayments,
        operating_expenses: operatingExpenses,
        net_cash_flow: netCashFlow,
        cumulative_cash_position: cumulativeCash,
        confidence_level: i <= 3 ? 'high' : i <= 6 ? 'medium' : 'low'
      });
    }
    
    return projections;
  }
}