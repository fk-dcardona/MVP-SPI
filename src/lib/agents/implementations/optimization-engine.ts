import { BaseAgent, AgentExecutionResult, OptimizationEngineConfig } from '../types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface InventoryItem {
  sku: string;
  description: string;
  quantity: number;
  unit_cost: number;
  category?: string;
  supplier?: string;
  location?: string;
}

interface SalesVelocity {
  sku: string;
  daily_velocity: number;
  units_sold: number;
  revenue: number;
  transaction_count: number;
}

interface OptimizationResult {
  totalCost: number;
  improvement: string;
  iterations: number;
  recommendations: string[];
  inventoryOptimization?: any;
  costOptimization?: any;
  supplyChainOptimization?: any;
}

export class OptimizationEngine extends BaseAgent {
  async execute(context?: any): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as OptimizationEngineConfig;
      const supabase = createClientComponentClient();
      
      console.log('OptimizationEngine: Starting execution with config:', config.optimizationType);
      
      // Get company ID from agent configuration
      const companyId = this.agent.company_id;
      
      // Load current state from database
      const currentState = await this.loadCurrentState(config, companyId);
      
      if (!currentState) {
        return {
          success: false,
          error: 'Unable to load current state from database'
        };
      }
      
      // Run optimization algorithm based on type
      const optimizationResult = await this.optimize(currentState, config, companyId);
      
      // Store optimization results
      await this.storeOptimizationResults(optimizationResult, companyId, config);
      
