import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface TriangleScore {
  service: number;
  cost: number;
  capital: number;
  overall: number;
  timestamp: Date;
}

export interface ServiceMetrics {
  fillRate: number;
  stockoutRisk: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
}

export interface CostMetrics {
  grossMargin: number;
  marginTrend: number;
  costOptimizationPotential: number;
  priceVariance: number;
}

export interface CapitalMetrics {
  inventoryTurnover: number;
  workingCapitalRatio: number;
  cashConversionCycle: number;
  returnOnCapitalEmployed: number;
}

export interface TriangleAnalysis {
  scores: TriangleScore;
  metrics: {
    service: ServiceMetrics;
    cost: CostMetrics;
    capital: CapitalMetrics;
  };
  recommendations: TriangleRecommendation[];
  historicalTrend: TriangleScore[];
}

export interface TriangleRecommendation {
  id: string;
  dimension: 'service' | 'cost' | 'capital';
  title: string;
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export class SupplyChainTriangleService {
  private supabase = createClientComponentClient();

  async calculateTriangleScores(companyId: string): Promise<TriangleAnalysis> {
    // Fetch necessary data
    const [inventoryData, salesData, metricsData] = await Promise.all([
      this.fetchInventoryData(companyId),
      this.fetchSalesData(companyId),
      this.fetchMetricsData(companyId)
    ]);

    // Calculate individual dimension scores
    const serviceMetrics = await this.calculateServiceScore(inventoryData, salesData);
    const costMetrics = await this.calculateCostScore(inventoryData, salesData);
    const capitalMetrics = await this.calculateCapitalScore(inventoryData, salesData, metricsData);

    // Calculate overall scores (0-100 scale)
    const scores: TriangleScore = {
      service: this.normalizeScore(serviceMetrics),
      cost: this.normalizeScore(costMetrics),
      capital: this.normalizeScore(capitalMetrics),
      overall: 0,
      timestamp: new Date()
    };

    // Overall score is the harmonic mean of the three dimensions
    scores.overall = this.calculateHarmonicMean([scores.service, scores.cost, scores.capital]);

    // Generate recommendations based on scores
    const recommendations = this.generateRecommendations(scores, {
      service: serviceMetrics,
      cost: costMetrics,
      capital: capitalMetrics
    });

    // Fetch historical trend
    const historicalTrend = await this.fetchHistoricalTrend(companyId);

    // Store current scores
    await this.storeTriangleScores(companyId, scores);

    return {
      scores,
      metrics: {
        service: serviceMetrics,
        cost: costMetrics,
        capital: capitalMetrics
      },
      recommendations,
      historicalTrend
    };
  }

  private async calculateServiceScore(inventoryData: any[], salesData: any[]): Promise<ServiceMetrics> {
    // Calculate fill rate
    const totalDemand = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const fulfilledDemand = salesData.filter(sale => sale.fulfilled).reduce((sum, sale) => sum + sale.quantity, 0);
    const fillRate = totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 0;

    // Calculate stockout risk
    const skuCount = inventoryData.length;
    const lowStockSkus = inventoryData.filter(item => {
      const salesVelocity = this.calculateSalesVelocity(item.sku, salesData);
      const daysOfStock = salesVelocity > 0 ? item.quantity / salesVelocity : Infinity;
      return daysOfStock < 7; // Less than 7 days of stock
    }).length;
    const stockoutRisk = skuCount > 0 ? (lowStockSkus / skuCount) * 100 : 0;

    // Calculate on-time delivery (placeholder - would need order data)
    const onTimeDelivery = 95; // Placeholder

    // Calculate customer satisfaction (derived from fill rate and on-time delivery)
    const customerSatisfaction = (fillRate * 0.6 + onTimeDelivery * 0.4);

    return {
      fillRate,
      stockoutRisk,
      onTimeDelivery,
      customerSatisfaction
    };
  }

  private async calculateCostScore(inventoryData: any[], salesData: any[]): Promise<CostMetrics> {
    // Calculate gross margin
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalCost = salesData.reduce((sum, sale) => {
      const item = inventoryData.find(inv => inv.sku === sale.sku);
      return sum + (item ? sale.quantity * item.unit_cost : 0);
    }, 0);
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    // Calculate margin trend (would need historical data)
    const marginTrend = 0; // Placeholder - positive means improving

    // Calculate cost optimization potential
    const avgUnitCost = inventoryData.reduce((sum, item) => sum + item.unit_cost, 0) / inventoryData.length;
    const minUnitCost = Math.min(...inventoryData.map(item => item.unit_cost));
    const costOptimizationPotential = avgUnitCost > 0 ? ((avgUnitCost - minUnitCost) / avgUnitCost) * 100 : 0;

    // Calculate price variance
    const priceVariance = this.calculatePriceVariance(inventoryData);

    return {
      grossMargin,
      marginTrend,
      costOptimizationPotential,
      priceVariance
    };
  }

  private async calculateCapitalScore(inventoryData: any[], salesData: any[], metricsData: any): Promise<CapitalMetrics> {
    // Calculate inventory turnover
    const totalInventoryValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const annualCOGS = salesData.reduce((sum, sale) => {
      const item = inventoryData.find(inv => inv.sku === sale.sku);
      return sum + (item ? sale.quantity * item.unit_cost : 0);
    }, 0) * 12; // Annualized
    const inventoryTurnover = totalInventoryValue > 0 ? annualCOGS / totalInventoryValue : 0;

    // Calculate working capital ratio
    const currentAssets = totalInventoryValue + (metricsData?.accounts_receivable || 0);
    const currentLiabilities = metricsData?.accounts_payable || 0;
    const workingCapitalRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 1;

    // Calculate cash conversion cycle
    const daysInventoryOutstanding = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;
    const daysSalesOutstanding = metricsData?.days_sales_outstanding || 30;
    const daysPayableOutstanding = metricsData?.days_payable_outstanding || 45;
    const cashConversionCycle = daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding;

    // Calculate ROCE (Return on Capital Employed)
    const operatingProfit = salesData.reduce((sum, sale) => sum + sale.revenue, 0) * 0.15; // Assuming 15% operating margin
    const capitalEmployed = currentAssets - currentLiabilities;
    const returnOnCapitalEmployed = capitalEmployed > 0 ? (operatingProfit / capitalEmployed) * 100 : 0;

    return {
      inventoryTurnover,
      workingCapitalRatio,
      cashConversionCycle,
      returnOnCapitalEmployed
    };
  }

  private normalizeScore(metrics: ServiceMetrics | CostMetrics | CapitalMetrics): number {
    if ('fillRate' in metrics) {
      // Service score normalization
      const serviceScore = (
        metrics.fillRate * 0.3 +
        (100 - metrics.stockoutRisk) * 0.3 +
        metrics.onTimeDelivery * 0.2 +
        metrics.customerSatisfaction * 0.2
      );
      return Math.min(100, Math.max(0, serviceScore));
    } else if ('grossMargin' in metrics) {
      // Cost score normalization
      const costScore = (
        Math.min(metrics.grossMargin * 2, 100) * 0.4 + // Gross margin (target: 50%)
        (100 - metrics.costOptimizationPotential) * 0.3 +
        (100 - metrics.priceVariance) * 0.3
      );
      return Math.min(100, Math.max(0, costScore));
    } else {
      // Capital score normalization
      const turnoverScore = Math.min(metrics.inventoryTurnover * 10, 100); // Target: 10x
      const workingCapitalScore = Math.min(metrics.workingCapitalRatio * 50, 100); // Target: 2.0
      const cashCycleScore = Math.max(0, 100 - metrics.cashConversionCycle); // Lower is better
      const roceScore = Math.min(metrics.returnOnCapitalEmployed * 4, 100); // Target: 25%
      
      const capitalScore = (
        turnoverScore * 0.3 +
        workingCapitalScore * 0.2 +
        cashCycleScore * 0.3 +
        roceScore * 0.2
      );
      return Math.min(100, Math.max(0, capitalScore));
    }
  }

  private calculateHarmonicMean(scores: number[]): number {
    const sum = scores.reduce((acc, score) => acc + (1 / score), 0);
    return scores.length / sum;
  }

  private generateRecommendations(
    scores: TriangleScore,
    metrics: { service: ServiceMetrics; cost: CostMetrics; capital: CapitalMetrics }
  ): TriangleRecommendation[] {
    const recommendations: TriangleRecommendation[] = [];

    // Service recommendations
    if (scores.service < 80) {
      if (metrics.service.fillRate < 95) {
        recommendations.push({
          id: 'srv-1',
          dimension: 'service',
          title: 'Improve Fill Rate',
          description: `Current fill rate is ${metrics.service.fillRate.toFixed(1)}%. Increase safety stock for high-velocity SKUs.`,
          impact: 95 - metrics.service.fillRate,
          effort: 'medium',
          priority: 1
        });
      }
      if (metrics.service.stockoutRisk > 20) {
        recommendations.push({
          id: 'srv-2',
          dimension: 'service',
          title: 'Reduce Stockout Risk',
          description: `${metrics.service.stockoutRisk.toFixed(1)}% of SKUs at risk. Implement automated reorder points.`,
          impact: metrics.service.stockoutRisk - 10,
          effort: 'low',
          priority: 2
        });
      }
    }

    // Cost recommendations
    if (scores.cost < 80) {
      if (metrics.cost.grossMargin < 40) {
        recommendations.push({
          id: 'cost-1',
          dimension: 'cost',
          title: 'Improve Gross Margins',
          description: `Gross margin at ${metrics.cost.grossMargin.toFixed(1)}%. Review pricing strategy and supplier costs.`,
          impact: 40 - metrics.cost.grossMargin,
          effort: 'high',
          priority: 1
        });
      }
      if (metrics.cost.costOptimizationPotential > 15) {
        recommendations.push({
          id: 'cost-2',
          dimension: 'cost',
          title: 'Optimize Procurement Costs',
          description: `Potential ${metrics.cost.costOptimizationPotential.toFixed(1)}% cost reduction through supplier consolidation.`,
          impact: metrics.cost.costOptimizationPotential,
          effort: 'medium',
          priority: 2
        });
      }
    }

    // Capital recommendations
    if (scores.capital < 80) {
      if (metrics.capital.inventoryTurnover < 8) {
        recommendations.push({
          id: 'cap-1',
          dimension: 'capital',
          title: 'Increase Inventory Turnover',
          description: `Current turnover ${metrics.capital.inventoryTurnover.toFixed(1)}x. Reduce slow-moving inventory.`,
          impact: (8 - metrics.capital.inventoryTurnover) * 10,
          effort: 'medium',
          priority: 1
        });
      }
      if (metrics.capital.cashConversionCycle > 60) {
        recommendations.push({
          id: 'cap-2',
          dimension: 'capital',
          title: 'Optimize Cash Conversion Cycle',
          description: `Current cycle ${metrics.capital.cashConversionCycle.toFixed(0)} days. Negotiate better payment terms.`,
          impact: metrics.capital.cashConversionCycle - 45,
          effort: 'low',
          priority: 2
        });
      }
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const scoreA = a.priority * 0.6 + a.impact * 0.4;
      const scoreB = b.priority * 0.6 + b.impact * 0.4;
      return scoreB - scoreA;
    });
  }

