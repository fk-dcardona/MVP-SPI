'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Network,
  Globe,
  Building2,
  Users,
  Package,
  Layers,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { EntitySwitcher } from './EntitySwitcher';

interface EntityPrediction {
  entityId: string;
  entityName: string;
  predictions: PredictionMetric[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface PredictionMetric {
  label: string;
  value: number;
  trend: number;
  confidence: number;
  unit: string;
  risk: 'low' | 'medium' | 'high';
  icon: any;
}

interface NetworkInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: string;
  affectedEntities: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ScenarioVariable {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  scope: 'global' | 'entity';
}

export function HubPredictiveAnalytics() {
  const [selectedView, setSelectedView] = useState<'consolidated' | 'entity' | 'comparison'>('consolidated');
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['all']);
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Multi-entity scenario variables
  const [scenarioVariables, setScenarioVariables] = useState<ScenarioVariable[]>([
    { id: 'global-growth', label: 'Network Growth Rate', value: 15, min: -30, max: 50, step: 5, unit: '%', scope: 'global' },
    { id: 'supply-chain-efficiency', label: 'Supply Chain Efficiency', value: 85, min: 50, max: 100, step: 5, unit: '%', scope: 'global' },
    { id: 'market-volatility', label: 'Market Volatility Index', value: 3, min: 1, max: 10, step: 1, unit: 'pts', scope: 'global' },
    { id: 'entity-collaboration', label: 'Inter-Entity Collaboration', value: 70, min: 0, max: 100, step: 10, unit: '%', scope: 'global' },
  ]);

  // Mock entity predictions data
  const entityPredictions: EntityPrediction[] = [
    {
      entityId: 'hq',
      entityName: 'Headquarters',
      predictions: [
        { label: 'Cash Flow', value: 850000, trend: 12, confidence: 92, unit: '$', risk: 'low', icon: DollarSign },
        { label: 'Efficiency', value: 89, trend: 5, confidence: 88, unit: '%', risk: 'low', icon: Target },
      ],
      riskLevel: 'low',
      confidence: 90
    },
    {
      entityId: 'branch-1',
      entityName: 'East Coast Branch',
      predictions: [
        { label: 'Cash Flow', value: 420000, trend: -5, confidence: 85, unit: '$', risk: 'medium', icon: DollarSign },
        { label: 'Efficiency', value: 75, trend: -2, confidence: 82, unit: '%', risk: 'medium', icon: Target },
      ],
      riskLevel: 'medium',
      confidence: 83
    },
    {
      entityId: 'branch-2',
      entityName: 'West Coast Branch',
      predictions: [
        { label: 'Cash Flow', value: 680000, trend: 18, confidence: 94, unit: '$', risk: 'low', icon: DollarSign },
        { label: 'Efficiency', value: 92, trend: 8, confidence: 91, unit: '%', risk: 'low', icon: Target },
      ],
      riskLevel: 'low',
      confidence: 92
    },
  ];

  // Network-wide insights
  const networkInsights: NetworkInsight[] = [
    {
      type: 'opportunity',
      title: 'Cross-Entity Inventory Optimization',
      description: 'Redistribute inventory between East and West branches to reduce holding costs',
      impact: 'Save $125,000 annually',
      affectedEntities: ['East Coast Branch', 'West Coast Branch'],
      priority: 'high'
    },
    {
      type: 'risk',
      title: 'Supply Chain Bottleneck Detected',
      description: 'East Coast branch showing payment delays affecting network cash flow',
      impact: '$200,000 cash flow impact',
      affectedEntities: ['East Coast Branch', 'Headquarters'],
      priority: 'high'
    },
    {
      type: 'trend',
      title: 'Network Efficiency Improving',
      description: 'Inter-entity collaboration has increased operational efficiency by 12%',
      impact: '+12% productivity gain',
      affectedEntities: ['All Entities'],
      priority: 'medium'
    },
  ];

  // Calculate consolidated metrics
  const calculateConsolidatedMetrics = () => {
    const totalCashFlow = entityPredictions.reduce((sum, ep) => 
      sum + (ep.predictions.find(p => p.label === 'Cash Flow')?.value || 0), 0
    );
    const avgEfficiency = entityPredictions.reduce((sum, ep) => 
      sum + (ep.predictions.find(p => p.label === 'Efficiency')?.value || 0), 0
    ) / entityPredictions.length;
    const avgConfidence = entityPredictions.reduce((sum, ep) => sum + ep.confidence, 0) / entityPredictions.length;
    
    return { totalCashFlow, avgEfficiency, avgConfidence };
  };

  const { totalCashFlow, avgEfficiency, avgConfidence } = calculateConsolidatedMetrics();

  const handleVariableChange = (id: string, newValue: number[]) => {
    setScenarioVariables(prev =>
      prev.map(v => (v.id === id ? { ...v, value: newValue[0] } : v))
    );
    
    // Simulate recalculation
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 1000);
  };

