'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigatorControlPanel } from './NavigatorControlPanel';
import { NavigatorCustomization } from './navigator/NavigatorCustomization';
import { PredictiveAnalytics } from './navigator/PredictiveAnalytics';
import { QuickAccessGrid } from './QuickAccessGrid';
import { SupplyChainTriangleOverview } from './SupplyChainTriangleOverview';
import { RecentActivity } from './RecentActivity';

interface NavigatorDashboardProps {
  user: any;
  company: any;
  recentActivity: any[];
  metrics: any;
}

export function NavigatorDashboard({ user, company, recentActivity, metrics }: NavigatorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCustomization, setShowCustomization] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Navigator'}! 👋</h1>
          <p className="text-muted-foreground">
            Here&apos;s your Supply Chain Intelligence overview for today
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomization(!showCustomization)}
        >
          {showCustomization ? '📊 View Dashboard' : '🎨 Customize'}
        </Button>
      </div>

      {showCustomization ? (
        <NavigatorCustomization />
      ) : (
        <>
          {/* Control Panel Overview */}
          <NavigatorControlPanel metrics={metrics} />

          {/* Customizable Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="custom">Custom View</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickAccessGrid persona="navigator" />
                <SupplyChainTriangleOverview />
              </div>
              <RecentActivity activities={recentActivity} />
            </TabsContent>

            <TabsContent value="predictive" className="space-y-6 mt-6">
              <PredictiveAnalytics />
            </TabsContent>

            <TabsContent value="operations" className="space-y-6 mt-6">
              <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2">Operations Control</h3>
                <p className="text-muted-foreground">
                  Operational dashboards and controls will appear here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6 mt-6">
              <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2">Custom Dashboard</h3>
                <p className="text-muted-foreground">
                  Your personalized widgets and views will appear here
                </p>
                <Button className="mt-4" onClick={() => setShowCustomization(true)}>
                  Configure Custom View
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}