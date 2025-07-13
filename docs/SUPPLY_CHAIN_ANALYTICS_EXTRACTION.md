# Supply Chain Analytics Engine - Complete Extraction Guide

## 🎯 Overview

This document provides a complete extraction of the Supply Chain Analytics Engine from the Finkargo Analytics MVP platform. The system implements a sophisticated **Supply Chain Triangle** framework that balances **Service**, **Cost**, and **Capital** optimization with real-time calculations, predictive analytics, and intelligent alerting.

## 1. Core Supply Chain Triangle Protocols

### Three Vertices of the Supply Chain Triangle

```
         SERVICE (Quality/Delivery)
          /\
         /  \
        /    \
       /      \
      /________\
CAPITAL    COST (Margin/Efficiency)
```

#### **Service Vertex (Quality/Delivery)**
- **Fill Rate**: Percentage of orders fulfilled from available stock
- **Stockout Risk**: Probability of running out of stock
- **On-Time Delivery**: Percentage of deliveries meeting promised dates
- **Customer Satisfaction**: Composite score based on service metrics

#### **Cost Vertex (Margin/Efficiency)**
- **Gross Margin**: Revenue minus cost of goods sold
- **Margin Trend**: Historical margin performance
- **Cost Optimization Potential**: Identified cost reduction opportunities
- **Price Variance**: Deviation from standard pricing

#### **Capital Vertex (Working Capital)**
- **Inventory Turnover**: How quickly inventory is sold and replaced
- **Working Capital Ratio**: Current assets to current liabilities
- **Cash Conversion Cycle**: Days to convert investments to cash flows
- **Return on Capital Employed**: Profitability relative to capital invested

### Trade-off Calculations

The system uses a **Harmonic Mean** approach to calculate the overall triangle score:

```typescript
private calculateHarmonicMean(values: number[]): number {
  const sum = values.reduce((acc, val) => acc + (1 / val), 0);
  return values.length / sum;
}
```

This ensures that poor performance in any dimension significantly impacts the overall score, preventing optimization of one vertex at the expense of others.

### Optimization Algorithms

#### **Service Score Normalization**
```typescript
// Service score normalization (0-100 scale)
return Math.min(100, Math.max(0,
  metrics.fillRate * 0.3 +
  (100 - metrics.stockoutRisk) * 0.3 +
  metrics.onTimeDelivery * 0.2 +
  metrics.customerSatisfaction * 0.2
));
```

#### **Cost Score Normalization**
```typescript
// Cost score normalization (0-100 scale)
return Math.min(100, Math.max(0,
  Math.min(metrics.grossMargin * 2, 100) * 0.4 +
  (50 + metrics.marginTrend * 10) * 0.2 +
  metrics.costOptimizationPotential * 0.2 +
  (100 - metrics.priceVariance * 2) * 0.2
));
```

#### **Capital Score Normalization**
```typescript
// Capital score normalization (0-100 scale)
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
```

### Balance Score Calculation

The overall balance score is calculated using the harmonic mean of the three vertices:

```typescript
scores.overall = this.calculateHarmonicMean([scores.service, scores.cost, scores.capital]);
```

This ensures that:
- All three dimensions must perform well for a high overall score
- Poor performance in any dimension significantly reduces the overall score
- The system encourages balanced optimization across all dimensions

## 2. Data Input Requirements

### Required Data Fields/Columns