  private calculateSalesVelocity(sku: string, salesData: any[]): number {
    const skuSales = salesData.filter(sale => sale.sku === sku);
    const totalQuantity = skuSales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Calculate days between first and last sale
    if (skuSales.length === 0) return 0;
    
    const dates = skuSales.map(sale => new Date(sale.transaction_date)).sort((a, b) => a.getTime() - b.getTime());
    const daysDiff = Math.max(1, (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
    
    return totalQuantity / daysDiff;
  }

  private calculatePriceVariance(inventoryData: any[]): number {
    if (inventoryData.length === 0) return 0;
    
    const avgPrice = inventoryData.reduce((sum, item) => sum + item.unit_cost, 0) / inventoryData.length;
    const variance = inventoryData.reduce((sum, item) => {
      return sum + Math.pow(item.unit_cost - avgPrice, 2);
    }, 0) / inventoryData.length;
    
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgPrice > 0 ? (stdDev / avgPrice) * 100 : 0;
    
    return coefficientOfVariation;
  }

  private async fetchInventoryData(companyId: string) {
    const { data } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId);
    return data || [];
  }

  private async fetchSalesData(companyId: string) {
    const { data } = await this.supabase
      .from('sales_transactions')
      .select('*')
      .eq('company_id', companyId)
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
    return data || [];
  }

  private async fetchMetricsData(companyId: string) {
    const { data } = await this.supabase
      .from('inventory_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  }

  private async fetchHistoricalTrend(companyId: string): Promise<TriangleScore[]> {
    const { data } = await this.supabase
      .from('triangle_scores')
      .select('*')
      .eq('company_id', companyId)
      .order('timestamp', { ascending: false })
      .limit(30);
    
    return (data || []).map(score => ({
      service: score.service_score,
      cost: score.cost_score,
      capital: score.capital_score,
      overall: score.overall_score,
      timestamp: new Date(score.timestamp)
    }));
  }

  private async storeTriangleScores(companyId: string, scores: TriangleScore) {
    await this.supabase
      .from('triangle_scores')
      .insert({
        company_id: companyId,
        service_score: scores.service,
        cost_score: scores.cost,
        capital_score: scores.capital,
        overall_score: scores.overall,
        timestamp: scores.timestamp.toISOString()
      });
  }
}

// Export singleton instance
export const triangleService = new SupplyChainTriangleService();