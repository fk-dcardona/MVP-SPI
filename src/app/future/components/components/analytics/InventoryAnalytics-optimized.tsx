'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { debounce } from '@/lib/utils/debounce';

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

// Memoized chart components
const MemoizedBarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip formatter={(value: any) => formatCurrency(value)} />
      <Legend />
      <Bar dataKey="value" fill="#3B82F6" />
      <Bar dataKey="quantity" fill="#10B981" />
    </BarChart>
  </ResponsiveContainer>
));
MemoizedBarChart.displayName = 'MemoizedBarChart';

const MemoizedPieChart = memo(({ data }: { data: any[] }) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
});
MemoizedPieChart.displayName = 'MemoizedPieChart';

// Memoized metric card component
const MetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className="flex items-center mt-2">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
          <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? 'Improving' : 'Declining'}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
));
MetricCard.displayName = 'MetricCard';

export function InventoryAnalytics({ companyId }: InventoryAnalyticsProps) {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Subscribe to real-time inventory updates with debouncing
  const handleRealtimeUpdate = useCallback(
    debounce(() => {
      loadInventoryMetrics();
    }, 1000),
    []
  );

  useInventoryRealtime(handleRealtimeUpdate);

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

      if (inventory) setInventoryData(inventory);
      if (sales) setSalesData(sales);
    } catch (error) {
      console.error('Failed to load inventory metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized calculations
  const calculatedMetrics = useMemo(() => {
    if (!inventoryData.length) return null;

    const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const totalItems = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueSkus = inventoryData.length;
    
    // Calculate velocity for each SKU
    const velocityMap = new Map<string, number>();
    salesData.forEach(sale => {
      const current = velocityMap.get(sale.sku) || 0;
      velocityMap.set(sale.sku, current + sale.quantity);
    });

    // Categorize inventory items
    const lowStockItems = inventoryData.filter(item => item.quantity < item.reorder_point).length;
    const stockoutItems = inventoryData.filter(item => item.quantity === 0).length;
    const excessStockItems = inventoryData.filter(item => {
      const velocity = velocityMap.get(item.sku) || 0;
      const daysOfSupply = velocity > 0 ? (item.quantity / velocity) * 30 : Infinity;
      return daysOfSupply > 90;
    }).length;

    // Calculate top and slow movers
    const itemsWithVelocity = inventoryData.map(item => ({
      ...item,
      velocity: velocityMap.get(item.sku) || 0,
      daysOfSupply: velocityMap.get(item.sku) ? (item.quantity / velocityMap.get(item.sku)!) * 30 : Infinity
    }));

    const topMovers = itemsWithVelocity
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10);

    const slowMovers = itemsWithVelocity
      .filter(item => item.velocity < 5 && item.quantity > 0)
      .sort((a, b) => a.velocity - b.velocity)
      .slice(0, 10);

    // Category breakdown
    const categoryMap = new Map<string, { value: number; quantity: number }>();
    inventoryData.forEach(item => {
      const current = categoryMap.get(item.category) || { value: 0, quantity: 0 };
      categoryMap.set(item.category, {
        value: current.value + (item.quantity * item.unit_cost),
        quantity: current.quantity + item.quantity
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }));

    // Calculate average turnover
    const totalVelocity = Array.from(velocityMap.values()).reduce((sum, v) => sum + v, 0);
    const averageTurnover = totalValue > 0 ? (totalVelocity * 30) / totalValue : 0;

    return {
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
      turnoverTrend: [] // Would need historical data
    };
  }, [inventoryData, salesData]);

  // Filtered data based on search and category
  const filteredInventory = useMemo(() => {
    if (!inventoryData.length) return [];
    
    return inventoryData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventoryData, searchTerm, selectedCategory]);

  // Export handler
  const handleExport = useCallback(() => {
    // Implementation for CSV export
    console.log('Exporting inventory data...');
  }, [filteredInventory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!calculatedMetrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No inventory data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
          <p className="text-gray-600">Real-time inventory insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search SKU or description..."
            className="pl-10"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inventory Value"
          value={formatCurrency(calculatedMetrics.totalValue)}
          icon={Package}
          description={`${calculatedMetrics.uniqueSkus} unique SKUs`}
        />
        <MetricCard
          title="Low Stock Items"
          value={calculatedMetrics.lowStockItems}
          icon={AlertTriangle}
          trend={calculatedMetrics.lowStockItems > 10 ? 'down' : 'up'}
          description="Below reorder point"
        />
        <MetricCard
          title="Excess Stock"
          value={calculatedMetrics.excessStockItems}
          icon={Package}
          description=">90 days supply"
        />
        <MetricCard
          title="Inventory Turnover"
          value={calculatedMetrics.averageTurnover.toFixed(1) + 'x'}
          icon={TrendingUp}
          trend={calculatedMetrics.averageTurnover > 6 ? 'up' : 'down'}
          description="Annual rate"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Inventory value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <MemoizedPieChart data={calculatedMetrics.categoryBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Value</CardTitle>
            <CardDescription>Value and quantity by category</CardDescription>
          </CardHeader>
          <CardContent>
            <MemoizedBarChart data={calculatedMetrics.categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Moving Items</CardTitle>
            <CardDescription>Fastest selling products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calculatedMetrics.topMovers.slice(0, 5).map((item, index) => (
                <div key={item.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{item.sku}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.velocity} units/mo</p>
                    <p className="text-sm text-gray-600">{item.quantity} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slow Moving Items</CardTitle>
            <CardDescription>Items with low velocity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calculatedMetrics.slowMovers.slice(0, 5).map((item, index) => (
                <div key={item.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{item.sku}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{item.velocity} units/mo</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.quantity * item.unit_cost)} tied up</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}