'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useInventoryRealtime } from '@/hooks/useRealtime';
import { formatCurrency } from '@/lib/utils';

interface InventoryAnalyticsProps {
  companyId: string;
}

interface InventoryMetrics {
  totalValue: number;
  totalItems: number;
  uniqueSkus: number;
  lowStockItems: number;
  excessStockItems: number;
  stockoutItems: number;
  averageTurnover: number;
  topMovers: any[];
  slowMovers: any[];
  categoryBreakdown: any[];
  turnoverTrend: any[];
}

export function InventoryAnalytics({ companyId }: InventoryAnalyticsProps) {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const supabase = createClientComponentClient();

  // Subscribe to real-time inventory updates
  useInventoryRealtime((payload) => {
    console.log('Inventory updated:', payload);
    // Reload metrics when inventory changes
    loadInventoryMetrics();
  });

  useEffect(() => {
    loadInventoryMetrics();
  }, [companyId]);

  const loadInventoryMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch inventory data
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId);

      // Fetch sales data for velocity calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sales } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('company_id', companyId)
        .gte('transaction_date', thirtyDaysAgo.toISOString());

      if (!inventory) return;

      // Calculate metrics
      const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const uniqueSkus = inventory.length;
      
      // Calculate velocity for each SKU
      const velocityMap = new Map<string, number>();
      sales?.forEach(sale => {
        const current = velocityMap.get(sale.sku) || 0;
        velocityMap.set(sale.sku, current + sale.quantity);
      });

      // Categorize inventory
      const categorizedInventory = inventory.map(item => {
        const velocity = velocityMap.get(item.sku) || 0;
        const dailyVelocity = velocity / 30;
        const daysOfStock = dailyVelocity > 0 ? item.quantity / dailyVelocity : Infinity;
        const turnover = velocity > 0 ? (velocity * 12) / item.quantity : 0; // Annualized

        return {
          ...item,
          velocity,
          dailyVelocity,
          daysOfStock,
          turnover,
          value: item.quantity * item.unit_cost,
          status: getStockStatus(item.quantity, daysOfStock)
        };
      });

      // Count by status
      const lowStockItems = categorizedInventory.filter(i => i.status === 'low').length;
      const excessStockItems = categorizedInventory.filter(i => i.status === 'excess').length;
      const stockoutItems = categorizedInventory.filter(i => i.status === 'stockout').length;
      
      // Average turnover
      const averageTurnover = categorizedInventory
        .filter(i => i.turnover > 0)
        .reduce((sum, item) => sum + item.turnover, 0) / categorizedInventory.filter(i => i.turnover > 0).length || 0;

      // Top and slow movers
      const topMovers = categorizedInventory
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, 10);
      
      const slowMovers = categorizedInventory
        .filter(i => i.velocity === 0 && i.quantity > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Category breakdown (simulated - would come from product categories)
      const categoryBreakdown = generateCategoryBreakdown(categorizedInventory);

      // Turnover trend (simulated - would come from historical data)
      const turnoverTrend = generateTurnoverTrend();

      setMetrics({
        totalValue,
        totalItems,
        uniqueSkus,
        lowStockItems,
        excessStockItems,
        stockoutItems,
        averageTurnover,
        topMovers,
        slowMovers,
        categoryBreakdown,
        turnoverTrend
      });
    } catch (error) {
      console.error('Error loading inventory metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (quantity: number, daysOfStock: number) => {
    if (quantity === 0) return 'stockout';
    if (daysOfStock <= 7) return 'low';
    if (daysOfStock > 90) return 'excess';
    return 'normal';
  };

  const generateCategoryBreakdown = (inventory: any[]) => {
    // Simulate categories based on SKU patterns
    const categories = new Map<string, { value: number; count: number }>();
    
    inventory.forEach(item => {
      const category = item.sku.split('-')[0] || 'Other';
      const current = categories.get(category) || { value: 0, count: 0 };
      categories.set(category, {
        value: current.value + item.value,
        count: current.count + 1
      });
    });

    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count
    }));
  };

  const generateTurnoverTrend = () => {
    // Generate last 6 months of data
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      turnover: 8 + Math.random() * 4 + (index * 0.5) // Trending upward
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          <p className="text-gray-600">No inventory data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
          <p className="text-gray-600">Real-time inventory insights and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-gray-500 mt-1">{metrics.totalItems.toLocaleString()} units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.uniqueSkus}</p>
            <p className="text-xs text-gray-500 mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.averageTurnover.toFixed(1)}x</p>
            <p className="text-xs text-gray-500 mt-1">Annual rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{metrics.lowStockItems}</p>
            <p className="text-xs text-gray-500 mt-1">Items at risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stockouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{metrics.stockoutItems}</p>
            <p className="text-xs text-gray-500 mt-1">Out of stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Excess Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{metrics.excessStockItems}</p>
            <p className="text-xs text-gray-500 mt-1">&gt;90 days supply</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Value distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Turnover Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover Trend</CardTitle>
            <CardDescription>Monthly turnover rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.turnoverTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="turnover"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Movers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Moving Products</CardTitle>
          <CardDescription>Fastest selling items in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topMovers.map((item, index) => (
              <div key={item.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.velocity} units/month</p>
                  <p className="text-sm text-gray-500">{item.turnover.toFixed(1)}x turnover</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slow Movers */}
      <Card>
        <CardHeader>
          <CardTitle>Slow Moving Inventory</CardTitle>
          <CardDescription>Items with no sales in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slowMovers.map((item) => (
              <div key={item.sku} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-yellow-600">{formatCurrency(item.value)}</p>
                  <p className="text-sm text-gray-500">{item.quantity} units stuck</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}