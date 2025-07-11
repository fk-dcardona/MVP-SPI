'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, Users, Shield, FileText, BarChart3, Upload, ChevronRight } from 'lucide-react';
import type { Profile, Company } from '@/types';

interface MobileDashboardProps {
  user: Profile;
  company: Company;
  recentActivity: any[];
  metrics: any;
}

export function MobileDashboard({ user, company, recentActivity, metrics }: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="pb-20"> {/* Space for bottom navigation */}
      {/* Welcome Section */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-xl font-bold">Welcome back! 👋</h1>
        <p className="text-sm text-muted-foreground">Your mobile dashboard</p>
      </div>

      {/* Supply Chain Score Card */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Supply Chain Score
              <span className="text-2xl font-bold text-green-600">78</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="text-lg font-bold text-green-600">85</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="text-lg font-bold text-amber-600">72</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capital</p>
                <p className="text-lg font-bold text-amber-600">78</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Horizontal Scroll */}
      <div className="px-4 pb-4">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            <QuickActionCard icon={Upload} label="Quick Upload" color="blue" />
            <QuickActionCard icon={Shield} label="Run Agents" color="purple" />
            <QuickActionCard icon={BarChart3} label="Analytics" color="green" />
            <QuickActionCard icon={FileText} label="Reports" color="orange" />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Main Content Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MobileQuickAccessItem icon={Package} label="Inventory" count="1,234" />
              <MobileQuickAccessItem icon={TrendingUp} label="Sales" count="$45K" />
              <MobileQuickAccessItem icon={Users} label="Suppliers" count="24" />
              <MobileQuickAccessItem icon={Shield} label="Agents" count="6" badge={3} />
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Recent Alerts
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertItem 
                  type="warning" 
                  title="Low Stock Alert" 
                  description="SKU-12345 below reorder point"
                  time="15m ago"
                />
                <AlertItem 
                  type="success" 
                  title="Upload Complete" 
                  description="2,450 records processed"
                  time="1h ago"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Total Inventory" value="$1.2M" trend="+12%" />
              <MetricCard label="Monthly Sales" value="$450K" trend="+8%" />
              <MetricCard label="Pending Orders" value="156" trend="-5%" />
              <MetricCard label="Efficiency" value="87%" trend="+3%" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function QuickActionCard({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
  }[color];

  return (
    <Card className={`${colorClasses} border-0 min-w-[120px]`}>
      <CardContent className="p-4 text-center">
        <Icon className="h-6 w-6 mx-auto mb-2" />
        <p className="text-xs font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

function MobileQuickAccessItem({ icon: Icon, label, count, badge }: any) {
  return (
    <Card className="relative">
      <CardContent className="p-4 text-center">
        <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{count}</p>
        {badge && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold">
            {badge}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ type, title, description, time }: any) {
  const typeStyles = {
    warning: 'bg-amber-100 text-amber-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  }[type];

  const icons = {
    warning: '⚠️',
    success: '✓',
    error: '❌',
  }[type];

  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${typeStyles}`}>
        {icons}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }: any) {
  const isPositive = trend.startsWith('+');
  
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend} vs last month
        </p>
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: string) {
  const icons: Record<string, string> = {
    upload: '⬆️',
    alert: '⚠️',
    success: '✓',
    agent: '🛡️',
    update: '🔄',
  };
  return icons[type] || '📄';
}