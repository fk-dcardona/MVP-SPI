'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  DollarSign,
  Share2,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { ImmediateValueEngine, DashboardMetrics, ProductInsight } from '@/lib/calculations/immediate-value-engine'
import { InventoryRow, SalesRow } from '@/lib/validators/csv-validator'

interface ImmediateValueDashboardProps {
  inventoryData: InventoryRow[]
  salesData: SalesRow[]
  onShare?: () => void
}

export function ImmediateValueDashboard({ 
  inventoryData, 
  salesData,
  onShare 
}: ImmediateValueDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [insights, setInsights] = useState<ProductInsight[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Calculate insights when data changes
    const engine = new ImmediateValueEngine()
    engine.loadInventoryData(inventoryData)
    engine.loadSalesData(salesData)
    
    const calculatedInsights = engine.calculateInsights()
    const dashboardMetrics = engine.generateDashboardMetrics()
    const recs = engine.getRecommendations()
    
    setInsights(calculatedInsights)
    setMetrics(dashboardMetrics)
    setRecommendations(recs)
    setLoading(false)
  }, [inventoryData, salesData])

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Calculating insights...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Immediate Insights</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Insights
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Inventory Value</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalInventoryValue)}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Inventory Turnover</p>
              <p className="text-2xl font-bold">{metrics.avgInventoryTurnover.toFixed(1)}x</p>
              <p className="text-xs text-muted-foreground">per year</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alerts</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="destructive">{metrics.lowStockCount} Low</Badge>
                <Badge variant="secondary">{metrics.overstockCount} Over</Badge>
              </div>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actionable Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="mt-0.5">{rec.startsWith('⚠️') ? '⚠️' : '💡'}</div>
                <p className="text-sm">{rec.replace(/^[⚠️💡🚀📈💰]/, '').trim()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {metrics.topPerformers.map((product) => (
              <div key={product.sku} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.sku}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="font-semibold text-sm">{formatPercent(product.roi)} ROI</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.inventoryTurnover.toFixed(1)}x turnover
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Needs Attention
          </h3>
          <div className="space-y-3">
            {metrics.bottomPerformers.map((product) => (
              <div key={product.sku} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.sku}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-red-600">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="font-semibold text-sm">{formatPercent(product.roi)} ROI</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {product.isOverstock && <Badge variant="secondary" className="text-xs">Overstock</Badge>}
                    {product.isSlowMoving && <Badge variant="secondary" className="text-xs">Slow</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Financial Impact */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <h3 className="text-lg font-semibold mb-4">Financial Impact</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Working Capital Tied</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.workingCapitalTied)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Opportunity Cost</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(metrics.opportunityCost)}</p>
            <p className="text-xs text-muted-foreground">In slow/overstock items</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Savings</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(metrics.opportunityCost * 0.3)}
            </p>
            <p className="text-xs text-muted-foreground">With optimization</p>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <Card className="p-6 text-center bg-primary/5">
        <h3 className="text-lg font-semibold mb-2">Want Deeper Insights?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add supplier data to unlock lead time optimization and cost analysis
        </p>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Add More Data
        </Button>
      </Card>
    </div>
  )
}