  const getInsightIcon = (type: NetworkInsight['type']) => {
    switch (type) {
      case 'opportunity': return Sparkles;
      case 'risk': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'anomaly': return Activity;
    }
  };

  const getInsightColor = (type: NetworkInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-emerald-600';
      case 'risk': return 'text-red-600';
      case 'trend': return 'text-blue-600';
      case 'anomaly': return 'text-purple-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intelligence Center Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-7 w-7" />
              Network Predictive Intelligence Center
            </h2>
            <p className="mt-1 text-indigo-100">
              Unified insights across all entities • AI-powered predictions • Network optimization
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(avgConfidence)}%</div>
            <div className="text-sm text-indigo-100">Network Confidence</div>
          </div>
        </div>
      </div>

      {/* Network Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700">Network</Badge>
            </div>
            <p className="text-sm text-emerald-700 mb-1">Total Cash Flow</p>
            <p className="text-2xl font-bold text-emerald-900">
              ${(totalCashFlow / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-emerald-600 mt-1">↑ 15% vs forecast</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700">Efficiency</Badge>
            </div>
            <p className="text-sm text-blue-700 mb-1">Network Efficiency</p>
            <p className="text-2xl font-bold text-blue-900">{avgEfficiency.toFixed(0)}%</p>
            <p className="text-xs text-blue-600 mt-1">Top 10% performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Network className="h-5 w-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700">Connected</Badge>
            </div>
            <p className="text-sm text-purple-700 mb-1">Active Entities</p>
            <p className="text-2xl font-bold text-purple-900">{entityPredictions.length}</p>
            <p className="text-xs text-purple-600 mt-1">All synchronized</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700">Risk</Badge>
            </div>
            <p className="text-sm text-amber-700 mb-1">Network Risk Score</p>
            <p className="text-2xl font-bold text-amber-900">Low</p>
            <p className="text-xs text-amber-600 mt-1">2 medium risks</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid grid-cols-3 w-full max-w-[600px]">
          <TabsTrigger value="consolidated" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Consolidated View
          </TabsTrigger>
          <TabsTrigger value="entity" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            By Entity
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidated" className="space-y-6 mt-6">
          {/* Network Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Network Intelligence Insights
              </CardTitle>
              <CardDescription>
                AI-powered recommendations across your entire network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {networkInsights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const colorClass = getInsightColor(insight.type);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-gray-50`}>
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-medium text-blue-600">{insight.impact}</span>
                              <span className="text-xs text-gray-500">
                                Affects: {insight.affectedEntities.join(', ')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={
                            insight.priority === 'high' ? 'destructive' : 
                            insight.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {insight.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Network-Wide Scenario Modeling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Network-Wide Scenario Modeling
              </CardTitle>
              <CardDescription>
                Model how changes impact your entire network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="baseline">Baseline</TabsTrigger>
                  <TabsTrigger value="expansion">Expansion</TabsTrigger>
                  <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="custom" className="space-y-6 mt-6">
                  {scenarioVariables.map((variable) => (
                    <div key={variable.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {variable.label}
                          {variable.scope === 'global' && (
                            <Badge variant="outline" className="text-xs">Network-wide</Badge>
                          )}
                        </label>
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

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Projected Network Impact</span>
                      {isCalculating && (
                        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin ml-auto" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700">Network Cash Flow</p>
                        <p className="text-lg font-bold text-blue-900">+$425,000</p>
                        <p className="text-xs text-blue-600">Across all entities</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">Risk Reduction</p>
                        <p className="text-lg font-bold text-blue-900">-22%</p>
                        <p className="text-xs text-blue-600">Network-wide improvement</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">Efficiency Gain</p>
                        <p className="text-lg font-bold text-blue-900">+8.5%</p>
                        <p className="text-xs text-blue-600">Average across entities</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">ROI Timeline</p>
                        <p className="text-lg font-bold text-blue-900">4.2 months</p>
                        <p className="text-xs text-blue-600">To positive returns</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baseline" className="mt-6">
                  <Alert>
                    <AlertDescription>
                      Current network trajectory based on existing operations and market conditions.
                      All entities showing stable performance with coordinated growth.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="expansion" className="mt-6">
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      Network expansion scenario: Add 2 new entities with 25% growth projection.
                      Total network value could increase by 40% within 18 months.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="consolidation" className="mt-6">
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-800">
                      Consolidation scenario: Merge operations for 30% cost reduction.
                      Maintain 95% of current capacity with improved margins.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entity" className="space-y-6 mt-6">
          {/* Entity Selector */}
          <div className="mb-6">
            <EntitySwitcher />
          </div>

