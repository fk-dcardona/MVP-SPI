import { 
  Supplier, 
  SupplierPerformance, 
  PurchaseOrder,
  SupplierScorecard 
} from './types';

export class SupplierPerformanceCalculator {
  
  calculatePerformance(
    supplier: Supplier,
    orders: PurchaseOrder[],
    periodStart: Date,
    periodEnd: Date
  ): SupplierPerformance {
    // Filter orders for the period
    const periodOrders = orders.filter(order => 
      order.order_date >= periodStart && 
      order.order_date <= periodEnd &&
      order.status === 'delivered'
    );

    // Delivery Performance
    const deliveryMetrics = this.calculateDeliveryMetrics(periodOrders);
    
    // Quality Performance
    const qualityMetrics = this.calculateQualityMetrics(periodOrders);
    
    // Cost Performance
    const costMetrics = this.calculateCostMetrics(periodOrders);
    
    // Responsiveness (mock data for now)
    const responsivenessMetrics = {
      average_response_time_hours: 24,
      quote_turnaround_days: 2,
      issue_resolution_days: 3
    };

    // Calculate scores
    const deliveryScore = this.calculateDeliveryScore(deliveryMetrics);
    const qualityScore = this.calculateQualityScore(qualityMetrics);
    const costScore = this.calculateCostScore(costMetrics);
    const responsivenessScore = this.calculateResponsivenessScore(responsivenessMetrics);
    
    // Overall score (weighted average)
    const overallScore = Math.round(
      (deliveryScore * 0.35) +
      (qualityScore * 0.30) +
      (costScore * 0.20) +
      (responsivenessScore * 0.15)
    );

    return {
      supplier_id: supplier.id,
      period_start: periodStart,
      period_end: periodEnd,
      
      // Delivery metrics
      total_orders: periodOrders.length,
      on_time_deliveries: deliveryMetrics.onTimeCount,
      late_deliveries: deliveryMetrics.lateCount,
      very_late_deliveries: deliveryMetrics.veryLateCount,
      average_delay_days: deliveryMetrics.averageDelay,
      on_time_delivery_rate: deliveryMetrics.onTimeRate,
      
      // Quality metrics
      total_items_received: qualityMetrics.totalItems,
      defective_items: qualityMetrics.defectiveItems,
      defect_rate: qualityMetrics.defectRate,
      quality_complaints: qualityMetrics.complaints,
      
      // Cost metrics
      total_spend: costMetrics.totalSpend,
      price_variance: costMetrics.priceVariance,
      invoice_accuracy_rate: costMetrics.invoiceAccuracy,
      discount_captured: costMetrics.discountCaptured,
      
      // Responsiveness metrics
      ...responsivenessMetrics,
      
      // Scores
      delivery_score: deliveryScore,
      quality_score: qualityScore,
      cost_score: costScore,
      responsiveness_score: responsivenessScore,
      overall_score: overallScore
    };
  }

