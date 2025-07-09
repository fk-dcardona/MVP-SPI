'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Truck
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatCurrency } from '@/lib/utils';

interface SupplierScorecardProps {
  companyId: string;
}

interface SupplierMetrics {
  suppliers: SupplierData[];
  overallMetrics: {
    totalSuppliers: number;
    averageScore: number;
    topPerformer: string;
    atRiskSuppliers: number;
  };
}

interface SupplierData {
  id: string;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  metrics: {
    onTimeDelivery: number;
    qualityScore: number;
    priceCompetitiveness: number;
    responsiveness: number;
    flexibility: number;
  };
  kpis: {
    totalOrders: number;
    deliveredOnTime: number;
    qualityIssues: number;
    averageLeadTime: number;
    totalSpend: number;
    priceVariance: number;
  };
  riskFactors: string[];
  lastDelivery: Date;
}

export function SupplierScorecard({ companyId }: SupplierScorecardProps) {
  const [metrics, setMetrics] = useState<SupplierMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSupplierMetrics();
  }, [companyId]);

  const loadSupplierMetrics = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from a suppliers table
      // For now, we'll generate sample data based on inventory suppliers
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('sku, description, unit_cost')
        .eq('company_id', companyId);

      // Generate supplier data from SKU prefixes (simulated)
      const supplierMap = new Map<string, any>();
      
      inventory?.forEach(item => {
        const supplierPrefix = item.sku.split('-')[0];
        if (!supplierMap.has(supplierPrefix)) {
          supplierMap.set(supplierPrefix, {
            id: supplierPrefix,
            name: `Supplier ${supplierPrefix}`,
            items: [],
            totalSpend: 0
          });
        }
        const supplier = supplierMap.get(supplierPrefix);
        supplier.items.push(item);
        supplier.totalSpend += item.unit_cost * 100; // Simulated quantity
      });

      // Convert to supplier data with metrics
      const suppliers: SupplierData[] = Array.from(supplierMap.values()).map(supplier => {
        const onTimeDelivery = 85 + Math.random() * 15;
        const qualityScore = 80 + Math.random() * 20;
        const priceCompetitiveness = 70 + Math.random() * 30;
        const responsiveness = 75 + Math.random() * 25;
        const flexibility = 80 + Math.random() * 20;
        
        const score = (onTimeDelivery + qualityScore + priceCompetitiveness + responsiveness + flexibility) / 5;
        
        const riskFactors = [];
        if (onTimeDelivery < 90) riskFactors.push('Delivery delays');
        if (qualityScore < 85) riskFactors.push('Quality concerns');
        if (priceCompetitiveness < 80) riskFactors.push('Price increases');
        
        return {
          id: supplier.id,
          name: supplier.name,
          score,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          metrics: {
            onTimeDelivery,
            qualityScore,
            priceCompetitiveness,
            responsiveness,
            flexibility
          },
          kpis: {
            totalOrders: Math.floor(50 + Math.random() * 200),
            deliveredOnTime: Math.floor(onTimeDelivery),
            qualityIssues: Math.floor(Math.random() * 10),
            averageLeadTime: Math.floor(5 + Math.random() * 15),
            totalSpend: supplier.totalSpend,
            priceVariance: (Math.random() * 10) - 5
          },
          riskFactors,
          lastDelivery: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };
      });

      const totalSuppliers = suppliers.length;
      const averageScore = suppliers.reduce((sum, s) => sum + s.score, 0) / totalSuppliers;
      const topPerformer = suppliers.sort((a, b) => b.score - a.score)[0]?.name || 'N/A';
      const atRiskSuppliers = suppliers.filter(s => s.score < 80).length;

      setMetrics({
        suppliers,
        overallMetrics: {
          totalSuppliers,
          averageScore,
          topPerformer,
          atRiskSuppliers
        }
      });

      if (suppliers.length > 0 && !selectedSupplier) {
        setSelectedSupplier(suppliers[0].id);
      }
    } catch (error) {
      console.error('Error loading supplier metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, className: 'bg-green-600' };
    if (score >= 80) return { variant: 'default' as const, className: 'bg-yellow-600' };
    return { variant: 'destructive' as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics || metrics.suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600">No supplier data available</p>
        </CardContent>
      </Card>
    );
  }

  const selectedSupplierData = metrics.suppliers.find(s => s.id === selectedSupplier);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Supplier Scorecard</h2>
        <p className="text-gray-600">Monitor and evaluate supplier performance</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.overallMetrics.totalSuppliers}</p>
            <p className="text-xs text-gray-500 mt-1">Active partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getScoreColor(metrics.overallMetrics.averageScore)}`}>
              {metrics.overallMetrics.averageScore.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{metrics.overallMetrics.topPerformer}</p>
            <div className="flex items-center gap-1 mt-1">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Best overall score</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{metrics.overallMetrics.atRiskSuppliers}</p>
            <p className="text-xs text-gray-500 mt-1">Suppliers below 80%</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Select a supplier to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.suppliers.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedSupplier === supplier.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-500">
                        {supplier.kpis.totalOrders} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge {...getScoreBadge(supplier.score)}>
                        {supplier.score.toFixed(0)}%
                      </Badge>
                      <div className="mt-1">
                        {supplier.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {supplier.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Details */}
        {selectedSupplierData && (
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedSupplierData.name} Performance</CardTitle>
                <CardDescription>Multi-dimensional performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'On-Time Delivery', value: selectedSupplierData.metrics.onTimeDelivery },
                      { metric: 'Quality', value: selectedSupplierData.metrics.qualityScore },
                      { metric: 'Price', value: selectedSupplierData.metrics.priceCompetitiveness },
                      { metric: 'Responsiveness', value: selectedSupplierData.metrics.responsiveness },
                      { metric: 'Flexibility', value: selectedSupplierData.metrics.flexibility }
                    ]}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Radar 
                        name="Score" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Lead Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold">
                      {selectedSupplierData.kpis.averageLeadTime} days
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold">
                      {formatCurrency(selectedSupplierData.kpis.totalSpend)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Quality Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold">
                      {selectedSupplierData.kpis.qualityIssues}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">On-Time Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold">
                      {selectedSupplierData.kpis.deliveredOnTime}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Price Variance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${selectedSupplierData.kpis.priceVariance > 0 ? 'text-red-400' : 'text-green-400'}`} />
                    <span className="text-xl font-bold">
                      {selectedSupplierData.kpis.priceVariance > 0 ? '+' : ''}{selectedSupplierData.kpis.priceVariance.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Last Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {selectedSupplierData.lastDelivery.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            {selectedSupplierData.riskFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedSupplierData.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">{risk}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}