#### **Inventory Data Fields**
```sql
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    sku TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reorder_point DECIMAL(10, 2),
    category TEXT,
    supplier_name TEXT,
    location TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Fields:**
- `sku`: Stock Keeping Unit (unique identifier)
- `description`: Product description
- `quantity`: Current stock level
- `unit_cost`: Cost per unit
- `company_id`: Multi-tenant company identifier

**Optional Fields:**
- `reorder_point`: Minimum stock level before reordering
- `category`: Product category for grouping
- `supplier_name`: Primary supplier
- `location`: Storage location

#### **Sales/Demand Data Fields**
```sql
CREATE TABLE sales_transactions (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    sku TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    revenue DECIMAL(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    customer TEXT,
    fulfilled BOOLEAN DEFAULT true,
    unit_price DECIMAL(10, 2) GENERATED ALWAYS AS (
        CASE WHEN quantity > 0 THEN revenue / quantity ELSE 0 END
    ) STORED
);
```

**Required Fields:**
- `sku`: Product identifier (matches inventory)
- `quantity`: Units sold
- `revenue`: Total revenue for transaction
- `transaction_date`: Date of sale
- `company_id`: Multi-tenant company identifier

**Optional Fields:**
- `customer`: Customer identifier
- `fulfilled`: Whether order was fulfilled from stock

#### **Supplier Data Fields**
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER NOT NULL,
    minimum_order_value DECIMAL(10, 2),
    performance_score DECIMAL(5, 2),
    delivery_reliability DECIMAL(5, 2)
);
```

**Required Fields:**
- `name`: Supplier name
- `lead_time_days`: Average delivery lead time
- `company_id`: Multi-tenant company identifier

**Optional Fields:**
- `code`: Supplier code
- `contact_name`: Primary contact
- `contact_email`: Contact email
- `payment_terms`: Payment terms (e.g., "Net 30")
- `performance_score`: Historical performance score
- `delivery_reliability`: On-time delivery percentage

#### **Financial Data Fields**
```sql
CREATE TABLE financial_metrics (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Working Capital Metrics
    inventory_value DECIMAL(15, 2),
    accounts_receivable DECIMAL(15, 2),
    accounts_payable DECIMAL(15, 2),
    working_capital DECIMAL(15, 2),
    
    -- Cash Conversion Cycle
    days_inventory_outstanding INTEGER,
    days_sales_outstanding INTEGER,
    days_payable_outstanding INTEGER,
    cash_conversion_cycle INTEGER,
    
    -- Profitability Metrics
    gross_margin DECIMAL(5, 4),
    operating_margin DECIMAL(5, 4),
    net_margin DECIMAL(5, 4),
    
    -- Activity Ratios
    inventory_turnover DECIMAL(5, 2),
    receivables_turnover DECIMAL(5, 2),
    payables_turnover DECIMAL(5, 2)
);
```

#### **Logistics/Shipping Data Fields**
```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    order_number TEXT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    shipping_cost DECIMAL(10, 2),
    delivery_method TEXT,
    tracking_number TEXT
);
```

## 3. Core Calculations and Formulas

### A) Inventory Metrics

#### **Inventory Turnover Rate**
```typescript
// Annualized inventory turnover
const annualizedSales = dailySalesRate * 365;
const inventoryTurnover = currentStock > 0 ? annualizedSales / currentStock : 0;

// Database function implementation
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  sku VARCHAR,
  units_sold INTEGER,
  avg_inventory NUMERIC,
  turnover_rate NUMERIC,
  days_of_supply INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH sales_summary AS (
    SELECT 
      s.sku,
      SUM(s.quantity) as units_sold
    FROM sales_transactions s
    WHERE s.company_id = p_company_id
      AND s.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY s.sku
  ),
  inventory_summary AS (
    SELECT 
      i.sku,
      i.quantity as current_inventory,
      i.unit_cost
    FROM inventory_items i
    WHERE i.company_id = p_company_id
  )
  SELECT 
    i.sku,
    COALESCE(s.units_sold, 0)::INTEGER as units_sold,
    i.current_inventory::NUMERIC as avg_inventory,
    CASE 
      WHEN i.current_inventory > 0 
      THEN (COALESCE(s.units_sold, 0)::NUMERIC * (365.0 / p_days)) / i.current_inventory
      ELSE 0
    END as turnover_rate,
    CASE 
      WHEN COALESCE(s.units_sold, 0) > 0 
      THEN (i.current_inventory * p_days / s.units_sold)::INTEGER
      ELSE 999
    END as days_of_supply
  FROM inventory_summary i
  LEFT JOIN sales_summary s ON i.sku = s.sku;
END;
$$ LANGUAGE plpgsql;
```

#### **Days of Supply**
```typescript
const dailySalesRate = totalSold / salesDays;
const daysOfSupply = dailySalesRate > 0 ? currentStock / dailySalesRate : Infinity;
```

#### **Stock Health Scoring**
```typescript
const getStockStatus = (quantity: number, daysOfStock: number) => {
  if (quantity === 0) return 'stockout';
  if (daysOfStock <= 7) return 'low';
  if (daysOfStock > 90) return 'excess';
  return 'normal';
};
```

#### **Reorder Point Calculation**
```typescript
const leadTimeDays = config.leadTime || 7; // Default 7 days lead time
const safetyStockDays = 3; // 3 days safety stock
const reorderPoint = dailyVelocity * (leadTimeDays + safetyStockDays);
```

### B) Financial Metrics

#### **Working Capital Calculations**
```typescript
// Working Capital = Current Assets - Current Liabilities
const workingCapital = inventoryValue + accountsReceivable - accountsPayable;

// Working Capital Ratio = Current Assets / Current Liabilities
const workingCapitalRatio = (inventoryValue + accountsReceivable) / accountsPayable;
```

#### **Cash Conversion Cycle**
```typescript
// Cash Conversion Cycle = DIO + DSO - DPO
const cashConversionCycle = daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding;

// Where:
// DIO = Days Inventory Outstanding = 365 / Inventory Turnover
// DSO = Days Sales Outstanding = Accounts Receivable / (Revenue / 365)
// DPO = Days Payable Outstanding = Accounts Payable / (Cost of Goods Sold / 365)
```

#### **ROI/Profit Margins**
```typescript
// Gross Margin = (Revenue - Cost of Goods Sold) / Revenue
const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

// Return on Capital Employed = Operating Profit / Capital Employed
const returnOnCapitalEmployed = capitalEmployed > 0 ? (operatingProfit / capitalEmployed) * 100 : 0;
```

#### **Cost Analytics**
```typescript
// Holding Cost = Average Inventory Value × Holding Cost Rate
const holdingCost = averageInventoryValue * holdingCostRate;

// Ordering Cost = Number of Orders × Cost per Order
const orderingCost = numberOfOrders * costPerOrder;

// Shortage Cost = Stockout Events × Cost per Stockout
const shortageCost = stockoutEvents * costPerStockout;
```

### C) Performance Metrics

#### **Fill Rate**
```typescript
const fillRate = totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 0;
```

#### **Order Accuracy**
```typescript
const orderAccuracy = totalOrders > 0 ? (accurateOrders / totalOrders) * 100 : 0;
```

#### **Lead Time Analysis**
```typescript
const averageLeadTime = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length;
const leadTimeVariability = calculateStandardDeviation(leadTimes);
```

#### **Supplier Performance Scoring**
```typescript
// Overall supplier score (weighted average)
const overallScore = Math.round(
  (deliveryScore * 0.35) +
  (qualityScore * 0.30) +
  (costScore * 0.20) +
  (responsivenessScore * 0.15)
);

// Delivery Score Calculation
const deliveryScore = onTimeDeliveryRate * 100;

// Quality Score Calculation
const qualityScore = (1 - defectRate) * 100;

// Cost Score Calculation
const costScore = Math.max(0, 100 - (priceVariance * 10));

// Responsiveness Score Calculation
const responsivenessScore = Math.max(0, 100 - (averageResponseTimeHours / 24) * 10);
```

### D) Predictive Analytics

#### **Demand Forecasting Logic**
```typescript
// Simple moving average forecast
const movingAverageForecast = (historicalData: number[], periods: number) => {
  const recentData = historicalData.slice(-periods);
  return recentData.reduce((sum, value) => sum + value, 0) / recentData.length;
};

// Exponential smoothing forecast
const exponentialSmoothingForecast = (historicalData: number[], alpha: number) => {
  let forecast = historicalData[0];
  for (let i = 1; i < historicalData.length; i++) {
    forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
  }
  return forecast;
};
```

#### **Seasonality Adjustments**
```typescript
// Seasonal index calculation
const calculateSeasonalIndex = (monthlyData: number[]) => {
  const monthlyAverages = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);
  
  monthlyData.forEach((value, index) => {
    const month = index % 12;
    monthlyAverages[month] += value;
    monthlyCounts[month]++;
  });
  
  return monthlyAverages.map((sum, index) => sum / monthlyCounts[index]);
};
```

#### **Trend Analysis**
```typescript
// Linear trend calculation
const calculateTrend = (data: number[]) => {
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((sum, value) => sum + value, 0);
  const sumXY = data.reduce((sum, value, index) => sum + (index * value), 0);
  const sumX2 = data.reduce((sum, value, index) => sum + (index * index), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};
```

#### **Risk Scoring**
```typescript
const calculateRiskScore = (metrics: any) => {
  let riskScore = 0;
  
  // Inventory risk (30% weight)
  if (metrics.daysOfSupply < 7) riskScore += 30;
  else if (metrics.daysOfSupply < 14) riskScore += 15;
  
  // Supplier risk (25% weight)
  if (metrics.supplierPerformance < 70) riskScore += 25;
  else if (metrics.supplierPerformance < 85) riskScore += 12;
  
  // Financial risk (25% weight)
  if (metrics.workingCapitalRatio < 1.0) riskScore += 25;
  else if (metrics.workingCapitalRatio < 1.5) riskScore += 12;
  
  // Market risk (20% weight)
  if (metrics.demandVolatility > 0.3) riskScore += 20;
  else if (metrics.demandVolatility > 0.15) riskScore += 10;
  
  return Math.min(100, riskScore);
};
```

## 4. Business Rules Engine

### Conditional Logic Applied

#### **Alert Thresholds**
```typescript
// Inventory Alert Rules
const inventoryAlertRules = {
  stockout: { threshold: 0, severity: 'critical' },
  critical: { threshold: 3, severity: 'high' }, // days of stock
  warning: { threshold: 7, severity: 'medium' }, // days of stock
  excess: { threshold: 90, severity: 'low' } // days of stock
};

// Supplier Performance Rules
const supplierAlertRules = {
  excellent: { threshold: 90, severity: 'low' },
  good: { threshold: 70, severity: 'medium' },
  fair: { threshold: 50, severity: 'high' },
  poor: { threshold: 0, severity: 'critical' }
};

// Financial Alert Rules
const financialAlertRules = {
  workingCapitalRatio: { min: 1.0, max: 3.0, severity: 'medium' },
  cashConversionCycle: { max: 60, severity: 'high' },
  inventoryTurnover: { min: 6, severity: 'medium' }
};
```

#### **Escalation Rules**
```typescript
const escalationRules = {
  critical: {
    immediate: ['sms', 'email', 'whatsapp'],
    followUp: '1 hour',
    escalation: '4 hours'
  },
  high: {
    immediate: ['email', 'whatsapp'],
    followUp: '4 hours',
    escalation: '24 hours'
  },
  medium: {
    immediate: ['email'],
    followUp: '24 hours',
    escalation: '72 hours'
  },
  low: {
    immediate: ['email'],
    followUp: '72 hours',
    escalation: '1 week'
  }
};
```

#### **Industry-Specific Adjustments**
```typescript
const industryBenchmarks = {
  retail: {
    inventory_turns: 8,
    receivables_days: 30,
    payables_days: 45,
    cash_cycle_days: 15
  },
  manufacturing: {
    inventory_turns: 6,
    receivables_days: 45,
    payables_days: 60,
    cash_cycle_days: 30
  },
  distribution: {
    inventory_turns: 12,
    receivables_days: 25,
    payables_days: 50,
    cash_cycle_days: 5
  }
};
```

## 5. Role-Based Analytics

### Analytics Customization by Role

#### **Sales Managers**
- **Key Metrics**: Fill rate, customer satisfaction, order accuracy
- **Focus Areas**: Service level optimization, customer retention
- **Alerts**: Stockout risk, order fulfillment issues
- **Reports**: Sales performance, customer analytics

#### **Finance Managers**
- **Key Metrics**: Working capital, cash conversion cycle, ROI
- **Focus Areas**: Cost optimization, cash flow management
- **Alerts**: Working capital thresholds, cash flow risks
- **Reports**: Financial health, cost analysis

#### **Procurement Managers**
- **Key Metrics**: Supplier performance, lead times, cost variance
- **Focus Areas**: Supplier optimization, cost reduction
- **Alerts**: Supplier performance drops, cost increases
- **Reports**: Supplier scorecards, cost analysis

#### **Operations Managers**
- **Key Metrics**: Inventory turnover, efficiency ratios, process metrics
- **Focus Areas**: Process optimization, efficiency improvement
- **Alerts**: Process bottlenecks, efficiency drops
- **Reports**: Operational efficiency, process analytics

#### **General Managers**
- **Key Metrics**: Overall triangle score, strategic KPIs
- **Focus Areas**: Strategic optimization, balanced performance
- **Alerts**: Strategic risks, performance trends
- **Reports**: Executive dashboard, strategic insights

## 6. Integration Points

### Data Flow Through the System

```typescript
// 1. Data Input Layer
const dataInputFlow = {
  csv_upload: 'Manual CSV upload with validation',
  api_integration: 'Real-time API connections',
  whatsapp_upload: 'Document processing via WhatsApp',
  email_parsing: 'Automatic email attachment processing'
};

// 2. Processing Layer
const processingFlow = {
  validation: 'Data quality checks and cleaning',
  enrichment: 'Adding calculated fields and relationships',
  aggregation: 'Rolling up data for analytics',
  calculation: 'Running metric calculations'
};

// 3. Analytics Layer
const analyticsFlow = {
  real_time: 'Immediate calculations on data changes',
  batch: 'Scheduled calculations for complex metrics',
  predictive: 'Forecasting and trend analysis',
  optimization: 'Recommendation generation'
};

// 4. Output Layer
const outputFlow = {
  dashboards: 'Real-time visualizations',
  alerts: 'Proactive notifications',
  reports: 'Scheduled and on-demand reports',
  api: 'Data access for external systems'
};
```

### Triggers for Recalculation

```typescript
// Real-time triggers
const realTimeTriggers = [
  'inventory_update',
  'sales_transaction',
  'supplier_performance_change',
  'financial_metric_update'
];

// Scheduled triggers
const scheduledTriggers = [
  { frequency: 'every_15_minutes', tasks: ['alert_evaluation'] },
  { frequency: 'hourly', tasks: ['metric_calculation', 'cache_refresh'] },
  { frequency: 'daily', tasks: ['report_generation', 'trend_analysis'] },
  { frequency: 'weekly', tasks: ['optimization_analysis', 'benchmarking'] }
];
```

### Real-time Update Handling

```typescript
// Supabase real-time subscriptions
const realtimeSubscriptions = {
  inventory: supabase
    .channel('inventory_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'inventory_items' },
      handleInventoryChange
    ),
  
  sales: supabase
    .channel('sales_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'sales_transactions' },
      handleSalesChange
    ),
  
  alerts: supabase
    .channel('alert_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'alert_instances' },
      handleAlertChange
    )
};
```

### API Structure for Analytics Endpoints

```typescript
// Analytics API endpoints
const analyticsEndpoints = {
  // Triangle scores
  'GET /api/triangle': 'Get current triangle scores',
  'GET /api/triangle/history': 'Get historical triangle scores',
  
  // Inventory analytics
  'GET /api/analytics/inventory': 'Get inventory metrics',
  'GET /api/analytics/inventory/turnover': 'Get turnover analysis',
  'GET /api/analytics/inventory/health': 'Get stock health analysis',
  
  // Financial analytics
  'GET /api/analytics/financial': 'Get financial metrics',
  'GET /api/analytics/financial/working-capital': 'Get working capital analysis',
  'GET /api/analytics/financial/cash-flow': 'Get cash flow projections',
  
  // Supplier analytics
  'GET /api/analytics/suppliers': 'Get supplier performance',
  'GET /api/analytics/suppliers/scorecards': 'Get supplier scorecards',
  
  // Alerts
  'GET /api/alerts': 'Get active alerts',
  'POST /api/alerts/acknowledge': 'Acknowledge alert',
  'POST /api/alerts/resolve': 'Resolve alert'
};
```

## 7. Visualization Requirements

### Dashboard/Report Specifications

#### **Executive Dashboard**
- **Key Metrics**: Overall triangle score, top 3 KPIs, trend indicators
- **Chart Types**: Radar chart (triangle), trend lines, gauge charts
- **Drill-down**: Click to view detailed metrics
- **Interactive Features**: Date range selection, metric filtering

#### **Inventory Dashboard**
- **Key Metrics**: Total value, turnover rate, stock health distribution
- **Chart Types**: Heatmap, bar charts, line charts
- **Drill-down**: SKU-level details, category analysis
- **Interactive Features**: Search, filter by category/supplier

#### **Financial Dashboard**
- **Key Metrics**: Working capital, cash conversion cycle, ROI
- **Chart Types**: Waterfall charts, trend analysis, comparison charts
- **Drill-down**: Component breakdown, historical trends
- **Interactive Features**: Scenario modeling, what-if analysis

#### **Supplier Dashboard**
- **Key Metrics**: Performance scores, spend analysis, risk assessment
- **Chart Types**: Scorecards, radar charts, comparison tables
- **Drill-down**: Individual supplier details, performance history
- **Interactive Features**: Supplier filtering, performance thresholds

## 8. Special Algorithms

### Multi-echelon Inventory Optimization

```typescript
class MultiEchelonOptimizer {
  optimizeInventoryLevels(network: SupplyChainNetwork): OptimizationResult {
    // 1. Calculate demand at each echelon
    const demandForecasts = this.calculateDemandForecasts(network);
    
    // 2. Determine optimal stock levels
    const stockLevels = this.calculateOptimalStockLevels(network, demandForecasts);
    
    // 3. Optimize reorder points
    const reorderPoints = this.calculateReorderPoints(network, stockLevels);
    
    // 4. Calculate total cost
    const totalCost = this.calculateTotalCost(network, stockLevels, reorderPoints);
    
    return {
      stockLevels,
      reorderPoints,
      totalCost,
      serviceLevel: this.calculateServiceLevel(network, stockLevels)
    };
  }
}
```

### Network Optimization

```typescript
class NetworkOptimizer {
  optimizeNetwork(topology: NetworkTopology): NetworkOptimization {
    // 1. Facility location optimization
    const optimalLocations = this.optimizeFacilityLocations(topology);
    
    // 2. Route optimization
    const optimalRoutes = this.optimizeRoutes(topology, optimalLocations);
    
    // 3. Capacity planning
    const capacityPlan = this.planCapacity(topology, optimalRoutes);
    
    return {
      locations: optimalLocations,
      routes: optimalRoutes,
      capacity: capacityPlan,
      totalCost: this.calculateNetworkCost(optimalLocations, optimalRoutes)
    };
  }
}
```

### Supplier Selection

```typescript
class SupplierSelector {
  selectOptimalSuppliers(requirements: ProcurementRequirements): SupplierSelection {
    // 1. Filter suppliers by capability
    const qualifiedSuppliers = this.filterByCapability(requirements);
    
    // 2. Score suppliers on multiple criteria
    const scoredSuppliers = this.scoreSuppliers(qualifiedSuppliers, requirements);
    
    // 3. Optimize supplier mix
    const optimalMix = this.optimizeSupplierMix(scoredSuppliers, requirements);
    
    return {
      primarySuppliers: optimalMix.primary,
      backupSuppliers: optimalMix.backup,
      allocation: optimalMix.allocation,
      expectedCost: optimalMix.totalCost
    };
  }
}
```

### Risk Mitigation

```typescript
class RiskMitigator {
  assessAndMitigateRisks(supplyChain: SupplyChain): RiskMitigationPlan {
    // 1. Identify risks
    const risks = this.identifyRisks(supplyChain);
    
    // 2. Assess impact and probability
    const riskAssessment = this.assessRisks(risks);
    
    // 3. Develop mitigation strategies
    const mitigationStrategies = this.developMitigationStrategies(riskAssessment);
    
    // 4. Calculate cost-benefit
    const costBenefit = this.calculateCostBenefit(mitigationStrategies);
    
    return {
      risks: riskAssessment,
      strategies: mitigationStrategies,
      costBenefit: costBenefit,
      implementationPlan: this.createImplementationPlan(mitigationStrategies)
    };
  }
}
```

## 9. Industry Standards Compliance

### SCOR Model Integration

The system follows the Supply Chain Operations Reference (SCOR) model:

```typescript
const scorMetrics = {
  // Plan metrics
  plan: {
    forecastAccuracy: 'Percentage of forecast accuracy',
    planningCycleTime: 'Time to complete planning cycle',
    inventoryDaysOfSupply: 'Days of inventory supply'
  },
  
  // Source metrics
  source: {
    supplierDeliveryPerformance: 'On-time delivery percentage',
    supplierQualityPerformance: 'Quality acceptance rate',
    supplierLeadTime: 'Average supplier lead time'
  },
  
  // Make metrics
  make: {
    productionCycleTime: 'Time to complete production',
    manufacturingYield: 'Percentage of good units produced',
    capacityUtilization: 'Percentage of capacity used'
  },
  
  // Deliver metrics
  deliver: {
    orderFulfillmentCycleTime: 'Time to fulfill orders',
    perfectOrderFulfillment: 'Percentage of perfect orders',
    fillRate: 'Percentage of orders filled from stock'
  },
  
  // Return metrics
  return: {
    returnCycleTime: 'Time to process returns',
    returnProcessingCost: 'Cost to process returns',
    returnRate: 'Percentage of products returned'
  }
};
```

### APICS Metrics

The system incorporates APICS (Association for Supply Chain Management) metrics:

```typescript
const apicsMetrics = {
  // Inventory metrics
  inventory: {
    inventoryTurnover: 'Annual inventory turnover rate',
    daysOfInventory: 'Days of inventory on hand',
    inventoryAccuracy: 'Percentage of accurate inventory records'
  },
  
  // Customer service metrics
  customerService: {
    fillRate: 'Percentage of orders filled from stock',
    perfectOrderRate: 'Percentage of perfect orders',
    orderCycleTime: 'Time from order to delivery'
  },
  
  // Supply chain cost metrics
  cost: {
    totalSupplyChainCost: 'Total cost of supply chain operations',
    costOfGoodsSold: 'Cost of goods sold percentage',
    logisticsCost: 'Logistics cost as percentage of sales'
  }
};
```

## 10. Implementation Guidelines

### Database Schema Implementation

```sql
-- Core tables for analytics
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_analytics_company_type ON analytics_metrics(company_id, metric_type);
CREATE INDEX idx_analytics_calculated_at ON analytics_metrics(calculated_at DESC);
```

### API Implementation

```typescript
// Analytics service class
export class AnalyticsService {
  async calculateMetrics(companyId: string, metricTypes: string[]): Promise<MetricResult[]> {
    const results: MetricResult[] = [];
    
    for (const metricType of metricTypes) {
      const calculator = this.getCalculator(metricType);
      const result = await calculator.calculate(companyId);
      results.push(result);
    }
    
    return results;
  }
  
  private getCalculator(metricType: string): MetricCalculator {
    switch (metricType) {
      case 'inventory_turnover':
        return new InventoryTurnoverCalculator();
      case 'working_capital':
        return new WorkingCapitalCalculator();
      case 'supplier_performance':
        return new SupplierPerformanceCalculator();
      default:
        throw new Error(`Unknown metric type: ${metricType}`);
    }
  }
}
```

### Caching Strategy

```typescript
// Cache configuration
const cacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  strategies: {
    realTime: { ttl: 1 * 60 * 1000 }, // 1 minute
    hourly: { ttl: 60 * 60 * 1000 }, // 1 hour
    daily: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
  }
};

// Cache implementation
class AnalyticsCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  get(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key: string, data: any, ttl: number = cacheConfig.ttl): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }
}
```

This comprehensive extraction provides all the necessary components to implement the Supply Chain Analytics Engine in a new project, including formulas, business rules, data structures, and implementation guidelines. 