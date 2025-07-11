'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Download
} from 'lucide-react';
import { TriangleAnalysis, TriangleScore } from '@/lib/services/supply-chain-triangle';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SupplyChainTriangleProps {
  analysis: TriangleAnalysis;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SupplyChainTriangle({ analysis, onRefresh, isLoading }: SupplyChainTriangleProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { scores, metrics, recommendations, historicalTrend } = analysis;

  // Prepare data for radar chart
  const radarData = [
    {
      dimension: 'Service',
      score: scores.service,
      fullMark: 100,
    },
    {
      dimension: 'Cost',
      score: scores.cost,
      fullMark: 100,
    },
    {
      dimension: 'Capital',
      score: scores.capital,
      fullMark: 100,
    },
  ];

  // Prepare historical data for line chart
  const historicalData = historicalTrend.map((score, index) => ({
    period: `Day ${index + 1}`,
    service: score.service,
    cost: score.cost,
    capital: score.capital,
    overall: score.overall,
  })).reverse();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, className: 'bg-green-600' };
    if (score >= 60) return { variant: 'default' as const, className: 'bg-yellow-600' };
    return { variant: 'destructive' as const };
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supply Chain Triangle</h2>
          <p className="text-gray-600">Real-time optimization across Service, Cost, and Capital</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-3xl font-bold", getScoreColor(scores.overall))}>
                {scores.overall.toFixed(0)}
              </span>
              <Badge {...getScoreBadge(scores.overall)}>
                {scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Harmonic mean of all dimensions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Service Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl font-bold", getScoreColor(scores.service))}>
                {scores.service.toFixed(0)}
              </span>
              {getTrendIcon(scores.service, historicalTrend[1]?.service)}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Fill Rate: {metrics.service.fillRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Stockout Risk: {metrics.service.stockoutRisk.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cost Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl font-bold", getScoreColor(scores.cost))}>
                {scores.cost.toFixed(0)}
              </span>
              {getTrendIcon(scores.cost, historicalTrend[1]?.cost)}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Gross Margin: {metrics.cost.grossMargin.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Optimization: {metrics.cost.costOptimizationPotential.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Capital Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className={cn("text-2xl font-bold", getScoreColor(scores.capital))}>
                {scores.capital.toFixed(0)}
              </span>
              {getTrendIcon(scores.capital, historicalTrend[1]?.capital)}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Inventory Turns: {metrics.capital.inventoryTurnover.toFixed(1)}x</p>
              <p className="text-xs text-gray-500">Cash Cycle: {metrics.capital.cashConversionCycle.toFixed(0)} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Triangle View</TabsTrigger>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Triangle</CardTitle>
              <CardDescription>
                Visual representation of your supply chain performance across three critical dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      tick={{ fill: '#6b7280', fontSize: 14 }}
                      className="font-medium"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metrics Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Service Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fill Rate</span>
                      <span className="font-medium">{metrics.service.fillRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">On-Time Delivery</span>
                      <span className="font-medium">{metrics.service.onTimeDelivery.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer Satisfaction</span>
                      <span className="font-medium">{metrics.service.customerSatisfaction.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Cost Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Margin</span>
                      <span className="font-medium">{metrics.cost.grossMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Variance</span>
                      <span className="font-medium">{metrics.cost.priceVariance.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost Optimization</span>
                      <span className="font-medium">{metrics.cost.costOptimizationPotential.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Capital Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inventory Turnover</span>
                      <span className="font-medium">{metrics.capital.inventoryTurnover.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Working Capital Ratio</span>
                      <span className="font-medium">{metrics.capital.workingCapitalRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ROCE</span>
                      <span className="font-medium">{metrics.capital.returnOnCapitalEmployed.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track your supply chain performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="service" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Service"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Cost"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="capital" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Capital"
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="overall" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      name="Overall"
                      strokeDasharray="5 5"
                      dot={{ fill: '#f59e0b', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Prioritized actions to improve your supply chain performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          rec.dimension === 'service' && "bg-blue-100",
                          rec.dimension === 'cost' && "bg-green-100",
                          rec.dimension === 'capital' && "bg-purple-100"
                        )}>
                          {rec.impact > 15 ? (
                            <AlertCircle className={cn(
                              "h-5 w-5",
                              rec.dimension === 'service' && "text-blue-600",
                              rec.dimension === 'cost' && "text-green-600",
                              rec.dimension === 'capital' && "text-purple-600"
                            )} />
                          ) : (
                            <Info className={cn(
                              "h-5 w-5",
                              rec.dimension === 'service' && "text-blue-600",
                              rec.dimension === 'cost' && "text-green-600",
                              rec.dimension === 'capital' && "text-purple-600"
                            )} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {rec.effort} effort
                        </Badge>
                        <Badge 
                          variant={rec.impact > 15 ? "destructive" : "secondary"}
                        >
                          +{rec.impact.toFixed(0)} pts
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Dimension: {rec.dimension}</span>
                      <span>Priority: {rec.priority}</span>
                      <span>Impact: {rec.impact.toFixed(1)} points</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}