  private calculateDeliveryMetrics(orders: PurchaseOrder[]) {
    let onTimeCount = 0;
    let lateCount = 0;
    let veryLateCount = 0;
    let totalDelayDays = 0;

    orders.forEach(order => {
      if (order.actual_delivery_date && order.expected_delivery_date) {
        const delayDays = Math.floor(
          (order.actual_delivery_date.getTime() - order.expected_delivery_date.getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        
        if (delayDays <= 0) {
          onTimeCount++;
        } else {
          lateCount++;
          totalDelayDays += delayDays;
          
          if (delayDays > 3) {
            veryLateCount++;
          }
        }
      }
    });

    return {
      onTimeCount,
      lateCount,
      veryLateCount,
      averageDelay: lateCount > 0 ? totalDelayDays / lateCount : 0,
      onTimeRate: orders.length > 0 ? (onTimeCount / orders.length) * 100 : 0
    };
  }

  private calculateQualityMetrics(orders: PurchaseOrder[]) {
    let totalItems = 0;
    let defectiveItems = 0;
    let complaints = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.quantity_received) {
          totalItems += item.quantity_received;
          if (item.defective_quantity) {
            defectiveItems += item.defective_quantity;
          }
        }
      });
    });

    return {
      totalItems,
      defectiveItems,
      defectRate: totalItems > 0 ? (defectiveItems / totalItems) * 100 : 0,
      complaints // Would come from a complaints table
    };
  }

  private calculateCostMetrics(orders: PurchaseOrder[]) {
    const totalSpend = orders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // These would be calculated from actual invoice data
    const priceVariance = 2.5; // % variance from quoted prices
    const invoiceAccuracy = 95; // % of accurate invoices
    const discountCaptured = totalSpend * 0.05; // 5% average discount

    return {
      totalSpend,
      priceVariance,
      invoiceAccuracy,
      discountCaptured
    };
  }

  private calculateDeliveryScore(metrics: any): number {
    // On-time rate is the primary factor
    let score = metrics.onTimeRate;
    
    // Penalize for very late deliveries
    score -= metrics.veryLateCount * 5;
    
    // Penalize for average delay
    score -= metrics.averageDelay * 2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateQualityScore(metrics: any): number {
    // Start with perfect score
    let score = 100;
    
    // Deduct based on defect rate
    score -= metrics.defectRate * 10;
    
    // Deduct for complaints
    score -= metrics.complaints * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateCostScore(metrics: any): number {
    // Start with base score
    let score = 80;
    
    // Bonus for low price variance
    if (metrics.priceVariance < 1) {
      score += 10;
    } else if (metrics.priceVariance < 3) {
      score += 5;
    } else {
      score -= metrics.priceVariance * 2;
    }
    
    // Bonus for invoice accuracy
    if (metrics.invoiceAccuracy > 98) {
      score += 10;
    } else if (metrics.invoiceAccuracy > 95) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateResponsivenessScore(metrics: any): number {
    let score = 100;
    
    // Deduct for slow response time
    if (metrics.average_response_time_hours > 48) {
      score -= 20;
    } else if (metrics.average_response_time_hours > 24) {
      score -= 10;
    }
    
    // Deduct for slow quote turnaround
    if (metrics.quote_turnaround_days > 5) {
      score -= 15;
    } else if (metrics.quote_turnaround_days > 3) {
      score -= 5;
    }
    
    // Deduct for slow issue resolution
    if (metrics.issue_resolution_days > 7) {
      score -= 20;
    } else if (metrics.issue_resolution_days > 3) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateScorecard(
    supplier: Supplier,
    currentPerformance: SupplierPerformance,
    historicalPerformance: SupplierPerformance[]
  ): SupplierScorecard {
    // Determine trend
    const trend = this.calculateTrend(currentPerformance, historicalPerformance);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(currentPerformance);
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(currentPerformance);

    return {
      supplier,
      current_performance: currentPerformance,
      historical_performance: historicalPerformance,
      trend,
      recommendations,
      risk_level: riskLevel
    };
  }

  private calculateTrend(
    current: SupplierPerformance,
    historical: SupplierPerformance[]
  ): 'improving' | 'stable' | 'declining' {
    if (historical.length === 0) return 'stable';
    
    const recentScores = historical
      .slice(-3)
      .map(p => p.overall_score);
    
    const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const scoreDiff = current.overall_score - avgRecentScore;
    
    if (scoreDiff > 5) return 'improving';
    if (scoreDiff < -5) return 'declining';
    return 'stable';
  }

  private generateRecommendations(performance: SupplierPerformance): string[] {
    const recommendations: string[] = [];

    // Delivery recommendations
    if (performance.on_time_delivery_rate < 80) {
      recommendations.push('Work with supplier to improve delivery reliability');
    }
    if (performance.very_late_deliveries > 2) {
      recommendations.push('Address root causes of significant delivery delays');
    }

    // Quality recommendations
    if (performance.defect_rate > 2) {
      recommendations.push('Implement quality improvement program with supplier');
    }
    if (performance.quality_complaints > 3) {
      recommendations.push('Schedule quality review meeting with supplier');
    }

    // Cost recommendations
    if (performance.price_variance > 5) {
      recommendations.push('Negotiate price stability agreement');
    }
    if (performance.invoice_accuracy_rate < 90) {
      recommendations.push('Review invoicing process with supplier');
    }

    // Responsiveness recommendations
    if (performance.average_response_time_hours > 48) {
      recommendations.push('Establish SLA for communication response times');
    }

    // General recommendations
    if (performance.overall_score < 70) {
      recommendations.push('Consider supplier performance improvement plan');
    }
    if (performance.overall_score < 50) {
      recommendations.push('Evaluate alternative suppliers for risk mitigation');
    }

    return recommendations;
  }

  private assessRiskLevel(performance: SupplierPerformance): 'low' | 'medium' | 'high' {
    const score = performance.overall_score;
    
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }
}