/**
 * Immediate Value Engine
 * Provides instant insights from inventory and sales CSV uploads
 */

import { InventoryRow, SalesRow } from '@/lib/validators/csv-validator'

export interface ProductInsight {
  sku: string
  description: string
  // Inventory Metrics
  currentStock: number
  inventoryValue: number
  // Sales Metrics
  totalSold: number
  totalRevenue: number
  avgSellingPrice: number
  // Key Performance Indicators
  inventoryTurnover: number
  daysOfInventory: number
  stockCoverage: number // days
  roi: number // percentage
  marginPerUnit: number
  // Alerts
  isLowStock: boolean
  isOverstock: boolean
  isSlowMoving: boolean
  isFastMoving: boolean
}

export interface DashboardMetrics {
  // Overall Metrics
  totalInventoryValue: number
  totalRevenue: number
  totalProducts: number
  avgInventoryTurnover: number
  
  // Alert Counts
  lowStockCount: number
  overstockCount: number
  slowMovingCount: number
  
  // Top Performers
  topPerformers: ProductInsight[]
  bottomPerformers: ProductInsight[]
  
  // Financial Health
  workingCapitalTied: number
  opportunityCost: number
}

export interface TimeSeriesData {
  date: string
  revenue: number
  unitsSold: number
}

export class ImmediateValueEngine {
  private inventoryData: Map<string, InventoryRow> = new Map()
  private salesData: Map<string, SalesRow[]> = new Map()
  private productInsights: Map<string, ProductInsight> = new Map()
  
  // Configuration thresholds
  private readonly LOW_STOCK_DAYS = 7
  private readonly OVERSTOCK_DAYS = 90
  private readonly SLOW_MOVING_DAYS = 30
  private readonly FAST_MOVING_TURNOVER = 12 // times per year
  
  constructor() {}
  
  /**
   * Load inventory data and prepare for analysis
   */
  loadInventoryData(data: InventoryRow[]) {
    this.inventoryData.clear()
    data.forEach(row => {
      this.inventoryData.set(row.SKU, row)
    })
  }
  
  /**
   * Load sales data and organize by SKU
   */
  loadSalesData(data: SalesRow[]) {
    this.salesData.clear()
    data.forEach(row => {
      const existing = this.salesData.get(row.SKU) || []
      existing.push(row)
      this.salesData.set(row.SKU, existing)
    })
  }
  
  /**
   * Calculate immediate insights from loaded data
   */
  calculateInsights(): ProductInsight[] {
    this.productInsights.clear()
    
    // Process each product in inventory
    this.inventoryData.forEach((inventory, sku) => {
      const salesHistory = this.salesData.get(sku) || []
      const insight = this.calculateProductInsight(inventory, salesHistory)
      this.productInsights.set(sku, insight)
    })
    
    return Array.from(this.productInsights.values())
  }
  
  /**
   * Calculate insights for a single product
   */
  private calculateProductInsight(
    inventory: InventoryRow, 
    sales: SalesRow[]
  ): ProductInsight {
    // Sales calculations
    const totalSold = sales.reduce((sum, sale) => sum + sale.Quantity, 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.Revenue, 0)
    const avgSellingPrice = totalSold > 0 ? totalRevenue / totalSold : 0
    
    // Time-based calculations (assuming sales data covers a period)
    const salesDays = this.calculateSalesPeriodDays(sales)
    const dailySalesRate = salesDays > 0 ? totalSold / salesDays : 0
    
    // Inventory metrics
    const currentStock = inventory.Quantity
    const inventoryValue = currentStock * inventory['Unit Cost']
    
    // Performance indicators
    const annualizedSales = dailySalesRate * 365
    const inventoryTurnover = currentStock > 0 ? annualizedSales / currentStock : 0
    const daysOfInventory = inventoryTurnover > 0 ? 365 / inventoryTurnover : 365
    const stockCoverage = dailySalesRate > 0 ? currentStock / dailySalesRate : 999
    
    // Financial metrics
    const marginPerUnit = avgSellingPrice - inventory['Unit Cost']
    const roi = inventory['Unit Cost'] > 0 
      ? ((marginPerUnit / inventory['Unit Cost']) * 100) 
      : 0
    
    // Alert conditions
    const isLowStock = stockCoverage < this.LOW_STOCK_DAYS && dailySalesRate > 0
    const isOverstock = stockCoverage > this.OVERSTOCK_DAYS || (currentStock > 0 && dailySalesRate === 0)
    const isSlowMoving = daysOfInventory > this.SLOW_MOVING_DAYS
    const isFastMoving = inventoryTurnover > this.FAST_MOVING_TURNOVER
    
    return {
      sku: inventory.SKU,
      description: inventory.Description,
      currentStock,
      inventoryValue,
      totalSold,
      totalRevenue,
      avgSellingPrice,
      inventoryTurnover,
      daysOfInventory,
      stockCoverage,
      roi,
      marginPerUnit,
      isLowStock,
      isOverstock,
      isSlowMoving,
      isFastMoving
    }
  }
  