          {/* Entity-Specific Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {entityPredictions.map((entity) => (
              <Card key={entity.entityId} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 ${
                  entity.riskLevel === 'low' ? 'bg-green-500' :
                  entity.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{
                  borderRadius: '0 0 0 100%',
                }} />
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {entity.entityName}
                    </span>
                    <Badge variant={
                      entity.riskLevel === 'low' ? 'default' :
                      entity.riskLevel === 'medium' ? 'secondary' : 'destructive'
                    }>
                      {entity.riskLevel} risk
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Confidence: {entity.confidence}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {entity.predictions.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <metric.icon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{metric.label}</p>
                            <p className="text-xs text-gray-500">
                              {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}% trend
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {metric.unit === '$' ? '$' : ''}
                            {metric.value.toLocaleString()}
                            {metric.unit !== '$' ? metric.unit : ''}
                          </p>
                          <Progress value={metric.confidence} className="w-20 h-1 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6 mt-6">
          {/* Entity Comparison View */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Entity Performance Comparison</CardTitle>
              <CardDescription>
                Compare predictions and performance across your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Comparison Matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Entity</th>
                        <th className="text-center p-2">Cash Flow</th>
                        <th className="text-center p-2">Efficiency</th>
                        <th className="text-center p-2">Risk Level</th>
                        <th className="text-center p-2">Confidence</th>
                        <th className="text-center p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entityPredictions.map((entity) => (
                        <tr key={entity.entityId} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{entity.entityName}</td>
                          <td className="text-center p-2">
                            ${(entity.predictions[0]?.value / 1000).toFixed(0)}K
                          </td>
                          <td className="text-center p-2">
                            {entity.predictions[1]?.value}%
                          </td>
                          <td className="text-center p-2">
                            <Badge variant={
                              entity.riskLevel === 'low' ? 'default' :
                              entity.riskLevel === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {entity.riskLevel}
                            </Badge>
                          </td>
                          <td className="text-center p-2">{entity.confidence}%</td>
                          <td className="text-center p-2">
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual Comparison */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Performance Distribution</h4>
                  <div className="space-y-3">
                    {entityPredictions.map((entity) => (
                      <div key={entity.entityId} className="flex items-center gap-3">
                        <span className="w-32 text-sm">{entity.entityName}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${entity.predictions[1]?.value || 0}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {entity.predictions[1]?.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Center */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1">Ready to Optimize Your Network?</h3>
              <p className="text-indigo-100">
                Apply AI recommendations across all entities with one click
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" variant="secondary" className="gap-2">
                <Network className="h-5 w-5" />
                Apply Network-Wide
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Shield className="h-5 w-5" />
                Review First
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}