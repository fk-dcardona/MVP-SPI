import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Extended Analytics Types based on SUPPLY_CHAIN_ANALYTICS_EXTRACTION.md
export interface ExtendedInventoryMetrics {
  inventoryTurnover: number;
  daysOfSupply: number;
  stockHealthScore: string;
  reorderPoint: number;
  holdingCost: number;
  orderingCost: number;
  shortageCost: number;
}

export interface ExtendedFinancialMetrics {
  workingCapital: number;
  workingCapitalRatio: number;
  cashConversionCycle: number;
  daysInventoryOutstanding: number;
  daysSalesOutstanding: number;
  daysPayableOutstanding: number;
  grossMargin: number;
  returnOnCapitalEmployed: number;
}

export interface ExtendedPerformanceMetrics {
  fillRate: number;
  orderAccuracy: number;
  averageLeadTime: number;
  leadTimeVariability: number;
  supplierPerformanceScore: number;
}

export interface DemandForecast {
  sku: string;
  forecastedDemand: number;
  seasonalityIndex: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  confidenceLevel: number;
}

export interface RiskAssessment {
  category: 'inventory' | 'supplier' | 'financial' | 'market';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: Record<string, any>;
}

export interface CostOptimizationOpportunity {
  type: string;
  sku?: string;
  currentValue: number;
  potentialSavings: number;
  recommendation: string;
  priority: number;
}

export interface IndustryBenchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  percentile: number;
  recommendation?: string;
}

export class ExtendedAnalyticsService {
  private supabase = createClientComponentClient();
  
  // Industry benchmarks based on EXTRACTION.md
  private readonly industryBenchmarks = {
    retail: {
      inventory_turns: 8,
      receivables_days: 30,
      payables_days: 45,
      cash_cycle_days: 15,
      gross_margin: 35,
      fill_rate: 95
    },
    manufacturing: {
      inventory_turns: 6,
      receivables_days: 45,
      payables_days: 60,
      cash_cycle_days: 30,
      gross_margin: 25,
      fill_rate: 92
    },
    distribution: {
      inventory_turns: 12,
      receivables_days: 25,
      payables_days: 50,
      cash_cycle_days: 5,
      gross_margin: 20,
      fill_rate: 98
    }
  };

  // Alert thresholds from EXTRACTION.md
  private readonly alertThresholds = {
    inventory: {
      stockout: { threshold: 0, severity: 'critical' },
      critical: { threshold: 3, severity: 'high' },
      warning: { threshold: 7, severity: 'medium' },
      excess: { threshold: 90, severity: 'low' }
    },
    supplier: {
      excellent: { threshold: 90, severity: 'low' },
      good: { threshold: 70, severity: 'medium' },
      fair: { threshold: 50, severity: 'high' },
      poor: { threshold: 0, severity: 'critical' }
    },
    financial: {
      workingCapitalRatio: { min: 1.0, max: 3.0, severity: 'medium' },
      cashConversionCycle: { max: 60, severity: 'high' },
      inventoryTurnover: { min: 6, severity: 'medium' }
    }
  };

  // Calculate extended inventory metrics
  async calculateExtendedInventoryMetrics(
    companyId: string,
    sku?: string
  ): Promise<ExtendedInventoryMetrics[]> {
    // Use the database function for turnover calculation
    const { data: turnoverData, error } = await this.supabase
      .rpc('calculate_inventory_turnover', { 
        p_company_id: companyId,
        p_days: 30
      });

    if (error) throw error;

    const metrics: ExtendedInventoryMetrics[] = [];
    
    for (const item of turnoverData || []) {
      if (sku && item.sku !== sku) continue;

      const dailyVelocity = (item as any).units_sold / 30;
      const leadTimeDays = 7; // Default lead time
      const safetyStockDays = 3;
      
      // Calculate reorder point
      const reorderPoint = dailyVelocity * (leadTimeDays + safetyStockDays);
      
      // Stock health scoring
      const stockHealth = this.getStockHealthStatus((item as any).avg_inventory, (item as any).days_of_supply);
      
      // Cost calculations (simplified)
      const holdingCostRate = 0.20; // 20% annual holding cost
      const averageInventoryValue = (item as any).avg_inventory * 50; // Assuming $50 unit cost
      const holdingCost = (averageInventoryValue * holdingCostRate) / 12; // Monthly
      
      const orderingCost = 100; // Fixed cost per order
      const numberOfOrders = (item as any).units_sold > 0 ? Math.ceil((item as any).units_sold / 100) : 0;
      const totalOrderingCost = numberOfOrders * orderingCost;
      
      // Shortage cost based on stockout events
      const stockoutEvents = (item as any).days_of_supply === 0 ? 1 : 0;
      const shortageCost = stockoutEvents * 500; // $500 per stockout

      metrics.push({
        inventoryTurnover: (item as any).turnover_rate,
        daysOfSupply: (item as any).days_of_supply,
        stockHealthScore: stockHealth,
        reorderPoint: Math.ceil(reorderPoint),
        holdingCost,
        orderingCost: totalOrderingCost,
        shortageCost
      });
    }

    return metrics;
  }

