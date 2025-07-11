'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { SupplierScorecard as ScorecardType } from '@/lib/supplier/types';

interface SupplierScorecardProps {
  scorecard: ScorecardType;
}

export function SupplierScorecard({ scorecard }: SupplierScorecardProps) {
  const { supplier, current_performance: performance, trend, risk_level } = scorecard;

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskBadgeVariant = () => {
    switch (risk_level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{supplier.name}</CardTitle>
            <CardDescription>
              {supplier.code && `Code: ${supplier.code} • `}
              Lead Time: {supplier.lead_time_days} days
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge variant={getRiskBadgeVariant()}>
              {risk_level.toUpperCase()} RISK
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(performance.overall_score)}`}>
            {performance.overall_score}
          </div>
          <p className="text-sm text-gray-600 mt-1">Overall Performance Score</p>
          <Progress 
            value={performance.overall_score} 
            className="mt-2 h-3"
            indicatorClassName={getProgressColor(performance.overall_score)}
          />
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Delivery</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(performance.delivery_score)}`}>
              {performance.delivery_score}
            </div>
            <Progress 
              value={performance.delivery_score} 
              className="h-2"
              indicatorClassName={getProgressColor(performance.delivery_score)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Quality</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(performance.quality_score)}`}>
              {performance.quality_score}
            </div>
            <Progress 
              value={performance.quality_score} 
              className="h-2"
              indicatorClassName={getProgressColor(performance.quality_score)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Cost</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(performance.cost_score)}`}>
              {performance.cost_score}
            </div>
            <Progress 
              value={performance.cost_score} 
              className="h-2"
              indicatorClassName={getProgressColor(performance.cost_score)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Response</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(performance.responsiveness_score)}`}>
              {performance.responsiveness_score}
            </div>
            <Progress 
              value={performance.responsiveness_score} 
              className="h-2"
              indicatorClassName={getProgressColor(performance.responsiveness_score)}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">On-Time Delivery</p>
            <p className="text-lg font-semibold">
              {performance.on_time_delivery_rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Defect Rate</p>
            <p className="text-lg font-semibold">
              {performance.defect_rate.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-lg font-semibold">
              {performance.total_orders}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Spend</p>
            <p className="text-lg font-semibold">
              ${performance.total_spend.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-lg font-semibold">
              {performance.average_response_time_hours}h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Invoice Accuracy</p>
            <p className="text-lg font-semibold">
              {performance.invoice_accuracy_rate}%
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {scorecard.recommendations.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {scorecard.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}