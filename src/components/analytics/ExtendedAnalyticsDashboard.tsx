'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Package,
  Truck,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  RadarChart,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import ErrorBoundary from '@/components/ui/error-boundary';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-spinner';

interface ExtendedAnalyticsDashboardProps {
  companyId?: string;
}

export default function ExtendedAnalyticsDashboard({ companyId }: ExtendedAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  
  // State for different analytics data
  const [inventoryMetrics, setInventoryMetrics] = useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [supplierMetrics, setSupplierMetrics] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<any>(null);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all analytics data in parallel with AbortController for cancellation
      const controller = new AbortController();
      const [inventory, financial, supplier, risk, benchmark, optimization] = await Promise.all([
        fetch('/api/analytics/inventory/extended', { signal: controller.signal }).then(res => res.json()),
        fetch('/api/analytics/financial', { signal: controller.signal }).then(res => res.json()),
        fetch('/api/analytics/suppliers/performance', { signal: controller.signal }).then(res => res.json()),
        fetch('/api/analytics/risk-assessment', { signal: controller.signal }).then(res => res.json()),
        fetch('/api/analytics/benchmarks?industry=retail', { signal: controller.signal }).then(res => res.json()),
        fetch('/api/analytics/optimization?type=all', { signal: controller.signal }).then(res => res.json())
      ]);

      setInventoryMetrics(inventory.data);
      setFinancialMetrics(financial.data);
      setSupplierMetrics(supplier.data);
      setRiskAssessment(risk.data);
      setBenchmarks(benchmark.data);
      setOptimizations(optimization.data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading analytics data:', error);
        setError('Failed to load analytics data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading advanced analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3 w-fit">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Failed to Load Analytics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => { setError(null); loadAnalyticsData(); }} className="w-full" variant="outline">
            <ArrowRight className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header with Risk Summary */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Supply Chain Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights based on industry best practices</p>
        </div>
        
        {/* Risk Alert Summary */}
        {riskAssessment?.alerts && riskAssessment.alerts.length > 0 && (
          <Alert className="w-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Active Alerts</AlertTitle>
            <AlertDescription>
              {riskAssessment.alerts.length} issues require attention
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Working Capital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialMetrics?.workingCapital || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Ratio: {financialMetrics?.workingCapitalRatio?.toFixed(2) || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Cash Conversion Cycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialMetrics?.cashConversionCycle || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  DIO: {financialMetrics?.daysInventoryOutstanding || 0}d
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  Fill Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierMetrics?.fillRate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Order Accuracy: {supplierMetrics?.orderAccuracy?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-purple-600" />
                  Supplier Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierMetrics?.supplierPerformanceScore?.toFixed(0) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Lead Time: {supplierMetrics?.averageLeadTime?.toFixed(1) || 0}d
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Overview */}
          <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/20">
            <CardHeader>
              <CardTitle>Risk Assessment Overview</CardTitle>
              <CardDescription>Current risk levels across key areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAssessment?.risks?.map((risk: any, index: number) => (
                  <div key={index} className="flex items-center justify-between transition-colors duration-200 hover:bg-muted/50 p-2 rounded-md">
                    <div className="flex items-center gap-4">
                      <Badge variant={getRiskBadgeColor(risk.riskLevel)}>
                        {risk.riskLevel}
                      </Badge>
                      <span className="font-medium capitalize">{risk.category} Risk</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={risk.riskScore} className="w-32" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {risk.riskScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Benchmarks */}
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
              <CardDescription>Performance compared to retail industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={benchmarks?.benchmarks} className="animate-in fade-in duration-500">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Your Performance" 
                    dataKey="percentile" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3} 
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Health Analysis</CardTitle>
              <CardDescription>Stock levels, turnover, and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryMetrics && inventoryMetrics.length > 0 && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Turnover</p>
                      <p className="text-2xl font-bold">
                        {inventoryMetrics ? (inventoryMetrics.reduce((sum: number, item: any) => sum + item.inventoryTurnover, 0) / inventoryMetrics.length).toFixed(2) : '0.00'}x
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Stock Health</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="destructive">
                          {inventoryMetrics.filter((i: any) => i.stockHealthScore === 'stockout').length} Stockout
                        </Badge>
                        <Badge variant="default">
                          {inventoryMetrics.filter((i: any) => i.stockHealthScore === 'low').length} Low
                        </Badge>
                        <Badge variant="secondary">
                          {inventoryMetrics.filter((i: any) => i.stockHealthScore === 'excess').length} Excess
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Holding Cost</p>
                      <p className="text-2xl font-bold">
                        {inventoryMetrics ? formatCurrency(inventoryMetrics.reduce((sum: number, item: any) => sum + item.holdingCost, 0)) : '$0'}
                      </p>
                    </div>
                  </div>

                  {/* Inventory Distribution Chart */}
                  <div>
                    <h4 className="font-medium mb-4">Days of Supply Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={inventoryMetrics.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sku" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="daysOfSupply" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Working Capital Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Inventory Value</span>
                    <span className="font-medium">{formatCurrency(financialMetrics?.workingCapital * 0.4 || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Accounts Receivable</span>
                    <span className="font-medium">{formatCurrency(financialMetrics?.workingCapital * 0.3 || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Accounts Payable</span>
                    <span className="font-medium text-red-600">
                      ({formatCurrency(financialMetrics?.workingCapital * 0.2 || 0)})
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Net Working Capital</span>
                      <span className="font-bold text-lg">{formatCurrency(financialMetrics?.workingCapital || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Conversion Cycle Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Days Inventory Outstanding</span>
                      <span className="text-sm font-medium">{financialMetrics?.daysInventoryOutstanding || 0}d</span>
                    </div>
                    <Progress value={financialMetrics?.daysInventoryOutstanding || 0} max={100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Days Sales Outstanding</span>
                      <span className="text-sm font-medium">{financialMetrics?.daysSalesOutstanding || 0}d</span>
                    </div>
                    <Progress value={financialMetrics?.daysSalesOutstanding || 0} max={100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Days Payable Outstanding</span>
                      <span className="text-sm font-medium">{financialMetrics?.daysPayableOutstanding || 0}d</span>
                    </div>
                    <Progress value={financialMetrics?.daysPayableOutstanding || 0} max={100} />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total CCC</span>
                      <span className="font-bold text-lg">{financialMetrics?.cashConversionCycle || 0} days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Key Financial Ratios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">{financialMetrics?.grossMargin?.toFixed(1) || 0}%</div>
                  <p className="text-sm text-muted-foreground">Gross Margin</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{financialMetrics?.workingCapitalRatio?.toFixed(2) || 0}</div>
                  <p className="text-sm text-muted-foreground">Working Capital Ratio</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{financialMetrics?.returnOnCapitalEmployed?.toFixed(1) || 0}%</div>
                  <p className="text-sm text-muted-foreground">ROCE</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Overview</CardTitle>
              <CardDescription>Key supplier metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                  <p className="text-3xl font-bold">{supplierMetrics?.supplierPerformanceScore?.toFixed(0) || 0}</p>
                  <Badge variant={supplierMetrics?.supplierPerformanceScore >= 85 ? 'default' : 'destructive'}>
                    {supplierMetrics?.supplierPerformanceScore >= 85 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fill Rate</p>
                  <p className="text-3xl font-bold">{supplierMetrics?.fillRate?.toFixed(1) || 0}%</p>
                  <p className="text-xs text-muted-foreground">vs. target: 95%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Lead Time</p>
                  <p className="text-3xl font-bold">{supplierMetrics?.averageLeadTime?.toFixed(1) || 0}d</p>
                  <p className="text-xs text-muted-foreground">
                    σ: {supplierMetrics?.leadTimeVariability?.toFixed(1) || 0}d
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Accuracy</p>
                  <p className="text-3xl font-bold">{supplierMetrics?.orderAccuracy?.toFixed(1) || 0}%</p>
                  <p className="text-xs text-muted-foreground">Quality score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          {/* Active Alerts */}
          {riskAssessment?.alerts && riskAssessment.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Immediate attention required</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskAssessment.alerts.map((alert: any, index: number) => (
                    <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="capitalize">{alert.type.replace('_', ' ')}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {riskAssessment?.risks?.map((risk: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="capitalize">{risk.category} Risk Analysis</CardTitle>
                  <Badge variant={getRiskBadgeColor(risk.riskLevel)}>
                    {risk.riskLevel} Risk - {risk.riskScore}%
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(risk.contributingFactors).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          {/* Cost Optimization Opportunities */}
          {optimizations?.costOptimizations && optimizations.costOptimizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Opportunities</CardTitle>
                <CardDescription>
                  Total potential savings: {formatCurrency(
                    optimizations.costOptimizations.reduce((sum: number, opt: any) => sum + opt.potentialSavings, 0)
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.costOptimizations.slice(0, 5).map((opt: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{opt.recommendation}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Type: {opt.type.replace('_', ' ')}</span>
                          {opt.sku && <span>SKU: {opt.sku}</span>}
                          <span>Current Value: {formatCurrency(opt.currentValue)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(opt.potentialSavings)}</p>
                        <p className="text-sm text-muted-foreground">potential savings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Optimization */}
          {optimizations?.inventoryOptimization && (
            <Card>
              <CardHeader>
                <CardTitle>Multi-Echelon Inventory Optimization</CardTitle>
                <CardDescription>
                  Optimize stock levels across locations - Total savings: {formatCurrency(optimizations.inventoryOptimization.totalSavings)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.inventoryOptimization.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{rec.location} - {rec.sku}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">Current: {rec.currentLevel}</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="text-sm font-medium text-green-600">Optimal: {rec.optimalLevel}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(rec.savings)}</p>
                        <p className="text-sm text-muted-foreground">savings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
}