  // Calculate working capital and financial metrics
  async calculateWorkingCapitalMetrics(companyId: string): Promise<ExtendedFinancialMetrics> {
    const { data, error } = await this.supabase
      .rpc('calculate_working_capital_metrics', { 
        p_company_id: companyId
      });

    if (error) throw error;

    const metrics = data[0];
    
    // Calculate additional metrics
    const daysInventoryOutstanding = metrics.cash_conversion_cycle + 45 - 30; // CCC + DPO - DSO
    const daysSalesOutstanding = 30; // From the function
    const daysPayableOutstanding = 45; // From the function
    
    // Estimate gross margin from recent sales
    const { data: salesData } = await this.supabase
      .from('sales_transactions')
      .select('revenue, quantity')
      .eq('company_id', companyId)
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    let grossMargin = 0;
    if (salesData && salesData.length > 0) {
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
      const estimatedCost = totalRevenue * 0.65; // Assume 65% COGS
      grossMargin = totalRevenue > 0 ? ((totalRevenue - estimatedCost) / totalRevenue) * 100 : 0;
    }

    // Calculate ROCE (simplified)
    const capitalEmployed = metrics.working_capital * 1.5; // Simplified estimation
    const operatingProfit = metrics.inventory_value * 0.15; // 15% of inventory value
    const roce = capitalEmployed > 0 ? (operatingProfit / capitalEmployed) * 100 : 0;

    return {
      workingCapital: metrics.working_capital,
      workingCapitalRatio: metrics.working_capital_ratio,
      cashConversionCycle: metrics.cash_conversion_cycle,
      daysInventoryOutstanding,
      daysSalesOutstanding,
      daysPayableOutstanding,
      grossMargin,
      returnOnCapitalEmployed: roce
    };
  }

  // Calculate supplier performance metrics
  async calculateSupplierPerformance(companyId: string): Promise<ExtendedPerformanceMetrics> {
    const { data: supplierData, error } = await this.supabase
      .rpc('calculate_supplier_performance', { 
        p_company_id: companyId,
        p_days: 90
      });

    if (error) throw error;

    // Aggregate supplier metrics
    const avgScore = supplierData?.reduce((sum, s) => sum + s.overall_score, 0) / (supplierData?.length || 1);
    const avgLeadTime = supplierData?.reduce((sum, s) => sum + (s.average_lead_time || 0), 0) / (supplierData?.length || 1);
    
    // Calculate lead time variability (standard deviation)
    const leadTimes = supplierData?.map(s => s.average_lead_time || 0) || [];
    const leadTimeVariability = this.calculateStandardDeviation(leadTimes);

    // Calculate fill rate from sales data
    const { data: salesData } = await this.supabase
      .from('sales_transactions')
      .select('quantity, fulfilled')
      .eq('company_id', companyId)
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    let fillRate = 0;
    let orderAccuracy = 95; // Default placeholder
    
    if (salesData && salesData.length > 0) {
      const totalDemand = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
      const fulfilledDemand = salesData.filter(s => s.fulfilled).reduce((sum, sale) => sum + sale.quantity, 0);
      fillRate = totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 0;
    }

    return {
      fillRate,
      orderAccuracy,
      averageLeadTime: avgLeadTime,
      leadTimeVariability,
      supplierPerformanceScore: avgScore
    };
  }

  // Demand forecasting
  async forecastDemand(
    companyId: string,
    sku: string,
    forecastDays: number = 30
  ): Promise<DemandForecast> {
    const { data, error } = await this.supabase
      .rpc('calculate_demand_forecast', {
        p_company_id: companyId,
        p_sku: sku,
        p_forecast_days: forecastDays,
        p_history_days: 90
      });

    if (error) throw error;

    const forecast = data[0];
    
    return {
      sku: forecast.sku,
      forecastedDemand: forecast.forecasted_demand,
      seasonalityIndex: forecast.seasonality_index,
      trendDirection: forecast.trend_direction,
      confidenceLevel: forecast.confidence_level
    };
  }