  /**
   * Calculate the period covered by sales data
   */
  private calculateSalesPeriodDays(sales: SalesRow[]): number {
    if (sales.length === 0) return 0
    
    const dates = sales.map(s => new Date(s.Date).getTime())
    const minDate = Math.min(...dates)
    const maxDate = Math.max(...dates)
    
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24)
    return Math.max(daysDiff, 1) // At least 1 day
  }
  
  /**
   * Generate dashboard-level metrics
   */
  generateDashboardMetrics(): DashboardMetrics {
    const insights = Array.from(this.productInsights.values())
    
    // Calculate totals
    const totalInventoryValue = insights.reduce((sum, p) => sum + p.inventoryValue, 0)
    const totalRevenue = insights.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalProducts = insights.length
    
    // Calculate averages
    const avgInventoryTurnover = insights.length > 0
      ? insights.reduce((sum, p) => sum + p.inventoryTurnover, 0) / insights.length
      : 0
    
    // Count alerts
    const lowStockCount = insights.filter(p => p.isLowStock).length
    const overstockCount = insights.filter(p => p.isOverstock).length
    const slowMovingCount = insights.filter(p => p.isSlowMoving).length
    
    // Find top and bottom performers by ROI
    const sortedByROI = [...insights].sort((a, b) => b.roi - a.roi)
    const topPerformers = sortedByROI.slice(0, 5)
    const bottomPerformers = sortedByROI.slice(-5).reverse()
    
    // Calculate financial health metrics
    const workingCapitalTied = totalInventoryValue
    const opportunityCost = insights
      .filter(p => p.isOverstock || p.isSlowMoving)
      .reduce((sum, p) => sum + p.inventoryValue, 0)
    
    return {
      totalInventoryValue,
      totalRevenue,
      totalProducts,
      avgInventoryTurnover,
      lowStockCount,
      overstockCount,
      slowMovingCount,
      topPerformers,
      bottomPerformers,
      workingCapitalTied,
      opportunityCost
    }
  }
  
  /**
   * Get time series data for a specific SKU
   */
  getProductTimeSeries(sku: string): TimeSeriesData[] {
    const sales = this.salesData.get(sku) || []
    
    // Group by date
    const grouped = sales.reduce((acc, sale) => {
      const date = sale.Date
      if (!acc[date]) {
        acc[date] = { revenue: 0, unitsSold: 0 }
      }
      acc[date].revenue += sale.Revenue
      acc[date].unitsSold += sale.Quantity
      return acc
    }, {} as Record<string, { revenue: number; unitsSold: number }>)
    
    // Convert to array and sort
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        unitsSold: data.unitsSold
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  
  /**
   * Get actionable recommendations
   */
  getRecommendations(): string[] {
    const insights = Array.from(this.productInsights.values())
    const recommendations: string[] = []
    
    // Low stock alerts
    const lowStockProducts = insights.filter(p => p.isLowStock)
    if (lowStockProducts.length > 0) {
      recommendations.push(
        `⚠️ ${lowStockProducts.length} products need immediate reordering (less than ${this.LOW_STOCK_DAYS} days of stock)`
      )
    }
    
    // Overstock alerts
    const overstockValue = insights
      .filter(p => p.isOverstock)
      .reduce((sum, p) => sum + p.inventoryValue, 0)
    if (overstockValue > 0) {
      recommendations.push(
        `💰 $${overstockValue.toFixed(2)} tied up in overstock inventory - consider promotions or supplier return`
      )
    }
    
    // Fast movers
    const fastMovers = insights.filter(p => p.isFastMoving && !p.isLowStock)
    if (fastMovers.length > 0) {
      recommendations.push(
        `🚀 ${fastMovers.length} fast-moving products may benefit from increased stock levels`
      )
    }
    
    // High ROI products
    const highROI = insights.filter(p => p.roi > 50 && p.currentStock < 100)
    if (highROI.length > 0) {
      recommendations.push(
        `📈 ${highROI.length} high-margin products (>50% ROI) could be scaled up`
      )
    }
    
    return recommendations
  }
  
  /**
   * Export insights for sharing
   */
  exportForSharing(): {
    summary: DashboardMetrics
    insights: ProductInsight[]
    recommendations: string[]
    generatedAt: string
  } {
    return {
      summary: this.generateDashboardMetrics(),
      insights: this.calculateInsights(),
      recommendations: this.getRecommendations(),
      generatedAt: new Date().toISOString()
    }
  }
}