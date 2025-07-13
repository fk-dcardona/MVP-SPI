'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, TrendingUpIcon, AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface DashboardData {
  inventoryCount: number;
  salesThisMonth: number;
  alertCount: number;
}

interface TriangleScore {
  overall_score: number;
  service_score: number;
  cost_score: number;
  capital_score: number;
  calculated_at: string;
}

export default function EnhancedClientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [triangleScore, setTriangleScore] = useState<TriangleScore | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Load dashboard data
        if (session.user.user_metadata?.company_id) {
          await loadDashboardData(session.user.user_metadata.company_id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadDashboardData = async (companyId: string) => {
    const supabase = createClient();
    
    try {
      setRefreshing(true);
      
      // Get inventory count
      const { count: inventoryCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get sales this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: salesData } = await supabase
        .from('sales_transactions')
        .select('revenue')
        .eq('company_id', companyId)
        .gte('date', startOfMonth.toISOString());

      const salesThisMonth = salesData?.reduce((sum, sale) => sum + (sale.revenue || 0), 0) || 0;

      // Get active alerts
      const { count: alertCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      // Get Supply Chain Triangle score
      const { data: triangleData } = await supabase
        .from('triangle_scores')
        .select('*')
        .eq('company_id', companyId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      setDashboardData({
        inventoryCount: inventoryCount || 0,
        salesThisMonth,
        alertCount: alertCount || 0
      });
      
      if (triangleData) {
        setTriangleScore(triangleData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (user?.user_metadata?.company_id) {
      const interval = setInterval(() => {
        loadDashboardData(user.user_metadata.company_id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = () => {
    if (user?.user_metadata?.company_id) {
      loadDashboardData(user.user_metadata.company_id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Supply Chain Intelligence</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back! 🚀</CardTitle>
              <CardDescription>
                <strong>{user.user_metadata?.full_name || user.email}</strong> | 
                Real-time supply chain insights powered by AI
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.inventoryCount?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.inventoryCount ? 'Total SKUs in system' : 'Upload CSV to see inventory'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(dashboardData?.salesThisMonth || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.salesThisMonth ? 'Revenue generated' : 'Upload sales data to track revenue'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.alertCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.alertCount ? 'Require attention' : 'No alerts - all good!'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supply Chain Triangle */}
          {triangleScore ? (
            <Card>
              <CardHeader>
                <CardTitle>🔺 Supply Chain Triangle Score</CardTitle>
                <CardDescription>
                  Optimizing Service-Cost-Capital balance for maximum efficiency
                  <span className="block text-xs mt-1">Last updated: {new Date(triangleScore.calculated_at).toLocaleString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{Math.round(triangleScore.overall_score || 0)}</div>
                    <div className="text-sm text-muted-foreground font-medium">Overall Score</div>
                    <Progress value={triangleScore.overall_score || 0} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">{Math.round(triangleScore.service_score || 0)}</div>
                    <div className="text-sm text-muted-foreground">Service Level</div>
                    <Progress value={triangleScore.service_score || 0} className="mt-2 h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-orange-600">{Math.round(triangleScore.cost_score || 0)}</div>
                    <div className="text-sm text-muted-foreground">Cost Efficiency</div>
                    <Progress value={triangleScore.cost_score || 0} className="mt-2 h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-purple-600">{Math.round(triangleScore.capital_score || 0)}</div>
                    <div className="text-sm text-muted-foreground">Capital Optimization</div>
                    <Progress value={triangleScore.capital_score || 0} className="mt-2 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>🔺 Supply Chain Triangle</CardTitle>
                <CardDescription>
                  Upload inventory and sales data to see your optimization score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    Your Supply Chain Triangle score will appear here once you upload data
                  </div>
                  <a href="/dashboard/upload" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    🚀 Upload CSV Data
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/dashboard/upload" className="bg-primary/10 hover:bg-primary/20 p-4 rounded-lg text-center transition-colors group">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-medium">Upload CSV</div>
                  <div className="text-sm text-muted-foreground">Add new data</div>
                </a>
                <a href="/dashboard/inventory" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors group">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">View Inventory</div>
                  <div className="text-sm text-muted-foreground">Stock levels</div>
                </a>
                <a href="/dashboard/sales" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors group">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium">View Sales</div>
                  <div className="text-sm text-muted-foreground">Revenue data</div>
                </a>
                <a href="/dashboard/agents" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors group">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium">Manage Agents</div>
                  <div className="text-sm text-muted-foreground">Automation</div>
                </a>
              </div>
            </CardContent>
          </Card>
          
          {/* WhatsApp AI Connection */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💬</span> WhatsApp AI Assistant
              </CardTitle>
              <CardDescription>
                Chat with your supply chain data using natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Try asking things like:</p>
                  <div className="space-y-2">
                    <code className="block text-sm bg-gray-100 px-3 py-2 rounded">📱 &quot;Show me my low stock items&quot;</code>
                    <code className="block text-sm bg-gray-100 px-3 py-2 rounded">📈 &quot;What&apos;s my top selling product?&quot;</code>
                    <code className="block text-sm bg-gray-100 px-3 py-2 rounded">⚠️ &quot;Any supply chain alerts?&quot;</code>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="https://wa.me/your-whatsapp-number" 
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <span>🚀</span>
                    <span className="ml-2">Start WhatsApp Chat</span>
                  </a>
                  <div className="text-center text-sm text-muted-foreground self-center">
                    Available 24/7 • Powered by AI
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}