  // Risk assessment
  async assessRisks(companyId: string): Promise<RiskAssessment[]> {
    const { data, error } = await this.supabase
      .rpc('calculate_risk_scores', {
        p_company_id: companyId
      });

    if (error) throw error;

    // Add market risk assessment
    const marketRisk = await this.assessMarketRisk(companyId);
    
    return [
      ...data.map((risk: any) => ({
        category: risk.risk_category,
        riskScore: risk.risk_score,
        riskLevel: risk.risk_level,
        contributingFactors: risk.contributing_factors
      })),
      marketRisk
    ];
  }

  // Cost optimization opportunities
  async identifyCostOptimizations(companyId: string): Promise<CostOptimizationOpportunity[]> {
    const { data, error } = await this.supabase
      .rpc('identify_cost_optimization_opportunities', {
        p_company_id: companyId,
        p_threshold_percentage: 10
      });

    if (error) throw error;

    return data.map((opp: any) => ({
      type: opp.opportunity_type,
      sku: opp.sku,
      currentValue: opp.current_value,
      potentialSavings: opp.potential_savings,
      recommendation: opp.recommendation,
      priority: opp.priority
    }));
  }

  // Industry benchmarking
  async compareToIndustryBenchmarks(
    companyId: string,
    industry: 'retail' | 'manufacturing' | 'distribution' = 'retail'
  ): Promise<IndustryBenchmark[]> {
    const benchmarks = this.industryBenchmarks[industry];
    const results: IndustryBenchmark[] = [];

    // Get current metrics
    const financialMetrics = await this.calculateWorkingCapitalMetrics(companyId);
    const performanceMetrics = await this.calculateSupplierPerformance(companyId);
    
    // Get inventory turnover
    const { data: turnoverData } = await this.supabase
      .rpc('calculate_inventory_turnover', { 
        p_company_id: companyId,
        p_days: 30
      });

    const avgTurnover = turnoverData?.reduce((sum: number, item: any) => 
      sum + item.turnover_rate, 0
    ) / (turnoverData?.length || 1);

    // Compare metrics
    results.push({
      metric: 'Inventory Turnover',
      currentValue: avgTurnover,
      industryAverage: benchmarks.inventory_turns,
      percentile: this.calculatePercentile(avgTurnover, benchmarks.inventory_turns),
      recommendation: avgTurnover < benchmarks.inventory_turns 
        ? 'Increase inventory turnover by optimizing stock levels'
        : undefined
    });

    results.push({
      metric: 'Cash Conversion Cycle',
      currentValue: financialMetrics.cashConversionCycle,
      industryAverage: benchmarks.cash_cycle_days,
      percentile: this.calculatePercentile(
        benchmarks.cash_cycle_days * 2 - financialMetrics.cashConversionCycle, 
        benchmarks.cash_cycle_days
      ),
      recommendation: financialMetrics.cashConversionCycle > benchmarks.cash_cycle_days
        ? 'Reduce cash conversion cycle by improving collections and extending payables'
        : undefined
    });

    results.push({
      metric: 'Gross Margin',
      currentValue: financialMetrics.grossMargin,
      industryAverage: benchmarks.gross_margin,
      percentile: this.calculatePercentile(financialMetrics.grossMargin, benchmarks.gross_margin),
      recommendation: financialMetrics.grossMargin < benchmarks.gross_margin
        ? 'Improve gross margin through better pricing or cost reduction'
        : undefined
    });

    results.push({
      metric: 'Fill Rate',
      currentValue: performanceMetrics.fillRate,
      industryAverage: benchmarks.fill_rate,
      percentile: this.calculatePercentile(performanceMetrics.fillRate, benchmarks.fill_rate),
      recommendation: performanceMetrics.fillRate < benchmarks.fill_rate
        ? 'Improve fill rate by optimizing inventory levels and supplier reliability'
        : undefined
    });

    return results;
  }

  // Multi-echelon inventory optimization
  async optimizeMultiEchelonInventory(companyId: string): Promise<{
    recommendations: Array<{
      location: string;
      sku: string;
      currentLevel: number;
      optimalLevel: number;
      savings: number;
    }>;
    totalSavings: number;
  }> {
    // Simplified multi-echelon optimization
    const { data: inventoryData } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId);

    const recommendations: any[] = [];
    let totalSavings = 0;

