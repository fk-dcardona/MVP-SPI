'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Calculator,
  BarChart3,
  Activity,
  DollarSign,
  Clock,
  Target,
  Zap,
  Info,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface PredictionMetric {
  label: string;
  value: number;
  trend: number;
  confidence: number;
  unit: string;
  risk: 'low' | 'medium' | 'high';
  icon: any;
}

interface ScenarioVariable {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export function PredictiveAnalytics() {
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [scenarioVariables, setScenarioVariables] = useState<ScenarioVariable[]>([
    { id: 'payment-terms', label: 'Payment Terms', value: 30, min: 0, max: 90, step: 15, unit: 'days' },
    { id: 'interest-rate', label: 'Interest Rate', value: 5.5, min: 0, max: 15, step: 0.5, unit: '%' },
    { id: 'sales-growth', label: 'Sales Growth', value: 15, min: -50, max: 100, step: 5, unit: '%' },
    { id: 'inventory-turns', label: 'Inventory Turns', value: 12, min: 1, max: 24, step: 1, unit: 'x/year' },
  ]);

  const predictions: PredictionMetric[] = [
    {
      label: 'Cash Flow Forecast',
      value: 850000,
      trend: 12,
      confidence: 92,
      unit: '$',
      risk: 'low',
      icon: DollarSign,
    },
    {
      label: 'Payment Flexibility',
      value: 78,
      trend: -5,
      confidence: 88,
      unit: '%',
      risk: 'medium',
      icon: Clock,
    },
    {
      label: 'Capital Efficiency',
      value: 2.3,
      trend: 8,
      confidence: 95,
      unit: 'x',
      risk: 'low',
      icon: Target,
    },
    {
      label: 'Risk Score',
      value: 24,
      trend: -15,
      confidence: 90,
      unit: 'pts',
      risk: 'low',
      icon: Shield,
    },
  ];

  const handleVariableChange = (id: string, newValue: number[]) => {
    setScenarioVariables(prev =>
      prev.map(v => (v.id === id ? { ...v, value: newValue[0] } : v))
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-amber-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-50';
      case 'medium':
        return 'bg-amber-50';
      case 'high':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Control Philosophy */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Predictive Analytics & Control Center
            </h2>
            <p className="text-emerald-700 mt-1">
              Take control of your future. Model scenarios, predict outcomes, eliminate surprises.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-900">95%</div>
            <div className="text-sm text-emerald-700">Prediction Accuracy</div>
          </div>
        </div>
      </div>

      {/* Main Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictions.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden ${getRiskBgColor(metric.risk)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-full ${getRiskBgColor(metric.risk)}`}>
                    <metric.icon className={`h-6 w-6 ${getRiskColor(metric.risk)}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="font-semibold">{metric.confidence}%</div>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.label}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {metric.unit === '$' ? '$' : ''}
                    {metric.value.toLocaleString()}
                    {metric.unit !== '$' ? metric.unit : ''}
                  </span>
                  <span className={`flex items-center text-sm font-medium ${
                    metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(metric.trend)}%
                  </span>
                </div>
                
                <div className="mt-3">
                  <Progress value={metric.confidence} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scenario Modeling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            What-If Scenario Modeling
          </CardTitle>
          <CardDescription>
            Adjust variables to see how changes impact your financial future
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="baseline">Baseline</TabsTrigger>
              <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
              <TabsTrigger value="pessimistic">Pessimistic</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-6 mt-6">
              {scenarioVariables.map((variable) => (
                <div key={variable.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">{variable.label}</label>
                    <span className="text-sm font-semibold">
                      {variable.value}{variable.unit}
                    </span>
                  </div>
                  <Slider
                    value={[variable.value]}
                    onValueChange={(value) => handleVariableChange(variable.id, value)}
                    min={variable.min}
                    max={variable.max}
                    step={variable.step}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{variable.min}{variable.unit}</span>
                    <span>{variable.max}{variable.unit}</span>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Projected Impact</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-blue-700">Cash Flow Change</p>
                    <p className="text-lg font-bold text-blue-900">+$125,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Risk Reduction</p>
                    <p className="text-lg font-bold text-blue-900">-18%</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="baseline" className="mt-6">
              <Alert>
                <AlertDescription>
                  Current trajectory based on historical data and market conditions.
                  All indicators show stable growth with manageable risk levels.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="optimistic" className="mt-6">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Best-case scenario with 20% sales growth and improved payment terms.
                  Cash flow could increase by 35% with proper execution.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="pessimistic" className="mt-6">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800">
                  Conservative scenario accounting for market downturns and extended payment cycles.
                  Maintain 6-month cash reserve for stability.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Risk Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Early Warning Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              className="p-3 bg-amber-50 rounded-lg border border-amber-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Payment Delays Increasing</p>
                    <p className="text-sm text-amber-700">3 suppliers showing 15+ day delays</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-600" />
              </div>
            </motion.div>

            <motion.div
              className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Inventory Turnover Slowing</p>
                    <p className="text-sm text-blue-700">Decreased by 8% this quarter</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-blue-600" />
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Optimize Payment Terms</h4>
              <p className="text-sm text-emerald-700 mb-3">
                Negotiate 45-day terms with top 3 suppliers to improve cash flow by $200K
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                View Strategy
              </Button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Diversify Supplier Base</h4>
              <p className="text-sm text-blue-700 mb-3">
                Add 2 backup suppliers to reduce single-source risk by 40%
              </p>
              <Button size="sm" variant="outline">
                Explore Options
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Center CTA */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1">Stay in Control</h3>
              <p className="text-emerald-100">
                Set up automated alerts for any metric deviation beyond your comfort zone
              </p>
            </div>
            <Button size="lg" variant="secondary" className="gap-2">
              <Shield className="h-5 w-5" />
              Configure Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}