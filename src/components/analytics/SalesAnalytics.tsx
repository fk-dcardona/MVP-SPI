'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSalesRealtime } from '@/hooks/useRealtime';
import { formatCurrency } from '@/lib/utils';

interface SalesAnalyticsProps {
  companyId: string;
}

interface SalesMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  revenueGrowth: number;
  dailySales: any[];
  topProducts: any[];
  salesByHour: any[];
  marginAnalysis: any[];
}

export function SalesAnalytics({ companyId }: SalesAnalyticsProps) {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const supabase = createClientComponentClient();

  // Subscribe to real-time sales updates
  useSalesRealtime((payload) => {
    console.log('Sales updated:', payload);
    loadSalesMetrics();
  });

  useEffect(() => {
    loadSalesMetrics();
  }, [companyId, period]);

  const loadSalesMetrics = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }

      // Fetch sales data
      const { data: sales } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('company_id', companyId)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true });

      // Fetch inventory for cost data
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('sku, unit_cost')
        .eq('company_id', companyId);

      if (!sales) return;

      // Create cost map
      const costMap = new Map(inventory?.map(item => [item.sku, item.unit_cost]) || []);

      // Calculate metrics
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
      const totalTransactions = sales.length;
      const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate growth (compare to previous period)
      const midDate = new Date(startDate);
      midDate.setDate(midDate.getDate() + (endDate.getDate() - startDate.getDate()) / 2);
      const currentPeriodRevenue = sales
        .filter(s => new Date(s.transaction_date) >= midDate)
        .reduce((sum, sale) => sum + sale.revenue, 0);
      const previousPeriodRevenue = sales
        .filter(s => new Date(s.transaction_date) < midDate)
        .reduce((sum, sale) => sum + sale.revenue, 0);
      const revenueGrowth = previousPeriodRevenue > 0 
        ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;

      // Daily sales aggregation
      const dailySalesMap = new Map<string, { revenue: number; transactions: number; quantity: number }>();
      sales.forEach(sale => {
        const date = new Date(sale.transaction_date).toLocaleDateString();
        const current = dailySalesMap.get(date) || { revenue: 0, transactions: 0, quantity: 0 };
        dailySalesMap.set(date, {
          revenue: current.revenue + sale.revenue,
          transactions: current.transactions + 1,
          quantity: current.quantity + sale.quantity
        });
      });

      const dailySales = Array.from(dailySalesMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          transactions: data.transactions,
          quantity: data.quantity,
          avgOrderValue: data.revenue / data.transactions
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Top products by revenue
      const productMap = new Map<string, { revenue: number; quantity: number; transactions: number }>();
      sales.forEach(sale => {
        const current = productMap.get(sale.sku) || { revenue: 0, quantity: 0, transactions: 0 };
        productMap.set(sale.sku, {
          revenue: current.revenue + sale.revenue,
          quantity: current.quantity + sale.quantity,
          transactions: current.transactions + 1
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([sku, data]) => ({
          sku,
          revenue: data.revenue,
          quantity: data.quantity,
          transactions: data.transactions,
          avgPrice: data.revenue / data.quantity
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Sales by hour of day
      const hourlyMap = new Map<number, { revenue: number; transactions: number }>();
      sales.forEach(sale => {
        const hour = new Date(sale.transaction_date).getHours();
        const current = hourlyMap.get(hour) || { revenue: 0, transactions: 0 };
        hourlyMap.set(hour, {
          revenue: current.revenue + sale.revenue,
          transactions: current.transactions + 1
        });
      });

      const salesByHour = Array.from({ length: 24 }, (_, hour) => {
        const data = hourlyMap.get(hour) || { revenue: 0, transactions: 0 };
        return {
          hour: `${hour}:00`,
          revenue: data.revenue,
          transactions: data.transactions
        };
      });

      // Margin analysis
      const marginAnalysis = topProducts.map(product => {
        const cost = costMap.get(product.sku) || 0;
        const margin = product.avgPrice - cost;
        const marginPercent = product.avgPrice > 0 ? (margin / product.avgPrice) * 100 : 0;
        return {
          sku: product.sku,
          revenue: product.revenue,
          cost: cost * product.quantity,
          margin: margin * product.quantity,
          marginPercent
        };
      });

      setMetrics({
        totalRevenue,
        totalTransactions,
        averageOrderValue,
        revenueGrowth,
        dailySales,
        topProducts,
        salesByHour,
        marginAnalysis
      });
    } catch (error) {
      console.error('Error loading sales metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600">No sales data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <p className="text-gray-600">Track revenue, trends, and product performance</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-1">
              {metrics.revenueGrowth > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(metrics.revenueGrowth).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalTransactions.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Product Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics.topProducts[0]?.revenue || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{metrics.topProducts[0]?.sku || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue and transaction volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metrics.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return formatCurrency(value);
                  return value;
                }} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Bar
                  yAxisId="right"
                  dataKey="transactions"
                  fill="#10b981"
                  name="Transactions"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Hour</CardTitle>
            <CardDescription>Identify peak selling times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Margin Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Margin Analysis</CardTitle>
            <CardDescription>Profitability by product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.marginAnalysis.slice(0, 5).map((product) => (
                <div key={product.sku} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.sku}</p>
                    <p className="text-sm text-gray-500">
                      Revenue: {formatCurrency(product.revenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={product.marginPercent > 40 ? "default" : product.marginPercent > 20 ? "secondary" : "destructive"}
                    >
                      {product.marginPercent.toFixed(1)}% margin
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(product.margin)} profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Transactions</th>
                  <th className="text-right py-2">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map((product, index) => (
                  <tr key={product.sku} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="font-medium">{product.sku}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="text-right py-2">{product.quantity.toLocaleString()}</td>
                    <td className="text-right py-2">{product.transactions}</td>
                    <td className="text-right py-2">{formatCurrency(product.avgPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}