    for (const item of inventoryData || []) {
      // Calculate optimal stock level based on turnover
      const { data: turnoverData } = await this.supabase
        .rpc('calculate_inventory_turnover', { 
          p_company_id: companyId,
          p_days: 30
        })
        .eq('sku', item.sku)
        .single();

      if (turnoverData) {
        const dailyDemand = (turnoverData as any).units_sold / 30;
        const leadTime = 7; // days
        const safetyStock = dailyDemand * 3; // 3 days safety
        const optimalLevel = (dailyDemand * leadTime) + safetyStock;
        
        if (item.quantity > optimalLevel * 1.2) {
          const excessStock = item.quantity - optimalLevel;
          const savings = excessStock * item.unit_cost * 0.2; // 20% holding cost
          
          recommendations.push({
            location: item.location || 'Main Warehouse',
            sku: item.sku,
            currentLevel: item.quantity,
            optimalLevel: Math.ceil(optimalLevel),
            savings
          });
          
          totalSavings += savings;
        }
      }
    }

    return {
      recommendations: recommendations.sort((a, b) => b.savings - a.savings).slice(0, 10),
      totalSavings
    };
  }

  // Helper methods
  private getStockHealthStatus(quantity: number, daysOfStock: number): string {
    if (quantity === 0) return 'stockout';
    if (daysOfStock <= 7) return 'low';
    if (daysOfStock > 90) return 'excess';
    return 'normal';
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculatePercentile(value: number, benchmark: number): number {
    // Simplified percentile calculation
    const ratio = value / benchmark;
    if (ratio >= 1.2) return 90;
    if (ratio >= 1.0) return 70;
    if (ratio >= 0.8) return 50;
    if (ratio >= 0.6) return 30;
    return 10;
  }

  private async assessMarketRisk(companyId: string): Promise<RiskAssessment> {
    // Simplified market risk assessment based on demand volatility
    const { data: salesData } = await this.supabase
      .from('sales_transactions')
      .select('transaction_date, quantity')
      .eq('company_id', companyId)
      .gte('transaction_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate demand volatility
    const dailySales = new Map<string, number>();
    salesData?.forEach(sale => {
      const date = sale.transaction_date.split('T')[0];
      dailySales.set(date, (dailySales.get(date) || 0) + sale.quantity);
    });

    const salesValues = Array.from(dailySales.values());
    const volatility = this.calculateStandardDeviation(salesValues) / (salesValues.reduce((a, b) => a + b, 0) / salesValues.length);

    let riskScore = 0;
    if (volatility > 0.3) riskScore += 50;
    else if (volatility > 0.15) riskScore += 25;

    return {
      category: 'market',
      riskScore,
      riskLevel: riskScore > 40 ? 'high' : riskScore > 20 ? 'medium' : 'low',
      contributingFactors: {
        demandVolatility: volatility,
        dataPoints: salesValues.length
      }
    };
  }

  // Real-time alert generation based on thresholds
  async generateAlerts(companyId: string): Promise<Array<{
    type: string;
    severity: string;
    message: string;
    data: any;
  }>> {
    const alerts: any[] = [];

    // Check inventory alerts
    const inventoryMetrics = await this.calculateExtendedInventoryMetrics(companyId);
    for (const metric of inventoryMetrics) {
      if (metric.daysOfSupply === 0) {
        alerts.push({
          type: 'stockout',
          severity: 'critical',
          message: `Stockout detected for SKU`,
          data: { daysOfSupply: metric.daysOfSupply }
        });
      } else if (metric.daysOfSupply < 3) {
        alerts.push({
          type: 'low_stock',
          severity: 'high',
          message: `Critical low stock - only ${metric.daysOfSupply} days remaining`,
          data: { daysOfSupply: metric.daysOfSupply }
        });
      } else if (metric.daysOfSupply > 90) {
        alerts.push({
          type: 'excess_stock',
          severity: 'low',
          message: `Excess stock detected - ${metric.daysOfSupply} days of supply`,
          data: { daysOfSupply: metric.daysOfSupply }
        });
      }
    }

    // Check financial alerts
    const financialMetrics = await this.calculateWorkingCapitalMetrics(companyId);
    if (financialMetrics.workingCapitalRatio < 1.0) {
      alerts.push({
        type: 'working_capital',
        severity: 'high',
        message: 'Working capital ratio below critical threshold',
        data: { ratio: financialMetrics.workingCapitalRatio }
      });
    }

    if (financialMetrics.cashConversionCycle > 60) {
      alerts.push({
        type: 'cash_cycle',
        severity: 'medium',
        message: 'Cash conversion cycle exceeding 60 days',
        data: { days: financialMetrics.cashConversionCycle }
      });
    }

    return alerts;
  }
}

export const extendedAnalyticsService = new ExtendedAnalyticsService();