'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Receipt, 
  CreditCard,
  RotateCw,
  AlertTriangle,
  Target
} from 'lucide-react';
import { WorkingCapitalDashboard as DashboardType, FinancialMetrics, OptimizationRecommendation } from '@/lib/financial/types';
import { formatCurrency, formatDays } from '@/lib/utils';

interface WorkingCapitalDashboardProps {
  dashboard: DashboardType;
}

export function WorkingCapitalDashboard({ dashboard }: WorkingCapitalDashboardProps) {
  const { current_metrics: metrics, optimization_potential } = dashboard;

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'deteriorating') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getMetricStatus = (current: number, benchmark: number, lowerIsBetter: boolean = false) => {
    const ratio = current / benchmark;
    if (lowerIsBetter) {
      if (ratio <= 1.1) return 'good';
      if (ratio <= 1.3) return 'warning';
      return 'critical';
    } else {
      if (ratio >= 0.9) return 'good';
      if (ratio >= 0.7) return 'warning';
      return 'critical';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Working Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {formatCurrency(metrics.working_capital)}
              </span>
              {getTrendIcon(dashboard.working_capital_trend)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.working_capital_trend} trend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cash Conversion Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {formatDays(metrics.cash_conversion_cycle)}
              </span>
              {getTrendIcon(dashboard.cash_cycle_trend)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Industry avg: {formatDays(dashboard.industry_benchmarks.cash_cycle_days)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.current_ratio.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Liquidity position
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Optimization Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(optimization_potential.total_opportunity)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available to unlock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Component Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Working Capital Components</CardTitle>
          <CardDescription>
            Analysis of inventory, receivables, and payables performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Inventory */}
            <div className="flex items-start justify-between pb-4 border-b">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Inventory</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Value: {formatCurrency(metrics.inventory_value)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Turnover: {metrics.inventory_turnover.toFixed(1)}x
                      <span className="text-gray-400 ml-1">
                        (benchmark: {dashboard.industry_benchmarks.inventory_turns}x)
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Days Outstanding: {formatDays(metrics.days_inventory_outstanding)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={optimization_potential.inventory_reduction > 0 ? "secondary" : "default"}
                >
                  {optimization_potential.inventory_reduction > 0 
                    ? `${formatCurrency(optimization_potential.inventory_reduction)} opportunity`
                    : 'Optimized'
                  }
                </Badge>
              </div>
            </div>

            {/* Receivables */}
            <div className="flex items-start justify-between pb-4 border-b">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Receivables</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Value: {formatCurrency(metrics.accounts_receivable)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Days Sales Outstanding: {formatDays(metrics.days_sales_outstanding)}
                      <span className="text-gray-400 ml-1">
                        (benchmark: {formatDays(dashboard.industry_benchmarks.receivables_days)})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Turnover: {metrics.receivables_turnover.toFixed(1)}x
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={optimization_potential.receivables_acceleration > 0 ? "secondary" : "default"}
                >
                  {optimization_potential.receivables_acceleration > 0 
                    ? `${formatCurrency(optimization_potential.receivables_acceleration)} opportunity`
                    : 'Optimized'
                  }
                </Badge>
              </div>
            </div>

            {/* Payables */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Payables</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Value: {formatCurrency(metrics.accounts_payable)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Days Payable Outstanding: {formatDays(metrics.days_payable_outstanding)}
                      <span className="text-gray-400 ml-1">
                        (benchmark: {formatDays(dashboard.industry_benchmarks.payables_days)})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Turnover: {metrics.payables_turnover.toFixed(1)}x
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={optimization_potential.payables_extension > 0 ? "secondary" : "default"}
                >
                  {optimization_potential.payables_extension > 0 
                    ? `${formatCurrency(optimization_potential.payables_extension)} opportunity`
                    : 'Optimized'
                  }
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {dashboard.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Optimization Recommendations
            </CardTitle>
            <CardDescription>
              Prioritized actions to improve working capital performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recommendations.slice(0, 5).map((rec) => (
                <div key={rec.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.quick_win && (
                        <Badge variant="default" className="bg-green-600">
                          Quick Win
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {rec.priority_score} priority
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-500">Working Capital Impact</p>
                      <p className="font-medium text-green-600">
                        +{formatCurrency(rec.expected_working_capital_improvement)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cash Cycle Reduction</p>
                      <p className="font-medium">
                        -{rec.expected_cash_cycle_reduction_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Implementation Time</p>
                      <p className="font-medium">
                        {rec.time_to_implement_days} days
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}