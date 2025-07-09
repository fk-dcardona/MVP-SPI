import { WorkingCapitalOptimizer } from '@/lib/financial/working-capital-optimizer';
import { FinancialMetrics } from '@/lib/financial/types';

describe('WorkingCapitalOptimizer', () => {
  let optimizer: WorkingCapitalOptimizer;
  let currentMetrics: FinancialMetrics;
  let historicalMetrics: FinancialMetrics[];
  let industryBenchmarks: any;

  beforeEach(() => {
    optimizer = new WorkingCapitalOptimizer();
    
    const baseDate = new Date('2024-01-31');
    currentMetrics = {
      // Working Capital Metrics
      inventory_value: 1000000,
      accounts_receivable: 800000,
      accounts_payable: 600000,
      working_capital: 1200000,
      
      // Cash Conversion Cycle
      days_inventory_outstanding: 45,
      days_sales_outstanding: 60,
      days_payable_outstanding: 30,
      cash_conversion_cycle: 75,
      
      // Liquidity Ratios
      current_ratio: 2.0,
      quick_ratio: 1.5,
      cash_ratio: 0.5,
      
      // Activity Ratios
      inventory_turnover: 8,
      receivables_turnover: 6,
      payables_turnover: 12,
      asset_turnover: 2,
      
      // Profitability Metrics
      gross_margin: 0.35,
      operating_margin: 0.15,
      net_margin: 0.10,
      return_on_assets: 0.12,
      return_on_equity: 0.20,
      
      period_start: new Date('2024-01-01'),
      period_end: baseDate
    };

    historicalMetrics = [
      { ...currentMetrics, working_capital: 1100000, cash_conversion_cycle: 80 },
      { ...currentMetrics, working_capital: 1150000, cash_conversion_cycle: 78 },
      { ...currentMetrics, working_capital: 1180000, cash_conversion_cycle: 76 }
    ];

    industryBenchmarks = {
      inventory_turns: 12,
      receivables_days: 45,
      payables_days: 45,
      cash_cycle_days: 60
    };
  });

  describe('analyzeWorkingCapital', () => {
    it('should analyze working capital correctly', () => {
      const dashboard = optimizer.analyzeWorkingCapital(
        currentMetrics,
        historicalMetrics,
        industryBenchmarks
      );

      expect(dashboard.current_metrics).toEqual(currentMetrics);
      expect(dashboard.historical_metrics).toEqual(historicalMetrics);
      expect(dashboard.industry_benchmarks).toEqual(industryBenchmarks);
      expect(dashboard.optimization_potential).toBeDefined();
      expect(dashboard.recommendations).toBeInstanceOf(Array);
    });

    it('should calculate trends correctly', () => {
      const dashboard = optimizer.analyzeWorkingCapital(
        currentMetrics,
        historicalMetrics,
        industryBenchmarks
      );

      expect(dashboard.working_capital_trend).toBe('stable');
      expect(dashboard.cash_cycle_trend).toBe('stable');
    });

    it('should identify optimization potential', () => {
      const dashboard = optimizer.analyzeWorkingCapital(
        currentMetrics,
        historicalMetrics,
        industryBenchmarks
      );

      expect(dashboard.optimization_potential.inventory_reduction).toBeGreaterThan(0);
      expect(dashboard.optimization_potential.receivables_acceleration).toBeGreaterThan(0);
      expect(dashboard.optimization_potential.payables_extension).toBeGreaterThan(0);
      expect(dashboard.optimization_potential.total_opportunity).toBeGreaterThan(0);
    });

    it('should generate relevant recommendations', () => {
      const dashboard = optimizer.analyzeWorkingCapital(
        currentMetrics,
        historicalMetrics,
        industryBenchmarks
      );

      expect(dashboard.recommendations.length).toBeGreaterThan(0);
      
      const categories = dashboard.recommendations.map(r => r.category);
      expect(categories).toContain('inventory');
      expect(categories).toContain('receivables');
      
      dashboard.recommendations.forEach(rec => {
        expect(rec.priority_score).toBeGreaterThan(0);
        expect(rec.priority_score).toBeLessThanOrEqual(100);
        expect(rec.expected_working_capital_improvement).toBeGreaterThanOrEqual(0);
      });
    });

    it('should prioritize quick wins', () => {
      const dashboard = optimizer.analyzeWorkingCapital(
        currentMetrics,
        historicalMetrics,
        industryBenchmarks
      );

      const quickWins = dashboard.recommendations.filter(r => r.quick_win);
      expect(quickWins.length).toBeGreaterThan(0);
      
      quickWins.forEach(win => {
        expect(win.effort_required).toBe('low');
        expect(win.time_to_implement_days).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('calculateROCE', () => {
    it('should calculate ROCE correctly', () => {
      const roce = optimizer.calculateROCE(currentMetrics);
      
      expect(roce).toBeGreaterThan(0);
      expect(roce).toBeLessThan(100);
    });

    it('should handle zero capital employed', () => {
      const metricsWithZeroCapital = {
        ...currentMetrics,
        working_capital: 0,
        inventory_value: 0
      };
      
      const roce = optimizer.calculateROCE(metricsWithZeroCapital);
      expect(roce).toBe(0);
    });
  });

  describe('projectCashFlow', () => {
    it('should project cash flow for 12 periods', () => {
      const assumptions = {
        sales_growth_rate: 10,
        cost_inflation_rate: 3
      };
      
      const projections = optimizer.projectCashFlow(currentMetrics, assumptions, 12);
      
      expect(projections).toHaveLength(12);
      expect(projections[0].month).toBe(1);
      expect(projections[11].month).toBe(12);
    });

    it('should calculate cumulative cash position', () => {
      const assumptions = {
        sales_growth_rate: 10,
        cost_inflation_rate: 3
      };
      
      const projections = optimizer.projectCashFlow(currentMetrics, assumptions, 6);
      
      for (let i = 1; i < projections.length; i++) {
        const previousCash = projections[i - 1].cumulative_cash_position;
        const netFlow = projections[i].net_cash_flow;
        const currentCash = projections[i].cumulative_cash_position;
        
        expect(currentCash).toBeCloseTo(previousCash + netFlow, 2);
      }
    });

    it('should apply confidence levels correctly', () => {
      const assumptions = {
        sales_growth_rate: 10,
        cost_inflation_rate: 3
      };
      
      const projections = optimizer.projectCashFlow(currentMetrics, assumptions, 12);
      
      expect(projections[0].confidence_level).toBe('high');
      expect(projections[5].confidence_level).toBe('medium');
      expect(projections[11].confidence_level).toBe('low');
    });

    it('should handle negative growth rates', () => {
      const assumptions = {
        sales_growth_rate: -10,
        cost_inflation_rate: 5
      };
      
      const projections = optimizer.projectCashFlow(currentMetrics, assumptions, 6);
      
      projections.forEach(projection => {
        expect(projection.sales_collections).toBeGreaterThan(0);
        expect(projection.supplier_payments).toBeGreaterThan(0);
      });
    });
  });
});