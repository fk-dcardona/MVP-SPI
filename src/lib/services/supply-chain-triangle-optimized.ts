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

// Optimized data structures for batch processing
interface EnrichedInventoryItem {
  sku: string;
  quantity: number;
  unit_cost: number;
  reorder_point: number;
  category: string;
  supplier_name: string;
  salesVelocity?: number;
  daysOfStock?: number;
}

interface EnrichedSalesData {
  sku: string;
  quantity: number;
  revenue: number;
  unit_cost?: number;
  transaction_date: string;
  fulfilled: boolean;
}

export class SupplyChainTriangleService {
  private supabase = createClientComponentClient();
  
  // Cache for expensive calculations
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async calculateTriangleScores(companyId: string): Promise<TriangleAnalysis> {
    // Check cache first
    const cacheKey = `triangle-${companyId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Fetch all data in a single optimized query
    const analysisData = await this.fetchAnalysisData(companyId);
    
    // Process data in parallel
    const [serviceMetrics, costMetrics, capitalMetrics] = await Promise.all([
      this.calculateServiceScore(analysisData),
      this.calculateCostScore(analysisData),
      this.calculateCapitalScore(analysisData)
    ]);

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

    // Store current scores asynchronously (don't wait)
    this.storeTriangleScores(companyId, scores).catch(console.error);

    const result = {
      scores,
      metrics: {
        service: serviceMetrics,
        cost: costMetrics,
        capital: capitalMetrics
      },
      recommendations,
      historicalTrend
    };

    // Cache the result
    this.setCache(cacheKey, result);

    return result;
  }

  private async fetchAnalysisData(companyId: string) {
    // Single optimized query using the database function
    const { data: turnoverData, error: turnoverError } = await this.supabase
      .rpc('calculate_inventory_turnover', { 
        p_company_id: companyId,
        p_days: 30
      });

    if (turnoverError) throw turnoverError;

    // Fetch additional data in parallel
    const [inventoryData, salesData, categoryData] = await Promise.all([
      // Inventory with sales velocity pre-calculated
      this.supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId),
      
      // Recent sales with aggregation
      this.supabase
        .from('sales_transactions')
        .select('*')
        .eq('company_id', companyId)
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Use materialized view for category data
      this.supabase
        .from('mv_category_summary')
        .select('*')
        .eq('company_id', companyId)
    ]);

    // Create enriched data structures with O(1) lookups
    const turnoverMap = new Map(
      turnoverData?.map((item: any) => [item.sku, item]) || []
    );

    const enrichedInventory: EnrichedInventoryItem[] = inventoryData.data?.map(item => ({
      ...item,
      salesVelocity: turnoverMap.get(item.sku)?.units_sold || 0,
      daysOfStock: turnoverMap.get(item.sku)?.days_of_supply || 999
    })) || [];

    // Create SKU to inventory map for O(1) lookups
    const inventoryMap = new Map(
      enrichedInventory.map(item => [item.sku, item])
    );

    const enrichedSales: EnrichedSalesData[] = salesData.data?.map(sale => ({
      ...sale,
      unit_cost: inventoryMap.get(sale.sku)?.unit_cost || 0
    })) || [];

    return {
      inventory: enrichedInventory,
      sales: enrichedSales,
      turnoverData: turnoverData || [],
      categoryData: categoryData.data || [],
      inventoryMap,
      turnoverMap
    };
  }

  private async calculateServiceScore(data: any): Promise<ServiceMetrics> {
    const { inventory, sales } = data;

    // Calculate fill rate efficiently
    const salesStats = sales.reduce((acc: any, sale: EnrichedSalesData) => {
      acc.totalDemand += sale.quantity;
      if (sale.fulfilled) acc.fulfilledDemand += sale.quantity;
      return acc;
    }, { totalDemand: 0, fulfilledDemand: 0 });

    const fillRate = salesStats.totalDemand > 0 
      ? (salesStats.fulfilledDemand / salesStats.totalDemand) * 100 
      : 0;

    // Calculate stockout risk using pre-calculated days of stock
    const lowStockCount = inventory.filter((item: EnrichedInventoryItem) => 
      item.daysOfStock < 7
    ).length;
    const stockoutRisk = inventory.length > 0 
      ? (lowStockCount / inventory.length) * 100 
      : 0;

    // Calculate on-time delivery (placeholder - would need order data)
    const onTimeDelivery = 95;

    // Calculate customer satisfaction
    const customerSatisfaction = (fillRate * 0.6 + onTimeDelivery * 0.4);

    return {
      fillRate,
      stockoutRisk,
      onTimeDelivery,
      customerSatisfaction
    };
  }

  private async calculateCostScore(data: any): Promise<CostMetrics> {
    const { sales } = data;

    // Calculate metrics in a single pass
    const costStats = sales.reduce((acc: any, sale: EnrichedSalesData) => {
      acc.totalRevenue += sale.revenue;
      acc.totalCost += sale.quantity * (sale.unit_cost || 0);
      return acc;
    }, { totalRevenue: 0, totalCost: 0 });

    const grossMargin = costStats.totalRevenue > 0 
      ? ((costStats.totalRevenue - costStats.totalCost) / costStats.totalRevenue) * 100 
      : 0;

    // Use category data for cost optimization potential
    const { categoryData } = data;
    const avgCostByCategory = categoryData.reduce((acc: any, cat: any) => {
      if (cat.sku_count > 0) {
        acc.total += cat.total_value / cat.total_quantity;
        acc.count++;
      }
      return acc;
    }, { total: 0, count: 0 });

    const costOptimizationPotential = avgCostByCategory.count > 1 ? 15 : 0; // Placeholder

    return {
      grossMargin,
      marginTrend: 0, // Would need historical data
      costOptimizationPotential,
      priceVariance: 5 // Placeholder
    };
  }

  private async calculateCapitalScore(data: any): Promise<CapitalMetrics> {
    const { inventory, turnoverData } = data;

    // Calculate inventory turnover from pre-calculated data
    const avgTurnover = turnoverData.reduce((sum: number, item: any) => 
      sum + item.turnover_rate, 0
    ) / (turnoverData.length || 1);

    // Calculate total inventory value
    const totalInventoryValue = inventory.reduce((sum: number, item: EnrichedInventoryItem) => 
      sum + (item.quantity * item.unit_cost), 0
    );

    // Working capital calculations
    const workingCapitalRatio = 1.2; // Placeholder
    const cashConversionCycle = avgTurnover > 0 ? 365 / avgTurnover : 90;
    const returnOnCapitalEmployed = 15; // Placeholder

    return {
      inventoryTurnover: avgTurnover,
      workingCapitalRatio,
      cashConversionCycle,
      returnOnCapitalEmployed
    };
  }

  private normalizeScore(metrics: ServiceMetrics | CostMetrics | CapitalMetrics): number {
    if ('fillRate' in metrics) {
      // Service score normalization
      return Math.min(100, Math.max(0,
        metrics.fillRate * 0.3 +
        (100 - metrics.stockoutRisk) * 0.3 +
        metrics.onTimeDelivery * 0.2 +
        metrics.customerSatisfaction * 0.2
      ));
    } else if ('grossMargin' in metrics) {
      // Cost score normalization
      return Math.min(100, Math.max(0,
        Math.min(metrics.grossMargin * 2, 100) * 0.4 +
        (50 + metrics.marginTrend * 10) * 0.2 +
        metrics.costOptimizationPotential * 0.2 +
        (100 - metrics.priceVariance * 2) * 0.2
      ));
    } else {
      // Capital score normalization
      const turnoverScore = Math.min(metrics.inventoryTurnover * 10, 100);
      const workingCapitalScore = Math.min(metrics.workingCapitalRatio * 50, 100);
      const cccScore = Math.max(0, 100 - metrics.cashConversionCycle);
      const roceScore = Math.min(metrics.returnOnCapitalEmployed * 5, 100);
      
      return Math.min(100, Math.max(0,
        turnoverScore * 0.3 +
        workingCapitalScore * 0.2 +
        cccScore * 0.3 +
        roceScore * 0.2
      ));
    }
  }

  private calculateHarmonicMean(values: number[]): number {
    const sum = values.reduce((acc, val) => acc + (1 / val), 0);
    return values.length / sum;
  }

  private generateRecommendations(
    scores: TriangleScore, 
    metrics: any
  ): TriangleRecommendation[] {
    const recommendations: TriangleRecommendation[] = [];
    let idCounter = 1;

    // Service recommendations
    if (scores.service < 70) {
      if (metrics.service.fillRate < 90) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          dimension: 'service',
          title: 'Improve Fill Rate',
          description: 'Increase safety stock for high-velocity SKUs to improve fill rate',
          impact: 8,
          effort: 'medium',
          priority: 1
        });
      }
      if (metrics.service.stockoutRisk > 20) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          dimension: 'service',
          title: 'Reduce Stockout Risk',
          description: 'Implement automated reordering for items approaching stockout',
          impact: 9,
          effort: 'low',
          priority: 1
        });
      }
    }

    // Cost recommendations
    if (scores.cost < 70) {
      if (metrics.cost.grossMargin < 30) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          dimension: 'cost',
          title: 'Improve Gross Margin',
          description: 'Negotiate better supplier terms or optimize product mix',
          impact: 9,
          effort: 'high',
          priority: 2
        });
      }
    }

    // Capital recommendations
    if (scores.capital < 70) {
      if (metrics.capital.inventoryTurnover < 6) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          dimension: 'capital',
          title: 'Increase Inventory Turnover',
          description: 'Reduce slow-moving inventory and optimize stock levels',
          impact: 7,
          effort: 'medium',
          priority: 2
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private async fetchHistoricalTrend(companyId: string): Promise<TriangleScore[]> {
    const { data, error } = await this.supabase
      .from('triangle_scores')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching historical trend:', error);
      return [];
    }

    return data?.map(score => ({
      service: score.service_score,
      cost: score.cost_score,
      capital: score.capital_score,
      overall: score.overall_score,
      timestamp: new Date(score.calculated_at)
    })) || [];
  }

  private async storeTriangleScores(companyId: string, scores: TriangleScore): Promise<void> {
    const { error } = await this.supabase
      .from('triangle_scores')
      .insert({
        company_id: companyId,
        service_score: scores.service,
        cost_score: scores.cost,
        capital_score: scores.capital,
        overall_score: scores.overall,
        calculated_at: scores.timestamp
      });

    if (error) {
      console.error('Error storing triangle scores:', error);
    }
  }

  // Cache helpers
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Cleanup old cache entries periodically
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

export const triangleService = new SupplyChainTriangleService();