      return {
        success: true,
        data: {
          optimizationType: config.optimizationType,
          currentCost: currentState.totalCost,
          optimizedCost: optimizationResult.totalCost,
          improvement: optimizationResult.improvement,
          recommendations: optimizationResult.recommendations,
          iterations: optimizationResult.iterations,
          timestamp: new Date(),
          ...optimizationResult
        }
      };
    } catch (error) {
      console.error('OptimizationEngine execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  validate(): boolean {
    const config = this.agent.config as OptimizationEngineConfig;
    
    if (!['inventory', 'route', 'cost', 'time', 'supply_chain'].includes(config.optimizationType)) {
      return false;
    }
    
    if (!config.constraints || typeof config.constraints !== 'object') {
      return false;
    }
    
    if (!Array.isArray(config.objectives) || config.objectives.length === 0) {
      return false;
    }
    
    if (!config.maxIterations || config.maxIterations <= 0) {
      return false;
    }
    
    return true;
  }

  private async loadCurrentState(config: OptimizationEngineConfig, companyId: string): Promise<any> {
    const supabase = createClientComponentClient();
    
    try {
      switch (config.optimizationType) {
        case 'inventory':
          return await this.loadInventoryState(companyId);
          
        case 'supply_chain':
          return await this.loadSupplyChainState(companyId);
          
        case 'cost':
          return await this.loadCostState(companyId);
          
        default:
          return { totalCost: 0, constraints: config.constraints };
      }
    } catch (error) {
      console.error('Error loading current state:', error);
      return null;
    }
  }

  private async loadInventoryState(companyId: string): Promise<any> {
    const supabase = createClientComponentClient();
    
    // Load inventory data
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId);
      
    if (inventoryError) {
      throw new Error(`Failed to load inventory: ${inventoryError.message}`);
    }
    
    // Load sales velocity data
    const { data: velocity, error: velocityError } = await supabase
      .from('sku_velocity')
      .select('*')
      .eq('company_id', companyId);
      
    if (velocityError) {
      throw new Error(`Failed to load sales velocity: ${velocityError.message}`);
    }
    
    // Calculate total inventory cost
    const totalCost = inventory?.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || 0;
    
    return {
      items: inventory || [],
      velocity: velocity || [],
      totalCost,
      type: 'inventory'
    };
  }

  private async loadSupplyChainState(companyId: string): Promise<any> {
    const supabase = createClientComponentClient();
    
    // Load inventory metrics
    const { data: inventoryMetrics } = await supabase
      .from('inventory_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
      
    // Load sales metrics
    const { data: salesMetrics } = await supabase
      .from('sales_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
      
    // Load supplier performance data
    const { data: supplierPerformance } = await supabase
      .from('supplier_performance')
      .select('*')
      .eq('company_id', companyId);
      
    return {
      inventoryMetrics: inventoryMetrics || {},
      salesMetrics: salesMetrics || {},
      supplierPerformance: supplierPerformance || [],
      type: 'supply_chain'
    };
  }

  private async loadCostState(companyId: string): Promise<any> {
    const supabase = createClientComponentClient();
    
    // Load cost-related data
    const { data: inventoryMetrics } = await supabase
      .from('inventory_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
      
    const { data: salesMetrics } = await supabase
      .from('sales_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
      
    return {
      inventoryMetrics: inventoryMetrics || {},
      salesMetrics: salesMetrics || {},
      type: 'cost'
    };
  }

  private async optimize(currentState: any, config: OptimizationEngineConfig, companyId: string): Promise<OptimizationResult> {
    console.log(`Running ${config.optimizationType} optimization`);
    
    switch (config.optimizationType) {
      case 'inventory':
        return await this.optimizeInventory(currentState, config);
        
      case 'supply_chain':
        return await this.optimizeSupplyChain(currentState, config);
        
      case 'cost':
        return await this.optimizeCost(currentState, config);
        
      default:
        return this.runGenericOptimization(currentState, config);
    }
  }

  private async optimizeInventory(currentState: any, config: OptimizationEngineConfig): Promise<OptimizationResult> {
    const items = currentState.items as InventoryItem[];
    const velocity = currentState.velocity as SalesVelocity[];
    
    if (!items || items.length === 0) {
      return {
        totalCost: 0,
        improvement: '0%',
        iterations: 0,
        recommendations: ['No inventory data available for optimization']
      };
    }
    
    const velocityMap = new Map(velocity.map(v => [v.sku, v]));
    const optimizedItems = [];
    const recommendations = [];
    let totalOptimizedCost = 0;
    
    for (const item of items) {
      const itemVelocity = velocityMap.get(item.sku);
      const dailyVelocity = itemVelocity?.daily_velocity || 0;
      
      // Calculate optimal inventory levels
      const leadTime = 7; // 7 days lead time
      const safetyStock = Math.max(3, dailyVelocity * 2); // 3 days minimum or 2x daily velocity
      const reorderPoint = dailyVelocity * leadTime + safetyStock;
      const optimalQuantity = Math.max(reorderPoint, dailyVelocity * 14); // 2 weeks of demand
      
      const currentCost = item.quantity * item.unit_cost;
      const optimizedCost = optimalQuantity * item.unit_cost;
      
      optimizedItems.push({
        ...item,
        optimalQuantity,
        reorderPoint,
        currentCost,
        optimizedCost,
        costSavings: currentCost - optimizedCost
      });
      
      totalOptimizedCost += optimizedCost;
      
      // Generate recommendations
      if (item.quantity > optimalQuantity * 1.5) {
        recommendations.push(`Reduce ${item.description} inventory from ${item.quantity} to ${optimalQuantity} units (excess inventory)`);
      } else if (item.quantity < reorderPoint) {
        recommendations.push(`Reorder ${item.description} - current: ${item.quantity}, reorder point: ${reorderPoint}`);
      }
    }
    
    const improvement = ((currentState.totalCost - totalOptimizedCost) / currentState.totalCost * 100).toFixed(2);
    
    return {
      totalCost: totalOptimizedCost,
      improvement: `${improvement}%`,
      iterations: 1,
      recommendations,
      inventoryOptimization: {
        items: optimizedItems,
        totalSavings: currentState.totalCost - totalOptimizedCost
      }
    };
  }

  private async optimizeSupplyChain(currentState: any, config: OptimizationEngineConfig): Promise<OptimizationResult> {
    const { inventoryMetrics, salesMetrics, supplierPerformance } = currentState;
    
    const recommendations = [];
    let totalOptimizedCost = 0;
    
    // Analyze inventory turnover
    if (inventoryMetrics && salesMetrics) {
      const inventoryTurnover = salesMetrics.total_units_sold / inventoryMetrics.total_units;
      const targetTurnover = 12; // 12x per year target
      
      if (inventoryTurnover < targetTurnover) {
        recommendations.push(`Improve inventory turnover from ${inventoryTurnover.toFixed(2)}x to ${targetTurnover}x annually`);
      }
    }
    
    // Analyze supplier performance
    if (supplierPerformance && supplierPerformance.length > 0) {
      const avgLeadTime = supplierPerformance.reduce((sum, s) => sum + (s.lead_time || 0), 0) / supplierPerformance.length;
      const avgQuality = supplierPerformance.reduce((sum, s) => sum + (s.quality_score || 0), 0) / supplierPerformance.length;
      
      if (avgLeadTime > 14) {
        recommendations.push(`Reduce average supplier lead time from ${avgLeadTime.toFixed(1)} to 14 days`);
      }
      
      if (avgQuality < 0.95) {
        recommendations.push(`Improve supplier quality score from ${(avgQuality * 100).toFixed(1)}% to 95%`);
      }
    }
    
    // Calculate supply chain triangle score
    const triangleScore = this.calculateSupplyChainTriangleScore(currentState);
    
    return {
      totalCost: totalOptimizedCost,
      improvement: `${triangleScore.improvement}%`,
      iterations: 1,
      recommendations,
      supplyChainOptimization: {
        triangleScore: triangleScore.score,
        recommendations: triangleScore.recommendations
      }
    };
  }

  private async optimizeCost(currentState: any, config: OptimizationEngineConfig): Promise<OptimizationResult> {
    const { inventoryMetrics, salesMetrics } = currentState;
    
    const recommendations = [];
    let totalOptimizedCost = 0;
    
    if (inventoryMetrics && salesMetrics) {
      // Analyze carrying costs
      const carryingCostRate = 0.25; // 25% annual carrying cost
      const annualCarryingCost = inventoryMetrics.total_value * carryingCostRate;
      
      if (annualCarryingCost > salesMetrics.total_revenue * 0.1) {
        recommendations.push(`Reduce inventory carrying costs from $${annualCarryingCost.toFixed(2)} to <10% of revenue`);
      }
      
      // Analyze slow-moving inventory
      if (inventoryMetrics.slow_moving_count > 0) {
        const slowMovingValue = inventoryMetrics.slow_moving_count * inventoryMetrics.average_unit_cost * 100;
        recommendations.push(`Liquidate slow-moving inventory worth $${slowMovingValue.toFixed(2)}`);
      }
      
      // Analyze out-of-stock costs
      if (inventoryMetrics.out_of_stock_count > 0) {
        const lostSales = inventoryMetrics.out_of_stock_count * salesMetrics.average_order_value;
        recommendations.push(`Prevent $${lostSales.toFixed(2)} in lost sales from stockouts`);
      }
    }
    
    return {
      totalCost: totalOptimizedCost,
      improvement: '5-15%',
      iterations: 1,
      recommendations
    };
  }

  private calculateSupplyChainTriangleScore(currentState: any): any {
    const { inventoryMetrics, salesMetrics, supplierPerformance } = currentState;
    
    let score = 0;
    const recommendations = [];
    
    // Inventory efficiency (33% weight)
    if (inventoryMetrics) {
      const inventoryEfficiency = Math.min(1, salesMetrics?.total_units_sold / inventoryMetrics.total_units || 0);
      score += inventoryEfficiency * 33;
      
      if (inventoryEfficiency < 0.5) {
        recommendations.push('Improve inventory efficiency through better demand forecasting');
      }
    }
    
    // Cost optimization (33% weight)
    if (inventoryMetrics && salesMetrics) {
      const costEfficiency = Math.min(1, salesMetrics.total_revenue / inventoryMetrics.total_value || 0);
      score += costEfficiency * 33;
      
      if (costEfficiency < 2) {
        recommendations.push('Optimize inventory costs relative to revenue');
      }
    }
    
    // Supplier performance (34% weight)
    if (supplierPerformance && supplierPerformance.length > 0) {
      const avgPerformance = supplierPerformance.reduce((sum, s) => sum + (s.performance_score || 0), 0) / supplierPerformance.length;
      score += avgPerformance * 34;
      
      if (avgPerformance < 0.8) {
        recommendations.push('Improve supplier performance and relationships');
      }
    }
    
    const improvement = Math.max(0, (100 - score) / 10); // Potential improvement percentage
    
    return {
      score: Math.round(score),
      improvement: improvement.toFixed(1),
      recommendations
    };
  }

  private runGenericOptimization(currentState: any, config: OptimizationEngineConfig): OptimizationResult {
    // Generic optimization algorithm
    let bestSolution = { ...currentState };
    let iterations = 0;
    
    while (iterations < config.maxIterations) {
      const candidate = this.generateCandidate(bestSolution, config);
      
      if (this.evaluateSolution(candidate, config) < this.evaluateSolution(bestSolution, config)) {
        bestSolution = candidate;
      }
      
      iterations++;
      
      if (this.isOptimal(bestSolution, config)) {
        break;
      }
    }
    
    const improvement = ((currentState.totalCost - bestSolution.totalCost) / currentState.totalCost) * 100;
    
    return {
      ...bestSolution,
      improvement: `${improvement.toFixed(2)}%`,
      iterations,
      recommendations: this.generateRecommendations(currentState, bestSolution, config)
    };
  }

  private generateCandidate(currentSolution: any, config: OptimizationEngineConfig): any {
    const candidate = { ...currentSolution };
    
    switch (config.optimizationType) {
      case 'inventory':
        if (candidate.items) {
          candidate.items = candidate.items.map((item: any) => ({
            ...item,
            quantity: Math.max(0, item.quantity + Math.floor(Math.random() * 20 - 10))
          }));
        }
        break;
    }
    
    return candidate;
  }

  private evaluateSolution(solution: any, config: OptimizationEngineConfig): number {
    let score = 0;
    
    for (const objective of config.objectives) {
      switch (objective) {
        case 'minimize_cost':
          score += solution.totalCost || 0;
          break;
        case 'maximize_efficiency':
          score -= solution.efficiency || 0;
          break;
      }
    }
    
    const violations = this.checkConstraints(solution, config.constraints);
    score += violations * 10000;
    
    return score;
  }

  private checkConstraints(solution: any, constraints: any): number {
    let violations = 0;
    return violations;
  }

  private isOptimal(solution: any, config: OptimizationEngineConfig): boolean {
    return false;
  }

  private generateRecommendations(original: any, optimized: any, config: OptimizationEngineConfig): string[] {
    const recommendations = [];
    
    switch (config.optimizationType) {
      case 'inventory':
        if (optimized.items) {
          for (let i = 0; i < optimized.items.length; i++) {
            const orig = original.items[i];
            const opt = optimized.items[i];
            
            if (opt.quantity !== orig.quantity) {
              recommendations.push(
                `Adjust ${opt.description} inventory from ${orig.quantity} to ${opt.quantity} units`
              );
            }
          }
        }
        break;
    }
    
    return recommendations;
  }

  private async storeOptimizationResults(results: OptimizationResult, companyId: string, config: OptimizationEngineConfig): Promise<void> {
    const supabase = createClientComponentClient();
    
    try {
      await supabase
        .from('optimization_results')
        .insert({
          company_id: companyId,
          optimization_type: config.optimizationType,
          improvement_percentage: parseFloat(results.improvement),
          recommendations: results.recommendations,
          iterations: results.iterations,
          total_cost: results.totalCost,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing optimization results:', error);
    }
  }

  private async applyOptimizations(optimizationResult: any): Promise<void> {
    // TODO: Implement auto-application of optimizations
    console.log('Optimizations would be applied here');
  }
}